/**
 * @file irregularIncome.js
 * @description Analyzes income variability, monthly distributions, and lower-income months
 * strictly from historical income transactions without assumptions of fixed employment.
 */

import { validateTransaction, TRANSACTION_TYPES } from './transactionSchema.js';

/**
 * Calculates the mathematical median of an array of numbers.
 * @param {number[]} values
 * @returns {number}
 */
export function calculateMedian(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return Math.round(sorted[mid] * 100) / 100;
}

/**
 * Calculates the mean of an array of numbers.
 * @param {number[]} values
 * @returns {number}
 */
export function calculateMean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Calculates sample standard deviation.
 * @param {number[]} values
 * @param {number} mean
 * @returns {number}
 */
export function calculateStandardDeviation(values, mean) {
  if (!Array.isArray(values) || values.length <= 1) return 0;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * Analyzes income transactions to evaluate pattern, variability, and lower-income months.
 *
 * Rules:
 * - Operates strictly on user-provided income transactions.
 * - Does NOT assume a fixed salary or permanent baseline.
 * - Does NOT predict future income.
 * - Does NOT label irregular income as negative or problematic.
 * - Flags "insufficient_data" when fewer than 2 distinct calendar months of income exist.
 *
 * @param {Array} transactions
 * @param {object} [options]
 * @param {number} [options.lowerIncomeRatio=0.80] Fraction of median below which a month is noted as lower-income (default: 80% of median)
 * @param {number} [options.cvThreshold=0.20] Coefficient of variation threshold for variability categorization
 * @returns {{
 *   incomePattern: "variable" | "relatively_stable" | "insufficient_data",
 *   monthsAnalyzed: number,
 *   monthlyIncomeValues: { month: string, amount: number }[],
 *   averageMonthlyIncome: number | null,
 *   medianMonthlyIncome: number | null,
 *   minimumMonthlyIncome: number | null,
 *   maximumMonthlyIncome: number | null,
 *   incomeRange: number | null,
 *   coefficientOfVariation: number | null,
 *   lowerIncomeMonths: { month: string, amount: number, threshold: number, deficitFromMedian: number }[],
 *   explanation: string
 * }}
 */
export function analyzeIrregularIncome(transactions, options = {}) {
  const { lowerIncomeRatio = 0.80, cvThreshold = 0.20 } = options;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      incomePattern: 'insufficient_data',
      monthsAnalyzed: 0,
      monthlyIncomeValues: [],
      averageMonthlyIncome: null,
      medianMonthlyIncome: null,
      minimumMonthlyIncome: null,
      maximumMonthlyIncome: null,
      incomeRange: null,
      coefficientOfVariation: null,
      lowerIncomeMonths: [],
      explanation: 'No transaction data provided for income analysis.'
    };
  }

  // 1. Filter strictly valid income transactions
  const validIncomeTxns = transactions.filter(tx => {
    return validateTransaction(tx).valid && tx.type === TRANSACTION_TYPES.INCOME;
  });

  if (validIncomeTxns.length === 0) {
    return {
      incomePattern: 'insufficient_data',
      monthsAnalyzed: 0,
      monthlyIncomeValues: [],
      averageMonthlyIncome: null,
      medianMonthlyIncome: null,
      minimumMonthlyIncome: null,
      maximumMonthlyIncome: null,
      incomeRange: null,
      coefficientOfVariation: null,
      lowerIncomeMonths: [],
      explanation: 'No income transactions were found in the provided records.'
    };
  }

  // 2. Group by calendar month (YYYY-MM)
  const monthlyMap = {};
  for (const tx of validIncomeTxns) {
    const month = tx.date.slice(0, 7);
    monthlyMap[month] = (monthlyMap[month] || 0) + tx.amount;
  }

  const sortedMonths = Object.keys(monthlyMap).sort();
  const monthlyValues = sortedMonths.map(month => ({
    month,
    amount: Math.round(monthlyMap[month] * 100) / 100
  }));

  const amounts = monthlyValues.map(m => m.amount);
  const monthsAnalyzed = amounts.length;

  // 3. Handle insufficient observation period (< 2 months)
  if (monthsAnalyzed < 2) {
    const singleAmount = amounts[0];
    return {
      incomePattern: 'insufficient_data',
      monthsAnalyzed: 1,
      monthlyIncomeValues: monthlyValues,
      averageMonthlyIncome: singleAmount,
      medianMonthlyIncome: singleAmount,
      minimumMonthlyIncome: singleAmount,
      maximumMonthlyIncome: singleAmount,
      incomeRange: 0,
      coefficientOfVariation: null,
      lowerIncomeMonths: [],
      explanation: `Only 1 month of income data observed (${sortedMonths[0]}: ${singleAmount.toFixed(2)}). At least 2 distinct calendar months are required to evaluate monthly income variability.`
    };
  }

  // 4. Calculate descriptive statistical metrics
  const avg = calculateMean(amounts);
  const med = calculateMedian(amounts);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const range = Math.round((max - min) * 100) / 100;
  const stdDev = calculateStandardDeviation(amounts, avg);
  const cv = avg > 0 ? Math.round((stdDev / avg) * 1000) / 1000 : 0;

  // 5. Identify lower-income months based on historical median threshold
  const lowerThreshold = Math.round((med * lowerIncomeRatio) * 100) / 100;
  const lowerIncomeMonths = monthlyValues
    .filter(m => m.amount < lowerThreshold)
    .map(m => ({
      month: m.month,
      amount: m.amount,
      threshold: lowerThreshold,
      deficitFromMedian: Math.round((med - m.amount) * 100) / 100
    }));

  // 6. Categorize variability pattern
  // Variable if CV > cvThreshold OR range relative to median > 0.35
  const isVariable = cv > cvThreshold || (med > 0 && (range / med) > 0.35);
  const incomePattern = isVariable ? 'variable' : 'relatively_stable';

  // 7. Transparent explanation of observed facts
  let explanation = `Analyzed ${monthsAnalyzed} months of income (average: ${avg.toFixed(2)}, median: ${med.toFixed(2)}). `;
  explanation += `Monthly income ranged from ${min.toFixed(2)} to ${max.toFixed(2)} (spread of ${range.toFixed(2)}, CV: ${cv}). `;

  if (isVariable) {
    explanation += `Observed income shows month-to-month variation. `;
  } else {
    explanation += `Observed income shows relatively stable monthly consistency. `;
  }

  if (lowerIncomeMonths.length > 0) {
    const monthNames = lowerIncomeMonths.map(m => m.month).join(', ');
    explanation += `${lowerIncomeMonths.length} month(s) fell below ${Math.round(lowerIncomeRatio * 100)}% of the historical median (${monthNames}).`;
  } else {
    explanation += `No months fell below ${Math.round(lowerIncomeRatio * 100)}% of the historical median.`;
  }

  return {
    incomePattern,
    monthsAnalyzed,
    monthlyIncomeValues: monthlyValues,
    averageMonthlyIncome: avg,
    medianMonthlyIncome: med,
    minimumMonthlyIncome: min,
    maximumMonthlyIncome: max,
    incomeRange: range,
    coefficientOfVariation: cv,
    lowerIncomeMonths,
    explanation
  };
}
