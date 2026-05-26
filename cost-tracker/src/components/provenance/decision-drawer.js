const { html, useState, useEffect } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import {
  STATUS, CONFIDENCE, CATEGORIES,
  resolveAssumption, markUnderDiscussion, withdrawAssumption,
  createAssumption, buildSupersessionPayload, supersessionChain,
} from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';
import { getAuthor } from '../../state/identity.js';

const CONFIDENCE_LABELS = {
  high: 'High', medium: 'Medium', low: 'Low', placeholder: 'Placeholder',
};

export function DecisionDrawer({ assumptionId, onClose }) {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const assumption  = assumptions[assumptionId];

  const [proposing, setProposing] = useState(false);
  const [propFields, setPropFields] = useState({ value: '', rationale: '', source: '', confidence: CONFIDENCE.MEDIUM });
  const [propErrors, setPropErrors] = useState({});
  const [resolveFields, setResolveFields] = useState({ rationale: '', source: '' });
  const [resolveErrors, setResolveErrors] = useState({});
  const [showResolve, setShowResolve] = useState(false);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!assumption) return null;

  const chain = supersessionChain(assumptions, assumptionId);

  function handleMarkDiscussion() {
    try {
      const updated = markUnderDiscussion(assumption);
      dispatch({ type: 'ASSUMPTION_UPDATED', payload: updated });
    } catch (e) {
      alert(e.message);
    }
  }

  function handleWithdraw() {
    if (!confirm('Withdraw this assumption? This cannot be undone.')) return;
    try {
      const updated = withdrawAssumption(assumption);
      dispatch({ type: 'ASSUMPTION_UPDATED', payload: updated });
    } catch (e) {
      alert(e.message);
    }
  }

  function handleResolveSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!resolveFields.rationale.trim()) errs.rationale = 'Rationale is required.';
    if (!resolveFields.source.trim())    errs.source    = 'Source is required.';
    if (Object.keys(errs).length) { setResolveErrors(errs); return; }
    try {
      const resolved = resolveAssumption(assumption, resolveFields);
      const payload  = buildSupersessionPayload(assumptions, resolved);
      if (payload) {
        dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
      } else {
        dispatch({ type: 'ASSUMPTION_UPDATED', payload: resolved });
      }
      setShowResolve(false);
    } catch (e) {
      alert(e.message);
    }
  }

  function handleProposeSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!propFields.value && propFields.value !== 0) errs.value = 'Value is required.';
    if (!propFields.rationale.trim()) errs.rationale = 'Rationale is required.';
    if (!propFields.source.trim())    errs.source    = 'Source is required.';
    if (Object.keys(errs).length) { setPropErrors(errs); return; }
    try {
      const draft    = createAssumption({ ...assumption, ...propFields, value: Number(propFields.value) });
      const resolved = resolveAssumption(draft, propFields);
      const payload  = buildSupersessionPayload(assumptions, resolved);
      if (payload) {
        dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
      } else {
        dispatch({ type: 'ASSUMPTION_PROPOSED', payload: draft });
      }
      setProposing(false);
    } catch (e) {
      alert(e.message);
    }
  }

  return html`
    <div class="drawer-overlay" onClick=${onClose} role="presentation">
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Decision drawer"
             onClick=${e => e.stopPropagation()}>
        <div class="drawer__header">
          <div class="drawer__key">${assumption.key}</div>
          <button class="btn btn--ghost btn--sm" onClick=${onClose} aria-label="Close">✕</button>
        </div>

        <div class="drawer__label">${assumption.label}</div>
        <div class="drawer__value">
          ${assumption.value} ${assumption.unit && html`<span class="text-muted">${assumption.unit}</span>`}
        </div>

        <dl class="drawer__meta">
          <dt>Status</dt>
          <dd>
            <span class=${'status-badge status-badge--' + assumption.status.toLowerCase().replace(' ', '-')}>
              ${assumption.status}
            </span>
          </dd>
          <dt>Author</dt><dd>${assumption.author}</dd>
          <dt>Decided on</dt><dd>${fmt.date(assumption.decided_on)}</dd>
          <dt>Confidence</dt><dd>${CONFIDENCE_LABELS[assumption.confidence] || assumption.confidence}</dd>
          ${assumption.effective_from && html`<dt>Effective from</dt><dd>${assumption.effective_from}</dd>`}
          ${assumption.effective_to   && html`<dt>Effective to</dt>  <dd>${assumption.effective_to}</dd>`}
        </dl>

        ${assumption.rationale && html`
          <div class="drawer__section">
            <div class="drawer__section-label">Rationale</div>
            <p class="drawer__text">${assumption.rationale}</p>
          </div>
        `}

        ${assumption.source && html`
          <div class="drawer__section">
            <div class="drawer__section-label">Source</div>
            <p class="drawer__text">${assumption.source}</p>
          </div>
        `}

        <!-- Lifecycle actions -->
        ${assumption.status === STATUS.PROPOSED && html`
          <div class="drawer__actions">
            <button class="btn btn--secondary btn--sm" onClick=${handleMarkDiscussion}>
              Mark under discussion
            </button>
            <button class="btn btn--primary btn--sm" onClick=${() => setShowResolve(true)}>
              Resolve
            </button>
          </div>
        `}
        ${assumption.status === STATUS.UNDER_DISCUSSION && html`
          <div class="drawer__actions">
            <button class="btn btn--primary btn--sm" onClick=${() => setShowResolve(true)}>
              Resolve
            </button>
            <button class="btn btn--ghost btn--sm" onClick=${handleWithdraw}>Withdraw</button>
          </div>
        `}
        ${assumption.status === STATUS.RESOLVED && html`
          <div class="drawer__actions">
            <button class="btn btn--secondary btn--sm" onClick=${() => setProposing(true)}>
              Propose new value
            </button>
          </div>
        `}

        <!-- Resolve form -->
        ${showResolve && html`
          <form class="drawer__form" onSubmit=${handleResolveSubmit}>
            <div class="drawer__section-label">Resolve this assumption</div>
            <${DrawerField} label="Rationale" error=${resolveErrors.rationale} required>
              <textarea class="field__input" rows="3"
                value=${resolveFields.rationale}
                onInput=${e => { setResolveFields(p => ({ ...p, rationale: e.target.value })); setResolveErrors(p => ({ ...p, rationale: '' })); }}
              ></textarea>
            <//>
            <${DrawerField} label="Source" error=${resolveErrors.source} required>
              <input class="field__input"
                value=${resolveFields.source}
                onInput=${e => { setResolveFields(p => ({ ...p, source: e.target.value })); setResolveErrors(p => ({ ...p, source: '' })); }}
              />
            <//>
            <div class="drawer__form-actions">
              <button type="button" class="btn btn--ghost btn--sm" onClick=${() => setShowResolve(false)}>Cancel</button>
              <button type="submit" class="btn btn--primary btn--sm">Confirm resolution</button>
            </div>
          </form>
        `}

        <!-- Propose new value form -->
        ${proposing && html`
          <form class="drawer__form" onSubmit=${handleProposeSubmit}>
            <div class="drawer__section-label">Propose new value</div>
            <${DrawerField} label="New value" error=${propErrors.value} required>
              <input class="field__input" type="number" step="any"
                value=${propFields.value}
                onInput=${e => { setPropFields(p => ({ ...p, value: e.target.value })); setPropErrors(p => ({ ...p, value: '' })); }}
              />
            <//>
            <${DrawerField} label="Rationale" error=${propErrors.rationale} required>
              <textarea class="field__input" rows="3"
                value=${propFields.rationale}
                onInput=${e => { setPropFields(p => ({ ...p, rationale: e.target.value })); setPropErrors(p => ({ ...p, rationale: '' })); }}
              ></textarea>
            <//>
            <${DrawerField} label="Source" error=${propErrors.source} required>
              <input class="field__input"
                value=${propFields.source}
                onInput=${e => { setPropFields(p => ({ ...p, source: e.target.value })); setPropErrors(p => ({ ...p, source: '' })); }}
              />
            <//>
            <div class="drawer__form-actions">
              <button type="button" class="btn btn--ghost btn--sm" onClick=${() => setProposing(false)}>Cancel</button>
              <button type="submit" class="btn btn--primary btn--sm">Save and resolve</button>
            </div>
          </form>
        `}

        <!-- Supersession chain -->
        ${chain.length > 0 && html`
          <details class="drawer__chain">
            <summary class="drawer__chain-summary">
              Prior versions (${chain.length})
            </summary>
            ${chain.map(prior => html`
              <div class="drawer__chain-item" key=${prior.id}>
                <span class="drawer__chain-value">${prior.value} ${prior.unit}</span>
                <span class="text-muted">${fmt.date(prior.decided_on)} — ${prior.author}</span>
                <p class="drawer__text text-muted">${prior.rationale}</p>
              </div>
            `)}
          </details>
        `}
      </aside>
    </div>
  `;
}

function DrawerField({ label, error, required, children }) {
  return html`
    <div class="field">
      <label class="field__label">
        ${label}${required ? html`<span class="field__required"> *</span>` : ''}
      </label>
      ${children}
      ${error && html`<span class="field__error">${error}</span>`}
    </div>
  `;
}
