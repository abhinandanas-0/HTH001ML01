/**
 * @file runAnalytics.js
 * @description Frontend-to-Analytics Orchestration Module for GA-08 Member 2.
 * Bridges React frontend state (CSV transactions, uploaded bills, financial profile, currency)
 * with the underlying Member 2 financial intelligence pipeline.
 *
 * Runs strictly the analytics supported by the currently available user inputs
 * without fabricating missing financial figures or calling external AI/LLMs.
 */

import { generateMember2Analytics } from './analyticsOutput.js';
import { calculateGoalTracking } from './goalTracking.js';
import { calculateFinancialHealth } from './financialHealth.js';
import { validateTransaction } from './transactionSchema.js';

/**
 * Executes Member 2 financial analytics based on the exact combination of inputs provided.
 *
 * Valid Input Combinations Supported:
 * 1. CSV only (transaction-based intelligence)
 * 2. Bills only (document evidence staging)
 * 3. Profile only (baseline income & savings goal analysis)
 * 4. CSV + Bills (dual evidence cross-referencing)
 * 5. CSV + Profile (ledger analytics combined with user profile goals)
 * 6. Bills + Profile (document evidence with baseline goals)
 * 7. CSV + Bills + Profile (fullest supported evidence-based analysis)
 *
 * Blocks analysis strictly when NO inputs are provided at all.
 *
 * @param {object} inputs
 * @param {Array} [inputs.transactions=[]] Normalized transaction records from CSV
 * @param {Array} [inputs.bills=[]] Staged bill/invoice document objects
 * @param {object} [inputs.profile={}] Manual financial profile { monthlyIncome, irregularIncome, savingsGoal }
 * @param {string} [inputs.currency='USD'] Active currency code
 * @param {Array} [inputs.csvErrors=[]] Validation or parsing errors from CSV
 * @param {Record<string, number>} [inputs.budgetConfig] Optional category budget allocations
 * @param {object} [inputs.whatIf] Optional hypothetical what-if scenario parameters
 * @returns {object} Structured analytics result contract
 */
