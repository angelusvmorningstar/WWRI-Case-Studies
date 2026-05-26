// Column name aliases — checked case-insensitively after trim()
const COLUMN_ALIASES = {
  contact:     ['contactname', 'contact', 'contact name', 'supplier', 'vendor', 'payee'],
  date:        ['invoicedate', 'invoice date', 'date', 'transactiondate', 'transaction date'],
  amount:      ['total', 'unitamount', 'unit amount', 'amount', 'lineamount', 'line amount', 'totalamount', 'netamount', 'gross'],
  currency:    ['currency', 'currencycode', 'currency code'],
  description: ['description', 'itemdescription', 'item description', 'desc', 'details', 'particulars'],
  account:     ['accountcode', 'account code', 'account', 'accountname', 'account name'],
};

const MONTH_ABBREVS = {
  jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
  jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12',
};

function parseDate(raw) {
  const s = raw.trim();
  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD-MMM-YYYY or DD MMM YYYY
  const mmm = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/);
  if (mmm) {
    const m = MONTH_ABBREVS[mmm[2].toLowerCase()];
    if (m) return `${mmm[3]}-${m}-${mmm[1].padStart(2, '0')}`;
  }
  return null;
}

function parseCSVRow(line) {
  const cells = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === ',' && !inQ) {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

function findColIdx(headers, aliases) {
  const idx = headers.findIndex(h => aliases.includes(h.trim().toLowerCase()));
  return idx >= 0 ? idx : -1;
}

export function parseXeroCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trimEnd()).filter((l, i) => i === 0 || l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);
  const colIdx = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    colIdx[field] = findColIdx(headers, aliases);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = parseCSVRow(line);

    const contact     = colIdx.contact  >= 0 ? (cells[colIdx.contact]  ?? '').trim() : '';
    const dateRaw     = colIdx.date     >= 0 ? (cells[colIdx.date]     ?? '').trim() : '';
    const amountRaw   = colIdx.amount   >= 0 ? (cells[colIdx.amount]   ?? '').trim() : '';
    const currency    = colIdx.currency >= 0 ? (cells[colIdx.currency] ?? 'AUD').trim().toUpperCase() || 'AUD' : 'AUD';
    const description = colIdx.description >= 0 ? (cells[colIdx.description] ?? '').trim() : '';
    const account     = colIdx.account  >= 0 ? (cells[colIdx.account]  ?? '').trim() : '';

    if (!contact) continue;

    const isoDate = parseDate(dateRaw);
    const yearMonth = isoDate ? isoDate.slice(0, 7) : null;
    const rawAmount = parseFloat(amountRaw.replace(/[,$\s]/g, ''));
    const amount = isNaN(rawAmount) ? 0 : Math.abs(rawAmount);

    rows.push({ contact, date: isoDate, yearMonth, amount, currency, description, account, rowIndex: i });
  }

  return rows;
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toAud(amount, currency, fxRate) {
  if (currency === 'AUD') return amount;
  if (currency === 'USD' && fxRate) return amount / fxRate;
  return amount; // fallback: treat as AUD and let the user review
}

// Group rows by (normalizedContact, yearMonth) and sum amounts
function aggregateRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${normalize(row.contact)}__${row.yearMonth ?? 'unknown'}`;
    if (!groups.has(key)) {
      groups.set(key, { ...row, amount: 0 });
    }
    groups.get(key).amount += row.amount;
  }
  return Array.from(groups.values());
}

// Returns { matched: [...], unmatched: [...], skipped: number }
// matched: { row, subscription, costAud, confirmed: true }
// unmatched: { row, assignedSubscriptionId: null }
// Rows outside [windowFrom, windowTo] are silently dropped (skipped count returned for UI info).
export function reconcile(rows, subscriptions, fxRate, windowFrom = '2025-07', windowTo = '2027-06') {
  const inWindow = r => r.yearMonth && r.yearMonth >= windowFrom && r.yearMonth <= windowTo;
  // Xero expense accounts are 400+; revenue/income accounts are 200-299.
  // Rows with a revenue-range account code are not subscription costs — exclude silently.
  const isExpense = r => { const code = parseInt(r.account, 10); return isNaN(code) || code >= 400; };
  const inScope = r => inWindow(r) && isExpense(r);
  const skipped = rows.filter(r => r.yearMonth && !inScope(r)).length;

  const aggregated = aggregateRows(rows.filter(inScope));
  const unknownDate = rows.filter(r => !r.yearMonth && isExpense(r));

  const matched = [];
  const unmatched = [];

  const activeSubs = subscriptions.filter(s => s.status !== 'archived');

  for (const row of aggregated) {
    const normContact = normalize(row.contact);
    const sub = activeSubs.find(s => {
      const normVendor = normalize(s.vendor);
      return normContact.includes(normVendor) || normVendor.includes(normContact);
    });

    if (sub) {
      matched.push({
        row,
        subscription: sub,
        costAud: toAud(row.amount, row.currency, fxRate),
        confirmed: true,
      });
    } else {
      unmatched.push({ row, assignedSubscriptionId: null });
    }
  }

  // Rows with unknown dates go straight to unmatched
  for (const row of unknownDate) {
    unmatched.push({ row, assignedSubscriptionId: null });
  }

  return { matched, unmatched, skipped };
}
