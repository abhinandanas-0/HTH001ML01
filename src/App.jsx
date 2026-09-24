import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeaderHero from './components/HeaderHero';
import TransactionUpload from './components/TransactionUpload';
import BillUpload from './components/BillUpload';
import FinancialProfile from './components/FinancialProfile';
import GenerateReportSection from './components/GenerateReportSection';
import PreviewCsvModal from './components/PreviewCsvModal';
import ReportModal from './components/ReportModal';
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
  };

  // Add uploaded bills from real user files
  const handleAddBills = (newBills) => {
    setBills((prev) => [...prev, ...newBills]);
  };

  // Remove individual bill
  const handleRemoveBill = (id) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  // Clear all bills
  const handleClearBills = () => {
    setBills([]);
  };

  const hasProfile = Boolean(profile.monthlyIncome || profile.irregularIncome || profile.savingsGoal);
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
          hasCsv={Boolean(csvFile)}
          billCount={bills.length}
          hasProfile={hasProfile}
        />

        {/* Two Upload Cards: CSV/Excel & Multiple Bills */}
        <div className="upload-grid">
          <TransactionUpload
            file={csvFile}
            onFileChange={setCsvFile}
            onRemove={() => setCsvFile(null)}
            onOpenPreview={() => setIsPreviewOpen(true)}
          />

          <BillUpload
            bills={bills}
            onAddBills={handleAddBills}
            onRemoveBill={handleRemoveBill}
            onClearBills={handleClearBills}
          />
        </div>

        {/* Manual Baseline Fields (Both Optional) */}
        <FinancialProfile
          profile={profile}
          onChange={setProfile}
          currency={currency}
          onCurrencyChange={setCurrency}
        />

        {/* Prominent "Generate Expenditure Report" Action */}
        <GenerateReportSection
          hasCsv={Boolean(csvFile)}
          billCount={bills.length}
          profile={profile}
          onGenerateReport={() => setIsReportOpen(true)}
        />
      </main>

      {/* CSV Extracted Rows Preview Modal */}
      <PreviewCsvModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileName={csvFile?.name}
        transactions={userTransactions}
        currencySymbol={currentCurrencySymbol}
      />

      {/* Forensic Expenditure Dossier Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        transactions={userTransactions}
        bills={bills}
        profile={profile}
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
