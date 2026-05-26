const { html, useState } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { STATUS, CONFIDENCE } from '../../state/assumptions.js';
import { DecisionDrawer } from './decision-drawer.js';

function isExpiringSoon(assumption) {
  if (!assumption.effective_to) return false;
  const diff = new Date(assumption.effective_to) - new Date();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function needsAttention(a) {
  return (
    a.status === STATUS.PROPOSED ||
    a.status === STATUS.UNDER_DISCUSSION ||
    (a.status === STATUS.RESOLVED && a.confidence === CONFIDENCE.PLACEHOLDER) ||
    isExpiringSoon(a)
  );
}

function attentionReason(a) {
  if (a.status === STATUS.PROPOSED)         return 'Proposed';
  if (a.status === STATUS.UNDER_DISCUSSION) return 'Under discussion';
  if (a.confidence === CONFIDENCE.PLACEHOLDER) return 'Placeholder confidence';
  if (isExpiringSoon(a))                    return 'Expires within 30 days';
  return '';
}

export function NeedsDecisionTray() {
  const { workbook } = useWorkbook();
  const urgent = Object.values(workbook.assumptions || {}).filter(needsAttention);
  const [openDrawerId, setOpenDrawerId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  if (urgent.length === 0) return null;

  return html`
    <div class="needs-decision-tray" role="region" aria-label="Needs decision">
      ${openDrawerId && html`
        <${DecisionDrawer}
          assumptionId=${openDrawerId}
          onClose=${() => setOpenDrawerId(null)}
        />
      `}
      <div class="needs-decision-tray__header">
        <span class="needs-decision-tray__label">
          Needs decision
          <span class="needs-decision-tray__count">${urgent.length}</span>
        </span>
        <button class="btn btn--ghost btn--sm" onClick=${() => setCollapsed(c => !c)}>
          ${collapsed ? 'Show' : 'Hide'}
        </button>
      </div>
      ${!collapsed && html`
        <div class="needs-decision-tray__items">
          ${urgent.map(a => html`
            <button class="needs-decision-item" key=${a.id}
              onClick=${() => setOpenDrawerId(a.id)}>
              <span class="needs-decision-item__label">${a.label}</span>
              <span class="needs-decision-item__reason">${attentionReason(a)}</span>
            </button>
          `)}
        </div>
      `}
    </div>
  `;
}
