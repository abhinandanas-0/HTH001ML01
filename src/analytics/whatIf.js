/**
 * @file whatIf.js
 * @description Pure calculation engine for hypothetical financial scenarios and spending adjustments.
 * Computes projected cash flow impacts without predicting market returns, forecasting variable income,
 * or dispensing financial advice.
 */

/**
 * Simulates a hypothetical spending change scenario against financial baseline metrics.
 *
 * Rules:
 * - Performs mathematical projections only.
 * - Does NOT predict investment returns or future income.
 * - Holds baseline income constant.
 * - Clearly documents assumptions and disclaimers.
 * - Does NOT generate coaching or recommendations.
 * - Ensures:
 *     newTotalExpense = currentTotalExpense - expenseReduction
 *     projectedNetCashFlow = currentNetCashFlow + expenseReduction
 *
 * @param {object} scenario User-provided hypothetical adjustment
 * @param {string} scenario.category Expense category, e.g. "Dining"
 * @param {number} [scenario.currentExpense] Baseline monthly expense in category
 * @param {number} [scenario.proposedChangeAmount] Proposed delta, e.g. -1000
 * @param {number} [scenario.proposedExpense] Proposed target expense, e.g. 4000
 * @param {number} [scenario.currentTotalExpense] Optional baseline total expenses
 * @param {number} [scenario.totalExpenses] Optional baseline total expenses (alias)
 * @param {number} [scenario.currentMonthlyNetCashFlow] Baseline monthly net cash flow
 * @param {number} [scenario.currentNetCashFlow] Baseline net cash flow (alias)
 * @param {object} [baseline] Optional baseline metrics derived from actual transactions
 * @param {number} [baseline.netCashFlow]
 * @param {number} [baseline.currentMonthlyNetCashFlow]
 * @param {number} [baseline.totalExpenses]
 * @param {Record<string, number>} [baseline.categoryTotals]
 * @returns {object} Calculated what-if projection
 */
export function calculateWhatIf(scenario, baseline = {}) {
  if (!scenario || typeof scenario !== 'object') {
    return {
      status: 'insufficient_data',
      message: 'No hypothetical what-if scenario parameters supplied.'
    };
  }

  const category = scenario.category || 'Unspecified';

  // 1. Determine current expense for the category
  let currentExpense = 0;
  if (typeof scenario.currentExpense === 'number') {
    currentExpense = Math.max(0, scenario.currentExpense);
  } else if (baseline && baseline.categoryTotals && typeof baseline.categoryTotals[category] === 'number') {
    currentExpense = baseline.categoryTotals[category];
  }

  // 2. Determine proposed expense and change amount
  let proposedExpense = currentExpense;
  let expenseChange = 0;

  if (typeof scenario.proposedChangeAmount === 'number') {
    expenseChange = scenario.proposedChangeAmount;
    proposedExpense = Math.max(0, currentExpense + scenario.proposedChangeAmount);
  } else if (typeof scenario.proposedExpense === 'number') {
    proposedExpense = Math.max(0, scenario.proposedExpense);
    expenseChange = proposedExpense - currentExpense;
  }

  const expenseReduction = Math.max(0, currentExpense - proposedExpense);

  // 3. Determine current total expenses
  let currentTotalExpense = 0;
  if (typeof scenario.currentTotalExpense === 'number') {
    currentTotalExpense = Math.max(0, scenario.currentTotalExpense);
  } else if (typeof scenario.totalExpenses === 'number') {
    currentTotalExpense = Math.max(0, scenario.totalExpenses);
  } else if (typeof baseline.totalExpenses === 'number') {
    // If user explicitly provided a category currentExpense that exceeds baseline.totalExpenses,
    // clearly distinguish user-supplied scenario totals from dataset totals.
    if (typeof scenario.currentExpense === 'number' && scenario.currentExpense > baseline.totalExpenses) {
      currentTotalExpense = currentExpense;
    } else {
      currentTotalExpense = baseline.totalExpenses;
    }
  } else {
    currentTotalExpense = currentExpense;
  }

  // Ensure newTotalExpense = currentTotalExpense - expenseReduction (or currentTotalExpense + expenseChange)
  const newTotalExpense = Math.max(0, Math.round((currentTotalExpense + expenseChange) * 100) / 100);

  // 4. Determine current net cash flow
  let currentMonthlyNetCashFlow = 0;
  if (typeof scenario.currentMonthlyNetCashFlow === 'number') {
    currentMonthlyNetCashFlow = scenario.currentMonthlyNetCashFlow;
  } else if (typeof scenario.currentNetCashFlow === 'number') {
    currentMonthlyNetCashFlow = scenario.currentNetCashFlow;
  } else if (typeof baseline.currentMonthlyNetCashFlow === 'number') {
    currentMonthlyNetCashFlow = baseline.currentMonthlyNetCashFlow;
  } else if (typeof baseline.netCashFlow === 'number') {
    currentMonthlyNetCashFlow = baseline.netCashFlow;
  }

  // Monthly cash flow improvement (positive if expenses are reduced)
  const monthlyCashFlowImprovement = Math.round((currentExpense - proposedExpense) * 100) / 100;
  const annualizedCashFlowImprovement = Math.round((monthlyCashFlowImprovement * 12) * 100) / 100;

  // Ensure projectedNetCashFlow = currentNetCashFlow + expenseReduction
  const projectedMonthlyNetCashFlow = Math.round((currentMonthlyNetCashFlow + monthlyCashFlowImprovement) * 100) / 100;

  return {
    category,
    currentExpense: Math.round(currentExpense * 100) / 100,
    proposedExpense: Math.round(proposedExpense * 100) / 100,
    expenseChange: Math.round(expenseChange * 100) / 100,
    expenseReduction: Math.round(expenseReduction * 100) / 100,
    currentTotalExpense: Math.round(currentTotalExpense * 100) / 100,
    newTotalExpense,
    currentMonthlyNetCashFlow: Math.round(currentMonthlyNetCashFlow * 100) / 100,
    currentNetCashFlow: Math.round(currentMonthlyNetCashFlow * 100) / 100,
    projectedMonthlyNetCashFlow,
    projectedNetCashFlow: projectedMonthlyNetCashFlow,
    monthlyCashFlowImprovement,
    annualizedCashFlowImprovement,
    disclaimer: 'Hypothetical projection based on user-supplied assumptions. Does not guarantee future cash flow or account for variable income.'
  };
}

export const simulateWhatIfScenario = calculateWhatIf;
export const whatIf = calculateWhatIf;
