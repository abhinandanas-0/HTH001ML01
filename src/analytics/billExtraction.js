/**
 * @file billExtraction.js
 * @description Document extraction and OCR layer for bills, invoices, and receipts.
 * Extracts structured financial fields from PDF documents and image files
 * using client-side PDF text extraction and OCR (Tesseract.js).
 *
 * Rules:
 * - Never fabricates financial values or guesses numbers.
 * - Extracts amount due, provider, due date, bill date, category, status, and currency.
 * - Marks ambiguous numbers as uncertain/null rather than silently guessing.
 * - Works offline/locally in the browser and Node.js testing environments.
 */

let cachedPdfjs = null;

/**
 * Loads the appropriate pdfjs-dist module based on environment (Browser vs Node).
 */
export async function getPdfjs() {
  if (cachedPdfjs) return cachedPdfjs;

  if (typeof window !== 'undefined') {
    // Browser environment (Vite)
    const pdfjs = await import('pdfjs-dist');
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;
    } catch {
      // Worker options fallback
    }
    cachedPdfjs = pdfjs;
    return cachedPdfjs;
  } else {
    // Node.js environment (for tests)
    cachedPdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    return cachedPdfjs;
  }
}

/**
 * Normalizes date strings (e.g. "September 1, 2026", "2026-09-01", "01/09/2026") into YYYY-MM-DD.
 * @param {string} dateStr
 * @returns {string | null} Normalized date string or null if unparseable
 */
export function normalizeBillDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleaned = dateStr.trim().replace(/^[^\w]+|[^\w]+$/g, '');
  if (!cleaned) return null;

  // Check for ISO format YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Attempt standard Date parsing
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    // Sanity check year
    if (year >= 2000 && year <= 2100) {
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Normalizes amount and currency strings, guarding strictly against ambiguous OCR values.
 * If OCR produces ambiguous characters (e.g., "1,2S0", "125O"), marks as uncertain and returns null.
 *
 * @param {string} rawString
 * @returns {{ amount: number | null, currency: string | null, status: 'extracted' | 'uncertain' | 'not_found', warning?: string }}
 */
export function normalizeBillAmount(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    return { amount: null, currency: null, status: 'not_found' };
  }

  const raw = rawString.trim();

  // 1. Detect currency
  let currency = null;
  if (/₹|INR|Rs\.?|Rupees?/i.test(raw)) {
    currency = 'INR';
  } else if (/\$|USD/i.test(raw)) {
    currency = 'USD';
  } else if (/€|EUR/i.test(raw)) {
    currency = 'EUR';
  } else if (/£|GBP/i.test(raw)) {
    currency = 'GBP';
  }

  // Remove currency keywords/symbols to isolate numeric token
  const cleaned = raw.replace(/₹|INR|Rs\.?|Rupees?|\$|USD|€|EUR|£|GBP/gi, '').trim();

  // 2. Strict ambiguity check: detect OCR character substitutions in digit sequences
  // e.g. 1,2S0, 12S0, 125O, 1.25O.00, S1250, l250
  if (/[0-9]+[a-zA-Z]+[0-9]*/.test(cleaned) || /[a-zA-Z]+[0-9]+/.test(cleaned)) {
    return {
      amount: null,
      currency,
      status: 'uncertain',
      warning: 'Amount contains ambiguous characters and could not be reliably extracted.'
    };
  }

  // 3. Extract clean numeric value
  // Matches e.g. "1,250", "1250", "1,250.00", "1250.50"
  const numMatch = cleaned.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/);
  if (!numMatch) {
    return { amount: null, currency, status: 'not_found' };
  }

  const numericValue = parseFloat(numMatch[1].replace(/,/g, ''));
  if (isNaN(numericValue) || numericValue < 0) {
    return { amount: null, currency, status: 'uncertain', warning: 'Extracted amount is not a valid positive number.' };
  }

  return {
    amount: numericValue,
    currency,
    status: 'extracted'
  };
}

/**
 * Parses structured bill fields from text content using deterministic pattern matching.
 *
 * @param {string} text Extracted document text
 * @param {object} [options]
 * @returns {object} Structured bill extraction result
 */
