import React, { useState } from 'react';
import { Sparkles, Scan, FileSearch, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GenerateReportSection({
  hasCsv,
  billCount,
  profile,
  onGenerateReport
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const scanStages = [
    'Parsing ledger transaction records & timestamps...',
    'Cross-referencing OCR invoice totals against card outflows...',
    'Isolating recurring ghost subscriptions & rate variances...',
    'Compiling evidence-based forensic dossier...'
  ];

  const handleTriggerAnalysis = () => {
    setIsScanning(true);
    setScanStep(0);

    // Simulated multi-stage forensic detective scan
    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev < scanStages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            // Trigger confetti for report generation completion!
            try {
              confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#a855f7', '#6366f1', '#38bdf8', '#34d399']
              });
            } catch (err) {
              // fallback gracefully if confetti not loaded
            }
            onGenerateReport();
          }, 600);
          return prev;
        }
      });
    }, 700);
  };

  // Human-readable evidence summary
  let evidenceSummary = 'Baseline Estimation';
  if (hasCsv && billCount > 0) {
    evidenceSummary = `1 Ledger File + ${billCount} Document Proofs Attached`;
  } else if (hasCsv) {
    evidenceSummary = '1 Ledger File (Bills Skipped)';
  } else if (billCount > 0) {
    evidenceSummary = `${billCount} Document Invoices (Ledger Skipped)`;
  }

  return (
    <>
      <section className="action-banner">
        <button
          type="button"
          className="btn-generate-report"
          onClick={handleTriggerAnalysis}
          aria-label="Generate Expenditure Report"
        >
          <Sparkles size={22} />
          <span>Generate Expenditure Report</span>
          <ArrowRight size={20} />
        </button>

        <div className="action-status-note">
          <span className="status-badge-live" />
          <span>Staged Inputs: <strong>{evidenceSummary}</strong></span>
          <span>•</span>
          <span style={{ color: 'var(--text-dim)' }}>Instant local forensic audit</span>
        </div>
      </section>

      {/* Interactive Scanning Overlay */}
      {isScanning && (
        <div className="modal-backdrop">
          <div className="modal-card scanner-overlay" style={{ maxWidth: '540px' }}>
            <div className="scanner-radar">
              <Scan size={36} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Financial Detective In Progress
            </h3>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', minHeight: '44px' }}>
              {scanStages[scanStep]}
            </p>

            <div className="scanner-progress-bar">
              <div
                className="scanner-progress-fill"
                style={{ width: `${((scanStep + 1) / scanStages.length) * 100}%` }}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--purple-400)', fontFamily: 'var(--font-mono)' }}>
              Step {scanStep + 1} of {scanStages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
