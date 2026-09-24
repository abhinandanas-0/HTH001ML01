import React from 'react';
import { X, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function PreviewCsvModal({
  isOpen,
  onClose,
  fileName,
  transactions = [],
  errors = [],
  currencySymbol = '$'
}) {
  if (!isOpen) return null;

  const hasData = Array.isArray(transactions) && transactions.length > 0;
  const hasErrors = Array.isArray(errors) && errors.length > 0;

  const isIncomeTx = (tx) => String(tx?.type || '').toLowerCase() === 'income';

  const totalIncome = hasData
    ? transactions
        .filter(isIncomeTx)
        .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0)
    : 0;

  const totalOutflow = hasData
    ? transactions
        .filter(tx => !isIncomeTx(tx))
        .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0)
    : 0;

  const netCashFlow = totalIncome - totalOutflow;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileSpreadsheet size={22} style={{ color: 'var(--emerald-400)' }} />
            <div>
              <span>Extracted Transaction Ledger Preview</span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {hasData
                  ? `Source: ${fileName || 'Uploaded Statement'} • ${transactions.length} rows parsed${hasErrors ? ` (${errors.length} invalid)` : ''}`
                  : (hasErrors ? `Source: ${fileName || 'Uploaded Statement'} • ${errors.length} invalid rows found` : 'No statement data parsed')}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            aria-label="Close Preview"
          >
            <X size={18} />
          </button>
        </div>

        {hasErrors && (
          <div
            style={{
              margin: '16px 0',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span>⚠️ {errors.length} Row Validation Warning{errors.length > 1 ? 's' : ''} Encountered</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', maxHeight: '120px', overflowY: 'auto' }}>
              {errors.slice(0, 10).map((err, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  <strong>Row {err.row}:</strong>{' '}
                  {Array.isArray(err.errors) ? err.errors.join('; ') : (err.message || String(err))}
                </li>
              ))}
              {errors.length > 10 && (
                <li style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  ...and {errors.length - 10} more row issue(s).
                </li>
              )}
            </ul>
          </div>
        )}

        {!hasData ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--text-dim)'
              }}
            >
              <FileSpreadsheet size={32} />
            </div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
              {hasErrors ? 'No Valid Transactions Extracted' : 'No Transaction Data Uploaded'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              {hasErrors
                ? 'All rows in this statement failed validation. Inspect the row warnings above or upload a properly formatted banking CSV.'
                : 'Upload a valid CSV file containing bank or card transaction history on the main page to preview and cross-reference your records.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing user ledger items prepared for forensic evidence cross-referencing:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>
                  Total Income: +{currencySymbol}{totalIncome.toFixed(2)}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>
                  Total Outflow: -{currencySymbol}{totalOutflow.toFixed(2)}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ color: netCashFlow >= 0 ? 'var(--purple-400)' : 'var(--rose-400)', fontWeight: 700 }}>
                  Net Cash Flow: {netCashFlow >= 0 ? '+' : ''}{currencySymbol}{netCashFlow.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant / Entity</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id || idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {tx.date || 'N/A'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {tx.merchant || 'Unlabeled Entry'}
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
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: isIncomeTx(tx)
                            ? 'var(--emerald-400)'
                            : ((tx.amount || 0) > 200 ? 'var(--rose-400)' : '#fff')
                        }}
                      >
                        {isIncomeTx(tx) ? '+' : '-'}{currencySymbol}{Number(tx.amount || 0).toFixed(2)}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--emerald-400)', fontSize: '0.75rem' }}>
                          <CheckCircle2 size={13} /> Extracted Record
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="nav-btn-secondary"
            onClick={onClose}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
