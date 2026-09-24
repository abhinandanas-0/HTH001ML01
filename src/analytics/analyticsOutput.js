/**
 * @file analyticsOutput.js
 * @description Member 2 Aggregated Analytics Data Output Contract for Member 3 (GenAI layer).
 * Combines financial calculations, irregular-income analysis, anomaly detection,
 * recurring-cost detection, spending-change analysis, and data-quality diagnostics
 * into a single unified, validated structure without generating advice, recommendations,
 * or invoking LLMs.
 */

import { validateTransaction } from './transactionSchema.js';
import { parseCSV } from './csvParser.js';
import { calculateFinancialSummary } from './financialCalculations.js';
import { analyzeIrregularIncome } from './irregularIncome.js';
import { detectSpendingAnomalies } from './anomalyDetection.js';
import { detectRecurringCosts, normalizeMerchant } from './recurringCosts.js';
import { analyzeSpendingChanges } from './spendingChanges.js';

/**
 * Identifies potential duplicate transactions sharing the same date, normalized merchant,
 * amount, and transaction type.
 *
 * @param {Array} transactions Array of normalized transactions
 * @returns {Array<{
 *   transactionIds: string[],
 *   date: string,
 *   merchant: string,
 *   amount: number,
 *   type: string,
 *   count: number,
 *   reason: string
 * }>}
 */
export function findPossibleDuplicates(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const seen = new Map();
  for (const tx of transactions) {
    if (!tx || !tx.date || typeof tx.amount !== 'number') continue;
    const normMerchant = normalizeMerchant(tx.merchant || '') || (tx.merchant || '').toLowerCase().trim();
    const key = `${tx.date}|${normMerchant}|${tx.amount}|${tx.type}`;

    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key).push(tx);
  }

  const duplicates = [];
  for (const group of seen.values()) {
    if (group.length > 1) {
      duplicates.push({
        transactionIds: group.map(t => t.id),
        date: group[0].date,
        merchant: group[0].merchant,
        amount: group[0].amount,
        type: group[0].type,
        count: group.length,
        reason: `${group.length} transactions share the same date, merchant, amount, and type.`
      });
    }
  }

  return duplicates;
}

/**
 * Aggregates all Member 2 analytics into a single structured output contract for Member 3.
 *
 * Contract Shape:
 * {
 *   summary: { totalIncome: 0, totalExpenses: 0, netCashFlow: 0, currency: "INR" },
 *   spendingChanges: [],
 *   irregularIncome: {
 *     incomePattern: "variable" | "relatively_stable" | "insufficient_data",
 *     monthsAnalyzed: 0,
 *     averageMonthlyIncome: null,
 *     medianMonthlyIncome: null,
 *     minimumMonthlyIncome: null,
 *     maximumMonthlyIncome: null,
 *     lowerIncomeMonths: [],
 *     explanation: ""
 *   },
 *   anomalies: [],
 *   recurringCharges: [],
 *   dataQuality: {
 *     totalTransactions: 0,
 *     validTransactions: 0,
 *     invalidRows: 0,
 *     possibleDuplicates: [],
 *     warnings: []
 *   }
 * }
 *
 * Rules:
 * - Does NOT generate financial plans or recommendations.
 * - Does NOT call an LLM.
 * - Every anomaly references a real transaction ID.
 * - Every recurring-cost finding references real transaction IDs.
 * - Every spending-change finding references real transaction IDs.
 * - If data is insufficient, returns empty arrays, null values, and data-quality warnings.
 *
 * @param {string | Array | { transactions: Array, errors?: Array, summary?: object }} input
 * @param {object} [options]
 * @returns {object} Member 2 unified analytics output contract
 */
