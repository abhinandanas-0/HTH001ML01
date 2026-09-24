/**
 * @file financialHealth.js
 * @description Computes transparent, rule-based financial health metrics and analytical score
 * strictly from observable financial data. Avoids moralizing or subjective judgment.
 */

import { validateTransaction } from './transactionSchema.js';
import { calculateFinancialSummary } from './financialCalculations.js';
import { analyzeIrregularIncome } from './irregularIncome.js';
import { detectSpendingAnomalies } from './anomalyDetection.js';
import { detectRecurringCosts } from './recurringCosts.js';
import { detectMoneyLeaks } from './moneyLeaks.js';

/**
 * SCORING METHODOLOGY DOCUMENTATION:
 * ----------------------------------------------------------------------------
 * The analytical financial health score is a deterministic 0-100 metric evaluated across 4 pillars:
 *
 * 1. Cash-Flow Surplus Retention (Max 40 points):
 *    - surplusRate = (totalIncome - totalExpenses) / totalIncome
 *    - surplusRate >= 0.25: 40 points (retains >= 25% of gross inflow)
 *    - 0 < surplusRate < 0.25: (surplusRate / 0.25) * 40 points
 *    - surplusRate <= 0: 0 points (cash flow deficit)
 *
 * 2. Income Stability & Variability (Max 25 points):
 *    - Evaluated from the Coefficient of Variation (CV = stdDev / mean) of monthly income:
 *    - CV <= 0.15: 25 points (stable monthly consistency)
 *    - CV <= 0.35: 20 points (moderate income variation)
 *    - CV <= 0.60: 15 points (variable income profile)
 *    - CV > 0.60: 10 points (high irregular income variability)
 *
 * 3. Budget Adherence (Max 15 points):
 *    - 0 budget violations: 15 points
 *    - 1 budget violation: 10 points
 *    - 2 budget violations: 5 points
 *    - >= 3 budget violations: 0 points
 *    - (If no budget configured, defaults to neutral 15 points)
 *
 * 4. Outflow Integrity & Anomaly Resilience (Max 20 points):
 *    - Base: 20 points
 *    - Deduct 5 points per spending anomaly (up to 10 points deducted)
 *    - Deduct 5 points per detected money leak (up to 10 points deducted)
 *    - Minimum: 0 points
 *
 * INSUFFICIENT DATA RULE:
 * If total income <= 0, fewer than 2 calendar months of income history exist,
 * or transaction volume is under 3 records, score is strictly set to null with explanatory warnings.
 * ----------------------------------------------------------------------------
 */

/**
 * Calculates transparent financial-health metrics and rule-based score from actual data.
 *
 * Rules:
 * - Operates strictly on verified normalized transaction data.
 * - Does NOT label users as "good" or "bad".
 * - Score is an analytical indicator, not professional financial advice.
 * - Returns score: null when income or historical duration is insufficient.
 *
 * @param {Array} transactions Array of normalized transactions
 * @param {object} [context] Pre-calculated findings or configurations
 * @param {object} [context.summary] Pre-calculated financial summary
 * @param {object} [context.irregularIncome] Pre-calculated irregular income analysis
 * @param {Array} [context.anomalies] Pre-calculated anomalies
 * @param {Array} [context.recurringCharges] Pre-calculated recurring costs
 * @param {Array} [context.budgetViolations] Pre-calculated budget violations
 * @param {Array} [context.moneyLeaks] Pre-calculated money leaks
 * @returns {{
 *   score: number | null,
 *   metrics: {
 *     totalIncome: number,
 *     totalExpenses: number,
 *     netCashFlow: number,
 *     expenseToIncomeRatio: number | null,
 *     surplusRate: number | null,
 *     incomeVariability: number | null,
 *     budgetViolationCount: number,
 *     anomalyCount: number,
 *     recurringCostCount: number,
 *     moneyLeakCount: number,
 *     possibleMoneyLeakImpact: number
 *   },
 *   scoringMethod: string,
 *   warnings: string[]
 * }}
 */
