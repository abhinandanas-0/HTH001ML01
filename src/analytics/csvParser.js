/**
 * @file csvParser.js
 * @description Robust, reusable CSV parser for converting banking and financial CSVs
 * into normalized Transaction objects conforming to the GA-08 Transaction Schema.
 */

import {
  createTransaction,
  normalizeDate,
  TRANSACTION_TYPES,
  TRANSACTION_SOURCES
} from './transactionSchema.js';

/**
 * Splits raw CSV text into an array of tokenized rows, handling:
 * - RFC 4180 quoted fields with embedded commas and newlines
 * - Escaped double quotes ("")
 * - Mixed line endings (\r\n, \r, \n)
 * - Auto-detection of delimiters (comma, semicolon, tab)
 * - UTF-8 Byte Order Mark (BOM) stripping
 *
 * @param {string} csvText
 * @param {string} [customDelimiter]
 * @returns {string[][]}
 */
export function tokenizeCSV(csvText, customDelimiter) {
  if (typeof csvText !== 'string' || !csvText.trim()) {
    return [];
  }

  let text = csvText;
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  // Detect delimiter if not explicitly provided
  let delimiter = customDelimiter;
  if (!delimiter) {
    let commaCount = 0;
    let semiCount = 0;
    let tabCount = 0;
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQ = !inQ;
      } else if (!inQ) {
        if (c === '\r' || c === '\n') break;
        if (c === ',') commaCount++;
        else if (c === ';') semiCount++;
        else if (c === '\t') tabCount++;
      }
    }
    if (semiCount > commaCount && semiCount > 0) {
      delimiter = ';';
    } else if (tabCount > commaCount && tabCount > 0) {
      delimiter = '\t';
    } else {
      delimiter = ',';
    }
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ""
        if (i + 1 < len && text[i + 1] === '"') {
          currentField += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Lookahead for \n
        if (i + 1 < len && text[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(col => col.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(col => col.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Final field & row flush
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Column header alias mappings for flexible identification
 */
const ALIASES = {
  DATE: [
    'transaction date', 'txn date', 'trans date', 'value date',
    'posting date', 'posted date', 'date of transaction', 'booking date',
    'trade date', 'effective date', 'date'
  ],
  MERCHANT: [
    'transaction description', 'txn description', 'merchant name',
    'payee name', 'vendor name', 'beneficiary name', 'narration',
    'merchant', 'description', 'payee', 'entity', 'vendor', 'party',
    'particulars', 'details', 'beneficiary', 'recipient', 'memo', 'remarks', 'name'
  ],
  CATEGORY: [
    'expense category', 'sub-category', 'subcategory', 'category',
    'tag', 'classification', 'group'
  ],
  TYPE: [
    'transaction type', 'txn type', 'type of transaction', 'entry type',
    'cr/dr', 'dr/cr', 'd/c', 'c/d', 'type'
  ],
  ID: [
    'transaction id', 'txn id', 'reference number', 'reference no',
    'ref no', 'ref #', 'trace number', 'check number', 'cheque no',
    'doc no', 'reference', 'id'
  ],
  BALANCE: [
    'available balance', 'running balance', 'closing balance',
    'ledger balance', 'net balance', 'balance'
  ],
  DEBIT: [
    'debit amount', 'withdrawal amount', 'paid out', 'money out',
    'withdrawals', 'withdrawal', 'debit', 'debits', 'dr',
    'outgoing', 'outflow', 'expense', 'expenses', 'spend'
  ],
  CREDIT: [
    'credit amount', 'deposit amount', 'paid in', 'money in',
    'deposits', 'deposit', 'credit', 'credits', 'cr',
    'incoming', 'inflow', 'income'
  ],
  AMOUNT: [
    'transaction amount', 'txn amount', 'net amount', 'total amount',
    'amount', 'sum', 'value', 'net'
  ]
};

/**
 * Normalizes header strings for safe comparison
 * @param {string} str
 * @returns {string}
 */
function normalizeHeaderString(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches a list of header string tokens to recognized column indexes.
 * Uses strict priority matching and mutual exclusivity to prevent column collisions.
 *
 * @param {string[]} headers
 * @returns {object} Column indexes mapping
 */
export function resolveColumnIndices(headers) {
  if (!Array.isArray(headers) || headers.length === 0) {
    return {
      dateIdx: -1,
      merchantIdx: -1,
      amountIdx: -1,
      debitIdx: -1,
      creditIdx: -1,
      categoryIdx: -1,
      typeIdx: -1,
      idIdx: -1,
      balanceIdx: -1,
      hasSeparateDebitCredit: false,
      isDebitOnly: false,
      isCreditOnly: false
    };
  }

  const normalizedHeaders = headers.map(normalizeHeaderString);
  const assigned = {};
  const usedCols = new Set();

  const roles = ['DATE', 'MERCHANT', 'TYPE', 'CATEGORY', 'ID', 'BALANCE', 'DEBIT', 'CREDIT', 'AMOUNT'];

  // Pass 1: Exact matches (prevents short words like "cr" from matching inside "description")
  for (const role of roles) {
    const aliasList = ALIASES[role].map(normalizeHeaderString);
    for (let c = 0; c < normalizedHeaders.length; c++) {
      if (usedCols.has(c)) continue;
      const h = normalizedHeaders[c];
      if (aliasList.includes(h)) {
        assigned[role] = c;
        usedCols.add(c);
        break;
      }
    }
  }

  // Pass 2: Whole-word / phrase matches (longer aliases first to prioritize compound phrases)
  for (const role of roles) {
    if (assigned[role] !== undefined) continue;
    const aliasList = [...ALIASES[role]].sort((a, b) => b.length - a.length);

    for (let c = 0; c < normalizedHeaders.length; c++) {
      if (usedCols.has(c)) continue;
      const h = normalizedHeaders[c];

      const matched = aliasList.some(rawAlias => {
        const a = normalizeHeaderString(rawAlias);
        if (!a) return false;
        const escaped = a.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp('(^|\\s|/)' + escaped + '($|\\s|/)', 'i');
        return regex.test(h);
      });

      if (matched) {
        assigned[role] = c;
        usedCols.add(c);
        break;
      }
    }
  }

  const dateIdx = assigned.DATE !== undefined ? assigned.DATE : -1;
  const merchantIdx = assigned.MERCHANT !== undefined ? assigned.MERCHANT : -1;
  let amountIdx = assigned.AMOUNT !== undefined ? assigned.AMOUNT : -1;
  const debitIdx = assigned.DEBIT !== undefined ? assigned.DEBIT : -1;
  const creditIdx = assigned.CREDIT !== undefined ? assigned.CREDIT : -1;
  const categoryIdx = assigned.CATEGORY !== undefined ? assigned.CATEGORY : -1;
  const typeIdx = assigned.TYPE !== undefined ? assigned.TYPE : -1;
  const idIdx = assigned.ID !== undefined ? assigned.ID : -1;
  const balanceIdx = assigned.BALANCE !== undefined ? assigned.BALANCE : -1;

  const hasSeparateDebitCredit = debitIdx !== -1 && creditIdx !== -1 && debitIdx !== creditIdx;
  const isDebitOnly = !hasSeparateDebitCredit && debitIdx !== -1 && creditIdx === -1 && amountIdx === -1;
  const isCreditOnly = !hasSeparateDebitCredit && creditIdx !== -1 && debitIdx === -1 && amountIdx === -1;

  // If a single debit or credit column was found without a separate amount column, route amountIdx to it
  if (isDebitOnly) {
    amountIdx = debitIdx;
  } else if (isCreditOnly) {
    amountIdx = creditIdx;
  }

  return {
    dateIdx,
    merchantIdx,
    amountIdx,
    debitIdx,
    creditIdx,
    categoryIdx,
    typeIdx,
    idIdx,
    balanceIdx,
    hasSeparateDebitCredit,
    isDebitOnly,
    isCreditOnly
  };
}

/**
 * Infers column indices from raw data rows when no valid header row is present.
 *
 * @param {string[][]} sampleRows
 * @returns {object} Column indexes mapping
 */
function inferColumnsFromData(sampleRows) {
  if (!Array.isArray(sampleRows) || sampleRows.length === 0) {
    return {
      dateIdx: 0,
      merchantIdx: 1,
      amountIdx: 2,
      debitIdx: -1,
      creditIdx: -1,
      categoryIdx: -1,
      typeIdx: -1,
      idIdx: -1,
      balanceIdx: -1,
      hasSeparateDebitCredit: false,
      isDebitOnly: false,
      isCreditOnly: false
    };
  }

  const numCols = Math.max(...sampleRows.map(r => r.length));
  let dateIdx = -1;
  let amountIdx = -1;
  let typeIdx = -1;
  const stringCols = [];

  const firstRow = sampleRows[0];
  for (let c = 0; c < firstRow.length; c++) {
    const val = firstRow[c] || '';
    if (dateIdx === -1 && normalizeDate(val) !== null) {
      dateIdx = c;
    } else if (typeIdx === -1 && /^(income|expense|debit|credit|cr|dr|inflow|outflow|deposit|withdrawal)$/i.test(val.trim())) {
      typeIdx = c;
    } else if (amountIdx === -1 && parseCurrencyNumber(val) !== null && !isNaN(parseCurrencyNumber(val).value)) {
      amountIdx = c;
    } else {
      stringCols.push(c);
    }
  }

  if (dateIdx === -1) dateIdx = 0;
  if (amountIdx === -1) amountIdx = Math.min(2, numCols - 1);

  let merchantIdx = -1;
  let categoryIdx = -1;
  if (stringCols.length > 0) {
    merchantIdx = stringCols[0];
    if (stringCols.length > 1) {
      categoryIdx = stringCols[1];
    }
  } else {
    merchantIdx = Math.min(1, numCols - 1);
  }

  return {
    dateIdx,
    merchantIdx,
    amountIdx,
    debitIdx: -1,
    creditIdx: -1,
    categoryIdx,
    typeIdx,
    idIdx: -1,
    balanceIdx: -1,
    hasSeparateDebitCredit: false,
    isDebitOnly: false,
    isCreditOnly: false
  };
}

/**
 * Cleans monetary string into a signed or unsigned number.
 * Handles currency symbols ($ € £ ₹ C$), comma thousands separators, European decimals,
 * explicit signs, accounting parentheses, and trailing DR / CR notations.
 *
 * @param {string} str
 * @returns {{
 *   value: number,
 *   absAmount: number,
 *   isExplicitNegative: boolean,
 *   isExplicitPositive: boolean,
 *   indicator: 'CR' | 'DR' | null
 * } | null}
 */
export function parseCurrencyNumber(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed || trimmed === '-' || trimmed === '--' || /^n\/?a$/i.test(trimmed) || /^none$/i.test(trimmed) || /^null$/i.test(trimmed)) {
    return null;
  }

  let isNegative = false;
  let isExplicitPositive = false;
  let indicator = null;

  // CR / DR detection
  if (/\bdr\b/i.test(trimmed)) {
    indicator = 'DR';
    isNegative = true;
  } else if (/\bcr\b/i.test(trimmed)) {
    indicator = 'CR';
    isExplicitPositive = true;
  }

  // Accounting parentheses format: (123.45)
  if (/^\(.*\)$/.test(trimmed)) {
    isNegative = true;
  } else if (trimmed.includes('-')) {
    isNegative = true;
  } else if (trimmed.startsWith('+') || /\+\s*[$€£₹C]?\s*\d/.test(trimmed)) {
    isExplicitPositive = true;
  }

  // Remove currency symbols and surrounding characters, preserving digits, commas, periods
  let clean = trimmed.replace(/[^0-9.,]/g, '');
  if (!clean) return null;

  // Handle European decimal formats: 1.234,56 or 1234,56
  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      // European: 1.234,56 -> 1234.56
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // Standard: 1,234.56 -> 1234.56
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',') && !clean.includes('.')) {
    // If comma has 1 or 2 digits after it at the end, it's decimal: 45,00 or 1234,56
    if (/,\d{1,2}$/.test(clean)) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return null;

  return {
    value: isNegative ? -num : num,
    absAmount: Math.abs(num),
    isExplicitNegative: isNegative,
    isExplicitPositive: isExplicitPositive,
    indicator
  };
}

/**
 * Parses CSV text and converts rows into standardized Transaction records.
 *
 * @param {string} csvText
 * @param {object} [options]
 * @param {string} [options.defaultCategory='Uncategorized']
 * @param {string} [options.idPrefix='CSV']
 * @param {"income" | "expense" | null} [options.defaultType=null]
 * @returns {{
 *   transactions: object[],
 *   errors: { row: number, raw: string, errors: string[] }[],
 *   summary: { totalRows: number, validRows: number, invalidRows: number }
 * }}
 */
export function parseCSV(csvText, options = {}) {
  const {
    defaultCategory = 'Uncategorized',
    idPrefix = 'CSV',
    defaultType = null
  } = options;

  const tokenized = tokenizeCSV(csvText);

  if (tokenized.length === 0) {
    return {
      transactions: [],
      errors: [{ row: 0, raw: '', errors: ['CSV content is empty or contains no valid rows.'] }],
      summary: { totalRows: 0, validRows: 0, invalidRows: 0 }
    };
  }

  // Look for header row within the first few rows (handles metadata / comment rows at top of file)
  let headerRowIndex = -1;
  let colMap = null;
  const maxHeaderSearch = Math.min(tokenized.length, 10);

  for (let r = 0; r < maxHeaderSearch; r++) {
    const candidateMap = resolveColumnIndices(tokenized[r]);
    const isHeader = candidateMap.dateIdx !== -1 && (
      candidateMap.amountIdx !== -1 ||
      candidateMap.hasSeparateDebitCredit ||
      candidateMap.debitIdx !== -1 ||
      candidateMap.creditIdx !== -1
    );
    if (isHeader) {
      headerRowIndex = r;
      colMap = candidateMap;
      break;
    }
  }

  const hasRecognizedHeader = headerRowIndex !== -1;
  const dataRows = hasRecognizedHeader ? tokenized.slice(headerRowIndex + 1) : tokenized;
  const startRowOffset = hasRecognizedHeader ? headerRowIndex + 2 : 1; // 1-based line number for user-facing errors

  // Fallbacks if no recognized headers
  const indices = hasRecognizedHeader ? colMap : inferColumnsFromData(tokenized);

  // Detect whether the single Amount column contains signed values (i.e. negative amounts, explicit plus signs, or CR/DR)
  let isSignedAmountColumn = false;
  if (!indices.hasSeparateDebitCredit && indices.amountIdx !== -1) {
    for (const r of dataRows) {
      if (indices.amountIdx < r.length) {
        const parsed = parseCurrencyNumber(r[indices.amountIdx]);
        if (parsed && (parsed.isExplicitNegative || parsed.value < 0 || parsed.isExplicitPositive || parsed.indicator)) {
          isSignedAmountColumn = true;
          break;
        }
      }
    }
  }

  const transactions = [];
  const errors = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + startRowOffset;
    const rawLine = row.join(',');

    // Skip blank or completely empty rows
    if (row.length === 0 || row.every(val => !val || !val.trim())) {
      continue;
    }

    const rowErrors = [];

    // 1. Date resolution
    const rawDate = indices.dateIdx !== -1 && row[indices.dateIdx] ? row[indices.dateIdx].trim() : null;
    const normalizedDate = normalizeDate(rawDate);
    if (!normalizedDate) {
      rowErrors.push(`Missing or unparseable date in column ${indices.dateIdx + 1}: "${rawDate || ''}".`);
    }

    // 2. Merchant / Description resolution
    const merchant = indices.merchantIdx !== -1 && row[indices.merchantIdx]
      ? row[indices.merchantIdx].trim()
      : null;
    if (!merchant) {
      rowErrors.push(`Missing merchant or transaction description in column ${indices.merchantIdx + 1}.`);
    }

    // 3. Category resolution
    const category = indices.categoryIdx !== -1 && row[indices.categoryIdx] && row[indices.categoryIdx].trim()
      ? row[indices.categoryIdx].trim()
      : defaultCategory;

    // 4. Amount and Type resolution
    let finalAmount = null;
    let finalType = null;

    if (indices.hasSeparateDebitCredit) {
      // Style B: Bank-style separate debit & credit columns
      const rawDebit = indices.debitIdx !== -1 ? row[indices.debitIdx] : null;
      const rawCredit = indices.creditIdx !== -1 ? row[indices.creditIdx] : null;

      const parsedDebit = parseCurrencyNumber(rawDebit);
      const parsedCredit = parseCurrencyNumber(rawCredit);

      const hasDebit = parsedDebit !== null && Math.abs(parsedDebit.value) > 0;
      const hasCredit = parsedCredit !== null && Math.abs(parsedCredit.value) > 0;

      if (hasCredit && !hasDebit) {
        finalAmount = Math.abs(parsedCredit.value);
        finalType = TRANSACTION_TYPES.INCOME;
      } else if (hasDebit && !hasCredit) {
        finalAmount = Math.abs(parsedDebit.value);
        finalType = TRANSACTION_TYPES.EXPENSE;
      } else if (hasCredit && hasDebit) {
        // Both populated: invalid/ambiguous row
        rowErrors.push(`Both Debit (${rawDebit}) and Credit (${rawCredit}) contain non-zero values on the same row.`);
      } else {
        // Neither populated: invalid row
        rowErrors.push('Neither Debit nor Credit column contained a valid non-zero amount.');
      }
    } else if (indices.amountIdx !== -1) {
      const rawAmountStr = row[indices.amountIdx];
      const parsedAmount = parseCurrencyNumber(rawAmountStr);

      if (parsedAmount === null || isNaN(parsedAmount.value) || parsedAmount.value === 0) {
        rowErrors.push(`Missing or invalid amount in column ${indices.amountIdx + 1}: "${rawAmountStr || ''}".`);
      } else {
        finalAmount = Math.abs(parsedAmount.value);

        // Check if row has explicit Type information in dedicated column
        const rawTypeStr = indices.typeIdx !== -1 && row[indices.typeIdx]
          ? row[indices.typeIdx].toLowerCase().trim()
          : '';

        if (rawTypeStr) {
          // Explicit Type column
          if (['income', 'credit', 'cr', 'c', 'deposit', 'inflow', 'refund', 'rebate', 'salary', 'payroll'].includes(rawTypeStr)) {
            finalType = TRANSACTION_TYPES.INCOME;
          } else if (['expense', 'debit', 'dr', 'd', 'withdrawal', 'outflow', 'charge', 'purchase', 'payment', 'fee'].includes(rawTypeStr)) {
            finalType = TRANSACTION_TYPES.EXPENSE;
          } else {
            rowErrors.push(`Unrecognized transaction type in column ${indices.typeIdx + 1}: "${rawTypeStr}". Expected income or expense.`);
          }
        } else if (indices.isDebitOnly) {
          // Column is specifically a Debit/Expense column
          finalType = TRANSACTION_TYPES.EXPENSE;
        } else if (indices.isCreditOnly) {
          // Column is specifically a Credit/Income column
          finalType = TRANSACTION_TYPES.INCOME;
        } else if (parsedAmount.indicator === 'CR') {
          // Amount string has explicit CR indicator (e.g. 500.00 CR)
          finalType = TRANSACTION_TYPES.INCOME;
        } else if (parsedAmount.indicator === 'DR') {
          // Amount string has explicit DR indicator (e.g. 50.00 DR)
          finalType = TRANSACTION_TYPES.EXPENSE;
        } else if (parsedAmount.isExplicitNegative || parsedAmount.value < 0) {
          // Signed Amount column: negative amount = expense
          finalType = TRANSACTION_TYPES.EXPENSE;
        } else if (parsedAmount.isExplicitPositive) {
          // Signed Amount column: explicit positive = income
          finalType = TRANSACTION_TYPES.INCOME;
        } else if (isSignedAmountColumn) {
          // Signed Amount column: positive amount = income
          finalType = TRANSACTION_TYPES.INCOME;
        } else if (defaultType === TRANSACTION_TYPES.EXPENSE || defaultType === TRANSACTION_TYPES.INCOME) {
          // Fallback to options.defaultType if provided
          finalType = defaultType;
        } else {
          // A positive Amount column with NO Type information and no defaultType:
          // DO NOT automatically assume expense.
          // Add a row validation error saying that transaction type is required/ambiguous.
          rowErrors.push(`Transaction type is required or ambiguous: positive amount "${rawAmountStr}" provided without type information.`);
        }
      }
    } else {
      rowErrors.push('No Amount or Debit/Credit columns could be mapped from the CSV header.');
    }

    // 5. Transaction ID resolution (keep deterministic ID generation when no ID supplied)
    let txId = indices.idIdx !== -1 && row[indices.idIdx] && row[indices.idIdx].trim()
      ? row[indices.idIdx].trim()
      : null;

    if (!txId) {
      txId = `${idPrefix}-${String(rowNum).padStart(4, '0')}-${(merchant || 'TX').slice(0, 3).toUpperCase()}`;
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNum,
        raw: rawLine,
        errors: rowErrors
      });
      continue;
    }

    // Transaction creation calling createTransaction() with required arguments
    const creationResult = createTransaction({
      id: txId,
      date: normalizedDate,
      merchant,
      category,
      amount: finalAmount,
      type: finalType,
      source: TRANSACTION_SOURCES.CSV
    });

    if (!creationResult.valid) {
      errors.push({
        row: rowNum,
        raw: rawLine,
        errors: creationResult.errors
      });
    } else {
      transactions.push(creationResult.transaction);
    }
  }

  return {
    transactions,
    errors,
    summary: {
      totalRows: dataRows.length,
      validRows: transactions.length,
      invalidRows: errors.length
    }
  };
}
