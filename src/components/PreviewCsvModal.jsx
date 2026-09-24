import React from 'react';
import { X, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function PreviewCsvModal({
  isOpen,
  onClose,
  fileName,
  transactions = [],
  currencySymbol = '$'
}) {
  if (!isOpen) return null;

  const hasData = Array.isArray(transactions) && transactions.length > 0;
  const totalOutflow = hasData
    ? transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0)
    : 0;

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
                  ? `Source: ${fileName || 'Uploaded Statement'} • ${transactions.length} rows parsed`
                  : 'No statement data parsed'}
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
              No Transaction Data Uploaded
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Upload a valid CSV file containing bank or card transaction history on the main page to preview and cross-reference your records.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing user ledger items prepared for forensic evidence cross-referencing:
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                Total Outflow: {currencySymbol}{totalOutflow.toFixed(2)}
              </span>
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
                          color: (tx.amount || 0) > 200 ? 'var(--rose-400)' : '#fff'
                        }}
                      >
                        -{currencySymbol}{Number(tx.amount || 0).toFixed(2)}
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
