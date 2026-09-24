/**
 * @file recurringCosts.js
 * @description Rule-based detector for possible recurring costs from normalized expense transactions.
 * Identifies repeated payments from identical or similar merchants occurring at regular cadences
 * (weekly, biweekly, monthly, quarterly).
 */

import { validateTransaction, TRANSACTION_TYPES } from './transactionSchema.js';

/**
 * Normalizes a merchant name by removing company entity suffixes, web domains,
 * store/location numbers, and punctuation to facilitate grouping of similar merchants.
 *
 * @param {string} rawMerchant
 * @returns {string}
 */
export function normalizeMerchant(rawMerchant) {
  if (typeof rawMerchant !== 'string') return '';
  return rawMerchant
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/\bwww\./g, '')
    .replace(/\.(com|org|net|io|co|ai|app|gov|edu)\b/g, '')
    .replace(/\b(inc|corp|corporation|llc|ltd|limited|co|company|gmbh|sa|pty)\b/g, '')
    .replace(/[#*~_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates day difference between two YYYY-MM-DD date strings.
 * @param {string} dateStrA
 * @param {string} dateStrB
 * @returns {number} Days difference (positive if B > A)
 */
function getDayDifference(dateStrA, dateStrB) {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Determines whether a list of day intervals matches an expected recurrence frequency.
 * Allows reasonable calendar variations (e.g. months with 28-31 days, weekend billing shifts).
 *
 * @param {number[]} intervals
 * @returns {{ matched: boolean, frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | null, confidence: "low" | "medium" | "high" }}
 */
function evaluateFrequencyPattern(intervals) {
  if (!Array.isArray(intervals) || intervals.length === 0) {
    return { matched: false, frequency: null, confidence: 'low' };
  }

  const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;

  // Patterns definitions: [frequency, minAvg, maxAvg, minSingle, maxSingle]
  const patterns = [
    { freq: 'weekly', minAvg: 6, maxAvg: 8, minSingle: 5, maxSingle: 10 },
    { freq: 'biweekly', minAvg: 12, maxAvg: 16, minSingle: 11, maxSingle: 18 },
    { freq: 'monthly', minAvg: 26, maxAvg: 35, minSingle: 24, maxSingle: 37 },
    { freq: 'quarterly', minAvg: 80, maxAvg: 100, minSingle: 74, maxSingle: 106 }
  ];

  for (const p of patterns) {
    if (avgInterval >= p.minAvg && avgInterval <= p.maxAvg) {
      // Check if all individual intervals are within acceptable window
      const allWithinWindow = intervals.every(i => i >= p.minSingle && i <= p.maxSingle);
      if (allWithinWindow) {
        // Evaluate confidence based on number of intervals and spread
        const maxSpread = Math.max(...intervals) - Math.min(...intervals);
        let confidence = 'medium';

        if (intervals.length >= 2 && maxSpread <= 4) {
          confidence = 'high';
        } else if (intervals.length === 1 && maxSpread === 0) {
          confidence = 'medium';
        } else if (maxSpread > 7) {
          confidence = 'low';
        }

        return { matched: true, frequency: p.freq, confidence };
      }
    }
  }

  return { matched: false, frequency: null, confidence: 'low' };
}

/**
 * Detects possible recurring costs from normalized expense transactions.
 *
 * Rules:
 * - Operates strictly on valid expense transactions (type === "expense").
 * - Groups transactions by normalized merchant.
 * - Compares dates between repeated transactions to detect weekly, biweekly, monthly, or quarterly cadences.
 * - Allows reasonable variation in dates and amounts.
 * - Requires enough repeated observations (default: >= 2 occurrences with strong cadence, or >= 3).
 * - If there is insufficient evidence, does not force a recurring result.
 * - Uses the wording "possible recurring cost".
 * - Does NOT call findings "confirmed subscription".
 * - Does NOT label findings as "wasteful".
 * - Every finding references real transaction IDs.
 *
 * @param {Array} transactions Array of normalized transactions
 * @param {object} [options]
 * @param {number} [options.minOccurrences=2] Minimum repeated transactions required
 * @param {number} [options.maxAmountVarianceRatio=0.25] Maximum coefficient of variation in amounts allowed
 * @returns {Array<{
 *   id: string,
 *   merchant: string,
 *   category: string,
 *   averageAmount: number,
 *   frequency: "weekly" | "biweekly" | "monthly" | "quarterly",
 *   confidence: "low" | "medium" | "high",
 *   transactionIds: string[],
 *   reason: string
 * }>}
 */
export function detectRecurringCosts(transactions, options = {}) {
  const {
    minOccurrences = 2,
    maxAmountVarianceRatio = 0.25
  } = options;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  // 1. Filter valid expense transactions
  const validExpenses = transactions.filter(tx => {
    return validateTransaction(tx).valid && tx.type === TRANSACTION_TYPES.EXPENSE;
  });

  if (validExpenses.length < minOccurrences) {
    return [];
  }

  // 2. Group expenses by normalized merchant name
  const merchantGroups = new Map();
  for (const tx of validExpenses) {
    const rawMerchant = tx.merchant || '';
    const normKey = normalizeMerchant(rawMerchant) || rawMerchant.toLowerCase().trim();
    if (!normKey) continue;

    if (!merchantGroups.has(normKey)) {
      merchantGroups.set(normKey, []);
    }
    merchantGroups.get(normKey).push(tx);
  }

  const recurringFindings = [];
  let recurCounter = 1;

  // 3. Analyze each merchant group for recurring cadence and amount consistency
  for (const group of merchantGroups.values()) {
    if (group.length < minOccurrences) {
      continue;
    }

    // Sort chronologically ascending
    const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate intervals between consecutive payments
    const intervals = [];
    let hasZeroInterval = false;

    for (let i = 1; i < sorted.length; i++) {
      const diff = getDayDifference(sorted[i - 1].date, sorted[i].date);
      if (diff <= 0) {
        hasZeroInterval = true;
      }
      intervals.push(diff);
    }

    // If multiple transactions happened on the exact same date, don't treat them as a recurring cadence
    if (hasZeroInterval && intervals.every(d => d === 0)) {
      continue;
    }

    // Filter out zero-day intervals (same-day duplicate charges) for cadence detection if there are other intervals
    const positiveIntervals = intervals.filter(d => d > 0);
    if (positiveIntervals.length === 0) {
      continue;
    }

    // Evaluate cadence
    const patternResult = evaluateFrequencyPattern(positiveIntervals);
    if (!patternResult.matched) {
      continue;
    }

    // Check amount consistency across the occurrences
    const amounts = sorted.map(t => t.amount);
    const sumAmount = amounts.reduce((s, v) => s + v, 0);
    const avgAmount = Math.round((sumAmount / amounts.length) * 100) / 100;

    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    // Calculate amount standard deviation
    let variance = 0;
    for (const amt of amounts) {
      variance += Math.pow(amt - avgAmount, 2);
    }
    const stdDev = Math.sqrt(variance / amounts.length);
    const cv = avgAmount > 0 ? stdDev / avgAmount : 0;

    // Reject if amount variance is too high (unless occurrences is 2 and amounts are within 15%)
    if (cv > maxAmountVarianceRatio && (maxAmount - minAmount) / avgAmount > 0.35) {
      continue;
    }

    // Determine representative category (most common category in group)
    const categoryCounts = {};
    for (const t of sorted) {
      const cat = t.category || 'Subscriptions';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    let dominantCategory = 'Subscriptions';
    let maxCatCount = 0;
    for (const [cat, cnt] of Object.entries(categoryCounts)) {
      if (cnt > maxCatCount) {
        maxCatCount = cnt;
        dominantCategory = cat;
      }
    }

    // Representative merchant name: use the latest or most frequent original merchant string
    const representativeMerchant = sorted[sorted.length - 1].merchant;

    // Adjust confidence if amounts vary slightly
    let finalConfidence = patternResult.confidence;
    if (sorted.length < 3 && finalConfidence === 'high') {
      finalConfidence = 'medium';
    }
    if (cv > 0.12 && finalConfidence === 'high') {
      finalConfidence = 'medium';
    }

    const txIds = sorted.map(t => t.id);

    recurringFindings.push({
      id: `RECUR-${String(recurCounter++).padStart(3, '0')}`,
      merchant: representativeMerchant,
      category: dominantCategory,
      averageAmount: avgAmount,
      frequency: patternResult.frequency,
      confidence: finalConfidence,
      transactionIds: txIds,
      reason: `Similar payments from the same merchant occurred at approximately ${patternResult.frequency} intervals (possible recurring cost).`
    });
  }

  // Sort by average amount descending
  recurringFindings.sort((a, b) => b.averageAmount - a.averageAmount);

  return recurringFindings;
}
