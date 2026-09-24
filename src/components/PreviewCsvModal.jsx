import React from 'react';
import { X, FileSpreadsheet, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { SAMPLE_CSV_TRANSACTIONS } from '../data/mockData';

export default function PreviewCsvModal({ isOpen, onClose, fileName, currencySymbol = '$' }) {
  if (!isOpen) return null;

  const transactions = SAMPLE_CSV_TRANSACTIONS;
  const totalOutflow = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileSpreadsheet size={22} style={{ color: 'var(--emerald-400)' }} />
            <div>
              <span>Extracted Transaction Ledger Preview</span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Source: {fileName || 'statement_sep2026.csv'} • {transactions.length} rows parsed
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

        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing ledger items prepared for forensic evidence cross-referencing:
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
                <th>Forensic Audit State</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {tx.date}
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {tx.merchant}
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
                      {tx.category}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: tx.amount > 200 ? 'var(--rose-400)' : '#fff'
                    }}
                  >
                    -{currencySymbol}{tx.amount.toFixed(2)}
                  </td>
                  <td>
                    {tx.evidenceStatus === 'verified' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--emerald-400)', fontSize: '0.75rem' }}>
                        <CheckCircle2 size={13} /> {tx.note}
                      </span>
                    )}
                    {tx.evidenceStatus === 'missing_bill' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <HelpCircle size={13} /> {tx.note}
                      </span>
                    )}
                    {tx.evidenceStatus === 'flagged_ghost' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--amber-400)', fontSize: '0.75rem' }}>
                        <AlertTriangle size={13} /> {tx.note}
                      </span>
                    )}
                    {tx.evidenceStatus === 'flagged_discrepancy' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--rose-400)', fontSize: '0.75rem' }}>
                        <AlertTriangle size={13} /> {tx.note}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