export function parseBillFieldsFromText(text = '', options = {}) {
  const method = options.extractionMethod || 'pdf-text';
  const warnings = [];

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      success: false,
      extractionMethod: 'none',
      extractedText: '',
      fields: {
        provider: null,
        billDate: null,
        dueDate: null,
        amountDue: null,
        currency: null,
        category: null,
        status: null
      },
      confidence: {
        provider: 'not_found',
        billDate: 'not_found',
        dueDate: 'not_found',
        amountDue: 'not_found',
        currency: 'not_found',
        category: 'not_found',
        status: 'not_found'
      },
      warnings: ['No text content available in document.']
    };
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Field holders
  let provider = null;
  let rawBillDate = null;
  let rawDueDate = null;
  let rawAmount = null;
  let category = null;
  let status = null;

  // 1. Detect Provider / Vendor
  const providerRegex = /(?:Provider|Vendor|Merchant|Company|Billed\s*By|Issued\s*By|Payee)\s*[:-]\s*([^\n\r]+)/i;
  for (const line of lines) {
    const match = line.match(providerRegex);
    if (match) {
      provider = match[1].trim();
      break;
    }
  }

  // 2. Detect Bill Date / Invoice Date
  const billDateRegex = /(?:Bill\s*Date|Invoice\s*Date|Statement\s*Date|Issue\s*Date)\s*[:-]\s*([^\n\r]+)/i;
  for (const line of lines) {
    const match = line.match(billDateRegex);
    if (match) {
      rawBillDate = match[1].trim();
      break;
    }
  }

  // 3. Detect Due Date / Payment Due Date
  const dueDateRegex = /(?:Due\s*Date|Payment\s*Due|Pay\s*By|Due\s*By)\s*[:-]\s*([^\n\r]+)/i;
  for (const line of lines) {
    const match = line.match(dueDateRegex);
    if (match) {
      rawDueDate = match[1].trim();
      break;
    }
  }

  // 4. Detect Amount Due / Total Due / Grand Total
  const amountRegex = /(?:Amount\s*Due|Total\s*Due|Grand\s*Total|Balance\s*Due|Invoice\s*Total|Total\s*Amount|Net\s*Payable|Amount\s*Payable)\s*[:-]?\s*([^\n\r]+)/i;
  for (const line of lines) {
    const match = line.match(amountRegex);
    if (match) {
      rawAmount = match[1].trim();
      break;
    }
  }

  // 5. Detect Category
  const categoryRegex = /(?:Category)\s*[:-]\s*([^\n\r]+)/i;
  for (const line of lines) {
    const match = line.match(categoryRegex);
    if (match) {
      category = match[1].trim();
      break;
    }
  }
  // Fallback category inference if not explicitly labeled
  if (!category) {
    const fullTextLower = text.toLowerCase();
    if (/electricity|power\s*corp|electric|energy\s*bill/i.test(fullTextLower)) {
      category = 'Utilities';
    } else if (/water\s*supply|water\s*utility/i.test(fullTextLower)) {
      category = 'Utilities';
    } else if (/broadband|internet|fiber|wifi|telecom|cellular|mobile\s*postpaid/i.test(fullTextLower)) {
      category = 'Internet';
    } else if (/cloud|software|subscription|saas|hosting/i.test(fullTextLower)) {
      category = 'Software';
    } else if (/rent|lease|mortgage|housing/i.test(fullTextLower)) {
      category = 'Housing';
    }
  }

  // 6. Detect Status
  const statusRegex = /(?:Status|Payment\s*Status)\s*[:-]\s*([^\n\r]+)/i;
  for (const line of lines) {
    const match = line.match(statusRegex);
    if (match) {
      status = match[1].trim();
      break;
    }
  }
  if (!status) {
    if (/\bunpaid\b|\boverdue\b|\bdue\b|\bpending\b/i.test(text)) {
      status = 'Unpaid';
    } else if (/\bpaid\b|\bsettled\b|\bcleared\b/i.test(text)) {
      status = 'Paid';
    }
  }

  // Normalize parsed fields
  const billDate = normalizeBillDate(rawBillDate);
  const dueDate = normalizeBillDate(rawDueDate);
  const amountObj = normalizeBillAmount(rawAmount);

  if (amountObj.warning) {
    warnings.push(amountObj.warning);
  }

  if (rawBillDate && !billDate) {
    warnings.push(`Bill date "${rawBillDate}" could not be parsed to standard date format.`);
  }

  if (rawDueDate && !dueDate) {
    warnings.push(`Due date "${rawDueDate}" could not be parsed to standard date format.`);
  }

  const confidence = {
    provider: provider ? 'extracted' : 'not_found',
    billDate: billDate ? 'extracted' : (rawBillDate ? 'uncertain' : 'not_found'),
    dueDate: dueDate ? 'extracted' : (rawDueDate ? 'uncertain' : 'not_found'),
    amountDue: amountObj.status,
    currency: amountObj.currency ? 'extracted' : 'not_found',
    category: category ? 'extracted' : 'not_found',
    status: status ? 'extracted' : 'not_found'
  };

  const hasAnyKeyField = Boolean(provider || billDate || dueDate || amountObj.amount !== null || category);

  return {
    success: hasAnyKeyField,
    extractionMethod: method,
    extractedText: text,
    fields: {
      provider,
      billDate,
      dueDate,
      amountDue: amountObj.amount,
      currency: amountObj.currency,
      category,
      status
    },
    confidence,
    warnings
  };
}

