/**
 * @file testBillExtraction.js
 * @description Test suite for Bill PDF/OCR extraction and integration pipeline.
 * Covers all 8 required validation scenarios from Step 14.
 */

import { extractBillDocument } from './billExtraction.js';
import { runAnalytics } from './runAnalytics.js';
import { prepareFinancialAdvice } from '../genai/financialAdvisor.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`[PASS] ${message}`);
  passedTests++;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('RUNNING BILL EXTRACTION & INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // ----------------------------------------------------------------
  // TEST 1: Text-based bill containing standard fields
  // ----------------------------------------------------------------
  console.log('--- TEST 1: Standard Fictional Electricity Bill Extraction ---');
  const billText1 = `
Provider: ABC Electricity
Bill Date: September 1, 2026
Due Date: September 15, 2026
Amount Due: ₹1,250
Category: Utilities
Status: Unpaid
  `.trim();

  const extraction1 = await extractBillDocument({ text: billText1, name: 'electricity_bill.pdf' });
  assert(extraction1.success === true, 'TEST 1: Extraction succeeded');
  assert(extraction1.fields.provider === 'ABC Electricity', `TEST 1: Provider is ABC Electricity (got ${extraction1.fields.provider})`);
  assert(extraction1.fields.billDate === '2026-09-01', `TEST 1: Bill Date is 2026-09-01 (got ${extraction1.fields.billDate})`);
  assert(extraction1.fields.dueDate === '2026-09-15', `TEST 1: Due Date is 2026-09-15 (got ${extraction1.fields.dueDate})`);
  assert(extraction1.fields.amountDue === 1250, `TEST 1: Amount Due is 1250 (got ${extraction1.fields.amountDue})`);
  assert(extraction1.fields.currency === 'INR', `TEST 1: Currency is INR (got ${extraction1.fields.currency})`);
  assert(extraction1.fields.category === 'Utilities', `TEST 1: Category is Utilities (got ${extraction1.fields.category})`);
  assert(extraction1.fields.status === 'Unpaid', `TEST 1: Status is Unpaid (got ${extraction1.fields.status})`);
  console.log();

  // ----------------------------------------------------------------
  // TEST 2: PDF with missing amount
  // ----------------------------------------------------------------
  console.log('--- TEST 2: Bill with Missing Amount ---');
  const billText2 = `
Provider: XYZ Internet Services
Bill Date: September 5, 2026
Due Date: September 20, 2026
Category: Internet
Status: Pending
  `.trim();

  const extraction2 = await extractBillDocument({ text: billText2, name: 'internet_notice.pdf' });
  assert(extraction2.success === true, 'TEST 2: Extraction succeeded for available fields');
  assert(extraction2.fields.amountDue === null, 'TEST 2: Amount Due is strictly null (not fabricated)');
  assert(extraction2.confidence.amountDue === 'not_found', 'TEST 2: Amount Due confidence is "not_found"');
  console.log();

  // ----------------------------------------------------------------
  // TEST 3: PDF containing an ambiguous amount (OCR error)
  // ----------------------------------------------------------------
  console.log('--- TEST 3: Bill with Ambiguous Amount (e.g. ₹1,2S0) ---');
  const billText3 = `
Provider: Metro Water Supply
Bill Date: September 2, 2026
Amount Due: ₹1,2S0
Category: Utilities
  `.trim();

  const extraction3 = await extractBillDocument({ text: billText3, name: 'water_scanned.pdf' });
  assert(extraction3.fields.amountDue === null, 'TEST 3: Ambiguous amount is not guessed as 1250 (strictly null)');
  assert(extraction3.confidence.amountDue === 'uncertain', 'TEST 3: Amount Due confidence marked as "uncertain"');
  assert(extraction3.warnings.some(w => w.includes('ambiguous')), 'TEST 3: Ambiguity warning recorded');
  console.log();

  // ----------------------------------------------------------------
  // TEST 4: Bills-only report (runAnalytics)
  // ----------------------------------------------------------------
  console.log('--- TEST 4: Bills-Only Analytics Report ---');
  const stagedBills4 = [
    {
      id: 'bill-1',
      name: 'electricity_bill.pdf',
      size: '42.5 KB',
      type: 'pdf',
      status: 'Bill details extracted',
      hasExtractedData: true,
      extraction: extraction1
    }
  ];

  const report4 = runAnalytics({
    transactions: [],
    bills: stagedBills4,
    currency: 'INR'
  });

  assert(report4.status === 'success', 'TEST 4: Analytics completed successfully');
  assert(report4.summary.totalIncome === 0, 'TEST 4: Bills-only totalIncome is 0');
  assert(report4.summary.totalExpenses === 0, 'TEST 4: Bills-only totalExpenses is strictly 0 (not fabricated as spending)');
  assert(report4.summary.netCashFlow === 0, 'TEST 4: Bills-only netCashFlow is 0');
  assert(report4.billEvidence.count === 1, 'TEST 4: Bill evidence count is 1');
  assert(report4.billEvidence.items[0].extraction.fields.amountDue === 1250, 'TEST 4: Extracted bill amount 1250 present in evidence');
  console.log();

  // ----------------------------------------------------------------
  // TEST 5: CSV + PDF (Prevent Double-Counting)
  // ----------------------------------------------------------------
  console.log('--- TEST 5: CSV + PDF (Authoritative CSV, No Double-Counting) ---');
  const sampleTransactions = [
    { id: 'tx-1', date: '2026-09-02', merchant: 'Employer Direct Deposit', category: 'Income', amount: 50000, type: 'income' },
    { id: 'tx-2', date: '2026-09-10', merchant: 'ABC Electricity Outflow', category: 'Utilities', amount: 1250, type: 'expense' },
    { id: 'tx-3', date: '2026-09-12', merchant: 'Grocery Market', category: 'Groceries', amount: 3500, type: 'expense' }
  ];

  const report5 = runAnalytics({
    transactions: sampleTransactions,
    bills: stagedBills4,
    currency: 'INR'
  });

  // Total expenses should strictly be 1250 + 3500 = 4750 from CSV, NOT 4750 + 1250 (bill) = 6000
  assert(report5.summary.totalIncome === 50000, 'TEST 5: Total income matches CSV (50000)');
  assert(report5.summary.totalExpenses === 4750, `TEST 5: Total expenses strictly 4750 from CSV, not double-counted (got ${report5.summary.totalExpenses})`);
  assert(report5.summary.netCashFlow === 45250, 'TEST 5: Net cash flow strictly matches CSV (45250)');
  assert(report5.billEvidence.count === 1, 'TEST 5: PDF bill evidence attached');
  console.log();

  // ----------------------------------------------------------------
  // TEST 6: CSV + Profile + PDF
  // ----------------------------------------------------------------
  console.log('--- TEST 6: CSV + Profile + PDF Full Integration ---');
  const report6 = runAnalytics({
    transactions: sampleTransactions,
    bills: stagedBills4,
    profile: { monthlyIncome: '50000', savingsGoal: '200000' },
    currency: 'INR'
  });

  assert(report6.evidenceMode === 'full_cross_source', `TEST 6: Evidence mode is full_cross_source (got ${report6.evidenceMode})`);
  assert(report6.summary.totalExpenses === 4750, 'TEST 6: CSV expenses remain authoritative');
  assert(report6.billEvidence.count === 1, 'TEST 6: Bill evidence available');
  assert(report6.profileBaseline !== null, 'TEST 6: Profile baseline preserved');

  // Verify GenAI consumes bill evidence
  const advice6 = prepareFinancialAdvice(report6, sampleTransactions);
  assert(advice6.evidence.some(e => e.findingType === 'bill_evidence'), 'TEST 6: GenAI received bill_evidence');
  assert(advice6.recommendations.some(r => r.recommendation.includes('ABC Electricity')), 'TEST 6: GenAI generated grounded bill recommendation');
  console.log();

  // ----------------------------------------------------------------
  // TEST 7: OCR / PDF Extraction Failure Resilience
  // ----------------------------------------------------------------
  console.log('--- TEST 7: Extraction Failure Resilience ---');
  const failedBill = {
    id: 'bill-fail',
    name: 'corrupt.pdf',
    size: '0 KB',
    type: 'pdf',
    status: 'Could not extract bill details',
    hasExtractedData: false,
    extraction: {
      success: false,
      extractionMethod: 'none',
      extractedText: '',
      fields: { provider: null, billDate: null, dueDate: null, amountDue: null, currency: null, category: null, status: null },
      confidence: { provider: 'not_found', billDate: 'not_found', dueDate: 'not_found', amountDue: 'not_found', currency: 'not_found', category: 'not_found', status: 'not_found' },
      warnings: ['Corrupt PDF header']
    }
  };

  const report7 = runAnalytics({
    transactions: sampleTransactions,
    bills: [failedBill],
    currency: 'INR'
  });

  assert(report7.status === 'success', 'TEST 7: Report succeeds even when bill extraction failed');
  assert(report7.summary.totalExpenses === 4750, 'TEST 7: CSV analytics continue working unaffected');
  const advice7 = prepareFinancialAdvice(report7, sampleTransactions);
  assert(Array.isArray(advice7.recommendations), 'TEST 7: GenAI advice executes without crashing');
  console.log();

  // ----------------------------------------------------------------
  // TEST 8: Multiple PDFs (One Succeeds, One Fails)
  // ----------------------------------------------------------------
  console.log('--- TEST 8: Multiple PDFs (Partial Extraction Success) ---');
  const stagedBills8 = [stagedBills4[0], failedBill];

  const report8 = runAnalytics({
    transactions: sampleTransactions,
    bills: stagedBills8,
    currency: 'INR'
  });

  assert(report8.billEvidence.count === 2, 'TEST 8: Both bills staged');
  assert(report8.billEvidence.items[0].extraction.success === true, 'TEST 8: First bill extraction succeeded');
  assert(report8.billEvidence.items[1].extraction.success === false, 'TEST 8: Second bill extraction marked failed');
  const advice8 = prepareFinancialAdvice(report8, sampleTransactions);
  assert(advice8.evidence.some(e => e.findingType === 'bill_evidence' && e.finding.provider === 'ABC Electricity'), 'TEST 8: Succeeded bill evidence included in GenAI advice');
  console.log();

  console.log('================================================================');
  console.log(`ALL ${passedTests}/${totalTests} BILL EXTRACTION & INTEGRATION TESTS PASSED!`);
  console.log('================================================================');
}

runTestSuite().catch(err => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
