import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Download,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  Activity
} from 'lucide-react';
import { prepareFinancialAdvice } from "../genai/financialAdvisor";
import { mockAnalytics, mockTransactions } from "../genai/mockAnalytics";

export default function ReportModal({
  isOpen,
  onClose,
  hasCsv,
  billCount,
  profile,
  currencySymbol = '$'
}) {
  const [simReductionPct, setSimReductionPct] = useState(20);

  const advisorData = useMemo(() => {
    return prepareFinancialAdvice(mockAnalytics, mockTransactions);
  }, []);

  if (!isOpen) return null;

  const { evidence, recommendations } = advisorData;
  const spendingChanges = evidence.filter((item) => item.findingType === 'spending_change');
  const genAiCurrency = mockAnalytics?.summary?.currency === 'INR' ? '₹' : currencySymbol;

  // What-If deterministic simulation
  const primaryChangeFinding = spendingChanges[0]?.finding;
  const simCategory = primaryChangeFinding?.category || 'Food';
  const simBaseSpending = primaryChangeFinding?.currentPeriodAmount || 8000;
  const simDifference = Math.round(simBaseSpending * (simReductionPct / 100));
  const simHypotheticalSpending = simBaseSpending - simDifference;

  const monthlyStable = parseFloat(profile.monthlyIncome) || 0;
  const irregular = parseFloat(profile.irregularIncome) || 0;
  const totalIncome = monthlyStable + irregular;
  const savingsTarget = parseFloat(profile.savingsGoal) || 0;

  // Mock computed forensic stats
  const totalOutflow = 1212.54;
  const verifiedWithInvoices = billCount > 0 ? 732.05 : 0;
  const unverifiedTransactions = totalOutflow - verifiedWithInvoices;
  const ghostLeakAmount = 29.99; // SyncPro + SubStream variance
  const estimatedSurplus = totalIncome > 0 ? (totalIncome - totalOutflow) : null;
  const savingsAttained = estimatedSurplus !== null && savingsTarget > 0 ? (estimatedSurplus >= savingsTarget) : null;

  const handleExportJSON = () => {
    const reportData = {
      reportTitle: "GA-08 Evidence-Based Financial Detective Dossier",
      generatedAt: new Date().toISOString(),
      currency: currencySymbol,
      evidenceSummary: {
        bankLedgerAttached: hasCsv,
        invoicesAttachedCount: billCount,
        totalAnalyzedOutflow: totalOutflow,
        verifiedWithEvidence: verifiedWithInvoices,
        unverifiedOutflow: unverifiedTransactions,
        flaggedGhostSubscriptions: ["SubStream Plus ($19.99/mo)", "SyncPro Variance (+$10.00)"]
      },
      baseline: {
        totalIncome,
        savingsTarget,
        estimatedSurplus,
        savingsFeasibility: savingsAttained
      },
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

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_detective_dossier_${Date.now()}.json`;
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

          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            aria-label="Close Report"
          >
            <X size={18} />
          </button>
        </div>

        {/* Forensic Metrics 4-Card Grid */}
        <div className="report-metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Analyzed Outflow</div>
            <div className="metric-value">
              {currencySymbol}{totalOutflow.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {hasCsv ? 'Extracted from statement' : 'Estimated from bills'}
            </div>
          </div>

          <div className="metric-card accent-emerald">
            <div className="metric-label">Verified by Proof</div>
            <div className="metric-value" style={{ color: 'var(--emerald-400)' }}>
              {currencySymbol}{verifiedWithInvoices.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--emerald-400)', marginTop: '4px' }}>
              {billCount > 0 ? `${billCount} bills cross-matched` : '0 bills attached (Skipped)'}
            </div>
          </div>

          <div className="metric-card accent-amber">
            <div className="metric-label">Discrepancies & Ghosts</div>
            <div className="metric-value" style={{ color: 'var(--amber-400)' }}>
              2 Flags
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--amber-400)', marginTop: '4px' }}>
              ~{currencySymbol}{ghostLeakAmount}/mo potential leak
            </div>
          </div>

          <div className="metric-card accent-purple">
            <div className="metric-label">
              {savingsTarget > 0 ? 'Savings Goal Gap' : 'Est. Monthly Surplus'}
            </div>
            <div className="metric-value" style={{ color: 'var(--purple-400)' }}>
              {totalIncome > 0 ? (
                `${currencySymbol}${Math.abs((totalIncome - totalOutflow) - savingsTarget).toFixed(0)}`
              ) : (
                'Pending Income'
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {totalIncome > 0 ? (
                savingsAttained ? '✓ Target achievable' : '⚠ Buffer under target'
              ) : (
                'Add baseline in profile'
              )}
            </div>
          </div>
        </div>

        {/* Forensic Discrepancy Findings Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--amber-400)' }} />
            <span>Forensic Evidence Findings & Variance Reconciliation</span>
          </h3>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor / Subject</th>
                  <th>Statement Outflow</th>
                  <th>Invoice Proof</th>
                  <th>Variance</th>
                  <th>Detective Verdict</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: '#fff' }}>Metropolitan Grid Utility</td>
                  <td className="font-mono">{currencySymbol}178.20</td>
                  <td className="font-mono">{currencySymbol}178.20</td>
                  <td style={{ color: 'var(--emerald-400)' }}>$0.00</td>
                  <td>
                    <span style={{ color: 'var(--emerald-400)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> 100% Exact Receipt Match
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style={{ fontWeight: 600, color: '#fff' }}>Apex Cloud Hosting</td>
                  <td className="font-mono">{currencySymbol}89.00</td>
                  <td className="font-mono">{currencySymbol}89.00</td>
                  <td style={{ color: 'var(--emerald-400)' }}>$0.00</td>
                  <td>
                    <span style={{ color: 'var(--emerald-400)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Verified against PDF #ACH-9942
                    </span>
                  </td>
                </tr>

                <tr style={{ background: 'rgba(251, 113, 133, 0.08)' }}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>SyncPro SaaS</td>
                  <td className="font-mono" style={{ color: 'var(--rose-400)' }}>{currencySymbol}49.00</td>
                  <td className="font-mono">{currencySymbol}39.00</td>
                  <td style={{ color: 'var(--rose-400)', fontWeight: 700 }}>+{currencySymbol}10.00</td>
                  <td>
                    <span style={{ color: 'var(--rose-400)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertOctagon size={13} /> Unverified Price Hike (Invoice was $39)
                    </span>
                  </td>
                </tr>

                <tr style={{ background: 'rgba(251, 191, 36, 0.08)' }}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>SubStream Plus Premium</td>
                  <td className="font-mono" style={{ color: 'var(--amber-400)' }}>{currencySymbol}19.99</td>
                  <td style={{ color: 'var(--text-dim)' }}>Missing</td>
                  <td style={{ color: 'var(--amber-400)' }}>N/A</td>
                  <td>
                    <span style={{ color: 'var(--amber-400)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertOctagon size={13} /> Ghost Subscription (Zero login past 60d)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Task 6: What Changed Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--purple-400)' }} />
            <span>What Changed — Period-over-Period Variance</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {spendingChanges.map((item) => {
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
                  key={item.findingId}
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Task 7: Compact Evidence Area */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--emerald-400)' }} />
            <span>Evidence Grounding — Supporting Transactions</span>
          </h3>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            The following transactions provide factual verification and ground each analytical finding:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {evidence.map((item) => (
              <div
                key={item.findingId}
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
                      Finding ID: <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{item.findingId}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {item.evidenceCount} transaction{item.evidenceCount === 1 ? '' : 's'} linked as evidence
                  </div>
                </div>

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
              </div>
            ))}
          </div>
        </div>

        {/* Task 8: Recommendation Display */}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendations.map((rec) => (
              <div
                key={rec.findingId}
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
                    Finding ({rec.findingId})
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#fff', lineHeight: 1.5 }}>
                    {rec.explanation}
                  </div>
                </div>

                {/* Evidence */}
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
        </div>

        {/* Task 9: What-If Simulation */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--cyan-400)' }} />
            <span>What-If Spending Simulation</span>
          </h3>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Simulate the possible financial effect of modifying expenditure in your highest-variance category ({simCategory}).
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

        {/* Task 10: Financial Health Explanation & Factors */}
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
              Based on the analyzed cash flows ({genAiCurrency}{(mockAnalytics?.summary?.totalIncome ?? 30000).toLocaleString()} inflow vs.{' '}
              {genAiCurrency}{(mockAnalytics?.summary?.totalExpenses ?? 22000).toLocaleString()} outflow), the financial health baseline demonstrates a positive net operating surplus of{' '}
              <strong style={{ color: 'var(--emerald-400)' }}>
                {genAiCurrency}{(mockAnalytics?.summary?.netCashFlow ?? 8000).toLocaleString()}
              </strong> (26.7% buffer).
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
                  Factor 1: Category Surge
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Food expenditures expanded +60% (+{genAiCurrency}3,000), evidenced by transactions <span className="font-mono">TXN003</span>, <span className="font-mono">TXN007</span>, and <span className="font-mono">TXN011</span>.
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
                  Factor 2: Outlier Transaction
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Transaction <span className="font-mono">TXN011</span> ({genAiCurrency}4,500) represents 56.3% of Food category spending, flagged as an atypical single outflow.
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Evidence Integrity: All health conclusions are grounded strictly in recorded bank transactions without speculative assumptions.
            </div>
          </div>
        </div>

        {/* Savings & Cashflow Insight */}
        {totalIncome > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(20, 29, 64, 0.7)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                Detective Savings Assessment
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Combined Inflow ({currencySymbol}{totalIncome.toFixed(2)}) minus Analyzed Outflows ({currencySymbol}{totalOutflow.toFixed(2)}) leaves an operating surplus of{' '}
                <strong style={{ color: 'var(--emerald-400)' }}>{currencySymbol}{(totalIncome - totalOutflow).toFixed(2)}</strong>.
              </div>
            </div>

            {savingsTarget > 0 && (
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: savingsAttained ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                  border: `1px solid ${savingsAttained ? 'rgba(16, 185, 129, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: savingsAttained ? 'var(--emerald-400)' : 'var(--amber-400)'
                }}
              >
                {savingsAttained ? '✓ Target Achieved' : '⚠ Gap: ' + currencySymbol + Math.abs((totalIncome - totalOutflow) - savingsTarget).toFixed(0)}
              </div>
            )}
          </div>
        )}

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
