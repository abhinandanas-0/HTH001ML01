import React from 'react';
import { Search, CheckCircle2, CircleDashed, FileSpreadsheet, Receipt, HelpCircle } from 'lucide-react';

export default function HeaderHero({ hasCsv, billCount, hasProfile }) {
  // Determine dynamic forensic confidence level
  let confidenceScore = 15;
  let statusText = 'Baseline Estimate Mode';

  if (hasCsv && billCount > 0) {
    confidenceScore = 98;
    statusText = 'Dual Evidence Audit (Maximum Accuracy)';
  } else if (hasCsv) {
    confidenceScore = 75;
    statusText = 'Bank Ledger Reconciled (No receipt cross-check)';
  } else if (billCount > 0) {
    confidenceScore = 65;
    statusText = 'Physical Invoices Linked (No bank ledger)';
  } else if (hasProfile) {
    confidenceScore = 35;
    statusText = 'Target & Income Baseline Mode';
  }

  return (
    <section className="hero-section">
      <div className="hero-badge-pill">
        <Search size={14} />
        <span>Evidence-Based Financial Detective</span>
      </div>

      <h1 className="hero-title">Your Money, Explained.</h1>

      <p className="hero-subtitle">
        Bridge the gap between what you think you spent and what your records actually prove.
        Cross-reference bank statements against bills to expose phantom subscriptions, billing discrepancies, and true savings feasibility.
      </p>

      {/* Dynamic Evidence Confidence Tracker */}
      <div className="evidence-tracker">
        <div className={`evidence-step ${hasCsv ? 'active' : ''}`}>
          {hasCsv ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
          <span>1. Bank Ledger {hasCsv ? '(Linked)' : '(Optional)'}</span>
        </div>

        <div className="evidence-divider" />

        <div className={`evidence-step ${billCount > 0 ? 'active' : ''}`}>
          {billCount > 0 ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
          <span>2. Bills & Receipts {billCount > 0 ? `(${billCount} Files)` : '(Optional)'}</span>
        </div>

        <div className="evidence-divider" />

        <div className={`evidence-step ${hasProfile ? 'active' : ''}`}>
          {hasProfile ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
          <span>3. Income & Savings Targets</span>
        </div>

        <div className="evidence-divider" />

        <div className="evidence-confidence">
          Evidence Level: <span style={{ color: confidenceScore > 70 ? '#34d399' : '#c084fc' }}>{confidenceScore}%</span>
        </div>
      </div>
    </section>
  );
}
