const { html, useState } = window.__WWCT__;
import { getAuthor, setAuthor } from '../../state/identity.js';

export function SettingsDialog({ onClose, required }) {
  const [name, setName] = useState(getAuthor());
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    try {
      setAuthor(name);
      onClose(name.trim());
    } catch {
      setError('Please enter your display name.');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !required) onClose(null);
  }

  return html`
    <div
      class="dialog-overlay"
      onClick=${required ? null : () => onClose(null)}
      onKeyDown=${handleKeyDown}
      role="presentation"
    >
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick=${e => e.stopPropagation()}
      >
        <h2 class="dialog__title" id="settings-title">Settings</h2>
        <p class="dialog__body">
          Your display name is attached to every assumption you record.
        </p>
        <form onSubmit=${handleSubmit}>
          <div class="field">
            <label class="field__label" for="display-name">Display name</label>
            <input
              id="display-name"
              class="field__input"
              type="text"
              value=${name}
              onInput=${e => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Angelus"
              autoFocus
              required
            />
            ${error && html`<span class="field__error">${error}</span>`}
          </div>
          <div class="dialog__actions">
            ${!required && html`
              <button type="button" class="btn btn--ghost" onClick=${() => onClose(null)}>
                Cancel
              </button>
            `}
            <button type="submit" class="btn btn--primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
