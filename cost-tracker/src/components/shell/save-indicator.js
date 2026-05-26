const { html } = window.__WWCT__;

const LABELS = {
  saved:  'Saved',
  dirty:  'Unsaved changes',
  cached: 'Cached',
};

export function SaveIndicator({ state = 'cached' }) {
  return html`
    <span class="save-indicator save-indicator--${state}" aria-live="polite" aria-label=${LABELS[state]}>
      <span class="save-indicator__dot"></span>
      ${LABELS[state]}
    </span>
  `;
}
