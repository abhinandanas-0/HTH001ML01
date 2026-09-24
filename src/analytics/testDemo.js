/**
 * @file testDemo.js
 * @description Comprehensive internal verification test for Member 2 GA-08 Analytics pipeline (Stages 1-9).
 * 
 * Verifies all 11 required checkpoints:
 * 1. Transaction normalization
 * 2. CSV parsing
 * 3. Income and expense calculations
 * 4. Monthly cash flow
 * 5. Irregular-income analysis
 * 6. At least one anomaly with a transaction ID
 * 7. At least one possible recurring cost with transaction IDs
 * 8. At least one spending increase with transaction IDs
 * 9. Final aggregated Member 2 output object
 * 10. Invalid CSV row handling
 * 11. Insufficient-data handling
 * 
 * NOTE: This file uses in-memory test data solely for verification and is NOT
 * imported into the React frontend.
 * 
 * Run with: node src/analytics/testDemo.js
 */

import {
  parseCSV,
  validateTransaction,
  calculateFinancialSummary,
  calculateMonthlyNetCashFlow,
  analyzeIrregularIncome,
  detectSpendingAnomalies,
  detectRecurringCosts,
  analyzeSpendingChanges,
  generateMember2Analytics
} from './index.js';

console.log('================================================================');
console.log('GA-08 MEMBER 2: COMPLETE DATA & FINANCIAL INTELLIGENCE PIPELINE');
console.log('================================================================\n');

// Standard in-memory test CSV spanning 3 chronological months (June, July, August 2026)
const inMemoryTestCSV = `Date,Description,Category,Amount,Type
2026-06-01,Client Consulting Payment,Client Work,4200.00,income
2026-06-05,Metropolitan Grocery Co,Groceries,82.40,expense
2026-06-12,Metropolitan Grocery Co,Groceries,94.10,expense
2026-06-18,Metropolitan Grocery Co,Groceries,88.90,expense
2026-06-20,Cloud Infrastructure Host LLC,Software,45.00,expense
2026-06-25,Metropolitan Grocery Co,Groceries,540.00,expense
2026-07-01,Client Consulting Payment,Client Work,1800.00,income
2026-07-08,Metropolitan Grocery Co,Groceries,78.50,expense
2026-07-15,Metropolitan Grocery Co,Groceries,85.20,expense
2026-07-20,Cloud Infrastructure Host LLC,Software,45.00,expense
2026-07-22,Urban Coworking Desk,Workspace,350.00,expense
2026-07-28,Fine Dining Lounge,Dining,120.00,expense
2026-08-01,Client Consulting Payment,Client Work,5600.00,income
2026-08-05,Metropolitan Grocery Co,Groceries,91.30,expense
2026-08-14,Metropolitan Grocery Co,Groceries,89.00,expense
2026-08-20,Cloud Infrastructure Host LLC,Software,45.00,expense
2026-08-28,Fine Dining Lounge,Dining,420.00,expense
`;

// ============================================================================
// CHECKPOINT 1 & 2: CSV Parsing & Transaction Normalization
// ============================================================================
console.log('--- CHECKPOINT 1 & 2: CSV Parsing & Transaction Normalization ---');
const parsed = parseCSV(inMemoryTestCSV);

if (parsed.errors.length > 0) {
  throw new Error(`CSV Parsing failed unexpectedly: ${JSON.stringify(parsed.errors)}`);
}

const allValid = parsed.transactions.every(tx => validateTransaction(tx).valid);
if (!allValid || parsed.transactions.length === 0) {
  throw new Error('Transaction normalization failed: transactions do not conform to schema.');
}

console.log(`[PASS] Total Rows Parsed: ${parsed.summary.totalRows}`);
console.log(`[PASS] Valid Transactions: ${parsed.summary.validRows}`);
console.log(`[PASS] All ${parsed.transactions.length} transactions strictly adhere to standardized schema.`);
console.log('Sample Normalized Transaction (Row 1):', JSON.stringify(parsed.transactions[0], null, 2));

