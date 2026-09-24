/**
 * @file transactionSchema.js
 * @description Standardized transaction schema and validation helpers for GA-08 Analytics.
 * 
 * Target Schema:
 * {
 *   id: string,
 *   date: "YYYY-MM-DD",
 *   merchant: string,
 *   category: string,
 *   amount: number,
 *   type: "income" | "expense",
 *   source: "csv" | "bill" | "synthetic"
 * }
 */

/**
 * Supported transaction types
 */
export const TRANSACTION_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense'
});

/**
 * Supported transaction evidence sources
 */
export const TRANSACTION_SOURCES = Object.freeze({
  CSV: 'csv',
  BILL: 'bill',
  SYNTHETIC: 'synthetic'
});

/**
 * Normalizes and validates an arbitrary date input into strict YYYY-MM-DD format.
 * Rejects invalid dates, impossible calendar dates (e.g. Feb 30), or unparseable strings.
 * 
 * Supports common formats:
 * - YYYY-MM-DD / YYYY/MM/DD
 * - MM/DD/YYYY / MM-DD-YYYY
 * - DD/MM/YYYY / DD-MM-YYYY (when unambiguous or explicitly matched)
 * - ISO timestamps (YYYY-MM-DDTHH:mm:ss.sssZ)
 *
 * @param {string | Date | number} rawDate
 * @returns {string | null} Normalized YYYY-MM-DD string, or null if invalid.
 */
export function normalizeDate(rawDate) {
  if (!rawDate && rawDate !== 0) return null;

  if (rawDate instanceof Date) {
    if (isNaN(rawDate.getTime())) return null;
    return rawDate.toISOString().slice(0, 10);
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // 1. Direct YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return formatYMD(year, month, day);
    }
  }

  // 2. MM/DD/YYYY or DD/MM/YYYY with slashes or dashes
  const slashMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (slashMatch) {
    const first = parseInt(slashMatch[1], 10);
    const second = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);

    // If first > 12, it must be DD/MM/YYYY
    if (first > 12 && second <= 12) {
      if (isValidCalendarDate(year, second, first)) {
        return formatYMD(year, second, first);
      }
    }

    // Default to MM/DD/YYYY (standard US/financial ledger convention)
    if (isValidCalendarDate(year, first, second)) {
      return formatYMD(year, first, second);
    }

    // Fallback: try DD/MM/YYYY if MM/DD/YYYY was invalid
    if (isValidCalendarDate(year, second, first)) {
      return formatYMD(year, second, first);
    }
  }

  // 3. Fallback: native Date.parse
  const parsedTime = Date.parse(str);
  if (!isNaN(parsedTime)) {
    const d = new Date(parsedTime);
    return formatYMD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  return null;
}

/**
 * Checks if a year, month, day combination represents a real Gregorian calendar date.
 * @param {number} year
 * @param {number} month 1-12
 * @param {number} day 1-31
 * @returns {boolean}
 */