export function generateMember2Analytics(input, options = {}) {
  let transactions = [];
  let parserErrors = [];
  let totalRows = 0;
  let invalidRows = 0;

  // 1. Ingest input (raw CSV string, parseResult object, or transaction array)
  if (typeof input === 'string') {
    const parseResult = parseCSV(input);
    transactions = parseResult.transactions;
    parserErrors = parseResult.errors;
    totalRows = parseResult.summary.totalRows;
    invalidRows = parseResult.summary.invalidRows;
  } else if (input && typeof input === 'object') {
    if (Array.isArray(input)) {
      transactions = input;
      totalRows = input.length;
      const validCount = transactions.filter(tx => validateTransaction(tx).valid).length;
      invalidRows = totalRows - validCount;
    } else if (Array.isArray(input.transactions)) {
      transactions = input.transactions;
      parserErrors = input.errors || [];
      invalidRows = input.summary?.invalidRows ?? parserErrors.length;
      totalRows = input.summary?.totalRows ?? (transactions.length + invalidRows);
    }
  }

  // 2. Filter strictly valid transactions conforming to schema
  const validTransactions = transactions.filter(tx => validateTransaction(tx).valid);
  const validCount = validTransactions.length;

  // 3. Compute Financial Summary
  const currency = options.currency || 'INR';

  let summary = {
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    currency
  };

  if (validCount > 0) {
    const finSummary = calculateFinancialSummary(validTransactions);
    summary = {
      totalIncome: finSummary.totalIncome,
      totalExpenses: finSummary.totalExpenses,
      netCashFlow: finSummary.netCashFlow,
      currency
    };
  }

  // 4. Compute Spending Changes
  const spendingChanges = validCount > 0
    ? analyzeSpendingChanges(validTransactions, options.spendingChangeOptions)
    : [];

  // 5. Compute Irregular Income Analysis
  let irregularIncome = {
    incomePattern: 'insufficient_data',
    monthsAnalyzed: 0,
    averageMonthlyIncome: null,
    medianMonthlyIncome: null,
    minimumMonthlyIncome: null,
    maximumMonthlyIncome: null,
    lowerIncomeMonths: [],
    explanation: 'No transaction data provided for income analysis.'
  };

  if (validCount > 0) {
    const incAnalysis = analyzeIrregularIncome(validTransactions, options.irregularIncomeOptions);
    irregularIncome = {
      incomePattern: incAnalysis.incomePattern,
      monthsAnalyzed: incAnalysis.monthsAnalyzed,
      averageMonthlyIncome: incAnalysis.averageMonthlyIncome,
      medianMonthlyIncome: incAnalysis.medianMonthlyIncome,
      minimumMonthlyIncome: incAnalysis.minimumMonthlyIncome,
      maximumMonthlyIncome: incAnalysis.maximumMonthlyIncome,
      lowerIncomeMonths: incAnalysis.lowerIncomeMonths || [],
      explanation: incAnalysis.explanation
    };
  }

  // 6. Compute Spending Anomalies (Median + MAD)
  let anomalies = [];
  if (validCount > 0) {
    const anomalyResult = detectSpendingAnomalies(validTransactions, options.anomalyOptions);
    anomalies = anomalyResult.anomalies;
  }

  // 7. Compute Recurring Charges
  let recurringCharges = [];
  if (validCount > 0) {
    recurringCharges = detectRecurringCosts(validTransactions, options.recurringCostOptions);
  }

  // 8. Assess Data Quality & Warnings
  const possibleDuplicates = findPossibleDuplicates(validTransactions);
  const warnings = [];

  if (invalidRows > 0) {
    warnings.push(`${invalidRows} row(s) failed CSV parsing or schema validation.`);
  }

  if (possibleDuplicates.length > 0) {
    warnings.push(`${possibleDuplicates.length} set(s) of potential duplicate transactions detected.`);
  }

  if (validCount === 0) {
    warnings.push('No valid transactions available for financial intelligence processing.');
  } else {
    // Check calendar month depth for spending changes
    const expenseMonths = new Set(
      validTransactions
        .filter(tx => tx.type === 'expense')
        .map(tx => tx.date.slice(0, 7))
    );
    if (expenseMonths.size < 2) {
      warnings.push('Insufficient historical periods (< 2 calendar months) for spending-change comparison.');
    }

    if (irregularIncome.incomePattern === 'insufficient_data') {
      warnings.push('Insufficient income history (< 2 calendar months) for irregular income variability analysis.');
    }
  }

  const dataQuality = {
    totalTransactions: totalRows,
    validTransactions: validCount,
    invalidRows,
    possibleDuplicates,
    warnings
  };

  // 9. Return the structured Member 2 output contract
  return {
    summary,
    spendingChanges,
    irregularIncome,
    anomalies,
    recurringCharges,
    dataQuality
  };
}

// Re-export alias for convenience
export const buildMember2Analytics = generateMember2Analytics;
