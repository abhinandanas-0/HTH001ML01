import React from 'react';
import { X, ShieldAlert, CheckCircle2, Download, Sparkles } from 'lucide-react';

export default function ReportModal({
  isOpen,
  onClose,
  transactions = [],
  bills = [],
  profile,
  currencySymbol = '$'
}) {
  if (!isOpen) return null;

  const monthlyStable = parseFloat(profile.monthlyIncome) || 0;
  const irregular = parseFloat(profile.irregularIncome) || 0;
  const totalIncome = monthlyStable + irregular;
  const savingsTarget = parseFloat(profile.savingsGoal) || 0;

  // Real computed stats from actual user inputs
  const totalOutflow = Array.isArray(transactions)
    ? transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0)
    : 0;
  const billCount = Array.isArray(bills) ? bills.length : 0;
  const hasTransactions = transactions.length > 0;
  const surplus = totalIncome > 0 || totalOutflow > 0 ? (totalIncome - totalOutflow) : null;
  const savingsAttained = surplus !== null && savingsTarget > 0 ? (surplus >= savingsTarget) : null;

  const handleExportJSON = () => {
    const exportTime = new Date().toISOString().replace(/[:.]/g, '-');
    const reportData = {
      reportTitle: "GA-08 Evidence-Based Financial Detective Dossier",
      generatedAt: new Date().toISOString(),
      currency: currencySymbol,
      userEvidenceSummary: {
        transactionsCount: transactions.length,
        totalOutflow: totalOutflow,
        billsCount: billCount,
        uploadedBillFiles: bills.map(b => ({ name: b.name, size: b.size, type: b.type })),
        transactions: transactions
      },
      financialBaseline: {
        monthlyIncome: monthlyStable,
        irregularIncome: irregular,
        totalIncome: totalIncome,
        savingsTarget: savingsTarget,
        operatingBalance: surplus
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
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

          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            aria-label="Close Report"
          >
            <X size={18} />
          </button>
        </div>

        {/* Real Metrics Grid */}
        <div className="report-metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Analyzed Outflow</div>
            <div className="metric-value">
              {currencySymbol}{totalOutflow.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {hasTransactions ? `${transactions.length} user records parsed` : 'No statement uploaded'}
            </div>
          </div>

          <div className="metric-card accent-emerald">
            <div className="metric-label">Attached Proofs</div>
            <div className="metric-value" style={{ color: 'var(--emerald-400)' }}>
              {billCount} {billCount === 1 ? 'Doc' : 'Docs'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--emerald-400)', marginTop: '4px' }}>
              {billCount > 0 ? `${billCount} user documents attached` : '0 bills attached (Skipped)'}
            </div>
          </div>

          <div className="metric-card accent-purple">
            <div className="metric-label">Evidence Depth</div>
            <div className="metric-value" style={{ color: 'var(--purple-400)', fontSize: '1.15rem' }}>
              {hasTransactions && billCount > 0
                ? 'Dual Evidence'
                : hasTransactions
                ? 'Ledger Only'
                : billCount > 0
                ? 'Bills Only'
                : 'Baseline Only'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--purple-400)', marginTop: '4px' }}>
              {hasTransactions && billCount > 0
                ? 'Cross-source available'
                : 'Single input mode'}
            </div>
          </div>

          <div className="metric-card accent-amber">
            <div className="metric-label">
              {savingsTarget > 0 ? 'Savings Goal Gap' : 'Est. Monthly Surplus'}
            </div>
            <div className="metric-value" style={{ color: 'var(--amber-400)' }}>
              {totalIncome > 0 ? (
                `${currencySymbol}${Math.abs((totalIncome - totalOutflow) - savingsTarget).toFixed(2)}`
              ) : (
                'Pending Income'
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {totalIncome > 0 ? (
                savingsAttained ? '✓ Target achievable' : '⚠ Deficit from target'
              ) : (
                'Add baseline in profile'
              )}
            </div>
          </div>
        </div>

        {/* Evidence Findings Section: Real User Data */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--purple-400)' }} />
            <span>Forensic Evidence Findings & Itemized Records</span>
          </h3>

          {hasTransactions ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant / Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Outflow</th>
                    <th>Evidence State</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
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
                      <td className="font-mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                        -{currencySymbol}{Number(tx.amount || 0).toFixed(2)}
                      </td>
                      <td>
                        {billCount > 0 ? (
                          <span style={{ color: 'var(--cyan-400)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> Linked to Staged Proofs
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                            Statement Only (Bills Skipped)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : billCount > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Uploaded Document</th>
                    <th>Format</th>
                    <th>File Size</th>
                    <th>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{bill.name}</td>
                      <td style={{ textTransform: 'uppercase', color: 'var(--purple-400)', fontSize: '0.78rem' }}>
                        {bill.type || 'DOCUMENT'}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--text-dim)' }}>{bill.size}</td>
                      <td>
                        <span style={{ color: 'var(--emerald-400)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> Staged for OCR Analysis
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(20, 29, 64, 0.5)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}
            >
              No ledger statements or bill documents have been provided. Report reflects manual profile baseline.
            </div>
          )}
        </div>

        {/* Real Savings & Cashflow Insight */}
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
                Combined Inflow ({currencySymbol}{totalIncome.toFixed(2)}) minus Analyzed Outflows ({currencySymbol}{totalOutflow.toFixed(2)}) leaves an operating balance of{' '}
                <strong style={{ color: surplus >= 0 ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                  {currencySymbol}{surplus.toFixed(2)}
                </strong>.
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
                {savingsAttained
                  ? '✓ Target Achieved'
                  : '⚠ Target Gap: ' + currencySymbol + Math.abs(surplus - savingsTarget).toFixed(2)}
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
