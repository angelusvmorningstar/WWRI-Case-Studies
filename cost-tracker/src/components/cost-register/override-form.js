const { html, useState, useMemo } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { createAssumption, resolveAssumption, buildSupersessionPayload, lookupValue } from '../../state/assumptions.js';
import { monthlyHeadcountByRegion } from '../../state/cohort.js';
import { fmt } from '../../shared/format.js';

function toShortId(subscriptionId) {
  return subscriptionId.replace(/^sub-/, '').replace(/-/g, '_');
}

function buildOverrideKey(subscriptionId, yearMonth) {
  return `subscription.${toShortId(subscriptionId)}.monthly_override.${yearMonth.replace('-', '_')}`;
}

function monthLabel(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

export function OverrideForm({ subscription, yearMonth, onClose }) {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;

  const isBundle = subscription.id === 'sub-hubspot';
  const { currency = 'AUD', cohort_driven, unit_cost_assumption_key, attribution_assumption_key, seat_count_assumption_key } = subscription;

  const { defaultUnitCost, defaultUnits } = useMemo(() => {
    if (isBundle) {
      const annual = lookupValue(assumptions, 'subscription.hubspot.bundle_annual_aud', 0);
      return { defaultUnitCost: annual / 12, defaultUnits: 1 };
    }
    const unitCost = lookupValue(assumptions, unit_cost_assumption_key, 0);
    let units;
    if (cohort_driven) {
      const hc = monthlyHeadcountByRegion(yearMonth, scenario, assumptions);
      const totalIEs = hc.apac + hc.americas + hc.emea;
      const attrRate = lookupValue(assumptions, attribution_assumption_key, 1);
      units = Math.round(totalIEs * attrRate);
    } else {
      units = lookupValue(assumptions, seat_count_assumption_key, 0);
    }
    return { defaultUnitCost: unitCost, defaultUnits: units };
  }, [subscription.id, yearMonth]);

  const [unitCost, setUnitCost] = useState(defaultUnitCost.toFixed(2));
  const [units, setUnits] = useState(String(defaultUnits));
  const [rationale, setRationale] = useState('');
  const [source, setSource] = useState('');
  const [errors, setErrors] = useState({});

  const fxRate = currency !== 'AUD'
    ? (lookupValue(assumptions, `scenario.fx_rate.aud_${currency.toLowerCase()}`, 1) || 1)
    : 1;

  const parsedUnitCost = parseFloat(unitCost) || 0;
  const parsedUnits = isBundle ? 1 : (parseInt(units, 10) || 0);
  const nativeTotal = parsedUnitCost * parsedUnits;
  const audTotal = currency === 'AUD' ? nativeTotal : nativeTotal / fxRate;

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (isNaN(parsedUnitCost) || parsedUnitCost < 0) errs.unitCost = 'Enter a valid amount';
    if (!isBundle && (isNaN(parsedUnits) || parsedUnits < 0)) errs.units = 'Enter a valid count';
    if (!rationale.trim()) errs.rationale = 'Rationale is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const key = buildOverrideKey(subscription.id, yearMonth);
    const label = isBundle
      ? `${subscription.vendor} ${subscription.product} — ${monthLabel(yearMonth)} monthly override`
      : `${subscription.vendor} ${subscription.product} — ${monthLabel(yearMonth)} override (${parsedUnits} seats × ${currency} ${parsedUnitCost.toFixed(2)})`;

    const resolvedSource = source.trim() || 'Manual override';
    const draft = createAssumption({
      key,
      label,
      value: parseFloat(audTotal.toFixed(2)),
      unit: 'AUD/month',
      category: 'Subscription cost',
      rationale: rationale.trim(),
      source: resolvedSource,
      confidence: 'high',
      applies_to: [subscription.id],
    });
    const resolved = resolveAssumption(draft, { rationale: rationale.trim(), source: resolvedSource });

    const supersessionPayload = buildSupersessionPayload(workbook.assumptions, resolved);
    if (supersessionPayload) {
      dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload: supersessionPayload });
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolved });
    }

    const entryKey = `${subscription.id}_${yearMonth}`;
    const existing = workbook.monthlyEntries?.[entryKey];
    dispatch({
      type: 'MONTHLY_ENTRY_UPSERTED',
      payload: {
        id: existing?.id ?? `entry-${subscription.id}-${yearMonth}`,
        subscriptionId: subscription.id,
        yearMonth,
        isActual: false,
        costAud: null,
        costNative: null,
        currency: 'AUD',
        xeroId: existing?.xeroId ?? null,
        overrideAssumptionKey: key,
      },
    });

    onClose();
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const unitCostLabel = isBundle ? 'Monthly cost (AUD)' : `Unit cost (${currency}/seat/month)`;
  const unitsLabel = cohort_driven ? 'Attributed seats' : 'Seat count';

  return html`
    <div
      class="dialog-overlay"
      onClick=${handleOverlayClick}
      onKeyDown=${e => { if (e.key === 'Escape') onClose(); }}
    >
      <div class="dialog dialog--wide" role="dialog" aria-modal="true" aria-labelledby="override-title">
        <h2 class="dialog__title" id="override-title">Override forecast — ${monthLabel(yearMonth)}</h2>
        <p class="dialog__body">
          Override the forecast for <strong>${subscription.vendor} ${subscription.product}</strong>.
          ${isBundle
            ? 'Enter the monthly AUD cost for this bundle.'
            : 'Enter the per-unit cost and seat count for this month.'
          }
        </p>
        <form onSubmit=${handleSubmit}>
          <div class="form-grid" style=${{ marginBottom: 'var(--space-3)' }}>
            <div class="field">
              <label class="field__label" for="override-unit-cost">
                ${unitCostLabel} <span class="field__required">*</span>
              </label>
              <input
                id="override-unit-cost"
                type="number"
                step="0.01"
                min="0"
                class="field__input"
                value=${unitCost}
                onInput=${e => setUnitCost(e.target.value)}
                autoFocus
              />
              ${errors.unitCost && html`<span class="field__error">${errors.unitCost}</span>`}
            </div>
            ${!isBundle && html`
              <div class="field">
                <label class="field__label" for="override-units">
                  ${unitsLabel} <span class="field__required">*</span>
                </label>
                <input
                  id="override-units"
                  type="number"
                  step="1"
                  min="0"
                  class="field__input"
                  value=${units}
                  onInput=${e => setUnits(e.target.value)}
                />
                ${errors.units && html`<span class="field__error">${errors.units}</span>`}
              </div>
            `}
          </div>

          ${!isBundle && html`
            <div class="override-form__total">
              <span class="override-form__total-calc">
                ${parsedUnits} seats × ${currency} ${parsedUnitCost.toFixed(2)}
                ${currency !== 'AUD' ? ` ÷ ${fxRate} (FX)` : ''}
              </span>
              <span class="override-form__total-value">${fmt.aud(audTotal)} / month</span>
            </div>
          `}

          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="override-rationale">
              Rationale <span class="field__required">*</span>
            </label>
            <textarea
              id="override-rationale"
              class="field__input"
              rows="3"
              placeholder="Why does this month differ from the standard forecast?"
              value=${rationale}
              onInput=${e => setRationale(e.target.value)}
            ></textarea>
            ${errors.rationale && html`<span class="field__error">${errors.rationale}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-4)' }}>
            <label class="field__label" for="override-source">
              Source <span class="field__optional">(optional)</span>
            </label>
            <input
              id="override-source"
              type="text"
              class="field__input"
              placeholder="Optional — Xero INV-1234, vendor quote, email thread..."
              value=${source}
              onInput=${e => setSource(e.target.value)}
            />
          </div>
          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" onClick=${onClose}>Cancel</button>
            <button type="submit" class="btn btn--primary">Resolve override</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
