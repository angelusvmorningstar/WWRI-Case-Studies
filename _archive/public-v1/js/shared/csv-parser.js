/**
 * csv-parser.js — Generic CSV/TSV parser
 *
 * Parses any CSV or TSV text into an array of objects keyed by column name.
 * Auto-detects delimiter (comma vs tab).
 * Handles quoted fields per RFC 4180.
 *
 * This is the BASE parser. Format-specific logic (Xero column mappings,
 * HubSpot field extraction) lives in the Controls tab modules.
 */

/**
 * Parse CSV or TSV text into structured data.
 * @param {string} text - Raw CSV/TSV text
 * @returns {{ ok: true, data: Object[], columns: string[], rowCount: number } |
 *           { ok: false, error: string }}
 */
function parseCSV(text) {
  if (!text || !text.trim()) {
    return { ok: false, error: 'No data provided — paste CSV or TSV content and try again' };
  }

  const trimmed = text.trim();
  const delimiter = detectDelimiter(trimmed);
  const rows = parseRows(trimmed, delimiter);

  if (rows.length < 2) {
    return { ok: false, error: 'Data must contain at least a header row and one data row' };
  }

  const columns = rows[0].map(col => col.trim());

  if (columns.length === 0 || columns.every(c => c === '')) {
    return { ok: false, error: 'Could not extract column names from header row' };
  }

  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (row.length === 1 && row[0].trim() === '') {
      continue;
    }

    const obj = {};
    for (let j = 0; j < columns.length; j++) {
      obj[columns[j]] = j < row.length ? row[j].trim() : '';
    }
    data.push(obj);
  }

  if (data.length === 0) {
    return { ok: false, error: 'No data rows found after header' };
  }

  return { ok: true, data, columns, rowCount: data.length };
}

/**
 * Check if parsed data contains all expected columns.
 * @param {string[]} actual - Columns found in the data
 * @param {string[]} expected - Columns required
 * @returns {{ ok: true } | { ok: false, missing: string[] }}
 */
function validateColumns(actual, expected) {
  const actualSet = new Set(actual.map(c => c.toLowerCase()));
  const missing = expected.filter(col => !actualSet.has(col.toLowerCase()));

  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true };
}

/**
 * Detect whether the text uses tabs or commas as delimiter.
 * @param {string} text - Raw text
 * @returns {string} '\t' or ','
 */
function detectDelimiter(text) {
  const firstLine = text.split('\n')[0];
  return firstLine.includes('\t') ? '\t' : ',';
}

/**
 * Parse text into rows of fields, handling quoted fields per RFC 4180.
 * @param {string} text - Raw text
 * @param {string} delimiter - Field delimiter
 * @returns {string[][]} Array of rows, each an array of field values
 */
function parseRows(text, delimiter) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (doubled "")
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      currentField += char;
      i++;
      continue;
    }

    if (char === '"' && currentField === '') {
      // Start of quoted field
      inQuotes = true;
      i++;
      continue;
    }

    if (char === delimiter) {
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    }

    if (char === '\r') {
      // Skip carriage return
      i++;
      continue;
    }

    if (char === '\n') {
      currentRow.push(currentField);
      currentField = '';
      rows.push(currentRow);
      currentRow = [];
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Push final field and row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export { parseCSV, validateColumns };
