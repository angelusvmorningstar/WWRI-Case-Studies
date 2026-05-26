const { html, useMemo, useState } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { computeArchitectureMetrics } from './hubspot-arch-compute.js';
import { lookupValue, lookupAssumption, buildSupersessionPayload, STATUS } from '../../state/assumptions.js';
import { getAuthor } from '../../state/identity.js';
import { fmt } from '../../shared/format.js';

function makeSelectedArchAssumption(archId) {
  return {
    id: crypto.randomUUID(),
    key: 'hubspot.selected_architecture',
    label: 'HubSpot — selected architecture',
    value: archId,
    unit: '',
    category: 'HubSpot',
    rationale: `Architecture ${archId} selected via HubSpot architectures view.`,
    source: 'HubSpot architectures view',
    confidence: 'high',
    status: STATUS.RESOLVED,
    author: getAuthor() || 'Unknown',
    decided_on: new Date().toISOString(),
    effective_from: new Date().toISOString().slice(0, 10),
    effective_to: null,
    applies_to: [],
    tags: ['hubspot', 'architecture'],
    supersedes: null,
    superseded_by: null,
  };
}

function SavingCell({ saving, isBaseline }) {
  if (isBaseline) {
    return html`<span class="hubspot-arch__saving hubspot-arch__saving--baseline">—</span>`;
  }
  if (saving > 0) {
    return html`<span class="hubspot-arch__saving hubspot-arch__saving--positive">${fmt.aud(saving)}</span>`;
  }
  if (saving < 0) {
    return html`<span class="hubspot-arch__saving hubspot-arch__saving--negative">${fmt.aud(Math.abs(saving))} more</span>`;
  }
  return html`<span class="hubspot-arch__saving">AUD 0</span>`;
}

function ArchCard({ arch, isSelected, onSelect }) {
  const isCurrent = arch.id === 'F';
  const classes = [
    'hubspot-arch__col',
    isCurrent ? 'hubspot-arch__col--current' : '',
    isSelected ? 'hubspot-arch__col--selected' : '',
  ].filter(Boolean).join(' ');
  return html`
    <div class=${classes}>
      <div class="hubspot-arch__col-header">
        <span class="hubspot-arch__col-id">${arch.label}</span>
        ${arch.badge && html`<span class="hubspot-arch__badge">${arch.badge}</span>`}
        ${isSelected && html`<span class="hubspot-arch__badge hubspot-arch__badge--selected">Selected</span>`}
      </div>
      <p class="hubspot-arch__composition">${arch.compositionString}</p>
      <div class="hubspot-arch__metrics">
        <div class="hubspot-arch__metric">
          <span class="hubspot-arch__metric-label">Bundle annualised</span>
          <span class="hubspot-arch__metric-value">${fmt.aud(arch.bundleAnnual)}</span>
        </div>
        <div class="hubspot-arch__metric">
          <span class="hubspot-arch__metric-label">Cohort seats FY 26/27</span>
          <span class="hubspot-arch__metric-value">${fmt.aud(arch.cohortSeatCost)}</span>
        </div>
        <div class="hubspot-arch__metric">
          <span class="hubspot-arch__metric-label">Onboarding fee</span>
          <span class="hubspot-arch__metric-value">${arch.onboardingFee > 0 ? fmt.aud(arch.onboardingFee) : '—'}</span>
        </div>
        <div class="hubspot-arch__metric hubspot-arch__metric--total">
          <span class="hubspot-arch__metric-label">Total Year 1</span>
          <span class="hubspot-arch__metric-value">${fmt.aud(arch.yearOneTotal)}</span>
        </div>
        <div class="hubspot-arch__metric hubspot-arch__metric--saving">
          <span class="hubspot-arch__metric-label">Saving vs F</span>
          <${SavingCell} saving=${arch.savingVsF} isBaseline=${isCurrent} />
        </div>
      </div>
      <button
        class=${'hubspot-arch__select-btn btn btn--sm ' + (isSelected ? 'btn--primary' : 'btn--ghost')}
        onClick=${() => onSelect(arch.id)}
        disabled=${isSelected}
      >
        ${isSelected ? 'Selected ✓' : 'Select'}
      </button>
    </div>
  `;
}

export function HubSpotArchView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;
  const subs = workbook.subscriptions || {};

  const resolvedDiscountPct = Math.round(lookupValue(assumptions, 'hubspot.discount_rate', 0.40) * 100);
  const [discountPct, setDiscountPct] = useState(resolvedDiscountPct);

  const selectedArchId = lookupValue(assumptions, 'hubspot.selected_architecture', 'F');

  const architectures = useMemo(
    () => computeArchitectureMetrics(assumptions, scenario, discountPct / 100),
    [assumptions, scenario, discountPct],
  );

  function handleSelectArch(archId) {
    const newAssumption = makeSelectedArchAssumption(archId);
    const existing = lookupAssumption(assumptions, 'hubspot.selected_architecture');
    if (existing) {
      const payload = buildSupersessionPayload(assumptions, newAssumption);
      if (payload) {
        dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
      } else {
        dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
      }
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
    }
  }

  if (Object.keys(subs).length === 0) {
    return html`
      <div class="page-header">
        <h1 class="page-header__title">HubSpot architectures</h1>
      </div>
      <div class="empty-state">Load a workbook to view HubSpot architectures.</div>
    `;
  }

  return html`
    <div class="hubspot-arch">
      <div class="page-header">
        <h1 class="page-header__title">HubSpot architectures</h1>
        <span class="page-header__count">October 2026 renewal · 4 options</span>
      </div>
      <p class="hubspot-arch__intro">
        Compare four architecture options for the HubSpot renewal negotiation.
        All values use the active scenario and the discount rate below.
      </p>
      <div class="hubspot-arch__slider-control">
        <span class="hubspot-arch__slider-label">Renewal discount</span>
        <input
          class="hubspot-arch__slider"
          type="range"
          min="0"
          max="60"
          step="1"
          value=${discountPct}
          onInput=${e => setDiscountPct(Number(e.target.value))}
        />
        <span class="hubspot-arch__slider-value">${discountPct}%</span>
      </div>
      <p class="hubspot-arch__slider-hint">
        Assumption: hubspot.discount_rate (${resolvedDiscountPct}% resolved) · drag to model scenarios
      </p>
      <div class="hubspot-arch__grid">
        ${architectures.map(arch => html`
          <${ArchCard}
            key=${arch.id}
            arch=${arch}
            isSelected=${arch.id === selectedArchId}
            onSelect=${handleSelectArch}
          />
        `)}
      </div>
    </div>
  `;
}
