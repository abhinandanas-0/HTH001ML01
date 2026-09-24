import React, { useRef, useState } from 'react';
import { Receipt, Upload, Trash2, FileText, Image as ImageIcon, CheckCircle2, Plus } from 'lucide-react';

export default function BillUpload({
  bills,
  onAddBills,
  onRemoveBill,
  onClearBills
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(Array.from(e.target.files));
    }
  };

  const processSelectedFiles = (fileList) => {
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const newItems = [];

    fileList.forEach((file) => {
      const fileName = file.name.toLowerCase();
      const isAccepted = validExtensions.some(ext => fileName.endsWith(ext));

      if (isAccepted) {
        const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(fileName);
        const previewUrl = isImage ? URL.createObjectURL(file) : null;

        newItems.push({
          id: 'uploaded-' + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: isImage ? 'image' : 'pdf',
          previewUrl,
          rawFile: file,
          status: 'Staged Document'
        });
      }
    });

    if (newItems.length > 0) {
      onAddBills(newItems);
    }
  };

  return (
    <div className="glass-panel upload-card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon-badge blue">
            <Receipt size={22} />
          </div>
          <div className="card-title-group">
            <h2>2. Invoices & Receipts</h2>
            <p>Upload utility bills, receipts, or PDF invoices</p>
          </div>
        </div>

        <div>
          {bills.length > 0 ? (
            <span className="card-status-pill attached">
              <CheckCircle2 size={13} /> {bills.length} Uploaded
            </span>
          ) : (
            <span className="card-status-pill optional">
              Optional / Can skip
            </span>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/png,image/jpeg,image/webp,image/jpg"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {bills.length === 0 ? (
        <div
          className={`dropzone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload multiple bill images or PDFs"
        >
          <div className="dropzone-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--cyan-400)' }}>
            <Upload size={24} />
          </div>
          <div className="dropzone-text">Drop multiple receipts or bill PDFs here</div>
          <div className="dropzone-subtext">Supports bulk uploads (PDF, PNG, JPG)</div>
          <div className="dropzone-tags">
            <span className="dropzone-tag">PDF</span>
            <span className="dropzone-tag">PNG</span>
            <span className="dropzone-tag">JPG</span>
            <span className="dropzone-tag">WEBP</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Quick bar with add more + clear */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {bills.length} physical {bills.length === 1 ? 'evidence item' : 'evidence items'} staged:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-inline-link"
                onClick={() => inputRef.current?.click()}
              >
                <Plus size={13} />
                <span>Add More</span>
              </button>
              <button
                type="button"
                className="btn-inline-link"
                style={{ color: 'var(--rose-400)' }}
                onClick={onClearBills}
              >
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* List of uploaded bills with thumbnail previews */}
          <div className="bills-preview-list">
            {bills.map((bill) => (
              <div key={bill.id} className="bill-item-card">
                <div className="bill-item-left">
                  <div className="bill-thumb-wrap">
                    {bill.previewUrl ? (
                      <img src={bill.previewUrl} alt={bill.name} className="bill-thumb-img" />
                    ) : bill.type === 'pdf' ? (
                      <FileText size={20} style={{ color: 'var(--rose-400)' }} />
                    ) : (
                      <ImageIcon size={20} style={{ color: 'var(--cyan-400)' }} />
                    )}
                  </div>
                  <div className="bill-info">
                    <div className="bill-name" title={bill.name}>
                      {bill.name}
                    </div>
                    <div className="bill-meta">
                      <span>{bill.size}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {bill.type ? bill.type.toUpperCase() : 'DOCUMENT'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn-icon"
                    title={`Remove ${bill.name}`}
                    onClick={() => onRemoveBill(bill.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-bottom-actions">
        {bills.length > 0 ? (
          <span style={{ fontSize: '0.74rem', color: 'var(--emerald-400)' }}>
            ✓ Ready to match against bank outflows
          </span>
        ) : (
          <span />
        )}

        <span className="card-skip-hint">
          {bills.length > 0 ? 'Multi-file evidence ready' : 'Can skip if no physical bills'}
        </span>
      </div>
    </div>
  );
}