export function calculateFinancialHealth(transactions, context = {}) {
  const warnings = [];

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      score: null,
      metrics: {
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        expenseToIncomeRatio: null,
        surplusRate: null,
        incomeVariability: null,
        budgetViolationCount: 0,
        anomalyCount: 0,
        recurringCostCount: 0,
        moneyLeakCount: 0,
        possibleMoneyLeakImpact: 0
      },
      scoringMethod: 'documented_rule_based_score',
      warnings: ['No transaction records available for financial health calculation.']
    };
  }

  const validTransactions = transactions.filter(tx => validateTransaction(tx).valid);
  if (validTransactions.length < 3) {
    warnings.push('Insufficient transaction volume (< 3 records) for reliable financial health scoring.');
  }

  // 1. Gather Financial Calculations
  const finSummary = context.summary || calculateFinancialSummary(validTransactions);
  const totalIncome = finSummary.totalIncome || 0;
  const totalExpenses = finSummary.totalExpenses || 0;
  const netCashFlow = finSummary.netCashFlow || 0;

  // 2. Compute Ratios
  let expenseToIncomeRatio = null;
  let surplusRate = null;
  if (totalIncome > 0) {
    expenseToIncomeRatio = Math.round((totalExpenses / totalIncome) * 10000) / 10000;
    surplusRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 10000) / 10000;
  } else {
    warnings.push('Zero verified income observed; cannot compute expense-to-income or surplus ratios.');
  }

  // 3. Gather Irregular Income Metrics
  const incomeAnalysis = (context.irregularIncome && context.irregularIncome.coefficientOfVariation !== undefined)
    ? context.irregularIncome
    : analyzeIrregularIncome(validTransactions);

  const incomeVariability = incomeAnalysis.coefficientOfVariation !== undefined && incomeAnalysis.coefficientOfVariation !== null
    ? incomeAnalysis.coefficientOfVariation
    : null;

  if (incomeAnalysis.incomePattern === 'insufficient_data' || incomeAnalysis.monthsAnalyzed < 2) {
    warnings.push('At least 2 calendar months of income history are required for income stability scoring.');
  }

  // 4. Gather Counts from Other Modules
  const anomalyList = Array.isArray(context.anomalies)
    ? context.anomalies
    : detectSpendingAnomalies(validTransactions).anomalies;
  const anomalyCount = anomalyList.length;

  const recurringList = Array.isArray(context.recurringCharges)
    ? context.recurringCharges
    : detectRecurringCosts(validTransactions);
  const recurringCostCount = recurringList.length;

  const budgetViolations = Array.isArray(context.budgetViolations) ? context.budgetViolations : [];
  const budgetViolationCount = budgetViolations.length;

  const leakList = Array.isArray(context.moneyLeaks)
    ? context.moneyLeaks
    : detectMoneyLeaks(validTransactions, {
      recurringCharges: recurringList,
      budgetViolations
    });
  const moneyLeakCount = leakList.length;
  const possibleMoneyLeakImpact = Math.round(
    leakList.reduce((sum, l) => sum + (l.estimatedMonthlyImpact || 0), 0) * 100
  ) / 100;

  // 5. Evaluate Analytical Score (0 - 100)
  let score = null;

  // Check data sufficiency criteria:
  // Requires: totalIncome > 0, at least 2 months of income observed, and at least 3 transactions
  const hasSufficientData = totalIncome > 0 && incomeAnalysis.monthsAnalyzed >= 2 && validTransactions.length >= 3;

  if (hasSufficientData) {
    // Component 1: Cash-Flow Surplus Retention (Max 40 points)
    let surplusPoints = 0;
    if (surplusRate !== null) {
      if (surplusRate >= 0.25) {
        surplusPoints = 40;
      } else if (surplusRate > 0) {
        surplusPoints = Math.round((surplusRate / 0.25) * 40);
      } else {
        surplusPoints = 0;
      }
    }

    // Component 2: Income Stability (Max 25 points)
    let stabilityPoints = 15; // default for variable income
    if (incomeVariability !== null) {
      if (incomeVariability <= 0.15) {
        stabilityPoints = 25;
      } else if (incomeVariability <= 0.35) {
        stabilityPoints = 20;
      } else if (incomeVariability <= 0.60) {
        stabilityPoints = 15;
      } else {
        stabilityPoints = 10;
      }
    }

    // Component 3: Budget Governance (Max 15 points)
    let budgetPoints = 15;
    if (budgetViolationCount === 1) {
      budgetPoints = 10;
    } else if (budgetViolationCount === 2) {
      budgetPoints = 5;
    } else if (budgetViolationCount >= 3) {
      budgetPoints = 0;
    }

    // Component 4: Outflow Integrity & Resilience (Max 20 points)
    const anomalyDeduction = Math.min(10, anomalyCount * 5);
    const leakDeduction = Math.min(10, moneyLeakCount * 5);
    const resiliencePoints = Math.max(0, 20 - (anomalyDeduction + leakDeduction));

    const totalRawScore = surplusPoints + stabilityPoints + budgetPoints + resiliencePoints;
    score = Math.max(0, Math.min(100, Math.round(totalRawScore)));
  }

  return {
    score,
    metrics: {
      totalIncome,
      totalExpenses,
      netCashFlow,
      expenseToIncomeRatio,
      surplusRate,
      incomeVariability,
      budgetViolationCount,
      anomalyCount,
      recurringCostCount,
      moneyLeakCount,
      possibleMoneyLeakImpact
    },
    scoringMethod: 'documented_rule_based_score',
    warnings
  };
}

export const financialHealth = calculateFinancialHealth;