export function runAnalytics(inputs = {}) {
  const {
    transactions = [],
    bills = [],
    profile = {},
    currency = 'USD',
    csvErrors = [],
    budgetConfig,
    whatIf: whatIfInput
  } = inputs;

  // 1. Determine presence of each input source
  const hasTransactions = Array.isArray(transactions) && transactions.length > 0;
  const hasBills = Array.isArray(bills) && bills.length > 0;

  const rawMonthly = profile?.monthlyIncome !== undefined && profile?.monthlyIncome !== ''
    ? parseFloat(profile.monthlyIncome)
    : null;
  const rawIrregular = profile?.irregularIncome !== undefined && profile?.irregularIncome !== ''
    ? parseFloat(profile.irregularIncome)
    : null;
  const rawSavingsGoal = profile?.savingsGoal !== undefined && profile?.savingsGoal !== ''
    ? parseFloat(profile.savingsGoal)
    : null;

  const validMonthlyIncome = rawMonthly !== null && !isNaN(rawMonthly) ? Math.max(0, rawMonthly) : null;
  const validIrregularIncome = rawIrregular !== null && !isNaN(rawIrregular) ? Math.max(0, rawIrregular) : null;
  const validSavingsGoal = rawSavingsGoal !== null && !isNaN(rawSavingsGoal) ? Math.max(0, rawSavingsGoal) : null;

  const hasProfile = validMonthlyIncome !== null || validIrregularIncome !== null || validSavingsGoal !== null;

  // 2. Block execution if NO valid input is provided at all
  if (!hasTransactions && !hasBills && !hasProfile) {
    return {
      status: 'no_input',
      error: 'Please provide at least one financial input before generating your analysis.',
      inputsProvided: {
        hasTransactions: false,
        hasBills: false,
        hasProfile: false
      },
      evidenceMode: 'none',
      currency,
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        currency
      },
      billEvidence: {
        count: 0,
        items: [],
        note: null
      },
      dataQuality: {
        totalTransactions: 0,
        validTransactions: 0,
        invalidRows: csvErrors.length,
        possibleDuplicates: [],
        warnings: ['Please provide at least one financial input before generating your analysis.']
      }
    };
  }

  // 3. Compile Bill Evidence Metadata (without inventing OCR transactions)
  const billEvidence = {
    count: hasBills ? bills.length : 0,
    items: hasBills
      ? bills.map((b, idx) => ({
        id: b.id || `bill-${idx + 1}`,
        name: b.name || 'Untitled Document',
        size: b.size || 'N/A',
        type: b.type || 'document',
        status: b.status || 'Staged Document',
        hasExtractedData: Boolean(b.extraction?.success || b.extractedData),
        extraction: b.extraction || null
      }))
      : [],
    note: hasBills
      ? `${bills.length} physical document proof(s) staged as forensic evidence.`
      : null
  };

  // 4. Resolve Evidence Mode Tag
  let evidenceMode = 'profile_only';
  if (hasTransactions && hasBills && hasProfile) {
    evidenceMode = 'full_cross_source';
  } else if (hasTransactions && hasBills) {
    evidenceMode = 'dual_evidence';
  } else if (hasTransactions && hasProfile) {
    evidenceMode = 'ledger_and_profile';
  } else if (hasTransactions) {
    evidenceMode = 'ledger_only';
  } else if (hasBills && hasProfile) {
    evidenceMode = 'bills_and_profile';
  } else if (hasBills) {
    evidenceMode = 'bills_only';
  }

  // Profile baseline object for reference
  const profileTotalIncome = (validMonthlyIncome || 0) + (validIrregularIncome || 0);
  const profileBaseline = hasProfile
    ? {
      monthlyIncome: validMonthlyIncome,
      irregularIncome: validIrregularIncome,
      totalIncome: profileTotalIncome,
      savingsGoal: validSavingsGoal
    }
    : null;

  // 5. CASE 1: Transactions available (CSV provided)
  if (hasTransactions) {
    // Build options for generateMember2Analytics
    const analyticsOptions = {
      currency,
      budgetConfig,
      whatIf: whatIfInput
    };

    // If profile specifies a savings goal, pass it to goalTracking
    if (validSavingsGoal !== null) {
      analyticsOptions.goalConfig = {
        goalAmount: validSavingsGoal
      };
    }

    const normalizedTransactions = transactions.map((tx, idx) => ({
      id: typeof tx?.id === 'string' && tx.id.trim() ? tx.id.trim() : `tx-${idx + 1}`,
      date: tx?.date,
      merchant: tx?.merchant || tx?.desc || tx?.description || 'Unlabeled Transaction',
      category: tx?.category || tx?.cat || 'General',
      amount: typeof tx?.amount === 'number' ? tx.amount : parseFloat(tx?.amount) || 0,
      type: String(tx?.type || 'expense').toLowerCase(),
      source: tx?.source || 'csv'
    }));

    const validTransactions = normalizedTransactions.filter(tx => validateTransaction(tx).valid);
    const member2Result = generateMember2Analytics(validTransactions, analyticsOptions);

    // Merge any file-level CSV parser errors into dataQuality
    if (csvErrors.length > 0 && member2Result.dataQuality) {
      member2Result.dataQuality.invalidRows += csvErrors.length;
      member2Result.dataQuality.warnings.push(
        `${csvErrors.length} raw CSV row(s) failed parsing or schema validation.`
      );
    }

    if (!budgetConfig && member2Result.dataQuality) {
      member2Result.dataQuality.warnings.push(
        'No category budgets configured; budget violation analysis skipped.'
      );
    }

    return {
      status: 'success',
      inputsProvided: {
        hasTransactions: true,
        hasBills,
        hasProfile
      },
      evidenceMode,
      currency,
      transactions: validTransactions,
      ...member2Result,
      summary: {
        ...member2Result.summary,
        reportedProfileIncome: validMonthlyIncome,
        reportedIrregularIncome: validIrregularIncome,
        reportedTotalProfileIncome: hasProfile ? profileTotalIncome : null
      },
      billEvidence,
      profileBaseline
    };
  }

  // 6. CASE 2: No transactions, but Profile is available (Profile only OR Profile + Bills)
  if (hasProfile) {
    // Goal tracking supported strictly if user provided savingsGoal
    let goalTrackingResult;
    if (validSavingsGoal !== null && validSavingsGoal > 0) {
      goalTrackingResult = calculateGoalTracking([], {
        goalAmount: validSavingsGoal,
        currentPeriodSurplus: profileTotalIncome
      });
    } else {
      goalTrackingResult = {
        goalAmount: null,
        actualSavingsBalance: null,
        observableSurplus: null,
        progressBasis: 'insufficient_data',
        currentProgressAmount: null,
        remainingAmount: null,
        progressPercentage: null,
        currentPeriodSurplus: profileTotalIncome,
        status: 'insufficient_data',
        isReachable: null,
        dataQualityWarning: 'Savings goal amount not specified in profile.'
      };
    }

    // Financial health on profile-only data: insufficient history for score
    const healthResult = calculateFinancialHealth([], {
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0
      }
    });

    const warnings = [
      'Transaction statement not provided; spending history, anomalies, recurring charges, and leaks unavailable.',
      'Analysis calculated strictly from user-provided income & savings profile baseline.'
    ];

    if (hasBills) {
      warnings.push(`${bills.length} bill document(s) attached as evidence without matching bank ledger.`);
    }

    return {
      status: 'success',
      inputsProvided: {
        hasTransactions: false,
        hasBills,
        hasProfile: true
      },
      evidenceMode,
      currency,
      transactions: [],
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        currency,
        isProfileBaseline: true,
        reportedProfileIncome: validMonthlyIncome || 0,
        reportedIrregularIncome: validIrregularIncome || 0,
        reportedTotalProfileIncome: profileTotalIncome
      },
      spendingChanges: [],
      irregularIncome: {
        incomePattern: 'insufficient_data',
        monthsAnalyzed: 0,
        averageMonthlyIncome: null,
        medianMonthlyIncome: null,
        minimumMonthlyIncome: null,
        maximumMonthlyIncome: null,
        coefficientOfVariation: null,
        lowerIncomeMonths: [],
        explanation: 'No transaction statement provided. Statistical income variability requires multi-month transaction history.'
      },
      anomalies: [],
      recurringCharges: [],
      goalTracking: goalTrackingResult,
      budgetViolations: [],
      moneyLeaks: [],
      financialHealth: healthResult,
      whatIf: whatIfInput
        ? {
          status: 'insufficient_data',
          disclaimer: 'What-if scenarios require transaction spending history.'
        }
        : {},
      billEvidence,
      profileBaseline,
      dataQuality: {
        totalTransactions: 0,
        validTransactions: 0,
        invalidRows: csvErrors.length,
        possibleDuplicates: [],
        warnings
      }
    };
  }

  // 7. CASE 3: Bills only (No CSV and No Profile)
  const billWarnings = [
    'No transaction statement or financial profile provided.',
    `${bills.length} physical invoice/receipt document(s) staged as evidence without ledger cross-reference.`
  ];

  return {
    status: 'success',
    inputsProvided: {
      hasTransactions: false,
      hasBills: true,
      hasProfile: false
    },
    evidenceMode: 'bills_only',
    currency,
    transactions: [],
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      currency,
      isDocumentEvidenceOnly: true,
      reportedProfileIncome: null,
      reportedIrregularIncome: null,
      reportedTotalProfileIncome: null
    },
    spendingChanges: [],
    irregularIncome: {
      incomePattern: 'insufficient_data',
      monthsAnalyzed: 0,
      averageMonthlyIncome: null,
      medianMonthlyIncome: null,
      minimumMonthlyIncome: null,
      maximumMonthlyIncome: null,
      coefficientOfVariation: null,
      lowerIncomeMonths: [],
      explanation: 'No transaction history provided for income analysis.'
    },
    anomalies: [],
    recurringCharges: [],
    goalTracking: {
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
      dataQualityWarning: 'No savings goal or transaction data provided.'
    },
    budgetViolations: [],
    moneyLeaks: [],
    financialHealth: {
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
    },
    whatIf: {},
    billEvidence,
    profileBaseline: null,
    dataQuality: {
      totalTransactions: 0,
      validTransactions: 0,
      invalidRows: csvErrors.length,
      possibleDuplicates: [],
      warnings: billWarnings
    }
  };
}
