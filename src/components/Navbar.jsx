import React from 'react';
import { ShieldCheck, RotateCcw } from 'lucide-react';

export default function Navbar({ onReset }) {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon-wrap" aria-label="Financial Detective Logo">
          <ShieldCheck size={24} />
        </div>
        <div>
          <div className="brand-title">
            Evidence-Based Financial Detective
            <span className="brand-tag">GA-08</span>
          </div>
          <div className="brand-subtitle">
            Forensic Reconciler & Expenditure Intelligence
          </div>
        </div>
      </div>

      <div className="nav-actions">
        <button
          type="button"
          className="nav-btn-secondary"
          onClick={onReset}
          title="Reset all inputs"
        >
          <RotateCcw size={15} />
          <span>Reset Form</span>
        </button>
      </div>
    </header>
  );
}
