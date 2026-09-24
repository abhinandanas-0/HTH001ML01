/**
 * @file financialCalculations.js
 * @description Pure functions for calculating financial totals, category distributions,
 * and monthly cashflow from normalized Transaction records.
 */

import { validateTransaction, TRANSACTION_TYPES } from './transactionSchema.js';

/**
 * Filters an array of transactions to only those strictly conforming to the schema.
 * @param {Array} transactions
 * @returns {Array} Valid transactions
 */
function getValidTransactions(transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.filter(tx => validateTransaction(tx).valid);
}

/**
 * Calculates total income across all valid transactions.
 * Only transactions with type === "income" contribute.
 *
 * @param {Array} transactions
 * @returns {number}
 */
export function calculateTotalIncome(transactions) {
  const valid = getValidTransactions(transactions);
  const total = valid.reduce((sum, tx) => {
    return tx.type === TRANSACTION_TYPES.INCOME ? sum + tx.amount : sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates total expenses across all valid transactions.
 * Only transactions with type === "expense" contribute.
 *
 * @param {Array} transactions
 * @returns {number}
 */
export function calculateTotalExpenses(transactions) {
  const valid = getValidTransactions(transactions);
  const total = valid.reduce((sum, tx) => {
    return tx.type === TRANSACTION_TYPES.EXPENSE ? sum + tx.amount : sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates net cash flow: totalIncome - totalExpenses.
 *
 * @param {Array} transactions
 * @returns {number}
 */
export function calculateNetCashFlow(transactions) {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  return Math.round((income - expenses) * 100) / 100;
}

/**
 * Calculates spending breakdown by category strictly from expense transactions.
 * Returns an object mapping category name to total spent.
 *
 * @param {Array} transactions
 * @returns {Record<string, number>}
 */
export function calculateCategoryTotals(transactions) {
  const valid = getValidTransactions(transactions);
  const categoryMap = {};

  for (const tx of valid) {
    if (tx.type === TRANSACTION_TYPES.EXPENSE) {
      const cat = tx.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + tx.amount;
    }
  }

  // Round all values to 2 decimal places
  const result = {};
  for (const [cat, sum] of Object.entries(categoryMap)) {
    result[cat] = Math.round(sum * 100) / 100;
  }

  return result;
}

/**
 * Groups income by month based on the transaction date (YYYY-MM).
 *
 * @param {Array} transactions
 * @returns {Record<string, number>} e.g. { "2026-08": 5200, "2026-09": 4800 }
 */
export function calculateMonthlyIncome(transactions) {
  const valid = getValidTransactions(transactions);
  const monthly = {};

  for (const tx of valid) {
    if (tx.type === TRANSACTION_TYPES.INCOME) {
      const monthKey = tx.date.slice(0, 7); // YYYY-MM
      monthly[monthKey] = (monthly[monthKey] || 0) + tx.amount;
    }
  }

  const result = {};
  for (const [m, sum] of Object.entries(monthly)) {
    result[m] = Math.round(sum * 100) / 100;
  }
  return result;
}

/**
 * Groups expenses by month based on the transaction date (YYYY-MM).
 *
 * @param {Array} transactions
 * @returns {Record<string, number>} e.g. { "2026-08": 3200, "2026-09": 3400 }
 */
export function calculateMonthlyExpenses(transactions) {
  const valid = getValidTransactions(transactions);
  const monthly = {};

  for (const tx of valid) {
    if (tx.type === TRANSACTION_TYPES.EXPENSE) {
      const monthKey = tx.date.slice(0, 7); // YYYY-MM
      monthly[monthKey] = (monthly[monthKey] || 0) + tx.amount;
    }
  }

  const result = {};
  for (const [m, sum] of Object.entries(monthly)) {
    result[m] = Math.round(sum * 100) / 100;
  }
  return result;
}

/**
 * Calculates net cash flow per month (monthlyIncome - monthlyExpenses).
 *
 * @param {Array} transactions
 * @returns {Record<string, number>} e.g. { "2026-08": 2000, "2026-09": 1400 }
 */
export function calculateMonthlyNetCashFlow(transactions) {
  const incomeMap = calculateMonthlyIncome(transactions);
  const expenseMap = calculateMonthlyExpenses(transactions);

  // Collect all unique months
  const allMonths = Array.from(new Set([...Object.keys(incomeMap), ...Object.keys(expenseMap)])).sort();
  const netMap = {};

  for (const month of allMonths) {
    const inc = incomeMap[month] || 0;
    const exp = expenseMap[month] || 0;
    netMap[month] = Math.round((inc - exp) * 100) / 100;
  }

  return netMap;
}

/**
 * Comprehensive summary of all financial calculations for downstream consumption.
 *
 * @param {Array} transactions
 * @returns {object}
 */
export function calculateFinancialSummary(transactions) {
  const valid = getValidTransactions(transactions);
  const totalIncome = calculateTotalIncome(valid);
  const totalExpenses = calculateTotalExpenses(valid);
  const netCashFlow = Math.round((totalIncome - totalExpenses) * 100) / 100;
  const categoryTotals = calculateCategoryTotals(valid);

  const monthlyIncome = calculateMonthlyIncome(valid);
  const monthlyExpenses = calculateMonthlyExpenses(valid);
  const monthlyNet = calculateMonthlyNetCashFlow(valid);

  const allMonths = Array.from(new Set([
    ...Object.keys(monthlyIncome),
    ...Object.keys(monthlyExpenses)
  ])).sort();

  const monthlyTimeline = allMonths.map(month => ({
    month,
    income: monthlyIncome[month] || 0,
    expenses: monthlyExpenses[month] || 0,
    netCashFlow: monthlyNet[month] || 0
  }));

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    categoryTotals,
    monthlyIncome,
    monthlyExpenses,
    monthlyNetCashFlow: monthlyNet,
    monthlyTimeline,
    transactionCount: {
      total: valid.length,
      incomeCount: valid.filter(tx => tx.type === TRANSACTION_TYPES.INCOME).length,
      expenseCount: valid.filter(tx => tx.type === TRANSACTION_TYPES.EXPENSE).length
    }
  };
}
