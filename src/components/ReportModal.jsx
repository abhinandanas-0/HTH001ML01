import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertOctagon, Download, Sparkles, FileText, ArrowRight } from 'lucide-react';

export default function ReportModal({
  isOpen,
  onClose,
  hasCsv,
  billCount,
  profile,
  currencySymbol = '$'
}) {
  if (!isOpen) return null;

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
