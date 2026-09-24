/**
 * @file budgetViolations.js
 * @description Compares user-defined category budgets against actual normalized expense transactions
 * to detect budget overruns with strict traceability to real transaction IDs.
 */

import { validateTransaction, TRANSACTION_TYPES } from './transactionSchema.js';

/**
 * Normalizes a category string for case-insensitive matching.
 * @param {string} cat
 * @returns {string}
 */
function normalizeCategory(cat) {
  return typeof cat === 'string' ? cat.trim().toLowerCase() : '';
}

/**
 * Evaluates all user-configured category budgets against actual expense transactions.
 * Returns evaluation details for both compliant and exceeded categories.
 *
 * @param {Array} transactions Array of normalized transactions
 * @param {Record<string, number>} budgetConfig Category budget mapping, e.g. { "Food": 5000, "Dining": 300 }
 * @param {object} [options]
 * @param {string} [options.period] Optional YYYY-MM filter to evaluate budget for a specific calendar month
 * @param {boolean} [options.latestPeriodOnly=false] Whether to restrict evaluation to the latest calendar month
 * @returns {Array<{
 *   category: string,
 *   budgetAmount: number,
 *   actualAmount: number,
 *   difference: number,
 *   exceededAmount: number,
 *   percentageOverBudget: number,
 *   transactionIds: string[],
 *   status: "over_budget" | "under_budget"
 * }>}
 */
export function evaluateCategoryBudgets(transactions, budgetConfig = {}, options = {}) {
  if (!budgetConfig || typeof budgetConfig !== 'object' || Object.keys(budgetConfig).length === 0) {
    return [];
  }

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  // 1. Filter valid expense transactions
  let validExpenses = transactions.filter(tx => {
    return validateTransaction(tx).valid && tx.type === TRANSACTION_TYPES.EXPENSE;
  });

  // Optional: filter by specific calendar month period (YYYY-MM)
  if (options.period && typeof options.period === 'string') {
    validExpenses = validExpenses.filter(tx => tx.date.startsWith(options.period));
  } else if (options.latestPeriodOnly) {
    const availableMonths = Array.from(new Set(validExpenses.map(tx => tx.date.slice(0, 7)))).sort();
    if (availableMonths.length > 0) {
      const latestMonth = availableMonths[availableMonths.length - 1];
      validExpenses = validExpenses.filter(tx => tx.date.startsWith(latestMonth));
    }
  }

  const results = [];

  for (const [budgetCategory, rawBudget] of Object.entries(budgetConfig)) {
    const budgetAmount = Number(rawBudget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      continue;
    }

    const normTarget = normalizeCategory(budgetCategory);

    // Collect all matching expense transactions for this category
    const matchingTxns = validExpenses.filter(tx => {
      return normalizeCategory(tx.category) === normTarget;
    });

    const actualAmount = Math.round(matchingTxns.reduce((sum, tx) => sum + tx.amount, 0) * 100) / 100;
    const difference = Math.round((actualAmount - budgetAmount) * 100) / 100;
    const isOver = actualAmount > budgetAmount;
    const exceededAmount = isOver ? difference : 0;
    const percentageOverBudget = isOver && budgetAmount > 0
      ? Math.round(((exceededAmount / budgetAmount) * 100) * 10) / 10
      : 0;

    results.push({
      category: budgetCategory,
      budgetAmount,
      actualAmount,
      difference,
      exceededAmount,
      percentageOverBudget,
      transactionIds: matchingTxns.map(tx => tx.id),
      status: isOver ? 'over_budget' : 'under_budget'
    });
  }

  return results;
}

/**
 * Detects category budget violations where actual spending strictly exceeds the allocated budget.
 *
 * Rules:
 * - Only uses actual normalized transactions.
 * - Does NOT invent a budget if none was provided.
 * - Does NOT flag violations for categories without an explicit user budget.
 * - Returns only categories where actualAmount > budgetAmount.
 * - Every violation includes actual transaction IDs.
 *
 * @param {Array} transactions Array of normalized transactions
 * @param {Record<string, number>} budgetConfig User-provided category budget configuration
 * @param {object} [options]
 * @returns {Array<{
 *   category: string,
 *   budgetAmount: number,
 *   actualAmount: number,
 *   difference: number,
 *   exceededAmount: number,
 *   percentageOverBudget: number,
 *   transactionIds: string[],
 *   status: "over_budget"
 * }>}
 */
export function detectBudgetViolations(transactions, budgetConfig = {}, options = {}) {
  const evaluations = evaluateCategoryBudgets(transactions, budgetConfig, options);

  // Return strictly violations (actualAmount > budgetAmount)
  return evaluations
    .filter(item => item.status === 'over_budget')
    .map(v => ({
      category: v.category,
      budgetAmount: v.budgetAmount,
      actualAmount: v.actualAmount,
      difference: v.difference,
      exceededAmount: v.exceededAmount,
      percentageOverBudget: v.percentageOverBudget,
      transactionIds: v.transactionIds,
      status: 'over_budget'
    }));
}

export const budgetViolations = detectBudgetViolations;