/**
 * Extracts text and structured fields from an image file using Tesseract OCR.
 *
 * @param {Blob | File | ArrayBuffer | Uint8Array} fileOrInput
 * @param {object} [options]
 * @returns {Promise<object>} Structured bill extraction result
 */
async function extractFromImageWithOcr(fileOrInput, options = {}) {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    let text = '';
    try {
      const res = await worker.recognize(fileOrInput);
      text = res?.data?.text || '';
    } finally {
      await worker.terminate();
    }

    if (text.trim().length >= 10) {
      return parseBillFieldsFromText(text, { extractionMethod: 'ocr', ...options });
    }

    return {
      success: false,
      extractionMethod: 'ocr',
      extractedText: text,
      fields: {
        provider: null,
        billDate: null,
        dueDate: null,
        amountDue: null,
        currency: null,
        category: null,
        status: null
      },
      confidence: {
        provider: 'not_found',
        billDate: 'not_found',
        dueDate: 'not_found',
        amountDue: 'not_found',
        currency: 'not_found',
        category: 'not_found',
        status: 'not_found'
      },
      warnings: ['Image OCR completed but no readable bill text was detected.']
    };
  } catch (err) {
    return {
      success: false,
      extractionMethod: 'none',
      extractedText: '',
      fields: {
        provider: null,
        billDate: null,
        dueDate: null,
        amountDue: null,
        currency: null,
        category: null,
        status: null
      },
      confidence: {
        provider: 'not_found',
        billDate: 'not_found',
        dueDate: 'not_found',
        amountDue: 'not_found',
        currency: 'not_found',
        category: 'not_found',
        status: 'not_found'
      },
      warnings: [`OCR processing failed: ${err.message}`]
    };
  }
}

/**
 * Extracts text and structured fields from a PDF document.
 * Tries PDF text extraction first; falls back to OCR if text is unavailable.
 *
 * @param {Blob | File | ArrayBuffer | Uint8Array} fileOrInput
 * @param {object} [options]
 * @returns {Promise<object>} Structured bill extraction result
 */
