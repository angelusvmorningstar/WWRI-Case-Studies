const { html } = window.__WWCT__;
import { SaveIndicator } from './save-indicator.js';
import { SCENARIO_DEFS } from '../../state/scenarios.js';
import { SUBSCRIPTION_MODELS } from '../../state/subscription-models.js';

const NAV_LINKS = [
  { href: '#/dashboard',    label: 'Dashboard'   },
  { href: '#/ie-intake',    label: 'IE Intake'   },
  { href: '#/ie-register',  label: 'IE Register' },
  { href: '#/subscriptions', label: 'Subscriptions' },
  { href: '#/forecast',     label: 'Forecast'    },
];

export function NavBar({ route, saveState, authorName, activeScenarioId, onScenarioChange, modelId, onModelChange, onLoad, onSave, onSettings }) {
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
      <div class="nav-bar__controls">
        <div class="nav-bar__pill-group">
          <span class="nav-bar__pill-label">Scenario</span>
          <div class="nav-bar__pills">
            ${SCENARIO_DEFS.map(def => html`
              <button
                key=${def.id}
                class=${'nav-bar__pill' + (activeScenarioId === def.id ? ' nav-bar__pill--active' : '')}
                onClick=${() => onScenarioChange?.(def.id)}
                title=${def.label}
              >${def.shortLabel}</button>
            `)}
          </div>
        </div>
        <div class="nav-bar__pill-group">
          <span class="nav-bar__pill-label">Model</span>
          <div class="nav-bar__pills">
            ${Object.values(SUBSCRIPTION_MODELS).map(m => html`
              <button
                key=${m.id}
                class=${'nav-bar__pill' + (modelId === m.id ? ' nav-bar__pill--active' : '')}
                onClick=${() => onModelChange?.(m.id)}
                title=${m.description}
              >${m.label}</button>
            `)}
          </div>
        </div>
      </div>
      <div class="nav-bar__actions">
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
