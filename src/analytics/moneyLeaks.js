/**
 * @file moneyLeaks.js
 * @description Evidence-based detector for potential money leaks from transaction data and analytics findings.
 * Identifies financially significant, potentially avoidable or accelerating discretionary outflows
 * without labeling all recurring charges or anomalies as leaks, and strictly avoiding accusatory language.
 */

import { validateTransaction, TRANSACTION_TYPES } from './transactionSchema.js';
import { detectRecurringCosts } from './recurringCosts.js';
import { analyzeSpendingChanges } from './spendingChanges.js';
import { detectSpendingAnomalies } from './anomalyDetection.js';

/**
 * Categories categorized as essential living expenses.
 * Recurring payments or spikes in these categories are protected from being blindly flagged as money leaks.
 */
const ESSENTIAL_CATEGORIES = new Set([
  'groceries',
  'grocery',
  'utilities',
  'utility',
  'rent',
  'mortgage',
  'healthcare',
  'medical',
  'insurance',
  'debt',
  'taxes',
  'education',
  'tuition'
]);

/**
 * Normalizes category string for lookup.
 * @param {string} cat
 * @returns {string}
 */
function normalizeCategory(cat) {
  return typeof cat === 'string' ? cat.trim().toLowerCase() : '';
}

/**
 * Estimates monthly recurring impact based on payment frequency and average amount.
 * @param {number} amount
 * @param {string} frequency
 * @returns {number}
 */
function calculateMonthlyImpact(amount, frequency) {
  const amt = Number(amount) || 0;
  switch (frequency) {
    case 'weekly':
      return Math.round(amt * 4.33 * 100) / 100;
    case 'biweekly':
      return Math.round(amt * 2.167 * 100) / 100;
    case 'quarterly':
      return Math.round((amt / 3) * 100) / 100;
    case 'monthly':
    default:
      return Math.round(amt * 100) / 100;
  }
}

/**
 * Detects potential money leaks using multi-signal evidence synthesis.
 *
 * Evidence Signals Evaluated:
 * 1. Discretionary recurring charges (e.g. subscriptions, entertainment, digital memberships).
 * 2. Material spending surges in discretionary categories (> 40% increase and >= 100 absolute change).
 * 3. Significant budget overruns (> 25% over budget and >= 50 exceeded) in discretionary categories.
 * 4. High-impact unusual transactions in discretionary categories (material spending spikes).
 *
 * Rules:
 * - Operates strictly on verified transaction data and analytics findings.
 * - Does NOT label all recurring charges as leaks (essential expenses like utilities, rent, groceries are protected).
 * - Does NOT label all anomalies automatically as leaks.
 * - Does NOT use accusatory terminology (no 'fraud', 'theft', 'scam', or 'wrongdoing').
 * - Every leak references real, traceable transaction IDs.
 *
 * @param {Array} transactions Normalized transaction array
 * @param {object} [context] Pre-calculated findings or configuration
 * @param {Array} [context.recurringCharges] Pre-calculated recurring findings
 * @param {Array} [context.spendingChanges] Pre-calculated spending changes
 * @param {Array} [context.budgetViolations] Pre-calculated budget violations
 * @param {Array} [context.anomalies] Pre-calculated anomalies
 * @param {object} [options]
 * @param {number} [options.minSurgeAmount=100] Minimum increase amount to consider a spending surge
 * @returns {Array<{
 *   id: string,
 *   category: string,
 *   merchant: string,
 *   amount: number,
 *   estimatedMonthlyImpact: number,
 *   reason: string,
 *   evidenceType: "recurring_cost" | "spending_surge" | "budget_overrun" | "unusual_spending",
 *   transactionIds: string[],
 *   confidence: "low" | "medium" | "high"
 * }>}
 */