async function extractFromPdf(fileOrInput, options = {}) {
  let arrayBuffer;
  try {
    if (fileOrInput instanceof ArrayBuffer) {
      arrayBuffer = fileOrInput;
    } else if (fileOrInput?.arrayBuffer && typeof fileOrInput.arrayBuffer === 'function') {
      arrayBuffer = await fileOrInput.arrayBuffer();
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(fileOrInput)) {
      arrayBuffer = fileOrInput.buffer.slice(fileOrInput.byteOffset, fileOrInput.byteOffset + fileOrInput.byteLength);
    } else if (fileOrInput instanceof Uint8Array) {
      arrayBuffer = fileOrInput.buffer;
    } else {
      throw new Error('Unable to read binary data from PDF document.');
    }
  } catch (err) {
    return {
      success: false,
      extractionMethod: 'none',
      extractedText: '',
      fields: {
        provider: null,
        billDate: null,
        dueDate: null,
        amountDue: null,
        currency: null,
        category: null,
        status: null
      },
      confidence: {
        provider: 'not_found',
        billDate: 'not_found',
        dueDate: 'not_found',
        amountDue: 'not_found',
        currency: 'not_found',
        category: 'not_found',
        status: 'not_found'
      },
      warnings: [`Failed to read PDF file: ${err.message}`]
    };
  }

  // 1. Attempt PDF direct text extraction first
  let pdfText = '';
  let pdfDoc = null;
  try {
    const pdfjs = await getPdfjs();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableFontFace: true
    });
    pdfDoc = await loadingTask.promise;
    const pageTexts = [];
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map(it => it.str).join(' ');
      pageTexts.push(pageText);
    }
    pdfText = pageTexts.join('\n').trim();
  } catch (err) {
    // PDF direct text extraction failed or unsupported
    console.warn('PDF text extraction attempt encountered error:', err.message);
  }

  // If useful text was found (more than 15 characters)
  if (pdfText && pdfText.replace(/\s+/g, '').length >= 15) {
    return parseBillFieldsFromText(pdfText, { extractionMethod: 'pdf-text', ...options });
  }

  // 2. If useful text is unavailable and we have pages: Scanned / Image PDF -> run OCR!
  if (pdfDoc && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const ocrTexts = [];
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      try {
        const pagesToScan = Math.min(pdfDoc.numPages, 3);
        for (let pageNum = 1; pageNum <= pagesToScan; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
          const ret = await worker.recognize(canvas);
          if (ret?.data?.text) {
            ocrTexts.push(ret.data.text);
          }
        }
      } finally {
        await worker.terminate();
      }

      const combinedOcrText = ocrTexts.join('\n').trim();
      if (combinedOcrText.length >= 10) {
        return parseBillFieldsFromText(combinedOcrText, { extractionMethod: 'ocr', ...options });
      }
    } catch (ocrErr) {
      console.warn('OCR on scanned PDF failed:', ocrErr.message);
    }
  }

  // If both failed or text is empty
  return {
    success: false,
    extractionMethod: 'none',
    extractedText: pdfText,
    fields: {
      provider: null,
      billDate: null,
      dueDate: null,
      amountDue: null,
      currency: null,
      category: null,
      status: null
    },
    confidence: {
      provider: 'not_found',
      billDate: 'not_found',
      dueDate: 'not_found',
      amountDue: 'not_found',
      currency: 'not_found',
      category: 'not_found',
      status: 'not_found'
    },
    warnings: ['PDF document does not contain readable text or OCR could not extract content.']
  };
}

/**
 * Main entry point for bill document extraction.
 *
 * @param {Blob | File | ArrayBuffer | Uint8Array | string | object} fileOrInput
 * @param {object} [options]
 * @returns {Promise<object>} Structured bill extraction result
 */
export async function extractBillDocument(fileOrInput, options = {}) {
  if (!fileOrInput) {
    return {
      success: false,
      extractionMethod: 'none',
      extractedText: '',
      fields: {
        provider: null,
        billDate: null,
        dueDate: null,
        amountDue: null,
        currency: null,
        category: null,
        status: null
      },
      confidence: {
        provider: 'not_found',
        billDate: 'not_found',
        dueDate: 'not_found',
        amountDue: 'not_found',
        currency: 'not_found',
        category: 'not_found',
        status: 'not_found'
      },
      warnings: ['No document provided for extraction.']
    };
  }

  // If input already provides text (e.g. in test fixture or pre-parsed)
  if (typeof fileOrInput === 'string') {
    return parseBillFieldsFromText(fileOrInput, { extractionMethod: 'pdf-text', ...options });
  }
  if (fileOrInput?.text && typeof fileOrInput.text === 'string') {
    return parseBillFieldsFromText(fileOrInput.text, {
      extractionMethod: fileOrInput.method || 'pdf-text',
      ...options
    });
  }

  // Determine file type
  const fileName = (fileOrInput?.name || '').toLowerCase();
  const fileType = (fileOrInput?.type || '').toLowerCase();
  const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(fileName);
  const isPdf = fileType.includes('pdf') || fileName.endsWith('.pdf');

  // Handle Image files via OCR
  if (isImage) {
    return extractFromImageWithOcr(fileOrInput, options);
  }

  // Handle PDF files (try text extraction first, fallback to OCR)
  if (isPdf) {
    return extractFromPdf(fileOrInput, options);
  }

  // Fallback for general binary / document
  return extractFromPdf(fileOrInput, options);
}
