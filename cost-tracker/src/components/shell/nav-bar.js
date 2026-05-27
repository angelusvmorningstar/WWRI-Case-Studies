const { html } = window.__WWCT__;
import { SaveIndicator } from './save-indicator.js';

const NAV_LINKS = [
  { href: '#/dashboard',    label: 'Dashboard'   },
  { href: '#/ie-intake',    label: 'IE Intake'   },
  { href: '#/ie-register',  label: 'IE Register' },
  { href: '#/subscriptions', label: 'Subscriptions' },
  { href: '#/forecast',     label: 'Forecast'    },
];

export function NavBar({ route, saveState, authorName, scenarios, activeScenarioId, onScenarioChange, onLoad, onSave, onSettings }) {
  return html`
    <nav class="nav-bar" role="navigation" aria-label="Main navigation">
      <div class="nav-bar__logo">
        <img src="public/assets/logo.svg" alt="Whitewater Reinventions" />
      </div>
      <span class="nav-bar__title">Subscription cost tracker</span>
      <div class="nav-bar__links">
        ${NAV_LINKS.map(({ href, label }) => html`
          <a
            key=${href}
            href=${href}
            class=${'nav-bar__link' + (route === href.slice(1) ? ' nav-bar__link--active' : '')}
          >${label}</a>
        `)}
      </div>
      <div class="nav-bar__actions">
        ${scenarios?.length > 0 && html`
          <select
            class="nav-bar__scenario-picker"
            value=${activeScenarioId ?? ''}
            onChange=${e => onScenarioChange?.(e.target.value)}
            title="Active scenario"
            aria-label="Active scenario"
          >
            ${scenarios.map(s => html`
              <option key=${s.id} value=${s.id}>${s.label}</option>
            `)}
          </select>
        `}
        <${SaveIndicator} state=${saveState} />
        <button class="btn btn--ghost btn--sm" onClick=${onLoad}>Load</button>
        <button class="btn btn--primary btn--sm" onClick=${onSave}>Save</button>
        <button class="btn btn--ghost btn--sm" onClick=${onSettings} title="Settings">
          ${authorName || 'Settings'}
        </button>
      </div>
    </nav>
  `;
}
