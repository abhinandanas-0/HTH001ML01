/**
 * @file anomalyDetection.js
 * @description Rule-based anomaly detector for unusual spending based on historical
 * Median and Median Absolute Deviation (MAD) within categories.
 */

import { validateTransaction, TRANSACTION_TYPES } from './transactionSchema.js';
import { calculateMedian } from './irregularIncome.js';

/**
 * Calculates Median Absolute Deviation (MAD) from an array of numbers.
 * MAD = median(|x_i - median(X)|)
 *
 * @param {number[]} values
 * @param {number} median
 * @returns {number}
 */
export function calculateMAD(values, median) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const deviations = values.map(v => Math.abs(v - median));
  return calculateMedian(deviations);
}

/**
 * Detects unusually high spending anomalies within transaction categories
 * using robust non-parametric statistics (Median + MAD).
 *
 * Rules:
 * - Operates strictly on valid expense transactions (type === "expense").
 * - Evaluates each category against the user's own historical distribution.
 * - Does NOT accuse or label transactions as "fraud"; flags statistical variances for review.
 * - Requires a minimum number of observations (default: 4) per category;
 *   otherwise marks the category as "insufficient_data" without forcing false positives.
 * - Every anomaly strictly points to an actual transaction ID.
 *
 * @param {Array} transactions Array of normalized transactions
 * @param {object} [options]
 * @param {number} [options.minObservations=4] Minimum transactions in category to calculate statistical baseline
 * @param {number} [options.lowZThreshold=2.5] Modified Z-score threshold for low severity
 * @param {number} [options.medZThreshold=3.5] Modified Z-score threshold for medium severity
 * @param {number} [options.highZThreshold=4.5] Modified Z-score threshold for high severity
 * @returns {{
 *   anomalies: {
 *     id: string,
 *     transactionId: string,
 *     date: string,
 *     merchant: string,
 *     category: string,
 *     amount: number,
 *     reason: string,
 *     severity: "low" | "medium" | "high",
 *     method: string
 *   }[],
 *   categoryStats: Record<string, {
 *     count: number,
 *     status: "analyzed" | "insufficient_data",
 *     median: number | null,
 *     mad: number | null
 *   }>,
 *   summary: {
 *     totalExpensesChecked: number,
 *     anomaliesFound: number,
 *     categoriesAnalyzed: number,
 *     insufficientDataCategories: string[]
 *   }
 * }}
 */
export function detectSpendingAnomalies(transactions, options = {}) {
  const {
    minObservations = 4,
    lowZThreshold = 2.5,
    medZThreshold = 3.5,
    highZThreshold = 4.5
  } = options;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      anomalies: [],
      categoryStats: {},
      summary: {
        totalExpensesChecked: 0,
        anomaliesFound: 0,
        categoriesAnalyzed: 0,
        insufficientDataCategories: []
      }
    };
  }

  // 1. Filter valid expense transactions
  const validExpenses = transactions.filter(tx => {
    return validateTransaction(tx).valid && tx.type === TRANSACTION_TYPES.EXPENSE;
  });

  // 2. Group expenses by category
  const categoryGroups = {};
  for (const tx of validExpenses) {
    const cat = tx.category || 'Uncategorized';
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = [];
    }
    categoryGroups[cat].push(tx);
  }

  const anomalies = [];
  const categoryStats = {};
  const insufficientDataCategories = [];
  let anomalyCounter = 1;

  for (const [category, txList] of Object.entries(categoryGroups)) {
    const count = txList.length;

    // Check observation threshold
    if (count < minObservations) {
      categoryStats[category] = {
        count,
        status: 'insufficient_data',
        median: null,
        mad: null
      };
      insufficientDataCategories.push(category);
      continue;
    }

    const amounts = txList.map(t => t.amount);
    const median = calculateMedian(amounts);
    const mad = calculateMAD(amounts, median);

    categoryStats[category] = {
      count,
      status: 'analyzed',
      median,
      mad
    };

    for (const tx of txList) {
      // We focus on unusually large positive spending outflows
      if (tx.amount <= median) {
        continue;
      }

      let severity = null;
      let reason = '';

      if (mad > 0) {
        // Standard Boris Iglewicz & David Hoaglin Modified Z-Score:
        // M_i = 0.6745 * (x_i - median) / MAD
        const modifiedZ = (0.6745 * (tx.amount - median)) / mad;

        if (modifiedZ >= highZThreshold) {
          severity = 'high';
          reason = `Amount (${tx.amount.toFixed(2)}) is exceptionally higher than typical ${category} spending (historical median: ${median.toFixed(2)}, modified Z-score: ${modifiedZ.toFixed(1)}).`;
        } else if (modifiedZ >= medZThreshold) {
          severity = 'medium';
          reason = `Amount (${tx.amount.toFixed(2)}) significantly exceeds historical ${category} spending (historical median: ${median.toFixed(2)}, modified Z-score: ${modifiedZ.toFixed(1)}).`;
        } else if (modifiedZ >= lowZThreshold) {
          severity = 'low';
          reason = `Amount (${tx.amount.toFixed(2)}) is moderately above typical ${category} spending (historical median: ${median.toFixed(2)}, modified Z-score: ${modifiedZ.toFixed(1)}).`;
        }
      } else {
        // MAD is 0 (i.e. majority of entries in this category are identical amounts)
        // Check relative factor variance
        if (median > 0 && tx.amount >= median * 2.5 && (tx.amount - median) >= 20) {
          severity = 'high';
          reason = `Amount (${tx.amount.toFixed(2)}) is over 2.5x the recurring ${category} median (${median.toFixed(2)}) where historical variance was near zero.`;
        } else if (median > 0 && tx.amount >= median * 1.8 && (tx.amount - median) >= 15) {
          severity = 'medium';
          reason = `Amount (${tx.amount.toFixed(2)}) is noticeably higher than the recurring ${category} baseline (${median.toFixed(2)}).`;
        }
      }

      if (severity) {
        anomalies.push({
          id: `ANOM-${String(anomalyCounter++).padStart(3, '0')}`,
          transactionId: tx.id,
          date: tx.date,
          merchant: tx.merchant,
          category: tx.category,
          amount: tx.amount,
          reason,
          severity,
          method: 'category_median_mad'
        });
      }
    }
  }

  // Sort anomalies by severity: high -> medium -> low
  const severityRank = { high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return {
    anomalies,
    categoryStats,
    summary: {
      totalExpensesChecked: validExpenses.length,
      anomaliesFound: anomalies.length,
      categoriesAnalyzed: Object.keys(categoryGroups).length - insufficientDataCategories.length,
      insufficientDataCategories
    }
  };
}
