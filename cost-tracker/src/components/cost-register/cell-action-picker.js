const { html, useEffect, useRef } = window.__WWCT__;
import { lookupAssumption } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';

export function CellActionPicker({
  assumptions,
  primaryAssumptionKey,
  currentValue,
  anchorX,
  anchorY,
  onEditAssumption,
  onOverride,
  onClose,
}) {
  const ref = useRef(null);
  const assumption = primaryAssumptionKey ? lookupAssumption(assumptions, primaryAssumptionKey) : null;

  useEffect(() => {
    function onMousedown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('mousedown', onMousedown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMousedown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const left = Math.min(anchorX, window.innerWidth - 300);
  const top = Math.min(anchorY + 8, window.innerHeight - 160);

  return html`
    <div
      ref=${ref}
      class="cell-action-picker"
      style=${{ left: `${left}px`, top: `${top}px` }}
      role="dialog"
      aria-label="Cell actions"
    >
      <div class="cell-action-picker__assumption">
        <div class="cell-action-picker__label">
          ${assumption?.label ?? primaryAssumptionKey ?? 'Driving assumption'}
        </div>
        <div class="cell-action-picker__value">
          ${assumption
            ? `${assumption.value} ${assumption.unit || 'AUD/month'}`
            : fmt.aud(currentValue ?? 0)
          }
        </div>
      </div>
      <div class="cell-action-picker__actions">
        <button
          class="btn btn--primary btn--sm"
          onClick=${() => onEditAssumption(assumption?.id ?? null)}
          disabled=${!assumption}
          title=${!assumption ? 'No resolvable assumption found for this cell' : ''}
        >
          Edit assumption
        </button>
        <button
          class="btn btn--ghost btn--sm"
          onClick=${onOverride}
        >
          Override this month
        </button>
      </div>
    </div>
  `;
}
