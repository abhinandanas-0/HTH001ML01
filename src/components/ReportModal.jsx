import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  Download,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  Activity,
  AlertTriangle,
  Repeat,
  TrendingDown,
  Target,
  FileText,
  Info
} from 'lucide-react';
import { prepareFinancialAdvice } from '../genai/financialAdvisor.js';

export default function ReportModal({
  isOpen,
  onClose,
  analyticsResult,
  currencySymbol = '$'
}) {
  const [simReductionPct, setSimReductionPct] = useState(20);

  // GenAI Recommendation & Evidence Layer (Member 3) with safety guard
  const advisorData = useMemo(() => {
    try {
      if (!analyticsResult || analyticsResult.status === 'no_input') {
        return { evidence: [], prompts: [], recommendations: [] };
      }
      return prepareFinancialAdvice(
        analyticsResult,
        analyticsResult.transactions || []
      );
    } catch (err) {
      console.warn('GenAI advisory layer encountered an error:', err);
      return { evidence: [], prompts: [], recommendations: [] };
    }
  }, [analyticsResult]);

  if (!isOpen) return null;

  // Handle case where no inputs exist
  if (!analyticsResult || analyticsResult.status === 'no_input') {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              <ShieldAlert size={24} style={{ color: 'var(--rose-400)' }} />
              <div>
                <span>Investigation Incomplete</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  No financial inputs provided
                </div>
              </div>
            </div>
            <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close Modal">
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: 'var(--amber-400)', margin: '0 auto 16px' }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '8px' }}>
              Insufficient Input
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              Please provide at least one financial input before generating your analysis.
            </p>
            <button type="button" className="nav-btn-secondary" onClick={onClose}>
              Return to Investigation Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    summary = { totalIncome: 0, totalExpenses: 0, netCashFlow: 0 },
    transactions = [],
    goalTracking = {},
    anomalies = [],
    recurringCharges = [],
    moneyLeaks = [],
    spendingChanges = [],
    budgetViolations = [],
    irregularIncome = {},
    financialHealth = {},
    whatIf: member2WhatIf = {},
    dataQuality = {},
    billEvidence = { count: 0, items: [] },
    inputsProvided = { hasTransactions: false, hasBills: false, hasProfile: false },
    evidenceMode = 'none'
  } = analyticsResult;

  const hasTransactions = Boolean(inputsProvided.hasTransactions);
  const billCount = billEvidence?.count || 0;

  const { evidence = [], recommendations = [] } = advisorData;
  const genAiSpendingChanges = evidence.filter((item) => item.findingType === 'spending_change');
  const genAiCurrency = summary.currency === 'INR' || analyticsResult.currency === 'INR' ? '₹' : currencySymbol;

  // What-If deterministic simulation
  const primaryChangeFinding = spendingChanges[0] || {};
  const simCategory = member2WhatIf?.category || primaryChangeFinding?.category || 'General';
  const simBaseSpending = member2WhatIf?.currentExpense !== undefined
    ? member2WhatIf.currentExpense
    : (primaryChangeFinding?.currentPeriodAmount || summary.totalExpenses || 0);
  const simDifference = Math.round(simBaseSpending * (simReductionPct / 100));
  const simHypotheticalSpending = Math.max(0, simBaseSpending - simDifference);

  const getEvidenceModeLabel = (mode) => {
    switch (mode) {
      case 'full_cross_source':
        return 'Full Dual-Source & Profile Audit';
      case 'dual_evidence':
        return 'Dual Evidence (Ledger + Bills)';
      case 'ledger_and_profile':
        return 'Bank Statement + Profile Baseline';
      case 'bills_and_profile':
        return 'Physical Document Proofs + Profile';
      case 'bills_only':
        return 'Physical Document Proofs Only';
      case 'profile_only':
        return 'Manual Profile Baseline Only';
      case 'ledger_only':
      default:
        return 'Bank Ledger Statement Only';
    }
  };

  const handleExportJSON = () => {
    const exportTime = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPayload = {
      reportTitle: 'GA-08 Evidence-Based Financial Detective Dossier',
      generatedAt: new Date().toISOString(),
      currency: currencySymbol,
      evidenceMode: getEvidenceModeLabel(evidenceMode),
      analyticsResult,
      genAiFinancialAdvisor: {
        evidence,
        recommendations,
        whatIfSimulation: {
          category: simCategory,
          currentSpending: simBaseSpending,
          reductionPercent: simReductionPct,
          hypotheticalSpending: simHypotheticalSpending,
          projectedDifference: simDifference
        }
      }
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_detective_dossier_${exportTime}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={24} style={{ color: 'var(--purple-400)' }} />
            <div>
              <span>Expenditure Investigation Dossier</span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Forensic cross-examination of bank ledgers vs. physical billing proof
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: 'var(--purple-400)',
                fontWeight: 600
              }}
            >
              {getEvidenceModeLabel(evidenceMode)}
            </span>

            <button
              type="button"
              className="close-modal-btn"
              onClick={onClose}
              aria-label="Close Report"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Forensic Metrics 4-Card Grid */}
        <div className="report-metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Analyzed Outflow</div>
            <div className="metric-value">
              {currencySymbol}{summary.totalExpenses.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {hasTransactions ? `${transactions.length} debits ledgered` : 'Profile/Bills estimate'}
            </div>
          </div>

          <div className="metric-card accent-emerald">
            <div className="metric-label">Verified Inflow</div>
            <div className="metric-value" style={{ color: 'var(--emerald-400)' }}>
              {currencySymbol}{summary.totalIncome.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--emerald-400)', marginTop: '4px' }}>
              Net Flow: {summary.netCashFlow >= 0 ? '+' : ''}{currencySymbol}{summary.netCashFlow.toFixed(2)}
            </div>
          </div>

          <div className="metric-card accent-purple">
            <div className="metric-label">Potential Money Leaks</div>
            <div className="metric-value" style={{ color: 'var(--purple-400)' }}>
              {moneyLeaks.length} Flag{moneyLeaks.length !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--purple-400)', marginTop: '4px' }}>
              {moneyLeaks.length > 0 ? `${anomalies.length} anomaly, ${recurringCharges.length} recurring` : 'No leaks identified'}
            </div>
          </div>

          <div className="metric-card accent-amber">
            <div className="metric-label">Health Score</div>
            <div className="metric-value" style={{ color: 'var(--amber-400)' }}>
              {financialHealth.score !== null ? `${financialHealth.score} / 100` : 'Pending Data'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {financialHealth.score !== null
                ? 'Rule-Based Analytical Score'
                : (financialHealth.warnings?.[0] || 'Requires income history')}
            </div>
          </div>
        </div>

        {/* SECTION 1: Goal Tracking Assessment */}
        {goalTracking.status && goalTracking.status !== 'insufficient_data' && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(20, 29, 64, 0.7)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                <Target size={18} style={{ color: 'var(--purple-400)' }} />
                <span>Savings Goal Trajectory</span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: goalTracking.status === 'completed'
                    ? 'rgba(52, 211, 153, 0.15)'
                    : (goalTracking.isReachable ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)'),
                  color: goalTracking.status === 'completed'
                    ? 'var(--emerald-400)'
                    : (goalTracking.isReachable ? 'var(--cyan-400)' : 'var(--amber-400)'),
                  fontWeight: 600
                }}
              >
                {goalTracking.status === 'completed'
                  ? 'Goal Achieved'
                  : (goalTracking.isReachable ? 'Surplus on Track' : 'Cash Flow Constrained')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>
                Target Goal: <strong style={{ color: '#fff' }}>{currencySymbol}{goalTracking.goalAmount?.toLocaleString()}</strong>
              </div>

              {goalTracking.progressBasis === 'actual_savings' ? (
                <>
                  <div>
                    Actual Savings: <strong style={{ color: '#fff' }}>{currencySymbol}{goalTracking.actualSavingsBalance?.toLocaleString()}</strong> ({goalTracking.progressPercentage}%)
                  </div>
                  <div>
                    Remaining to Target: <strong style={{ color: '#fff' }}>{currencySymbol}{goalTracking.remainingAmount?.toLocaleString()}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    Observable Surplus: <strong style={{ color: '#fff' }}>{currencySymbol}{goalTracking.observableSurplus?.toLocaleString()}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--cyan-400)', display: 'block' }}>(Run-Rate Estimate)</span>
                  </div>
                  <div>
                    Target Goal Gap: <strong style={{ color: '#fff' }}>{currencySymbol}{goalTracking.goalAmount?.toLocaleString()}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>(Balance Unrecorded)</span>
                  </div>
                </>
              )}

              <div>
                Period Cash Flow: <strong style={{ color: (goalTracking.currentPeriodSurplus ?? 0) >= 0 ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                  {(goalTracking.currentPeriodSurplus ?? 0) >= 0 ? '+' : ''}{currencySymbol}{goalTracking.currentPeriodSurplus?.toLocaleString()}
                </strong>
              </div>
            </div>

            {goalTracking.progressBasis !== 'actual_savings' && (
              <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                * Estimated progress based on observable cash-flow surplus; current savings balance was not supplied.
              </div>
            )}
          </div>
        )}

        {/* SECTION: Irregular Income Intelligence */}
        {irregularIncome && irregularIncome.incomePattern && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(20, 29, 64, 0.7)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--purple-400)' }} />
                <span>Income Stability & Pattern Analysis</span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: irregularIncome.incomePattern === 'relatively_stable'
                    ? 'rgba(52, 211, 153, 0.15)'
                    : (irregularIncome.incomePattern === 'variable'
                        ? 'rgba(251, 191, 36, 0.15)'
                        : 'rgba(148, 163, 184, 0.15)'),
                  color: irregularIncome.incomePattern === 'relatively_stable'
                    ? 'var(--emerald-400)'
                    : (irregularIncome.incomePattern === 'variable'
                        ? 'var(--amber-400)'
                        : 'var(--text-muted)'),
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {irregularIncome.incomePattern.replace('_', ' ')}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
              {irregularIncome.explanation}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>
                Months Analyzed: <strong style={{ color: '#fff' }}>{irregularIncome.monthsAnalyzed ?? 0}</strong>
              </div>
              <div>
                Average Income: <strong style={{ color: '#fff' }}>{currencySymbol}{irregularIncome.averageMonthlyIncome ? Number(irregularIncome.averageMonthlyIncome).toFixed(2) : 'N/A'}</strong>
              </div>
              <div>
                Median Income: <strong style={{ color: '#fff' }}>{currencySymbol}{irregularIncome.medianMonthlyIncome ? Number(irregularIncome.medianMonthlyIncome).toFixed(2) : 'N/A'}</strong>
              </div>
              <div>
                Variability (CV): <strong style={{ color: '#fff' }}>{irregularIncome.coefficientOfVariation !== null && irregularIncome.coefficientOfVariation !== undefined ? irregularIncome.coefficientOfVariation : 'N/A'}</strong>
              </div>
            </div>

            {irregularIncome.lowerIncomeMonths && irregularIncome.lowerIncomeMonths.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--amber-400)', fontWeight: 600 }}>
                  Lower Income Months Below Baseline Threshold (80% of Median):
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {irregularIncome.lowerIncomeMonths.map((lim, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(251, 191, 36, 0.1)',
                        color: 'var(--amber-400)',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {lim.month}: {currencySymbol}{Number(lim.amount).toFixed(2)} (Deficit: -{currencySymbol}{Number(lim.deficitFromMedian).toFixed(2)})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: Budget Violations */}
        {budgetViolations.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={17} style={{ color: 'var(--rose-400)' }} />
              <span>Category Budget Violations Detected ({budgetViolations.length})</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {budgetViolations.map((bv, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <strong style={{ color: '#fff', fontSize: '0.86rem' }}>{bv.category}</strong>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--rose-400)', fontWeight: 600 }}>
                        {bv.percentageOverBudget}% OVER BUDGET
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Actual spending ({currencySymbol}{Number(bv.actualAmount).toFixed(2)}) exceeded allocated limit of {currencySymbol}{Number(bv.budgetAmount).toFixed(2)}.
                    </div>
                    {bv.transactionIds && bv.transactionIds.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        Violating Transaction IDs: {bv.transactionIds.join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--rose-400)', fontFamily: 'var(--font-mono)' }}>
                      +{currencySymbol}{Number(bv.exceededAmount || bv.difference).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      Over Limit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: Potential Money Leaks */}
        {moneyLeaks.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={17} style={{ color: 'var(--rose-400)' }} />
              <span>Potential Money Leaks Detected ({moneyLeaks.length})</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {moneyLeaks.map((leak) => (
                <div
                  key={leak.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{leak.id}</span>
                      <strong style={{ color: '#fff', fontSize: '0.86rem' }}>{leak.merchant}</strong>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                        {leak.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {leak.reason}
                    </div>
                    {leak.transactionIds && leak.transactionIds.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        Evidence IDs: {leak.transactionIds.join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--rose-400)', fontFamily: 'var(--font-mono)' }}>
                      -{currencySymbol}{Number(leak.estimatedMonthlyImpact || leak.amount).toFixed(2)}/mo
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                      Confidence: {leak.confidence}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: Spending Anomalies */}
        {anomalies.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={17} style={{ color: 'var(--amber-400)' }} />
              <span>Unusual Spending Anomalies ({anomalies.length})</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {anomalies.map((anom) => (
                <div
                  key={anom.id || anom.transactionId}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <strong style={{ color: '#fff', fontSize: '0.86rem' }}>{anom.merchant}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{anom.date}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(251, 191, 36, 0.15)', color: 'var(--amber-400)', fontWeight: 600 }}>
                        {anom.severity?.toUpperCase()} SEVERITY
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {anom.reason}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Transaction ID: {anom.transactionId}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--amber-400)', fontFamily: 'var(--font-mono)' }}>
                    -{currencySymbol}{Number(anom.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: Recurring Costs */}
        {recurringCharges.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Repeat size={17} style={{ color: 'var(--cyan-400)' }} />
              <span>Detected Recurring Payments ({recurringCharges.length})</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recurringCharges.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <strong style={{ color: '#fff', fontSize: '0.86rem' }}>{rec.merchant}</strong>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                        {rec.category}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
                        {rec.frequency}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {rec.reason}
                    </div>
                    {rec.transactionIds && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        Observed IDs: {rec.transactionIds.join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>
                    ~{currencySymbol}{Number(rec.averageAmount).toFixed(2)}/cycle
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: Spending Changes (Analytical Overview) */}
        {spendingChanges.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={17} style={{ color: 'var(--purple-400)' }} />
              <span>Period-over-Period Spending Changes</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
              {spendingChanges.map((sc) => (
                <div
                  key={sc.category}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#fff', fontSize: '0.82rem' }}>{sc.category}</strong>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: sc.changeAmount > 0 ? 'var(--rose-400)' : (sc.changeAmount < 0 ? 'var(--emerald-400)' : 'var(--text-dim)')
                      }}
                    >
                      {sc.changeAmount > 0 ? '+' : ''}{currencySymbol}{sc.changeAmount} ({sc.changePercentage !== null ? `${sc.changePercentage}%` : 'N/A'})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {sc.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: Staged Document Proofs */}
        {billCount > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={17} style={{ color: 'var(--cyan-400)' }} />
              <span>Attached Physical Document Proofs ({billCount})</span>
            </h3>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Format</th>
                    <th>File Size</th>
                    <th>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billEvidence.items.map((bill) => (
                    <tr key={bill.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{bill.name}</td>
                      <td style={{ textTransform: 'uppercase', color: 'var(--purple-400)', fontSize: '0.78rem' }}>
                        {bill.type}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--text-dim)' }}>{bill.size}</td>
                      <td>
                        <span style={{ color: 'var(--emerald-400)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> {bill.status || 'Staged Document'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 7: Normalized Transaction Records */}
        {hasTransactions ? (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={17} style={{ color: 'var(--emerald-400)' }} />
              <span>Normalized Statement Transactions ({transactions.length})</span>
            </h3>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant / Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map((tx, idx) => (
                    <tr key={tx.id || idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {tx.date || 'N/A'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {tx.merchant || 'Unlabeled Transaction'}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          {tx.category || 'General'}
                        </span>
                      </td>
                      <td
                        className="font-mono"
                        style={{
                          textAlign: 'right',
                          fontWeight: 600,
                          color: tx.type === 'income' ? 'var(--emerald-400)' : '#fff'
                        }}
                      >
                        {tx.type === 'income' ? '+' : '-'}{currencySymbol}{Number(tx.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {tx.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length > 50 && (
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                Showing first 50 of {transactions.length} normalized records. Full dataset included in JSON export.
              </div>
            )}
          </div>
        ) : (
          !billCount && (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(20, 29, 64, 0.5)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}
            >
              No ledger statements or bill documents have been provided. Report reflects manual profile baseline.
            </div>
          )
        )}

        {/* SECTION 8: Data Quality Observations & Diagnostics */}
        {dataQuality.warnings && dataQuality.warnings.length > 0 && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px'
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Data Quality & Audit Observations:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {dataQuality.warnings.map((w, idx) => (
                <li key={idx} style={{ marginBottom: '2px' }}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* SECTION 9: Member 3 GenAI Recommendations & Explanations */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sparkles size={18} style={{ color: 'var(--purple-400)' }} />
              <span>Explainable GenAI Recommendations</span>
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              * Advisory guidance; not guaranteed financial outcomes
            </span>
          </div>

          {recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((rec, rIdx) => (
                <div
                  key={rec.findingId || rIdx}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(20, 29, 64, 0.6)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Finding */}
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                      Finding ({rec.findingId || `F-${rIdx + 1}`})
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#fff', lineHeight: 1.5 }}>
                      {rec.explanation}
                    </div>
                  </div>

                  {/* Evidence */}
                  {rec.supportingTransactionIds && rec.supportingTransactionIds.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Supporting Evidence:
                      </span>
                      {rec.supportingTransactionIds.map((id) => (
                        <span
                          key={id}
                          className="font-mono"
                          style={{
                            fontSize: '0.74rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: 'var(--purple-400)'
                          }}
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Recommended Action */}
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(124, 58, 237, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                  >
                    <ArrowRight size={16} style={{ color: 'var(--purple-400)', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--purple-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                        Recommended Action
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#fff', lineHeight: 1.45 }}>
                        {rec.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                textAlign: 'center'
              }}
            >
              No high-variance spending changes or anomalies detected in current inputs. Recommendations will populate as transaction evidence is analyzed.
            </div>
          )}
        </div>

        {/* What Changed Section (GenAI View) */}
        {genAiSpendingChanges.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--purple-400)' }} />
              <span>What Changed — Period-over-Period Variance</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {genAiSpendingChanges.map((item) => {
                const finding = item.finding || {};
                const changeAmount = finding.changeAmount ?? 0;
                const changePercentage = finding.changePercentage ?? 0;
                const isIncrease = changeAmount >= 0;
                const direction = isIncrease ? 'increased' : 'decreased';
                const formattedChange = `${genAiCurrency}${Math.abs(changeAmount).toLocaleString()}`;
                const formattedPct = `${Math.abs(changePercentage)}%`;
                const prevAmount = `${genAiCurrency}${(finding.previousPeriodAmount ?? 0).toLocaleString()}`;
                const currAmount = `${genAiCurrency}${(finding.currentPeriodAmount ?? 0).toLocaleString()}`;

                return (
                  <div
                    key={item.findingId || finding.category}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(20, 29, 64, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>
                        {finding.category} spending {direction} by <span style={{ color: isIncrease ? 'var(--rose-400)' : 'var(--emerald-400)' }}>{formattedChange}</span> ({formattedPct}).
                      </div>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: isIncrease ? 'rgba(251, 113, 133, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isIncrease ? 'var(--rose-400)' : 'var(--emerald-400)',
                          border: `1px solid ${isIncrease ? 'rgba(251, 113, 133, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          fontWeight: 600
                        }}
                      >
                        {isIncrease ? `+${formattedPct}` : `-${formattedPct}`}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(10, 15, 36, 0.6)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Category</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{finding.category}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Previous Period</div>
                        <div className="font-mono" style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{prevAmount}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Period</div>
                        <div className="font-mono" style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>{currAmount}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Net Change</div>
                        <div className="font-mono" style={{ fontSize: '0.88rem', color: isIncrease ? 'var(--rose-400)' : 'var(--emerald-400)', fontWeight: 600 }}>
                          {isIncrease ? `+${formattedChange}` : `-${formattedChange}`}
                        </div>
                      </div>
                    </div>

                    {item.transactionIds && item.transactionIds.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Supporting Transactions:</span>
                        {item.transactionIds.map((txId) => (
                          <span
                            key={txId}
                            className="font-mono"
                            style={{
                              background: 'rgba(139, 92, 246, 0.15)',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: 'var(--purple-400)',
                              fontSize: '0.75rem'
                            }}
                          >
                            {txId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Evidence Grounding — Supporting Transactions */}
        {evidence.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--emerald-400)' }} />
              <span>Evidence Grounding — Supporting Transactions</span>
            </h3>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              The following transactions provide factual verification and ground each analytical finding:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {evidence.map((item, eIdx) => (
                <div
                  key={item.findingId || eIdx}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(20, 29, 64, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(10, 15, 36, 0.7)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: item.findingType === 'unusual_spending' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                          color: item.findingType === 'unusual_spending' ? 'var(--amber-400)' : 'var(--purple-400)'
                        }}
                      >
                        {item.findingType.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                        Finding ID: <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{item.findingId || `F-${eIdx + 1}`}</span>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {item.evidenceCount} transaction{item.evidenceCount === 1 ? '' : 's'} linked as evidence
                    </div>
                  </div>

                  {item.transactions && item.transactions.length > 0 ? (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Txn ID</th>
                            <th>Date</th>
                            <th>Merchant</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Evidence Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="font-mono" style={{ color: 'var(--purple-400)', fontWeight: 600 }}>{tx.id}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{tx.date || '-'}</td>
                              <td style={{ fontWeight: 600, color: '#fff' }}>{tx.merchant || 'Unknown'}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{tx.category || '-'}</td>
                              <td className="font-mono" style={{ color: '#fff', fontWeight: 600 }}>
                                {genAiCurrency}{(tx.amount ?? 0).toLocaleString()}
                              </td>
                              <td>
                                <span style={{ color: 'var(--emerald-400)', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> Verified Evidence
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No individual transactions linked for this finding.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What-If Simulation Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--cyan-400)' }} />
            <span>What-If Spending Simulation</span>
          </h3>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Simulate the possible financial effect of modifying expenditure in your target category ({simCategory}).
          </div>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(20, 29, 64, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                  Simulated Category: {simCategory}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Current spending: <strong style={{ color: '#fff' }}>{genAiCurrency}{simBaseSpending.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
                {[10, 20, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSimReductionPct(pct)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${simReductionPct === pct ? 'var(--cyan-400)' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: simReductionPct === pct ? 'rgba(56, 189, 248, 0.2)' : 'rgba(10, 15, 36, 0.5)',
                      color: simReductionPct === pct ? 'var(--cyan-400)' : 'var(--text-muted)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                <span>Adjust Reduction Target: {simReductionPct}%</span>
                <span>Possible Monthly Difference: +{genAiCurrency}{simDifference.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={simReductionPct}
                onChange={(e) => setSimReductionPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(10, 15, 36, 0.6)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Spending</div>
                <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                  {genAiCurrency}{simBaseSpending.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hypothetical Reduced Spending</div>
                <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--cyan-400)' }}>
                  {genAiCurrency}{simHypotheticalSpending.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Possible Monthly Difference</div>
                <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                  +{genAiCurrency}{simDifference.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              * Projected results: All simulated figures represent hypothetical projections calculated deterministically and are not guaranteed financial outcomes.
            </div>
          </div>
        </div>

        {/* Financial Health Explanation & Factors */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--emerald-400)' }} />
            <span>Financial Health & Analytics Factors</span>
          </h3>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(20, 29, 64, 0.7)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '0.84rem', color: '#fff', lineHeight: 1.5 }}>
              Based on the analyzed cash flows ({genAiCurrency}{(summary.totalIncome || 0).toLocaleString()} inflow vs.{' '}
              {genAiCurrency}{(summary.totalExpenses || 0).toLocaleString()} outflow), the financial health baseline demonstrates a net operating cash flow of{' '}
              <strong style={{ color: summary.netCashFlow >= 0 ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                {summary.netCashFlow >= 0 ? '+' : ''}{genAiCurrency}{(summary.netCashFlow || 0).toLocaleString()}
              </strong>
              {summary.totalIncome > 0 && ` (${((summary.netCashFlow / summary.totalIncome) * 100).toFixed(1)}% cash flow margin)`}.
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px'
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(10, 15, 36, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--purple-400)', marginBottom: '4px' }}>
                  Factor 1: Analytical Health Score
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Overall analytical score: <strong style={{ color: '#fff' }}>{financialHealth.score !== null ? `${financialHealth.score} / 100` : 'Pending Data'}</strong>.
                  {financialHealth.scoringMethod && ` Method: ${financialHealth.scoringMethod.replace(/_/g, ' ')}.`}
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(10, 15, 36, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--amber-400)', marginBottom: '4px' }}>
                  Factor 2: Outliers & Leak Risks
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {anomalies.length} anomaly detected, {moneyLeaks.length} potential money leak flagged across observed statement transactions.
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Evidence Integrity: All health conclusions are grounded strictly in recorded bank transactions and uploaded evidence without speculative assumptions.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            className="nav-btn-demo"
            onClick={handleExportJSON}
          >
            <Download size={15} />
            <span>Export Forensic Dossier (.JSON)</span>
          </button>

          <button
            type="button"
            className="nav-btn-secondary"
            onClick={onClose}
          >
            Return to Investigation Setup
          </button>
        </div>
      </div>
    </div>
  );
}
