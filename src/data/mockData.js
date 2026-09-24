export const SAMPLE_CSV_TRANSACTIONS = [
  { id: 'tx-101', date: '2026-09-18', merchant: 'Apex Cloud Hosting', category: 'Software & Cloud', amount: 89.00, type: 'debit', evidenceStatus: 'verified', note: 'Matches PDF invoice #ACH-9942' },
  { id: 'tx-102', date: '2026-09-17', merchant: 'Whole Foods Market', category: 'Groceries', amount: 142.50, type: 'debit', evidenceStatus: 'missing_bill', note: 'Card transaction without uploaded receipt' },
  { id: 'tx-103', date: '2026-09-16', merchant: 'SubStream Plus Premium', category: 'Entertainment', amount: 19.99, type: 'debit', evidenceStatus: 'flagged_ghost', note: 'Potential zombie recurring fee (inactive 60+ days)' },
  { id: 'tx-104', date: '2026-09-14', merchant: 'Metropolitan Grid Utility', category: 'Utilities', amount: 178.20, type: 'debit', evidenceStatus: 'verified', note: 'Matched against Energy_Bill_Sep2026.pdf' },
  { id: 'tx-105', date: '2026-09-12', merchant: 'Starbucks Coffee Reserve', category: 'Dining & Cafes', amount: 14.85, type: 'debit', evidenceStatus: 'verified', note: 'Receipt image matched timestamp' },
  { id: 'tx-106', date: '2026-09-10', merchant: 'Nordic Workspace Coworking', category: 'Office Rent', amount: 450.00, type: 'debit', evidenceStatus: 'verified', note: 'Recurring invoice verified' },
  { id: 'tx-107', date: '2026-09-08', merchant: 'SaaS Tool SyncPro', category: 'Subscriptions', amount: 49.00, type: 'debit', evidenceStatus: 'flagged_discrepancy', note: 'Bank charged $49.00; Invoice says $39.00 (+$10 unverified variance)' },
  { id: 'tx-108', date: '2026-09-05', merchant: 'Equinox Fitness Club', category: 'Health & Wellness', amount: 280.00, type: 'debit', evidenceStatus: 'verified', note: 'Monthly auto-draft confirmed' }
];

export const SAMPLE_BILLS = [
  {
    id: 'bill-1',
    name: 'Energy_Bill_Sep2026.pdf',
    type: 'pdf',
    size: '428 KB',
    vendor: 'Metropolitan Grid Utility',
    amount: 178.20,
    dueDate: '2026-09-28',
    status: 'Verified Match'
  },
  {
    id: 'bill-2',
    name: 'Apex_Cloud_Invoice_092026.pdf',
    type: 'pdf',
    size: '215 KB',
    vendor: 'Apex Cloud Hosting',
    amount: 89.00,
    dueDate: '2026-09-22',
    status: 'Verified Match'
  },
  {
    id: 'bill-3',
    name: 'SyncPro_SaaS_Invoice.pdf',
    type: 'pdf',
    size: '180 KB',
    vendor: 'SyncPro SaaS',
    amount: 39.00,
    dueDate: '2026-09-10',
    status: 'Discrepancy (+$10)'
  },
  {
    id: 'bill-4',
    name: 'Starbucks_Receipt_12Sep.jpg',
    type: 'image',
    size: '1.2 MB',
    vendor: 'Starbucks Reserve',
    amount: 14.85,
    dueDate: '2026-09-12',
    status: 'Receipt Attached'
  }
];

export const CURRENCIES = [
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' }
];
