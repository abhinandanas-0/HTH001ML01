import React from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  Download,
  Sparkles,
  AlertTriangle,
  Repeat,
  TrendingDown,
  Target,
  FileText,
  Info,
  TrendingUp
} from 'lucide-react';

export default function ReportModal({
  isOpen,
  onClose,
  analyticsResult,
  currencySymbol = '$'
}) {
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
    dataQuality = { warnings: [] },
    billEvidence = { count: 0, items: [] },
    evidenceMode = 'ledger_only',
    inputsProvided = {},
    profileBaseline = null
  } = analyticsResult;

  const totalIncome = Number(summary.totalIncome || 0);
  const totalOutflow = Number(summary.totalExpenses || 0);
  const netCashFlow = Number(summary.netCashFlow || 0);
  const billCount = billEvidence.count || 0;
  const hasTransactions = Boolean(inputsProvided.hasTransactions);
  const reportedProfileIncome = profileBaseline?.monthlyIncome ?? summary.reportedProfileIncome ?? null;

  // Evidence mode badge formatting
  const getEvidenceModeLabel = () => {
    switch (evidenceMode) {
      case 'full_cross_source':
        return 'Full Multi-Source Audit';
      case 'dual_evidence':
        return 'Dual Evidence (Ledger + Bills)';
      case 'ledger_and_profile':
        return 'Ledger & Baseline Profile';
      case 'bills_and_profile':
        return 'Document Proofs & Profile';
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
    const blob = new Blob([JSON.stringify(analyticsResult, null, 2)], { type: 'application/json' });
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
                Forensic expenditure reconciliation based strictly on user-provided evidence
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: 'var(--purple-400)',
                fontWeight: 600
              }}
            >
              {getEvidenceModeLabel()}
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

        {/* Real Metrics Grid */}
        <div className="report-metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Analyzed Outflow</div>
            <div className="metric-value">
              {currencySymbol}{totalOutflow.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {hasTransactions ? `${dataQuality.validTransactions} verified records parsed` : 'No statement uploaded'}
            </div>
          </div>

          <div className="metric-card accent-emerald">
            <div className="metric-label">
              {hasTransactions ? 'Verified Inflow' : 'Reported Profile Income'}
            </div>
            <div className="metric-value" style={{ color: 'var(--emerald-400)' }}>
              {currencySymbol}{hasTransactions ? totalIncome.toFixed(2) : Number(reportedProfileIncome || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--emerald-400)', marginTop: '4px' }}>
              {hasTransactions
                ? (totalIncome > 0
                    ? `Observed Ledger Inflow${reportedProfileIncome !== null ? ` (Profile: ${currencySymbol}${Number(reportedProfileIncome).toLocaleString()})` : ''}`
                    : 'Zero Verified Inflow')
                : (reportedProfileIncome !== null ? 'User-Reported Profile Baseline' : 'No Income Specified')}
            </div>
          </div>

          <div className="metric-card accent-purple">
            <div className="metric-label">Net Operating Flow</div>
            <div
              className="metric-value"
              style={{
                color: netCashFlow >= 0 ? 'var(--purple-400)' : 'var(--rose-400)'
              }}
            >
              {netCashFlow >= 0 ? '+' : ''}{currencySymbol}{netCashFlow.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {hasTransactions
                ? (netCashFlow >= 0 ? 'Operating Surplus' : 'Operating Deficit')
                : 'Requires statement ledger'}
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
                ℹ Estimated progress based on observable cash-flow surplus; current savings balance was not supplied.
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

        {/* SECTION: Budget Violations (if category budgets configured and exceeded) */}
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

        {/* SECTION 5: Spending Changes */}
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

        {/* SECTION 6: Staged Document Proofs (if bills uploaded) */}
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

        {/* SECTION 7: Normalized Transaction Records (if statement uploaded) */}
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

        {/* SECTION 9: Member 3 GenAI Recommendations Placeholder */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(168, 85, 247, 0.06)',
            border: '1px dashed rgba(168, 85, 247, 0.25)',
            marginBottom: '24px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--purple-400)', fontWeight: 600, marginBottom: '4px' }}>
            <Sparkles size={15} />
            <span>Member 3 GenAI Recommendations Layer</span>
          </div>
          <div>
            Structured evidence findings and financial intelligence above are compiled and formatted for Member 3 explanation and recommendation synthesis.
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
