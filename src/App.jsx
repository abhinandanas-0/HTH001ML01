import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeaderHero from './components/HeaderHero';
import TransactionUpload from './components/TransactionUpload';
import BillUpload from './components/BillUpload';
import FinancialProfile from './components/FinancialProfile';
import GenerateReportSection from './components/GenerateReportSection';
import PreviewCsvModal from './components/PreviewCsvModal';
import ReportModal from './components/ReportModal';
import { runAnalytics } from './analytics/index.js';
import { CURRENCIES } from './data/currencies';
import './App.css';

export default function App() {
  const [csvFile, setCsvFile] = useState(null);
  const [bills, setBills] = useState([]);
  const [profile, setProfile] = useState({
    monthlyIncome: '',
    irregularIncome: '',
    savingsGoal: ''
  });
  const [currency, setCurrency] = useState('USD');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);

  const currentCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  // Reset entire form to blank state
  const handleReset = () => {
    setCsvFile(null);
    setBills([]);
    setProfile({
      monthlyIncome: '',
      irregularIncome: '',
      savingsGoal: ''
    });
    setAnalyticsResult(null);
    setAnalyticsError(null);
    setIsReportOpen(false);
  };

  // Add uploaded bills from real user files
  const handleAddBills = (newBills) => {
    setBills((prev) => [...prev, ...newBills]);
    setAnalyticsResult(null);
    setAnalyticsError(null);
  };

  // Update bill item with extraction results
  const handleUpdateBill = (id, updates) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  // Remove individual bill
  const handleRemoveBill = (id) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    setAnalyticsResult(null);
    setAnalyticsError(null);
  };

  // Clear all bills
  const handleClearBills = () => {
    setBills([]);
    setAnalyticsResult(null);
    setAnalyticsError(null);
  };

  // CSV file change & removal handlers
  const handleFileChange = (file) => {
    setCsvFile(file);
    setAnalyticsResult(null);
    setAnalyticsError(null);
  };

  const handleRemoveCsv = () => {
    setCsvFile(null);
    setAnalyticsResult(null);
    setAnalyticsError(null);
  };

  const handleProfileChange = (newProfile) => {
    setProfile(newProfile);
    setAnalyticsResult(null);
    setAnalyticsError(null);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    setAnalyticsResult(null);
    setAnalyticsError(null);
  };

  // Orchestrate analytics execution
  const handleGenerateReport = () => {
    const result = runAnalytics({
      transactions: csvFile?.transactions || [],
      bills,
      profile,
      currency,
      csvErrors: csvFile?.errors || []
    });

    if (result.status === 'no_input') {
      setAnalyticsError(result.error);
      setAnalyticsResult(null);
      return;
    }

    setAnalyticsError(null);
    setAnalyticsResult(result);
    setIsReportOpen(true);
  };

  const hasValidTransactions = Boolean(csvFile && csvFile.recordsCount > 0);
  const hasProfile = Boolean(
    (profile?.monthlyIncome && String(profile.monthlyIncome).trim() !== '') ||
    (profile?.irregularIncome && String(profile.irregularIncome).trim() !== '') ||
    (profile?.savingsGoal && String(profile.savingsGoal).trim() !== '')
  );
  const userTransactions = csvFile?.transactions || [];

  return (
    <div className="app-container">
      {/* Dynamic Ambient Background Canvas */}
      <div className="ambient-canvas">
        <div className="ambient-blob blob-1" />
        <div className="ambient-blob blob-2" />
        <div className="ambient-blob blob-3" />
        <div className="ambient-grid" />
      </div>

      <main className="main-content">
        {/* Navigation Bar */}
        <Navbar onReset={handleReset} />

        {/* Hero & Title: “Your Money, Explained.” */}
        <HeaderHero
          hasCsv={hasValidTransactions}
          billCount={bills.length}
          hasProfile={hasProfile}
        />

        {/* Two Upload Cards: CSV/Excel & Multiple Bills */}
        <div className="upload-grid">
          <TransactionUpload
            file={csvFile}
            onFileChange={handleFileChange}
            onRemove={handleRemoveCsv}
            onOpenPreview={() => setIsPreviewOpen(true)}
          />

          <BillUpload
            bills={bills}
            onAddBills={handleAddBills}
            onUpdateBill={handleUpdateBill}
            onRemoveBill={handleRemoveBill}
            onClearBills={handleClearBills}
          />
        </div>

        {/* Manual Baseline Fields (Both Optional) */}
        <FinancialProfile
          profile={profile}
          onChange={handleProfileChange}
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
        />

        {/* Prominent "Generate Expenditure Report" Action */}
        <GenerateReportSection
          hasCsv={Boolean(csvFile)}
          hasValidTransactions={hasValidTransactions}
          billCount={bills.length}
          profile={profile}
          externalError={analyticsError}
          onGenerateReport={handleGenerateReport}
        />
      </main>

      {/* CSV Extracted Rows Preview Modal */}
      <PreviewCsvModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileName={csvFile?.name}
        transactions={userTransactions}
        errors={csvFile?.errors}
        currencySymbol={currentCurrencySymbol}
      />

      {/* Forensic Expenditure Dossier Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        analyticsResult={analyticsResult}
        currencySymbol={currentCurrencySymbol}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div>
          GA-08 Project • Evidence-Based Financial Detective • Dark Navy & Purple Glassmorphism Dashboard
        </div>
        <div style={{ marginTop: '6px', color: 'rgba(148, 163, 184, 0.5)', fontSize: '0.72rem' }}>
          Zero Cloud Retention • Local Evidence Reconciler • Strict Client-Side Analysis
        </div>
      </footer>
    </div>
  );
}