// ============================================================================
// CHECKPOINT 3: Income and Expense Calculations
// ============================================================================
console.log('\n--- CHECKPOINT 3: Income and Expense Calculations ---');
const financialSummary = calculateFinancialSummary(parsed.transactions);

if (financialSummary.totalIncome <= 0 || financialSummary.totalExpenses <= 0) {
  throw new Error('Financial calculations failed: income or expenses not calculated correctly.');
}

console.log(`[PASS] Total Income:   $${financialSummary.totalIncome.toFixed(2)}`);
console.log(`[PASS] Total Expenses: $${financialSummary.totalExpenses.toFixed(2)}`);
console.log(`[PASS] Net Cash Flow:  $${financialSummary.netCashFlow.toFixed(2)}`);
console.log('Category Outflows Breakdown:', financialSummary.categoryTotals);

// ============================================================================
// CHECKPOINT 4: Monthly Cash Flow
// ============================================================================
console.log('\n--- CHECKPOINT 4: Monthly Cash Flow ---');
const monthlyNetFlow = calculateMonthlyNetCashFlow(parsed.transactions);
const timeline = financialSummary.monthlyTimeline;

if (timeline.length !== 3 || Object.keys(monthlyNetFlow).length !== 3) {
  throw new Error(`Expected 3 monthly periods, found: ${timeline.length}`);
}

console.log('[PASS] Monthly Net Flow Map:', monthlyNetFlow);
console.log('[PASS] Monthly Cash Flow Timeline:');
timeline.forEach(m => {
  console.log(`  - ${m.month}: Income: $${m.income.toFixed(2)} | Expenses: $${m.expenses.toFixed(2)} | Net: $${m.netCashFlow.toFixed(2)}`);
});

// ============================================================================
// CHECKPOINT 5: Irregular-Income Analysis
// ============================================================================
console.log('\n--- CHECKPOINT 5: Irregular-Income Analysis ---');
const incomeAnalysis = analyzeIrregularIncome(parsed.transactions);

if (incomeAnalysis.incomePattern !== 'variable' || incomeAnalysis.monthsAnalyzed !== 3) {
  throw new Error(`Irregular income pattern expected 'variable' with 3 months, got: ${incomeAnalysis.incomePattern}`);
}

console.log(`[PASS] Income Pattern:         ${incomeAnalysis.incomePattern}`);
console.log(`[PASS] Months Analyzed:        ${incomeAnalysis.monthsAnalyzed}`);
console.log(`[PASS] Average Monthly Income: $${incomeAnalysis.averageMonthlyIncome?.toFixed(2)}`);
console.log(`[PASS] Median Monthly Income:  $${incomeAnalysis.medianMonthlyIncome?.toFixed(2)}`);
console.log(`[PASS] Min Monthly Income:     $${incomeAnalysis.minimumMonthlyIncome?.toFixed(2)}`);
console.log(`[PASS] Max Monthly Income:     $${incomeAnalysis.maximumMonthlyIncome?.toFixed(2)}`);
console.log(`[PASS] Lower-Income Months:    ${incomeAnalysis.lowerIncomeMonths.map(m => m.month).join(', ')}`);
console.log(`[PASS] Factual Explanation:    ${incomeAnalysis.explanation}`);

// ============================================================================
// CHECKPOINT 6: At Least One Anomaly with a Transaction ID
// ============================================================================
console.log('\n--- CHECKPOINT 6: Anomaly Detection (with real Transaction ID) ---');
const anomalyResult = detectSpendingAnomalies(parsed.transactions);

if (anomalyResult.anomalies.length === 0) {
  throw new Error('Anomaly detection failed: expected at least one spending anomaly.');
}

const sampleAnomaly = anomalyResult.anomalies[0];
if (!sampleAnomaly.transactionId || typeof sampleAnomaly.transactionId !== 'string') {
  throw new Error('Anomaly finding must reference an actual transactionId.');
}

