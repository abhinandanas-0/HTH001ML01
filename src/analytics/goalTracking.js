/**
 * @file goalTracking.js
 * @description Evaluates savings goals strictly from observable financial data and user-provided inputs.
 * Calculates progress, remaining amounts, surplus metrics, and reachability without predicting future income
 * or guaranteeing goal attainment.
 */

import { validateTransaction } from './transactionSchema.js';
import { calculateFinancialSummary } from './financialCalculations.js';

/**
 * Calculates goal tracking metrics based on user-provided goal configuration and normalized transactions.
 *
 * Rules:
 * - Operates strictly on user-provided goal amount and optional current savings.
 * - Does NOT assume net cash flow equals actual savings unless explicit savings are not provided.
 * - When current savings are omitted, uses observable net cash flow surplus as a run-rate indicator and labels it clearly.
 * - Does NOT predict future earnings or guarantee goal completion.
 * - Returns status: "insufficient_data" if goal configuration is missing.
 *
 * @param {Array} transactions Array of normalized transactions
 * @param {number | { goalAmount: number, currentSavings?: number, currentPeriodSurplus?: number }} goalConfig
 * @param {number | object} [currentSavingsOrOptions] Optional current savings balance or options object
 * @param {object} [cashFlowMetrics] Optional pre-calculated cash flow metrics
 * @returns {{
 *   goalAmount: number | null,
 *   currentProgressAmount: number | null,
 *   remainingAmount: number | null,
 *   progressPercentage: number | null,
 *   currentPeriodSurplus: number | null,
 *   status: "completed" | "in_progress" | "stalled" | "insufficient_data",
 *   isReachable: boolean | null,
 *   dataQualityWarning: string | null
 * }}
 */
export function calculateGoalTracking(transactions, goalConfig, currentSavingsOrOptions = {}, cashFlowMetrics = {}) {
  // 1. Validate and extract goal input
  let goalAmount = null;
  let currentSavings = null;
  let customSurplus = null;

  if (typeof goalConfig === 'number') {
    goalAmount = goalConfig;
    if (typeof currentSavingsOrOptions === 'number') {
      currentSavings = currentSavingsOrOptions;
      if (cashFlowMetrics && typeof cashFlowMetrics.currentPeriodSurplus === 'number') {
        customSurplus = cashFlowMetrics.currentPeriodSurplus;
      } else if (cashFlowMetrics && typeof cashFlowMetrics.netCashFlow === 'number') {
        customSurplus = cashFlowMetrics.netCashFlow;
      }
    } else if (currentSavingsOrOptions && typeof currentSavingsOrOptions === 'object') {
      if (typeof currentSavingsOrOptions.currentSavings === 'number') {
        currentSavings = currentSavingsOrOptions.currentSavings;
      }
      if (typeof currentSavingsOrOptions.currentPeriodSurplus === 'number') {
        customSurplus = currentSavingsOrOptions.currentPeriodSurplus;
      }
    }
  } else if (goalConfig && typeof goalConfig === 'object') {
    if (typeof goalConfig.goalAmount === 'number') {
      goalAmount = goalConfig.goalAmount;
    }
    if (typeof goalConfig.currentSavings === 'number') {
      currentSavings = goalConfig.currentSavings;
    }
    if (typeof goalConfig.currentPeriodSurplus === 'number') {
      customSurplus = goalConfig.currentPeriodSurplus;
    }
  }

  // Handle missing or invalid goal amount
  if (goalAmount === null || isNaN(goalAmount) || goalAmount <= 0) {
    return {
      goalAmount: null,
      actualSavingsBalance: null,
      observableSurplus: null,
      progressBasis: 'insufficient_data',
      currentProgressAmount: null,
      remainingAmount: null,
      progressPercentage: null,
      currentPeriodSurplus: null,
      status: 'insufficient_data',
      isReachable: null,
      dataQualityWarning: 'Savings goal amount not specified or invalid.'
    };
  }

  // 2. Determine current period surplus from transactions if not provided
  let calculatedSurplus = 0;
  let hasValidTransactions = false;

  if (Array.isArray(transactions) && transactions.length > 0) {
    const valid = transactions.filter(tx => validateTransaction(tx).valid);
    if (valid.length > 0) {
      hasValidTransactions = true;
      const fin = calculateFinancialSummary(valid);

      // If monthly timeline is present, use the most recent month's net cash flow as current period surplus
      if (fin.monthlyTimeline && fin.monthlyTimeline.length > 0) {
        const latestMonth = fin.monthlyTimeline[fin.monthlyTimeline.length - 1];
        calculatedSurplus = latestMonth.netCashFlow;
      } else {
        calculatedSurplus = fin.netCashFlow;
      }
    }
  }

  const currentPeriodSurplus = customSurplus !== null ? customSurplus : (hasValidTransactions ? calculatedSurplus : 0);

  // 3. Determine current progress amount and progress basis
  let currentProgressAmount = 0;
  let dataQualityWarning = null;
  let progressBasis = 'insufficient_data';
  let actualSavingsBalance = null;

  if (currentSavings !== null && !isNaN(currentSavings)) {
    // Explicit savings balance supplied by application / user
    actualSavingsBalance = Math.max(0, currentSavings);
    currentProgressAmount = actualSavingsBalance;
    progressBasis = 'actual_savings';
  } else {
    // Current savings balance not provided; use positive observable surplus as run-rate estimate
    currentProgressAmount = Math.max(0, currentPeriodSurplus);
    progressBasis = 'cash_flow_surplus';
    dataQualityWarning = 'Estimated progress based on observable cash-flow surplus; current savings balance was not supplied.';
  }

  // 4. Calculate progress and remaining amounts
  const remainingAmount = Math.max(0, Math.round((goalAmount - currentProgressAmount) * 100) / 100);
  const progressPercentage = goalAmount > 0
    ? Math.min(100, Math.round(((currentProgressAmount / goalAmount) * 100) * 10) / 10)
    : 0;

  // 5. Evaluate status and observable reachability
  let status = 'in_progress';
  if (remainingAmount === 0) {
    status = 'completed';
  } else if (currentPeriodSurplus <= 0 && currentProgressAmount < goalAmount) {
    status = 'stalled';
  }

  // Reachable is true if already achieved or currently generating positive observable surplus
  const isReachable = remainingAmount === 0 || currentPeriodSurplus > 0;

  return {
    goalAmount: Math.round(goalAmount * 100) / 100,
    actualSavingsBalance: actualSavingsBalance !== null ? Math.round(actualSavingsBalance * 100) / 100 : null,
    observableSurplus: Math.round(currentPeriodSurplus * 100) / 100,
    progressBasis,
    currentProgressAmount: Math.round(currentProgressAmount * 100) / 100,
    remainingAmount,
    progressPercentage,
    currentPeriodSurplus: Math.round(currentPeriodSurplus * 100) / 100,
    status,
    isReachable,
    dataQualityWarning
  };
}

export const goalTracking = calculateGoalTracking;