export function detectMoneyLeaks(transactions, context = {}, options = {}) {
  const { minSurgeAmount = 100 } = options;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const validExpenses = transactions.filter(tx => {
    return validateTransaction(tx).valid && tx.type === TRANSACTION_TYPES.EXPENSE;
  });

  if (validExpenses.length === 0) {
    return [];
  }

  const leaks = [];
  let leakCounter = 1;
  const flaggedCategories = new Set();
  const seenTxnIds = new Set();

  // 1. SIGNAL 1: Discretionary Recurring Outflows
  const recurringList = Array.isArray(context.recurringCharges)
    ? context.recurringCharges
    : detectRecurringCosts(validExpenses);

  for (const rec of recurringList) {
    const normCat = normalizeCategory(rec.category);

    // Skip essential categories (utilities, groceries, rent, etc.)
    if (ESSENTIAL_CATEGORIES.has(normCat)) {
      continue;
    }

    // Flag discretionary recurring charges (e.g. Subscriptions, Entertainment, Dining, Streaming, Gaming, Memberships)
    const isDiscretionaryCategory = (
      normCat.includes('subscript') ||
      normCat.includes('entertain') ||
      normCat.includes('stream') ||
      normCat.includes('dining') ||
      normCat.includes('leisure') ||
      normCat.includes('game') ||
      normCat.includes('club') ||
      normCat.includes('fitness')
    );

    if (isDiscretionaryCategory) {
      const monthlyImpact = calculateMonthlyImpact(rec.averageAmount, rec.frequency);
      leaks.push({
        id: `LEAK-${String(leakCounter++).padStart(3, '0')}`,
        category: rec.category,
        merchant: rec.merchant,
        amount: rec.averageAmount,
        estimatedMonthlyImpact: monthlyImpact,
        reason: 'Recurring discretionary payment detected.',
        evidenceType: 'recurring_cost',
        transactionIds: rec.transactionIds,
        confidence: rec.confidence || 'medium'
      });

      flaggedCategories.add(rec.category);
      rec.transactionIds.forEach(id => seenTxnIds.add(id));
    }
  }

  // 2. SIGNAL 2: Discretionary Spending Surges
  const changesList = Array.isArray(context.spendingChanges)
    ? context.spendingChanges
    : analyzeSpendingChanges(validExpenses);

  for (const sc of changesList) {
    const normCat = normalizeCategory(sc.category);

    // Skip essential categories
    if (ESSENTIAL_CATEGORIES.has(normCat)) {
      continue;
    }

    // Check if spending significantly accelerated in a discretionary category
    if (sc.changeAmount >= minSurgeAmount && sc.changePercentage !== null && sc.changePercentage >= 40) {
      // Find representative merchant in current period transactions
      const currentTxns = validExpenses.filter(tx => sc.currentPeriodTransactionIds.includes(tx.id));
      const representativeMerchant = currentTxns.length > 0 ? currentTxns[0].merchant : sc.category;

      leaks.push({
        id: `LEAK-${String(leakCounter++).padStart(3, '0')}`,
        category: sc.category,
        merchant: representativeMerchant,
        amount: sc.changeAmount,
        estimatedMonthlyImpact: sc.changeAmount,
        reason: `${sc.category} spending escalated by ${sc.changeAmount} (${sc.changePercentage}%) compared with the previous period.`,
        evidenceType: 'spending_surge',
        transactionIds: sc.currentPeriodTransactionIds,
        confidence: 'medium'
      });

      flaggedCategories.add(sc.category);
      sc.currentPeriodTransactionIds.forEach(id => seenTxnIds.add(id));
    }
  }

  // 3. SIGNAL 3: Discretionary Budget Overruns (if budget violations supplied)
  if (Array.isArray(context.budgetViolations)) {
    for (const bv of context.budgetViolations) {
      const normCat = normalizeCategory(bv.category);
      if (ESSENTIAL_CATEGORIES.has(normCat)) {
        continue;
      }

      if (bv.percentageOverBudget >= 25 && bv.exceededAmount >= 50) {
        // Only add if not already captured by spending surge
        const alreadyFlagged = leaks.some(l => l.category === bv.category && l.evidenceType === 'spending_surge');
        if (!alreadyFlagged && bv.transactionIds && bv.transactionIds.length > 0) {
          const currentTxns = validExpenses.filter(tx => bv.transactionIds.includes(tx.id));
          const representativeMerchant = currentTxns.length > 0 ? currentTxns[0].merchant : bv.category;

          leaks.push({
            id: `LEAK-${String(leakCounter++).padStart(3, '0')}`,
            category: bv.category,
            merchant: representativeMerchant,
            amount: bv.exceededAmount,
            estimatedMonthlyImpact: bv.exceededAmount,
            reason: `${bv.category} spending exceeded allocated budget by ${bv.exceededAmount} (${bv.percentageOverBudget}% over budget).`,
            evidenceType: 'budget_overrun',
            transactionIds: bv.transactionIds,
            confidence: 'medium'
          });

          flaggedCategories.add(bv.category);
          bv.transactionIds.forEach(id => seenTxnIds.add(id));
        }
      }
    }
  }

  // 4. SIGNAL 4: Discretionary Unusual High Spending (material outflows not explained by recurring or surge)
  const anomaliesList = Array.isArray(context.anomalies)
    ? context.anomalies
    : (context.anomalies === undefined ? detectSpendingAnomalies(validExpenses).anomalies : []);

  for (const anom of anomaliesList) {
    const normCat = normalizeCategory(anom.category);
    // Protect essential categories and avoid duplicate flagging
    if (ESSENTIAL_CATEGORIES.has(normCat)) {
      continue;
    }

    if (anom.amount >= minSurgeAmount && anom.severity === 'high' && !seenTxnIds.has(anom.transactionId)) {
      const alreadyFlagged = leaks.some(l => l.category === anom.category);
      if (!alreadyFlagged) {
        leaks.push({
          id: `LEAK-${String(leakCounter++).padStart(3, '0')}`,
          category: anom.category,
          merchant: anom.merchant,
          amount: anom.amount,
          estimatedMonthlyImpact: anom.amount,
          reason: `Unusual discretionary payment of ${anom.amount} significantly higher than typical spending.`,
          evidenceType: 'unusual_spending',
          transactionIds: [anom.transactionId],
          confidence: 'low'
        });

        seenTxnIds.add(anom.transactionId);
      }
    }
  }

  // Sort by estimated monthly impact descending
  leaks.sort((a, b) => b.estimatedMonthlyImpact - a.estimatedMonthlyImpact);

  return leaks;
}

export const moneyLeaks = detectMoneyLeaks;
