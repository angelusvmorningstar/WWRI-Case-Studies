const { html, useState, useRef, useCallback } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { parseXeroCSV, reconcile } from '../../state/xero-parser.js';
import { lookupValue } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';

function monthLabel(ym) {
  if (!ym) return 'Unknown date';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
}

export function XeroImport({ onClose }) {
  const { workbook, dispatch } = useWorkbook();
  const fileRef = useRef(null);
  const [parseError, setParseError] = useState(null);
  const [result, setResult] = useState(null);   // { matched, unmatched, skipped }
  const [matched, setMatched] = useState([]);   // mutable copies for UI state
  const [unmatched, setUnmatched] = useState([]);

  const assumptions = workbook.assumptions || {};
  const subscriptions = Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived');
  const fxRate = lookupValue(assumptions, 'scenario.fx_rate.aud_usd');

  const handleFileChange = useCallback(async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    try {
      const text = await file.text();
      const rows = parseXeroCSV(text);
      if (rows.length === 0) { setParseError('No transactions found in this CSV. Check the file format.'); return; }
      const rec = reconcile(rows, subscriptions, fxRate);
      setResult(rec);
      setMatched(rec.matched.map(m => ({ ...m })));
      setUnmatched(rec.unmatched.map(u => ({ ...u })));
    } catch (err) {
      setParseError('Failed to parse CSV: ' + err.message);
    }
    // Reset file input so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  }, [subscriptions, fxRate]);

  function toggleConfirmed(i) {
    setMatched(prev => prev.map((m, idx) => idx === i ? { ...m, confirmed: !m.confirmed } : m));
  }

  function assignUnmatched(i, subId) {
    setUnmatched(prev => prev.map((u, idx) => idx === i ? { ...u, assignedSubscriptionId: subId } : u));
  }

  function handleConfirm() {
    const entries = [];

    for (const m of matched) {
      if (!m.confirmed) continue;
      const { subscription, row, costAud } = m;
      const entryKey = `${subscription.id}_${row.yearMonth}`;
      const existing = workbook.monthlyEntries?.[entryKey];
      entries.push({
        id: existing?.id ?? `entry-${subscription.id}-${row.yearMonth}`,
        subscriptionId: subscription.id,
        yearMonth: row.yearMonth,
        isActual: true,
        costAud,
        costNative: row.amount,
        currency: row.currency,
        xeroId: `xero-row-${row.rowIndex}`,
        overrideAssumptionKey: null,
      });
    }

    for (const u of unmatched) {
      if (!u.assignedSubscriptionId || !u.row.yearMonth) continue;
      const sub = subscriptions.find(s => s.id === u.assignedSubscriptionId);
      if (!sub) continue;
      const costAud = lookupValue(assumptions, 'scenario.fx_rate.aud_usd')
        ? (u.row.currency === 'USD' ? u.row.amount / lookupValue(assumptions, 'scenario.fx_rate.aud_usd') : u.row.amount)
        : u.row.amount;
      const entryKey = `${sub.id}_${u.row.yearMonth}`;
      const existing = workbook.monthlyEntries?.[entryKey];
      entries.push({
        id: existing?.id ?? `entry-${sub.id}-${u.row.yearMonth}`,
        subscriptionId: sub.id,
        yearMonth: u.row.yearMonth,
        isActual: true,
        costAud,
        costNative: u.row.amount,
        currency: u.row.currency,
        xeroId: `xero-row-${u.row.rowIndex}`,
        overrideAssumptionKey: null,
      });
    }

    if (entries.length > 0) {
      dispatch({ type: 'MONTHLY_ENTRIES_BATCH_UPDATED', payload: entries });
    }
    onClose();
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const confirmedCount = matched.filter(m => m.confirmed).length;
  const manualCount = unmatched.filter(u => u.assignedSubscriptionId && u.row.yearMonth).length;
  const totalImporting = confirmedCount + manualCount;

  return html`
    <div
      class="dialog-overlay"
      onClick=${handleOverlayClick}
      onKeyDown=${e => { if (e.key === 'Escape') onClose(); }}
    >
      <div class="dialog xero-import-dialog" role="dialog" aria-modal="true" aria-labelledby="xero-title">
        <div class="xero-import-dialog__header">
          <h2 class="dialog__title" id="xero-title">Import Xero CSV</h2>
          <button class="btn btn--ghost btn--sm" onClick=${onClose} aria-label="Close">✕</button>
        </div>

        ${!result && html`
          <p class="dialog__body">
            Select a Xero sales or expense CSV export. The parser tolerates column reordering and multiple date formats.
          </p>
          <div class="xero-import-dialog__upload">
            <input
              ref=${fileRef}
              type="file"
              accept=".csv,text/csv"
              style=${{ display: 'none' }}
              onChange=${handleFileChange}
            />
            <button class="btn btn--primary" onClick=${() => fileRef.current?.click()}>
              Choose CSV file
            </button>
            ${parseError && html`<p class="field__error" style=${{ marginTop: 'var(--space-2)' }}>${parseError}</p>`}
          </div>
        `}

        ${result && html`
          <div class="xero-import-dialog__results">

            ${result.skipped > 0 && html`
              <p class="dialog__body text-muted" style=${{ fontSize: 'var(--font-size-xs)' }}>
                ${result.skipped} transaction${result.skipped !== 1 ? 's' : ''} excluded — outside FY 25/26–FY 26/27 or non-expense account codes (revenue, income).
              </p>
            `}

            ${matched.length > 0 && html`
              <section class="xero-import-dialog__section">
                <h3 class="xero-import-dialog__section-title">
                  Matched transactions
                  <span class="badge">${matched.filter(m => m.confirmed).length} / ${matched.length} confirmed</span>
                </h3>
                <table class="data-table xero-import-dialog__table">
                  <thead>
                    <tr>
                      <th>Confirm</th>
                      <th>Vendor (Xero)</th>
                      <th>Matched to</th>
                      <th>Month</th>
                      <th class="text-right">Amount (AUD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${matched.map((m, i) => html`
                      <tr key=${i}>
                        <td>
                          <input
                            type="checkbox"
                            checked=${m.confirmed}
                            onChange=${() => toggleConfirmed(i)}
                            aria-label=${'Confirm ' + m.row.contact}
                          />
                        </td>
                        <td>${m.row.contact}</td>
                        <td>${m.subscription.vendor} — ${m.subscription.product}</td>
                        <td>${monthLabel(m.row.yearMonth)}</td>
                        <td class="text-right">${fmt.aud(m.costAud)}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </section>
            `}

            ${unmatched.length > 0 && html`
              <section class="xero-import-dialog__section">
                <h3 class="xero-import-dialog__section-title">
                  Unmatched transactions
                  <span class="badge">${unmatched.length} item${unmatched.length !== 1 ? 's' : ''}</span>
                </h3>
                <table class="data-table xero-import-dialog__table">
                  <thead>
                    <tr>
                      <th>Vendor (Xero)</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Currency</th>
                      <th>Account</th>
                      <th>Assign to</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${unmatched.map((u, i) => html`
                      <tr key=${i}>
                        <td>${u.row.contact}</td>
                        <td>${u.row.date ?? 'Unknown'}</td>
                        <td class="text-right">${u.row.amount.toFixed(2)}</td>
                        <td>${u.row.currency}</td>
                        <td>${u.row.account || '—'}</td>
                        <td>
                          <select
                            class="filter-bar__select"
                            value=${u.assignedSubscriptionId ?? ''}
                            onChange=${e => assignUnmatched(i, e.target.value || null)}
                          >
                            <option value="">-- Skip --</option>
                            ${subscriptions.map(s => html`
                              <option key=${s.id} value=${s.id}>${s.vendor} — ${s.product}</option>
                            `)}
                          </select>
                        </td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </section>
            `}

            ${matched.length === 0 && unmatched.length === 0 && html`
              <p class="empty-state">No transactions found after reconciliation.</p>
            `}

          </div>
        `}

        <div class="dialog__actions">
          ${!result && html`
            <button class="btn btn--ghost" onClick=${onClose}>Cancel</button>
          `}
          ${result && html`
            <button class="btn btn--ghost" onClick=${onClose}>Cancel</button>
            <button class="btn btn--ghost btn--sm" onClick=${() => { setResult(null); setMatched([]); setUnmatched([]); }}>
              Load different file
            </button>
            <button
              class="btn btn--primary"
              onClick=${handleConfirm}
              disabled=${totalImporting === 0}
            >
              Confirm and import ${totalImporting > 0 ? `(${totalImporting})` : ''}
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}
