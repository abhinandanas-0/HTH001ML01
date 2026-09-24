/**
 * @file spendingChanges.js
 * @description Pure functions for comparing category spending across chronological periods.
 * Analyzes period-over-period spending changes strictly from actual transaction data
 * with full traceability to real transaction IDs.
 */

import { validateTransaction, TRANSACTION_TYPES } from './transactionSchema.js';

/**
 * Compares spending across two comparable periods (default: the two most recent calendar months).
 *
 * Rules:
 * - Operates strictly on valid expense transactions (type === "expense").
 * - Uses actual transaction data only.
 * - Does NOT invent comparison periods.
 * - If fewer than 2 distinct periods exist, returns an empty array (insufficient historical data).
 * - Every finding contains real transaction IDs from both periods.
 *
 * @param {Array} transactions Array of normalized transactions
 * @param {object} [options]
 * @param {string} [options.currentPeriod] YYYY-MM period for current spending (optional)
 * @param {string} [options.previousPeriod] YYYY-MM period for comparison baseline (optional)
 * @returns {Array<{
 *   category: string,
 *   currentPeriodAmount: number,
 *   previousPeriodAmount: number,
 *   changeAmount: number,
 *   changePercentage: number | null,
 *   currentPeriodTransactionIds: string[],
 *   previousPeriodTransactionIds: string[],
 *   explanation: string
 * }>}
 */
export function analyzeSpendingChanges(transactions, options = {}) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  // 1. Filter valid expense transactions
  const validExpenses = transactions.filter(tx => {
    return validateTransaction(tx).valid && tx.type === TRANSACTION_TYPES.EXPENSE;
  });

  if (validExpenses.length === 0) {
    return [];
  }

  // 2. Discover available calendar months (YYYY-MM)
  const availableMonths = Array.from(new Set(
    validExpenses.map(tx => tx.date.slice(0, 7))
  )).sort();

  // If fewer than 2 distinct calendar months exist, there is insufficient historical data
  if (availableMonths.length < 2) {
    return [];
  }

  // Determine current and previous comparison periods
  const currentPeriod = options.currentPeriod || availableMonths[availableMonths.length - 1];
  const previousPeriod = options.previousPeriod || availableMonths[availableMonths.length - 2];

  // Verify that the requested periods exist in available data
  if (!availableMonths.includes(currentPeriod) || !availableMonths.includes(previousPeriod)) {
    return [];
  }

  // Partition transactions into the two periods
  const currPeriodTxns = validExpenses.filter(tx => tx.date.startsWith(currentPeriod));
  const prevPeriodTxns = validExpenses.filter(tx => tx.date.startsWith(previousPeriod));

  // Collect all unique categories across both periods
  const allCategories = Array.from(new Set([
    ...currPeriodTxns.map(tx => tx.category || 'Uncategorized'),
    ...prevPeriodTxns.map(tx => tx.category || 'Uncategorized')
  ])).sort();

  const results = [];

  for (const category of allCategories) {
    const currCatTxns = currPeriodTxns.filter(tx => (tx.category || 'Uncategorized') === category);
    const prevCatTxns = prevPeriodTxns.filter(tx => (tx.category || 'Uncategorized') === category);

    const currAmount = Math.round(currCatTxns.reduce((sum, tx) => sum + tx.amount, 0) * 100) / 100;
    const prevAmount = Math.round(prevCatTxns.reduce((sum, tx) => sum + tx.amount, 0) * 100) / 100;

    // If no spending in either period, omit
    if (currAmount === 0 && prevAmount === 0) {
      continue;
    }

    const changeAmount = Math.round((currAmount - prevAmount) * 100) / 100;

    let changePercentage = null;
    if (prevAmount > 0) {
      changePercentage = Math.round(((changeAmount / prevAmount) * 100) * 10) / 10;
    }

    const currIds = currCatTxns.map(tx => tx.id);
    const prevIds = prevCatTxns.map(tx => tx.id);

    let explanation = '';
    if (changeAmount > 0) {
      explanation = `${category} spending increased by ${changeAmount} compared with the previous period.`;
    } else if (changeAmount < 0) {
      explanation = `${category} spending decreased by ${Math.abs(changeAmount)} compared with the previous period.`;
    } else {
      explanation = `${category} spending remained unchanged compared with the previous period.`;
    }

    results.push({
      category,
      currentPeriodAmount: currAmount,
      previousPeriodAmount: prevAmount,
      changeAmount,
      changePercentage,
      currentPeriodTransactionIds: currIds,
      previousPeriodTransactionIds: prevIds,
      explanation
    });
  }

  // Sort by absolute change amount descending
  results.sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount));

  return results;
}