console.log(`[PASS] Anomalies Found: ${anomalyResult.anomalies.length}`);
console.log('[PASS] Example Anomaly Output:');
console.log(JSON.stringify(sampleAnomaly, null, 2));

// ============================================================================
// CHECKPOINT 7: At Least One Possible Recurring Cost with Transaction IDs
// ============================================================================
console.log('\n--- CHECKPOINT 7: Recurring-Cost Detection (with real Transaction IDs) ---');
const recurringCosts = detectRecurringCosts(parsed.transactions);

if (recurringCosts.length === 0) {
  throw new Error('Recurring-cost detection failed: expected at least one recurring cost pattern.');
}

const sampleRecurring = recurringCosts[0];
if (!Array.isArray(sampleRecurring.transactionIds) || sampleRecurring.transactionIds.length < 2) {
  throw new Error('Recurring cost finding must reference real transaction IDs.');
}
if (!sampleRecurring.reason.includes('possible recurring cost')) {
  throw new Error('Recurring cost reason must include wording "possible recurring cost".');
}

console.log(`[PASS] Recurring Charges Identified: ${recurringCosts.length}`);
console.log('[PASS] Example Recurring-Cost Output:');
console.log(JSON.stringify(sampleRecurring, null, 2));

// ============================================================================
// CHECKPOINT 8: At Least One Spending Increase with Transaction IDs
// ============================================================================
console.log('\n--- CHECKPOINT 8: Spending-Change Analysis (with real Transaction IDs) ---');
// Compare the two latest months: 2026-08 (current) vs 2026-07 (previous)
const spendingChanges = analyzeSpendingChanges(parsed.transactions, {
  currentPeriod: '2026-08',
  previousPeriod: '2026-07'
});

const spendingIncrease = spendingChanges.find(sc => sc.changeAmount > 0);
if (!spendingIncrease) {
  throw new Error('Spending-change analysis failed: expected at least one spending increase.');
}

if (!Array.isArray(spendingIncrease.currentPeriodTransactionIds) || spendingIncrease.currentPeriodTransactionIds.length === 0) {
  throw new Error('Spending increase must reference current period transaction IDs.');
}
if (!Array.isArray(spendingIncrease.previousPeriodTransactionIds) || spendingIncrease.previousPeriodTransactionIds.length === 0) {
  throw new Error('Spending increase must reference previous period transaction IDs.');
}

console.log(`[PASS] Categories Analyzed for Change: ${spendingChanges.length}`);
console.log('[PASS] Example Spending Increase Output:');
console.log(JSON.stringify(spendingIncrease, null, 2));

// ============================================================================
// CHECKPOINT 9: Final Aggregated Member 2 Output Object
// ============================================================================
console.log('\n--- CHECKPOINT 9: Final Aggregated Member 2 Output Object ---');
const member2Output = generateMember2Analytics(parsed);

// Validate shape strictly matches contract
const requiredTopKeys = ['summary', 'spendingChanges', 'irregularIncome', 'anomalies', 'recurringCharges', 'dataQuality'];
for (const key of requiredTopKeys) {
  if (!(key in member2Output)) {
    throw new Error(`Aggregated output missing required contract key: "${key}"`);
  }
}

if (typeof member2Output.summary.totalIncome !== 'number' ||
    typeof member2Output.summary.totalExpenses !== 'number' ||
    typeof member2Output.summary.netCashFlow !== 'number' ||
    member2Output.summary.currency !== 'INR') {
  throw new Error('Aggregated summary values must be numbers and include default currency "INR".');
}

// Test custom currency metadata passing
const customCurrencyOutput = generateMember2Analytics(parsed, { currency: 'USD' });
if (customCurrencyOutput.summary.currency !== 'USD') {
  throw new Error('Summary currency must reflect user-selected currency option.');
}

