import React, { useState } from 'react';
import { Sparkles, Scan, ArrowRight, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GenerateReportSection({
  hasCsv,
  hasValidTransactions,
  billCount = 0,
  profile = {},
  externalError = null,
  onGenerateReport
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [validationError, setValidationError] = useState(null);

  const scanStages = [
    'Parsing ledger transaction records & timestamps...',
    'Cross-referencing OCR invoice totals against card outflows...',
    'Isolating recurring ghost subscriptions & rate variances...',
    'Compiling evidence-based forensic dossier...'
  ];

  const isProfileFilled = Boolean(
    (profile?.monthlyIncome && String(profile.monthlyIncome).trim() !== '') ||
    (profile?.irregularIncome && String(profile.irregularIncome).trim() !== '') ||
    (profile?.savingsGoal && String(profile.savingsGoal).trim() !== '')
  );

  const hasValidLedger = hasValidTransactions !== undefined
    ? Boolean(hasValidTransactions)
    : Boolean(hasCsv);
  const hasBills = billCount > 0;

  const hasAnyInput = Boolean(hasValidLedger || hasBills || isProfileFilled);

  // Derived error: clears automatically when an input is added, avoiding setState inside effects
  const displayError = hasAnyInput ? null : (validationError || externalError);

  const handleTriggerAnalysis = () => {
    if (!hasAnyInput) {
      setValidationError('Please provide at least one financial input before generating your analysis.');
      return;
    }

    setValidationError(null);
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
            try {
              confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#a855f7', '#6366f1', '#38bdf8', '#34d399']
              });
            } catch {
              // fallback gracefully if confetti not available
            }
            onGenerateReport();
          }, 600);
          return prev;
        }
      });
    }, 700);
  };

  // Human-readable evidence summary
  let evidenceSummary = 'No Inputs Staged';
  if (hasValidLedger && hasBills && isProfileFilled) {
    evidenceSummary = `1 Ledger File + ${billCount} Docs + Profile Attached`;
  } else if (hasValidLedger && hasBills) {
    evidenceSummary = `1 Ledger File + ${billCount} Document Proofs Attached`;
  } else if (hasValidLedger && isProfileFilled) {
    evidenceSummary = '1 Ledger File + Baseline Profile Attached';
  } else if (hasValidLedger) {
    evidenceSummary = '1 Ledger File (Bills Skipped)';
  } else if (hasBills && isProfileFilled) {
    evidenceSummary = `${billCount} Document Proofs + Profile Attached`;
  } else if (hasBills) {
    evidenceSummary = `${billCount} Document Invoices (Ledger Skipped)`;
  } else if (isProfileFilled) {
    evidenceSummary = 'Income & Savings Baseline Profile Only';
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

        {displayError && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={16} />
            <span>{displayError}</span>
          </div>
        )}

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
