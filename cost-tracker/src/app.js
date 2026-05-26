const { html, useState, useEffect } = window.__WWCT__;
import { ErrorBoundary } from './components/shell/error-boundary.js';
import { NavBar } from './components/shell/nav-bar.js';
import { SettingsDialog } from './components/shell/settings-dialog.js';
import { WorkbookProvider, useWorkbook } from './state/store.js';
import { hasAuthor, getAuthor } from './state/identity.js';
import { loadWorkbookFromFile, saveWorkbookToDownload } from './state/file-io.js';
import { DecisionLog } from './components/provenance/decision-log.js';
import { DecisionsView } from './components/decisions/decisions-view.js';
import { NeedsDecisionTray } from './components/provenance/needs-decision-tray.js';
import { CostRegisterView } from './components/cost-register/cost-register-view.js';
import { ScenariosView } from './components/scenarios/scenarios-view.js';
import { LicenceForecastView } from './components/scenarios/licence-forecast-view.js';
import { HubSpotArchView } from './components/hubspot-arch/hubspot-arch-view.js';
import { SavingsView } from './components/savings/savings-view.js';
import { RenewalsView } from './components/renewals/renewals-view.js';
import { DashboardView } from './components/dashboard/dashboard-view.js';
import { IEIntakeView } from './components/ie-intake/ie-intake-view.js';
import { PerIECostsView } from './components/per-ie-costs/per-ie-costs-view.js';
import { ForecastView } from './components/forecast/forecast-view.js';
import { IERegisterView } from './components/ie-register/ie-register-view.js';

function PagePlaceholder({ name }) {
  return html`
    <div class="page-placeholder">
      <div class="page-placeholder__label">${name}</div>
      <p>Coming soon</p>
    </div>
  `;
}

function RouteContent({ path }) {
  switch (path) {
    case '/dashboard':        return html`<${DashboardView} />`;
    case '/ie-intake':        return html`<${IEIntakeView} />`;
    case '/ie-register':      return html`<${IERegisterView} />`;
    case '/per-ie-costs':     return html`<${PerIECostsView} />`;
    case '/forecast':         return html`<${ForecastView} />`;
    // Legacy routes — not in nav but accessible via deep link
    case '/decisions':        return html`<${DecisionsView} />`;
    case '/decision-log':     return html`<${DecisionLog} />`;
    case '/cost-register':    return html`<${CostRegisterView} />`;
    case '/scenarios':        return html`<${ScenariosView} />`;
    case '/licence-forecast': return html`<${LicenceForecastView} />`;
    case '/hubspot':          return html`<${HubSpotArchView} />`;
    case '/savings':          return html`<${SavingsView} />`;
    case '/renewals':         return html`<${RenewalsView} />`;
    default:
      return html`<${PagePlaceholder} name=${path} />`;
  }
}

function resolveRoute(hash) {
  const path = hash.replace(/^#/, '') || '/dashboard';
  const routes = {
    '/dashboard':        'Dashboard',
    '/ie-intake':        'IE Intake',
    '/ie-register':      'IE Register',
    '/per-ie-costs':     'Per-IE Costs',
    '/forecast':         'Forecast',
    // Legacy
    '/cost-register':    'Cost register',
    '/scenarios':        'Recruitment',
    '/licence-forecast': 'Licence forecast',
    '/hubspot':          'HubSpot',
    '/renewals':         'Renewals',
    '/decisions':        'Subscriptions',
    '/decision-log':     'Decision log',
    '/savings':          'Savings register',
  };
  return { path, label: routes[path] || 'Dashboard' };
}

function AppShell() {
  const { workbook, dispatch, saveState, markSaved } = useWorkbook();
  const [hash, setHash] = useState(window.location.hash || '#/dashboard');
  const [authorName, setAuthorName] = useState(getAuthor());
  const [showSettings, setShowSettings] = useState(!hasAuthor());
  const [loadedFilename, setLoadedFilename] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#/dashboard');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { path, label } = resolveRoute(hash);
  const firstLoad = !authorName;

  function handleSettingsClose(savedName) {
    if (savedName) setAuthorName(savedName);
    if (savedName || !firstLoad) setShowSettings(false);
  }

  async function handleLoad() {
    try {
      setLoadError(null);
      const { workbook: loaded, filename } = await loadWorkbookFromFile();
      dispatch({ type: 'WORKBOOK_LOADED', payload: loaded });
      setLoadedFilename(filename);
      markSaved();
    } catch (e) {
      if (e.message !== 'File selection cancelled.') setLoadError(e.message);
    }
  }

  function handleSave() {
    const filename = loadedFilename || 'WWRI Cost Tracker.json';
    saveWorkbookToDownload(workbook, filename);
    markSaved();
  }

  function handleScenarioChange(scenarioId) {
    dispatch({ type: 'SCENARIO_SWITCHED', payload: scenarioId });
  }

  const scenarios = Object.values(workbook.scenarios || {});

  return html`
    <div id="app">
      <${NavBar}
        route=${path}
        saveState=${saveState}
        authorName=${authorName}
        scenarios=${scenarios}
        activeScenarioId=${workbook.activeScenarioId}
        onScenarioChange=${handleScenarioChange}
        onLoad=${handleLoad}
        onSave=${handleSave}
        onSettings=${() => setShowSettings(true)}
      />
      <main class=${'app-content' + (path === '/ie-register' ? ' app-content--wide' : '')}>
        ${loadError && html`
          <div class="banner banner--error" role="alert">
            <strong>Could not load workbook:</strong> ${loadError}
            <button class="btn btn--ghost btn--sm" onClick=${() => setLoadError(null)}>Dismiss</button>
          </div>
        `}
        <${NeedsDecisionTray} />
        <${RouteContent} path=${path} />
      </main>
      ${showSettings && html`
        <${SettingsDialog}
          required=${firstLoad}
          onClose=${handleSettingsClose}
        />
      `}
    </div>
  `;
}

export function mount(root) {
  const { createRoot } = window.ReactDOM;
  const rootEl = createRoot(root);
  rootEl.render(html`
    <${ErrorBoundary}>
      <${WorkbookProvider}>
        <${AppShell} />
      <//>
    <//>
  `);
}