export function isValidCalendarDate(year, month, day) {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ];

  return day <= daysInMonth[month - 1];
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function formatYMD(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Validates whether an object strictly conforms to the Transaction schema.
 * 
 * @param {any} tx
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTransaction(tx) {
  const errors = [];

  if (!tx || typeof tx !== 'object') {
    return { valid: false, errors: ['Transaction must be a non-null object.'] };
  }

  // 1. id
  if (typeof tx.id !== 'string' || tx.id.trim().length === 0) {
    errors.push('Transaction "id" must be a non-empty string.');
  }

  // 2. date
  if (typeof tx.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
    errors.push('Transaction "date" must be formatted as YYYY-MM-DD.');
  } else {
    const [y, m, d] = tx.date.split('-').map(Number);
    if (!isValidCalendarDate(y, m, d)) {
      errors.push(`Transaction "date" (${tx.date}) is not a valid calendar date.`);
    }
  }

  // 3. merchant
  if (typeof tx.merchant !== 'string' || tx.merchant.trim().length === 0) {
    errors.push('Transaction "merchant" must be a non-empty string.');
  }

  // 4. category
  if (typeof tx.category !== 'string' || tx.category.trim().length === 0) {
    errors.push('Transaction "category" must be a non-empty string.');
  }

  // 5. amount: must be positive finite number
  if (typeof tx.amount !== 'number' || isNaN(tx.amount) || !isFinite(tx.amount)) {
    errors.push('Transaction "amount" must be a valid finite number.');
  } else if (tx.amount <= 0) {
    errors.push(`Transaction "amount" must be strictly positive (got: ${tx.amount}).`);
  }

  // 6. type: "income" | "expense"
  if (tx.type !== TRANSACTION_TYPES.INCOME && tx.type !== TRANSACTION_TYPES.EXPENSE) {
    errors.push(`Transaction "type" must be either "${TRANSACTION_TYPES.INCOME}" or "${TRANSACTION_TYPES.EXPENSE}" (got: "${tx.type}").`);
  }

  // 7. source: "csv" | "bill" | "synthetic" (optional, defaults to csv if omitted)
  const validSources = Object.values(TRANSACTION_SOURCES);
  if (tx.source !== undefined && !validSources.includes(tx.source)) {
    errors.push(`Transaction "source" must be one of [${validSources.join(', ')}] (got: "${tx.source}").`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Creates and normalizes a Transaction object, or returns validation errors.
 * 
 * @param {object} raw
 * @param {string} raw.id
 * @param {string | Date} raw.date
 * @param {string} raw.merchant
 * @param {string} [raw.category]
 * @param {number | string} raw.amount
 * @param {"income" | "expense"} raw.type
 * @param {"csv" | "bill" | "synthetic"} [raw.source="csv"]
 * @returns {{ valid: boolean, transaction?: object, errors: string[] }}
 */
export function createTransaction(raw) {
  const errors = [];

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : null;
  if (!id) errors.push('Missing or empty transaction id.');

  const normalizedDate = normalizeDate(raw.date);
  if (!normalizedDate) {
    errors.push(`Invalid date format for date: "${raw.date}". Expected YYYY-MM-DD or parseable date.`);
  }

  const merchant = typeof raw.merchant === 'string' && raw.merchant.trim()
    ? raw.merchant.trim()
    : null;
  if (!merchant) errors.push('Missing or empty merchant/description.');

  const category = typeof raw.category === 'string' && raw.category.trim()
    ? raw.category.trim()
    : 'Uncategorized';

  let amount = null;
  if (typeof raw.amount === 'number') {
    amount = Math.abs(raw.amount);
  } else if (typeof raw.amount === 'string') {
    const cleanStr = raw.amount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleanStr);
    if (!isNaN(parsed)) {
      amount = Math.abs(parsed);
    }
  }

  if (amount === null || isNaN(amount) || !isFinite(amount) || amount <= 0) {
    errors.push(`Invalid amount: "${raw.amount}". Amount must resolve to a positive number.`);
  }

  let type = null;
  if (typeof raw.type === 'string') {
    const lowerType = raw.type.trim().toLowerCase();
    if (lowerType === 'income' || lowerType === 'credit' || lowerType === 'cr' || lowerType === 'deposit') {
      type = TRANSACTION_TYPES.INCOME;
    } else if (lowerType === 'expense' || lowerType === 'debit' || lowerType === 'dr' || lowerType === 'withdrawal') {
      type = TRANSACTION_TYPES.EXPENSE;
    }
  }
  if (!type) {
    errors.push(`Invalid type: "${raw.type}". Expected "income" or "expense".`);
  }

  const source = raw.source && Object.values(TRANSACTION_SOURCES).includes(raw.source)
    ? raw.source
    : TRANSACTION_SOURCES.CSV;

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Construct normalized transaction
  const transaction = {
    id,
    date: normalizedDate,
    merchant,
    category,
    amount: Math.round(amount * 100) / 100, // round to 2 decimal places
    type,
    source
  };

  const validation = validateTransaction(transaction);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  return { valid: true, transaction, errors: [] };
}