console.log('[PASS] Aggregated Output Object successfully generated and schema verified (including currency).');
console.log('\nComplete Aggregated Member 2 Output Object:');
console.log(JSON.stringify(member2Output, null, 2));

// ============================================================================
// CHECKPOINT 10: Invalid CSV Row Handling
// ============================================================================
console.log('\n--- CHECKPOINT 10: Invalid CSV Row Handling ---');
const invalidCSVData = `Date,Description,Category,Amount,Type
2026-09-01,Valid Office Supplies,Workspace,75.00,expense
INVALID_DATE_FORMAT,Broken Date Txn,Workspace,50.00,expense
2026-09-03,Broken Amount Txn,Workspace,NOT_A_NUMBER,expense
2026-09-04,Broken Type Txn,Workspace,20.00,invalid_type
`;

const invalidTestResult = parseCSV(invalidCSVData);
if (invalidTestResult.summary.invalidRows !== 3 || invalidTestResult.summary.validRows !== 1) {
  throw new Error(`Expected 3 invalid rows and 1 valid row, got: ${invalidTestResult.summary.invalidRows} invalid and ${invalidTestResult.summary.validRows} valid.`);
}

const invalidAggregated = generateMember2Analytics(invalidCSVData);
if (invalidAggregated.dataQuality.invalidRows !== 3) {
  throw new Error(`Data quality contract must report invalid rows (got: ${invalidAggregated.dataQuality.invalidRows})`);
}
if (!invalidAggregated.dataQuality.warnings.some(w => w.includes('3 row(s) failed'))) {
  throw new Error('Data quality warnings must notify about rejected rows.');
}

console.log(`[PASS] Correctly detected ${invalidTestResult.summary.invalidRows} invalid rows and preserved ${invalidTestResult.summary.validRows} valid row.`);
console.log('[PASS] Data quality warnings reported:', invalidAggregated.dataQuality.warnings);

// ============================================================================
// CHECKPOINT 11: Insufficient-Data Handling
// ============================================================================
console.log('\n--- CHECKPOINT 11: Insufficient-Data Handling ---');
// Scenario A: Completely empty dataset
const emptyAggregated = generateMember2Analytics([]);
if (emptyAggregated.summary.totalIncome !== 0 ||
    emptyAggregated.summary.totalExpenses !== 0 ||
    emptyAggregated.summary.currency !== 'INR' ||
    emptyAggregated.spendingChanges.length !== 0 ||
    emptyAggregated.anomalies.length !== 0 ||
    emptyAggregated.recurringCharges.length !== 0 ||
    emptyAggregated.irregularIncome.incomePattern !== 'insufficient_data') {
  throw new Error('Insufficient-data handling failed on empty input.');
}

// Scenario B: Single transaction (only 1 month, no comparisons possible)
const singleTxnAggregated = generateMember2Analytics([
  {
    id: 'TXN-SOLO',
    date: '2026-09-10',
    merchant: 'One Time Vendor',
    category: 'Misc',
    amount: 150.00,
    type: 'expense',
    source: 'csv'
  }
]);

if (singleTxnAggregated.spendingChanges.length !== 0) {
  throw new Error('Spending changes should be empty when fewer than 2 periods exist.');
}
if (singleTxnAggregated.recurringCharges.length !== 0) {
  throw new Error('Recurring charges should be empty when insufficient repeated observations exist.');
}
if (!singleTxnAggregated.dataQuality.warnings.some(w => w.includes('Insufficient historical periods'))) {
  throw new Error('Must generate warning for insufficient historical periods.');
}

console.log('[PASS] Empty dataset safely handled with zeroed summaries, empty arrays, and clear warnings.');
console.log('[PASS] Single transaction dataset correctly avoided making ungrounded spending change or recurring claims.');

console.log('\n================================================================');
console.log('ALL 11 MEMBER 2 PIPELINE CHECKPOINTS VERIFIED SUCCESSFULLY!');
console.log('================================================================');
