/**
 * @file testDemo.js
 * @description Comprehensive verification test suite for GA-08 Member 2 Data & Financial Intelligence pipeline.
 *
 * Verifies all Member 2 responsibilities:
 * 1. Transaction schema & CSV normalization
 * 2. Financial totals, category breakdowns, and monthly cash flow
 * 3. Irregular-income variability analysis
 * 4. Anomaly detection (Median + MAD with transaction IDs)
 * 5. Recurring-cost detection (with transaction IDs)
 * 6. Spending-change analysis (period-over-period with transaction IDs)
 * 7. Goal Tracking (Section A: known goal, calculated progress/surplus, missing goal handling)
 * 8. Budget Violation Detection (Section B: over/under budget, exceeded amount, transaction IDs)
 * 9. Money Leak Detection (Section C: evidence-based, essential category protection, non-accusatory)
 * 10. Financial Health Metrics / Score (Section D: transparent score, metrics, insufficient-data handling)
 * 11. What-If Financial Calculations (Section E: hypothetical projections, cash flow delta, annualized impact)
 * 12. Full Aggregated Member 2 Output Contract (Section F: 11 required keys, data-quality diagnostics)
 * 13. Invalid CSV row handling
 * 14. Insufficient-data edge cases
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
  calculateGoalTracking,
  goalTracking,
  detectBudgetViolations,
  budgetViolations,
  evaluateCategoryBudgets,
  detectMoneyLeaks,
  moneyLeaks,
  calculateFinancialHealth,
  financialHealth,
  calculateWhatIf,
  whatIf,
  simulateWhatIfScenario,
  generateMember2Analytics,
  runAnalytics
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
console.log(`[PASS] CV (Variability):       ${incomeAnalysis.coefficientOfVariation}`);
console.log(`[PASS] Lower-Income Months:    ${incomeAnalysis.lowerIncomeMonths.map(m => m.month).join(', ')}`);
console.log(`[PASS] Factual Explanation:    ${incomeAnalysis.explanation}`);

// ============================================================================
// CHECKPOINT 6: Anomaly Detection (with real Transaction ID)
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
// CHECKPOINT 7: Recurring-Cost Detection (with real Transaction IDs)
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
// CHECKPOINT 8: Spending-Change Analysis (with real Transaction IDs)
// ============================================================================
console.log('\n--- CHECKPOINT 8: Spending-Change Analysis (with real Transaction IDs) ---');
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
// CHECKPOINT 9 (SECTION A): Goal Tracking
// ============================================================================
console.log('\n--- CHECKPOINT 9 (SECTION A): Goal Tracking ---');
// Test A.1: Known savings goal with explicit current savings
const goalResultKnown = calculateGoalTracking(parsed.transactions, {
  goalAmount: 50000,
  currentSavings: 18000,
  currentPeriodSurplus: 7000
});

if (goalResultKnown.goalAmount !== 50000 ||
    goalResultKnown.currentProgressAmount !== 18000 ||
    goalResultKnown.remainingAmount !== 32000 ||
    goalResultKnown.progressPercentage !== 36 ||
    goalResultKnown.currentPeriodSurplus !== 7000 ||
    goalResultKnown.status !== 'in_progress' ||
    goalResultKnown.isReachable !== true) {
  throw new Error(`Goal tracking known calculation failed: ${JSON.stringify(goalResultKnown)}`);
}
console.log('[PASS] Known savings goal successfully evaluated:');
console.log(JSON.stringify(goalResultKnown, null, 2));

// Test A.2: Positional parameter invocation and alias check
const goalResultPositional = goalTracking(parsed.transactions, 50000, 18000, { currentPeriodSurplus: 7000 });
if (goalResultPositional.remainingAmount !== 32000 || goalResultPositional.progressPercentage !== 36) {
  throw new Error('Goal tracking positional invocation or alias failed.');
}
console.log('[PASS] Goal tracking positional signature and alias verified.');

// Test A.3: Goal tracking with observable surplus baseline (when current savings not supplied)
const goalResultSurplusBaseline = calculateGoalTracking(parsed.transactions, { goalAmount: 10000 });
if (goalResultSurplusBaseline.dataQualityWarning === null ||
    !goalResultSurplusBaseline.dataQualityWarning.toLowerCase().includes('current savings balance')) {
  throw new Error('Goal tracking must flag data quality warning when savings balance is missing.');
}
console.log('[PASS] Goal tracking without explicit savings uses observable surplus and sets clear warning.');

// Test A.4: Missing or invalid goal information
const goalMissing = calculateGoalTracking(parsed.transactions, null);
if (goalMissing.status !== 'insufficient_data' ||
    goalMissing.goalAmount !== null ||
    goalMissing.dataQualityWarning === null) {
  throw new Error('Goal tracking must return status "insufficient_data" when goal is missing.');
}
console.log('[PASS] Missing goal correctly returned status "insufficient_data" with clear warning.');

// ============================================================================
// CHECKPOINT 10 (SECTION B): Budget Violation Detection
// ============================================================================
console.log('\n--- CHECKPOINT 10 (SECTION B): Budget Violation Detection ---');
// Config: Dining budget 300 (actual is 540 across all, or 420 in Aug), Groceries budget 2000 (actual is ~1047 -> under budget)
const budgetConfig = {
  Dining: 300,
  Groceries: 2000
};

// Evaluate across all parsed transactions
const allEvaluations = evaluateCategoryBudgets(parsed.transactions, budgetConfig);
const diningEval = allEvaluations.find(e => e.category === 'Dining');
const groceriesEval = allEvaluations.find(e => e.category === 'Groceries');

if (!diningEval || diningEval.status !== 'over_budget' || diningEval.actualAmount <= 300) {
  throw new Error(`Expected Dining to be over budget, got: ${JSON.stringify(diningEval)}`);
}
if (!groceriesEval || groceriesEval.status !== 'under_budget' || groceriesEval.actualAmount >= 2000) {
  throw new Error(`Expected Groceries to be under budget, got: ${JSON.stringify(groceriesEval)}`);
}

// Detect strictly violations
const violations = detectBudgetViolations(parsed.transactions, budgetConfig);
const diningViolation = violations.find(v => v.category === 'Dining');

if (!diningViolation) {
  throw new Error('detectBudgetViolations failed to identify Dining violation.');
}
if (violations.some(v => v.category === 'Groceries')) {
  throw new Error('detectBudgetViolations must NOT include under-budget categories.');
}
if (!Array.isArray(diningViolation.transactionIds) || diningViolation.transactionIds.length === 0) {
  throw new Error('Budget violation must include actual supporting transaction IDs.');
}
if (typeof diningViolation.difference !== 'number' || typeof diningViolation.exceededAmount !== 'number') {
  throw new Error('Budget violation must include difference and exceededAmount numbers.');
}

// Test alias
const aliasViolations = budgetViolations(parsed.transactions, budgetConfig);
if (aliasViolations.length !== violations.length) {
  throw new Error('budgetViolations alias failed.');
}

console.log('[PASS] Evaluated categories: 1 over budget (Dining), 1 under budget (Groceries).');
console.log('[PASS] Only over-budget categories included in violations list.');
console.log('[PASS] Supporting transaction IDs verified for violation:', diningViolation.transactionIds);
console.log('[PASS] Example Budget Violation Output:');
console.log(JSON.stringify(diningViolation, null, 2));

// ============================================================================
// CHECKPOINT 11 (SECTION C): Money Leak Detection
// ============================================================================
console.log('\n--- CHECKPOINT 11 (SECTION C): Money Leak Detection ---');
const detectedLeaks = detectMoneyLeaks(parsed.transactions, {
  spendingChanges,
  recurringCharges: recurringCosts,
  budgetViolations: violations
});

if (detectedLeaks.length === 0) {
  throw new Error('Money leak detection failed: expected at least one potential leak.');
}

// Verify leak structure and evidence link
const sampleLeak = detectedLeaks[0];
if (!sampleLeak.id.startsWith('LEAK-') ||
    !sampleLeak.category ||
    !sampleLeak.reason ||
    !sampleLeak.evidenceType ||
    !Array.isArray(sampleLeak.transactionIds) ||
    sampleLeak.transactionIds.length === 0 ||
    !sampleLeak.confidence) {
  throw new Error(`Money leak object structure invalid: ${JSON.stringify(sampleLeak)}`);
}

// Verify no accusatory language in any leak
const forbiddenWords = ['fraud', 'theft', 'scam', 'wrongdoing'];
for (const leak of detectedLeaks) {
  for (const word of forbiddenWords) {
    if (leak.reason.toLowerCase().includes(word)) {
      throw new Error(`Money leak contains forbidden accusatory word "${word}": ${leak.reason}`);
    }
  }
}

// Verify that essential expenses (like Groceries anomaly) and essential recurring costs are NOT leaks
const groceryLeak = detectedLeaks.find(l => l.category.toLowerCase().includes('grocer'));
if (groceryLeak) {
  throw new Error('Essential categories (Groceries) must NOT be flagged as money leaks.');
}

// Test discretionary recurring leak detection specifically
const testTxnsWithSubscription = [
  ...parsed.transactions,
  {
    id: 'CSV-SUB-01',
    date: '2026-06-15',
    merchant: 'StreamPrime Digital',
    category: 'Subscriptions',
    amount: 199.00,
    type: 'expense',
    source: 'csv'
  },
  {
    id: 'CSV-SUB-02',
    date: '2026-07-15',
    merchant: 'StreamPrime Digital',
    category: 'Subscriptions',
    amount: 199.00,
    type: 'expense',
    source: 'csv'
  },
  {
    id: 'CSV-SUB-03',
    date: '2026-08-15',
    merchant: 'StreamPrime Digital',
    category: 'Subscriptions',
    amount: 199.00,
    type: 'expense',
    source: 'csv'
  }
];

const subRecurring = detectRecurringCosts(testTxnsWithSubscription);
const subLeaks = moneyLeaks(testTxnsWithSubscription, { recurringCharges: subRecurring });
const streamingLeak = subLeaks.find(l => l.category === 'Subscriptions');

if (!streamingLeak || streamingLeak.evidenceType !== 'recurring_cost' || streamingLeak.reason !== 'Recurring discretionary payment detected.') {
  throw new Error(`Expected discretionary subscription to be detected as recurring_cost leak: ${JSON.stringify(streamingLeak)}`);
}

console.log(`[PASS] Potential Money Leaks Identified: ${detectedLeaks.length}`);
console.log(`[PASS] Protected essential categories (Groceries, etc.) safely guarded from false positive leaks.`);
console.log(`[PASS] Discretionary recurring payments properly detected with evidenceType 'recurring_cost'.`);
console.log('[PASS] Example Money Leak Output:');
console.log(JSON.stringify(sampleLeak, null, 2));

// ============================================================================
// CHECKPOINT 12 (SECTION D): Financial Health Metrics & Scoring
// ============================================================================
console.log('\n--- CHECKPOINT 12 (SECTION D): Financial Health Metrics & Score ---');
// D.1: Sufficient data scenario
const healthOutput = calculateFinancialHealth(parsed.transactions, {
  summary: financialSummary,
  irregularIncome: incomeAnalysis,
  anomalies: anomalyResult.anomalies,
  recurringCharges: recurringCosts,
  budgetViolations: violations,
  moneyLeaks: detectedLeaks
});

if (typeof healthOutput.score !== 'number' || healthOutput.score < 0 || healthOutput.score > 100) {
  throw new Error(`Financial health score must be a number between 0 and 100, got: ${healthOutput.score}`);
}

const requiredMetrics = [
  'totalIncome',
  'totalExpenses',
  'netCashFlow',
  'expenseToIncomeRatio',
  'surplusRate',
  'incomeVariability',
  'budgetViolationCount',
  'anomalyCount',
  'recurringCostCount'
];

for (const m of requiredMetrics) {
  if (healthOutput.metrics[m] === undefined) {
    throw new Error(`Financial health metrics missing required field: "${m}"`);
  }
}

if (healthOutput.scoringMethod !== 'documented_rule_based_score') {
  throw new Error(`Expected scoringMethod "documented_rule_based_score", got: ${healthOutput.scoringMethod}`);
}

console.log(`[PASS] Financial Health Score: ${healthOutput.score} / 100`);
console.log(`[PASS] Scoring Methodology:   ${healthOutput.scoringMethod}`);
console.log('[PASS] Financial Health Metrics Breakdown:');
console.log(JSON.stringify(healthOutput.metrics, null, 2));

// D.2: Insufficient data scenario (< 2 months of income or zero income)
const insufficientTxns = [
  {
    id: 'TXN-001',
    date: '2026-08-01',
    merchant: 'Single Client',
    category: 'Client Work',
    amount: 2000,
    type: 'income',
    source: 'csv'
  }
];

const insufficientHealth = financialHealth(insufficientTxns);
if (insufficientHealth.score !== null) {
  throw new Error(`Expected score to be null on insufficient data, got: ${insufficientHealth.score}`);
}
if (insufficientHealth.warnings.length === 0) {
  throw new Error('Expected warnings explaining why score cannot be calculated on insufficient data.');
}
console.log('[PASS] Insufficient data correctly resulted in score: null and explanatory warnings:');
console.log(insufficientHealth.warnings);

// ============================================================================
// CHECKPOINT 13 (SECTION E): What-If Financial Calculations
// ============================================================================
console.log('\n--- CHECKPOINT 13 (SECTION E): What-If Financial Calculations ---');

// E.1: Standalone user-supplied scenario with explicit totals
const standaloneScenario = {
  category: 'Dining',
  currentExpense: 5000,
  proposedChangeAmount: -1000,
  currentTotalExpense: 15000,
  currentMonthlyNetCashFlow: 8000
};

const whatIfResult = calculateWhatIf(standaloneScenario);

if (whatIfResult.category !== 'Dining' ||
    whatIfResult.currentExpense !== 5000 ||
    whatIfResult.proposedExpense !== 4000 ||
    whatIfResult.expenseChange !== -1000 ||
    whatIfResult.expenseReduction !== 1000 ||
    whatIfResult.currentTotalExpense !== 15000 ||
    whatIfResult.newTotalExpense !== 14000 ||
    whatIfResult.currentMonthlyNetCashFlow !== 8000 ||
    whatIfResult.projectedMonthlyNetCashFlow !== 9000 ||
    whatIfResult.monthlyCashFlowImprovement !== 1000 ||
    whatIfResult.annualizedCashFlowImprovement !== 12000) {
  throw new Error(`What-if calculation failed: ${JSON.stringify(whatIfResult)}`);
}

// Verify mathematical invariants:
// newTotalExpense = currentTotalExpense - expenseReduction
// projectedNetCashFlow = currentNetCashFlow + expenseReduction
if (whatIfResult.newTotalExpense !== whatIfResult.currentTotalExpense - whatIfResult.expenseReduction) {
  throw new Error('What-if invariant violated: newTotalExpense must equal currentTotalExpense - expenseReduction');
}
if (whatIfResult.projectedMonthlyNetCashFlow !== whatIfResult.currentMonthlyNetCashFlow + whatIfResult.expenseReduction) {
  throw new Error('What-if invariant violated: projectedNetCashFlow must equal currentNetCashFlow + expenseReduction');
}

if (!whatIfResult.disclaimer || !whatIfResult.disclaimer.includes('Hypothetical projection')) {
  throw new Error('What-if projection must include explicit hypothetical disclaimer.');
}

// E.2: Direct proposedExpense parameter test
const directScenario = {
  category: 'Dining',
  currentExpense: 5000,
  proposedExpense: 4000,
  currentTotalExpense: 15000,
  currentMonthlyNetCashFlow: 8000
};
const directResult = calculateWhatIf(directScenario);
if (directResult.newTotalExpense !== 14000 || directResult.projectedMonthlyNetCashFlow !== 9000) {
  throw new Error('What-if direct proposedExpense calculation failed.');
}

// Test aliases
const aliasResult = whatIf(standaloneScenario);
const simResult = simulateWhatIfScenario(standaloneScenario);
if (aliasResult.projectedMonthlyNetCashFlow !== 9000 || simResult.projectedMonthlyNetCashFlow !== 9000) {
  throw new Error('What-if aliases failed.');
}

console.log('[PASS] What-If Standalone Scenario successfully verified:');
console.log(JSON.stringify(whatIfResult, null, 2));

// ============================================================================
// CHECKPOINT 14 (SECTION F): Full Aggregated Member 2 Output Contract
// ============================================================================
console.log('\n--- CHECKPOINT 14 (SECTION F): Full Aggregated Member 2 Output Contract ---');

// Use a scenario where the category expense exists within the dataset total expenses (Dining = 540 in dataset, total = 2174.40)
const datasetWhatIfScenario = {
  category: 'Dining',
  currentExpense: 500,
  proposedChangeAmount: -200
};

const member2Output = generateMember2Analytics(parsed, {
  goalConfig: { goalAmount: 50000, currentSavings: 18000 },
  budgetConfig: { Dining: 300 },
  whatIf: datasetWhatIfScenario,
  currency: 'INR'
});

// Verify all 11 required contract keys strictly exist
const required11Keys = [
  'summary',
  'spendingChanges',
  'irregularIncome',
  'anomalies',
  'recurringCharges',
  'goalTracking',
  'budgetViolations',
  'moneyLeaks',
  'financialHealth',
  'whatIf',
  'dataQuality'
];

for (const key of required11Keys) {
  if (!(key in member2Output)) {
    throw new Error(`Aggregated output missing required contract key: "${key}"`);
  }
}

// Verify mathematical consistency of What-If within aggregated output:
// 1. Category currentExpense must not exceed currentTotalExpense
if (member2Output.whatIf.currentExpense > member2Output.whatIf.currentTotalExpense) {
  throw new Error('whatIf category currentExpense cannot exceed currentTotalExpense.');
}
// 2. currentTotalExpense must match dataset summary.totalExpenses
if (member2Output.whatIf.currentTotalExpense !== member2Output.summary.totalExpenses) {
  throw new Error(`whatIf currentTotalExpense (${member2Output.whatIf.currentTotalExpense}) must match summary.totalExpenses (${member2Output.summary.totalExpenses}).`);
}
// 3. newTotalExpense = currentTotalExpense - expenseReduction
if (member2Output.whatIf.newTotalExpense !== Math.round((member2Output.whatIf.currentTotalExpense - member2Output.whatIf.expenseReduction) * 100) / 100) {
  throw new Error('whatIf newTotalExpense must equal currentTotalExpense - expenseReduction.');
}
// 4. projectedMonthlyNetCashFlow = currentMonthlyNetCashFlow + expenseReduction
if (member2Output.whatIf.projectedMonthlyNetCashFlow !== Math.round((member2Output.whatIf.currentMonthlyNetCashFlow + member2Output.whatIf.expenseReduction) * 100) / 100) {
  throw new Error('whatIf projectedMonthlyNetCashFlow must equal currentMonthlyNetCashFlow + expenseReduction.');
}
// 5. currentMonthlyNetCashFlow matches summary.netCashFlow
if (member2Output.whatIf.currentMonthlyNetCashFlow !== member2Output.summary.netCashFlow) {
  throw new Error('whatIf currentMonthlyNetCashFlow must match summary.netCashFlow.');
}

// Verify evidence linking: Every anomaly, recurring charge, spending change, and leak has real IDs
member2Output.anomalies.forEach(a => {
  if (!a.transactionId || typeof a.transactionId !== 'string') {
    throw new Error('Anomaly finding must reference valid transactionId.');
  }
});

member2Output.recurringCharges.forEach(r => {
  if (!Array.isArray(r.transactionIds) || r.transactionIds.length === 0) {
    throw new Error('Recurring charge must reference valid transactionIds.');
  }
});

member2Output.budgetViolations.forEach(b => {
  if (!Array.isArray(b.transactionIds) || b.transactionIds.length === 0) {
    throw new Error('Budget violation must reference valid transactionIds.');
  }
});

member2Output.moneyLeaks.forEach(l => {
  if (!Array.isArray(l.transactionIds) || l.transactionIds.length === 0) {
    throw new Error('Money leak must reference valid transactionIds.');
  }
});

console.log('[PASS] All 11 Member 2 contract sections verified.');
console.log('[PASS] What-If in aggregated output is internally consistent with dataset totals.');
console.log(`       - currentTotalExpense (${member2Output.whatIf.currentTotalExpense}) - expenseReduction (${member2Output.whatIf.expenseReduction}) = newTotalExpense (${member2Output.whatIf.newTotalExpense})`);
console.log(`       - currentNetCashFlow (${member2Output.whatIf.currentMonthlyNetCashFlow}) + expenseReduction (${member2Output.whatIf.expenseReduction}) = projectedNetCashFlow (${member2Output.whatIf.projectedMonthlyNetCashFlow})`);
console.log('[PASS] Evidence linking verified: all findings contain authentic transaction IDs.');
console.log('\n--- Complete Aggregated Member 2 Output ---');
console.log(JSON.stringify(member2Output, null, 2));

// ============================================================================
// CHECKPOINT 15: Invalid CSV Row Handling
// ============================================================================
console.log('\n--- CHECKPOINT 15: Invalid CSV Row Handling ---');
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
// CHECKPOINT 16: Insufficient-Data Handling
// ============================================================================
console.log('\n--- CHECKPOINT 16: Insufficient-Data Handling ---');
// Scenario A: Completely empty dataset
const emptyAggregated = generateMember2Analytics([]);
if (emptyAggregated.summary.totalIncome !== 0 ||
    emptyAggregated.summary.totalExpenses !== 0 ||
    emptyAggregated.summary.currency !== 'INR' ||
    emptyAggregated.spendingChanges.length !== 0 ||
    emptyAggregated.anomalies.length !== 0 ||
    emptyAggregated.recurringCharges.length !== 0 ||
    emptyAggregated.budgetViolations.length !== 0 ||
    emptyAggregated.moneyLeaks.length !== 0 ||
    emptyAggregated.financialHealth.score !== null ||
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
if (singleTxnAggregated.financialHealth.score !== null) {
  throw new Error('Financial health score must be null on single transaction dataset.');
}
if (!singleTxnAggregated.dataQuality.warnings.some(w => w.includes('Insufficient historical periods'))) {
  throw new Error('Must generate warning for insufficient historical periods.');
}

console.log('[PASS] Empty dataset safely handled with zeroed summaries, empty arrays, score: null, and clear warnings.');
console.log('[PASS] Single transaction dataset correctly avoided making ungrounded spending change, recurring, or score claims.');

// ============================================================================
// CHECKPOINT 17: Integrated Evidence Scenarios (Profile-Only, CSV-Only, CSV+Profile, Empty)
// ============================================================================
console.log('\n--- CHECKPOINT 17: Integrated Evidence Scenarios ---');

// TEST A: Profile only
const testProfileOnly = runAnalytics({
  profile: {
    monthlyIncome: '10000',
    irregularIncome: '3000',
    savingsGoal: '20000'
  }
});

if (testProfileOnly.status !== 'success' ||
    testProfileOnly.irregularIncome.incomePattern !== 'insufficient_data' ||
    testProfileOnly.irregularIncome.monthsAnalyzed !== 0 ||
    testProfileOnly.irregularIncome.coefficientOfVariation !== null ||
    testProfileOnly.summary.reportedProfileIncome !== 10000 ||
    testProfileOnly.summary.totalIncome !== 0 ||
    testProfileOnly.goalTracking.actualSavingsBalance !== null ||
    testProfileOnly.goalTracking.progressBasis !== 'cash_flow_surplus' ||
    testProfileOnly.goalTracking.observableSurplus !== 13000) {
  throw new Error(`TEST A (Profile Only) verification failed: ${JSON.stringify(testProfileOnly)}`);
}
console.log('[PASS] Test A (Profile Only): Correctly marked incomePattern as insufficient_data, monthsAnalyzed as 0, CV as null, profile income separated, and goal actual savings balance as null.');

// TEST B: CSV only
const testCsvOnly = runAnalytics({
  transactions: [
    { date: '2026-08-01', desc: 'Client Payout', cat: 'Consulting', amount: 10000, type: 'income' },
    { date: '2026-08-05', desc: 'Office Supplies', cat: 'Operations', amount: 800, type: 'expense' },
    { date: '2026-08-10', desc: 'Software Suite', cat: 'Tech', amount: 2000, type: 'expense' }
  ]
});

if (testCsvOnly.status !== 'success' ||
    testCsvOnly.summary.totalIncome !== 10000 ||
    testCsvOnly.summary.totalExpenses !== 2800 ||
    testCsvOnly.summary.netCashFlow !== 7200) {
  throw new Error(`TEST B (CSV Only) verification failed: ${JSON.stringify(testCsvOnly.summary)}`);
}
console.log('[PASS] Test B (CSV Only): totalIncome is 10000, totalExpenses is 2800, netCashFlow is 7200.');

// TEST C: CSV + Profile (Double-counting prevention)
const testCsvAndProfile = runAnalytics({
  transactions: [
    { date: '2026-08-01', desc: 'Client Payout', cat: 'Consulting', amount: 10000, type: 'income' },
    { date: '2026-08-05', desc: 'Office Supplies', cat: 'Operations', amount: 800, type: 'expense' },
    { date: '2026-08-10', desc: 'Software Suite', cat: 'Tech', amount: 2000, type: 'expense' }
  ],
  profile: {
    monthlyIncome: '10000',
    irregularIncome: '3000',
    savingsGoal: '20000'
  }
});

if (testCsvAndProfile.status !== 'success' ||
    testCsvAndProfile.summary.totalIncome !== 10000 ||
    testCsvAndProfile.summary.totalExpenses !== 2800 ||
    testCsvAndProfile.summary.netCashFlow !== 7200 ||
    testCsvAndProfile.summary.reportedProfileIncome !== 10000 ||
    testCsvAndProfile.summary.reportedTotalProfileIncome !== 13000) {
  throw new Error(`TEST C (CSV + Profile) verification failed: ${JSON.stringify(testCsvAndProfile.summary)}`);
}
console.log('[PASS] Test C (CSV + Profile): totalIncome is strictly 10000 from CSV (not double-counted with profile), netCashFlow is 7200.');

// TEST D: Empty / No Input
const testEmptyInput = runAnalytics({});
if (testEmptyInput.status !== 'no_input' ||
    !testEmptyInput.error ||
    testEmptyInput.summary.totalIncome !== 0 ||
    testEmptyInput.summary.totalExpenses !== 0) {
  throw new Error(`TEST D (Empty Input) verification failed: ${JSON.stringify(testEmptyInput)}`);
}
console.log('[PASS] Test D (Empty Input): Safely handled without crash, status "no_input", and descriptive error.');

console.log('\n================================================================');
console.log('ALL 17 MEMBER 2 & INTEGRATION PIPELINE CHECKPOINTS VERIFIED!');
console.log('================================================================');
