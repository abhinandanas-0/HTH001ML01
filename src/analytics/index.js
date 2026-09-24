/**
 * @file index.js
 * @description Central export point for Member 2 GA-08 Financial & Data Intelligence Module.
 * Stages implemented:
 * 1. Transaction schema & validation
 * 2. CSV parser
 * 3. Financial calculations & totals
 * 4. Irregular-income analysis
 * 5. Anomaly detection (Median + MAD)
 * 6. Recurring-cost detection
 * 7. Spending-change analysis
 * 8. Aggregated Member 2 output contract
 */

export {
  TRANSACTION_TYPES,
  TRANSACTION_SOURCES,
  normalizeDate,
  isValidCalendarDate,
  validateTransaction,
  createTransaction
} from './transactionSchema.js';

export {
  tokenizeCSV,
  parseCSV,
  parseCurrencyNumber,
  resolveColumnIndices
} from './csvParser.js';

export {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateNetCashFlow,
  calculateCategoryTotals,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateMonthlyNetCashFlow,
  calculateFinancialSummary
} from './financialCalculations.js';

export {
  calculateMedian,
  calculateMean,
  calculateStandardDeviation,
  analyzeIrregularIncome
} from './irregularIncome.js';

export {
  calculateMAD,
  detectSpendingAnomalies
} from './anomalyDetection.js';

export {
  detectRecurringCosts,
  normalizeMerchant
} from './recurringCosts.js';

export {
  analyzeSpendingChanges
} from './spendingChanges.js';

export {
  generateMember2Analytics,
  buildMember2Analytics,
  findPossibleDuplicates
} from './analyticsOutput.js';
