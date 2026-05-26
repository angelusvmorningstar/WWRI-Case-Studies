const { html, useState } = window.__WWCT__;
import { DecisionDrawer } from './decision-drawer.js';
import { useWorkbook } from '../../state/store.js';
import { lookupAssumption, CONFIDENCE } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';

export function AssumptionMarker({ assumptionKey, children, passive = false }) {
  const { workbook } = useWorkbook();
  const assumption = lookupAssumption(workbook.assumptions || {}, assumptionKey);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  if (!assumption) {
    return html`
      <span class="assumption-missing" title="No resolved assumption for key: ${assumptionKey}">
        ${children}
        <span class="assumption-marker assumption-marker--missing" aria-label="Missing assumption">●</span>
      </span>
    `;
  }

  const isPlaceholder = assumption.confidence === CONFIDENCE.PLACEHOLDER;
  const markerClass = 'assumption-marker' + (isPlaceholder ? ' assumption-marker--placeholder' : '');

  const tooltipText = [
    assumption.value + (assumption.unit ? ' ' + assumption.unit : ''),
    assumption.author,
    fmt.date(assumption.decided_on),
    isPlaceholder ? 'Placeholder confidence' : assumption.confidence + ' confidence',
  ].join(' · ');

  return html`
    <span
      class="assumption-value-wrap"
      tabIndex="0"
      role="button"
      aria-label=${'Open decision drawer for ' + assumption.label}
      onMouseEnter=${() => setTooltipVisible(true)}
      onMouseLeave=${() => setTooltipVisible(false)}
      onFocus=${() => setTooltipVisible(true)}
      onBlur=${() => setTooltipVisible(false)}
      onClick=${() => { setTooltipVisible(false); if (!passive) setDrawerOpen(true); }}
      onKeyDown=${e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!passive) setDrawerOpen(true); } }}
    >
      ${children}
      <span class=${markerClass} aria-hidden="true">●</span>
      ${tooltipVisible && html`
        <span class="assumption-tooltip" role="tooltip">${tooltipText}</span>
      `}
      ${drawerOpen && html`
        <${DecisionDrawer}
          assumptionId=${assumption.id}
          onClose=${() => setDrawerOpen(false)}
        />
      `}
    </span>
  `;
}
