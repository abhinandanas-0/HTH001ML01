import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Trash2, Eye, CheckCircle2, FileCheck } from 'lucide-react';
import { parseCSV } from '../analytics/index.js';

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

  const processFile = async (selectedFile) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      alert('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    let parsedTransactions = [];
    let parserErrors = [];
    let parserSummary = { totalRows: 0, validRows: 0, invalidRows: 0 };

    if (fileName.endsWith('.csv') || selectedFile.type === 'text/csv' || selectedFile.type === 'text/plain') {
      try {
        const text = await selectedFile.text();
        const parseResult = parseCSV(text);
        parsedTransactions = parseResult.transactions || [];
        parserErrors = parseResult.errors || [];
        parserSummary = parseResult.summary || {
          totalRows: parsedTransactions.length,
          validRows: parsedTransactions.length,
          invalidRows: 0
        };
      } catch (err) {
        console.warn('Failed to parse CSV text:', err);
        parserErrors.push({ row: 0, raw: '', errors: [err.message || 'Failed to read CSV text'] });
      }
    }

    onFileChange({
      name: selectedFile.name,
      size: (selectedFile.size / 1024).toFixed(1) + ' KB',
      rawFile: selectedFile,
      recordsCount: parsedTransactions.length,
      totalRows: parserSummary.totalRows,
      invalidRows: parserSummary.invalidRows,
      transactions: parsedTransactions,
      errors: parserErrors,
      summary: parserSummary,
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
            file.recordsCount > 0 ? (
              <span className="card-status-pill attached">
                <CheckCircle2 size={13} /> Linked
              </span>
            ) : (
              <span
                className="card-status-pill"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                ⚠️ Invalid CSV
              </span>
            )
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
                  <span style={{ color: file.recordsCount > 0 ? '#38bdf8' : 'var(--rose-400)' }}>
                    {file.recordsCount > 0 ? `${file.recordsCount} entries parsed` : '0 valid entries parsed'}
                  </span>
                  {file.invalidRows > 0 && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--amber-400)' }}>
                        {file.invalidRows} invalid row{file.invalidRows > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
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
          {file
            ? (file.recordsCount > 0 ? 'Statement ready for analysis' : 'No valid transactions found in file')
            : 'Either CSV or Bills can be skipped'}
        </span>
      </div>
    </div>
  );
}
