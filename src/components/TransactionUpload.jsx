import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Trash2, Eye, CheckCircle2, FileCheck } from 'lucide-react';

export default function TransactionUpload({
  file,
  onFileChange,
  onRemove,
  onOpenPreview
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
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return [];

    const parseLine = (line) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));
      return values;
    };

    const headerValues = parseLine(lines[0]).map(h => h.toLowerCase());
    
    let dateIdx = headerValues.findIndex(h => h.includes('date') || h.includes('time'));
    let merchantIdx = headerValues.findIndex(h => h.includes('merchant') || h.includes('desc') || h.includes('payee') || h.includes('entity') || h.includes('name'));
    let amountIdx = headerValues.findIndex(h => h.includes('amount') || h.includes('cost') || h.includes('price') || h.includes('total') || h.includes('debit'));
    let categoryIdx = headerValues.findIndex(h => h.includes('category') || h.includes('type') || h.includes('tag'));

    const hasHeaders = dateIdx !== -1 || merchantIdx !== -1 || amountIdx !== -1;
    const dataLines = hasHeaders ? lines.slice(1) : lines;

    if (dateIdx === -1) dateIdx = 0;
    if (merchantIdx === -1) merchantIdx = Math.min(1, headerValues.length - 1);
    if (amountIdx === -1) amountIdx = Math.min(2, headerValues.length - 1);
    if (categoryIdx === -1) categoryIdx = Math.min(3, headerValues.length - 1);

    return dataLines.map((line, idx) => {
      const cols = parseLine(line);
      const rawAmount = cols[amountIdx] || '0';
      const cleanAmount = parseFloat(rawAmount.replace(/[^0-9.-]/g, '')) || 0;

      return {
        id: `tx-${idx + 1}`,
        date: cols[dateIdx] || 'N/A',
        merchant: cols[merchantIdx] || 'Unknown Merchant',
        category: (cols[categoryIdx] && categoryIdx !== amountIdx && categoryIdx !== merchantIdx) ? cols[categoryIdx] : 'General',
        amount: Math.abs(cleanAmount)
      };
    }).filter(tx => tx.merchant !== 'Unknown Merchant' || tx.amount > 0);
  };

  const processFile = async (selectedFile) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      alert('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    let parsedTransactions = [];
    if (fileName.endsWith('.csv') || selectedFile.type === 'text/csv' || selectedFile.type === 'text/plain') {
      try {
        const text = await selectedFile.text();
        parsedTransactions = parseCSV(text);
      } catch (err) {
        console.warn('Failed to parse CSV text:', err);
      }
    }

    onFileChange({
      name: selectedFile.name,
      size: (selectedFile.size / 1024).toFixed(1) + ' KB',
      rawFile: selectedFile,
      recordsCount: parsedTransactions.length,
      transactions: parsedTransactions,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  return (
    <div className="glass-panel upload-card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon-badge">
            <FileSpreadsheet size={22} />
          </div>
          <div className="card-title-group">
            <h2>1. Transaction History</h2>
            <p>Upload bank or credit card statements</p>
          </div>
        </div>

        <div>
          {file ? (
            <span className="card-status-pill attached">
              <CheckCircle2 size={13} /> Linked
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
        accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {!file ? (
        <div
          className={`dropzone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload CSV or Excel file"
        >
          <div className="dropzone-icon">
            <Upload size={24} />
          </div>
          <div className="dropzone-text">Drop your CSV or Excel ledger here</div>
          <div className="dropzone-subtext">or click to browse from device</div>
          <div className="dropzone-tags">
            <span className="dropzone-tag">.CSV</span>
            <span className="dropzone-tag">.XLSX</span>
            <span className="dropzone-tag">.XLS</span>
          </div>
        </div>
      ) : (
        <div className="file-preview-box">
          <div className="file-preview-header">
            <div className="file-meta-left">
              <div className="file-icon-badge">
                <FileCheck size={20} />
              </div>
              <div className="file-title-wrap">
                <div className="file-name" title={file.name}>
                  {file.name}
                </div>
                <div className="file-details">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span style={{ color: '#38bdf8' }}>
                    {file.recordsCount > 0 ? `${file.recordsCount} entries parsed` : 'File staged'}
                  </span>
                  <span>•</span>
                  <span>Uploaded {file.uploadedAt || 'just now'}</span>
                </div>
              </div>
            </div>

            <div className="file-actions">
              <button
                type="button"
                className="btn-icon preview-btn"
                title="Preview extracted data"
                onClick={onOpenPreview}
              >
                <Eye size={16} />
              </button>
              <button
                type="button"
                className="btn-icon"
                title="Remove statement"
                onClick={onRemove}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card-bottom-actions">
        {file ? (
          <button
            type="button"
            className="btn-inline-link"
            onClick={onOpenPreview}
          >
            <Eye size={13} />
            <span>Inspect Extracted Ledger Rows</span>
          </button>
        ) : (
          <span />
        )}

        <span className="card-skip-hint">
          {file ? 'Statement ready for analysis' : 'Either CSV or Bills can be skipped'}
        </span>
      </div>
    </div>
  );
}
