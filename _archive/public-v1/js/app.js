/**
 * app.js — Entry point: mode switcher, tab router, store initialisation
 *
 * The sole module that knows which tabs exist and routes between them.
 * Tab modules export render(container) — app.js calls them.
 */

import { init } from './shared/store.js';
import { render as renderFinanceControls } from './finance/finance-controls.js';
import { render as renderDashboard } from './finance/dashboard.js';
import { render as renderCashForecast } from './finance/cash-forecast.js';
import { render as renderRevenuePipeline } from './finance/revenue-pipeline.js';
import { render as renderFinancePrint } from './finance/finance-print.js';
import { render as renderPipelineControls } from './pipeline/pipeline-controls.js';
import { render as renderPipelineTab } from './pipeline/pipeline.js';
import { render as renderPerformance } from './pipeline/performance.js';
import { render as renderForecasting } from './pipeline/forecasting.js';
import { render as renderLeads } from './pipeline/leads.js';
import { render as renderHistory } from './pipeline/history.js';
import { render as renderPipelineReport } from './pipeline/pipeline-report.js';

const FINANCE_TABS = [
  { id: 'dashboard',        label: 'Dashboard',         story: '3.1' },
  { id: 'cash-forecast',    label: 'Cash Forecast',     story: '3.2' },
  { id: 'revenue-pipeline', label: 'Revenue Pipeline',  story: '3.5' },
  { id: 'controls',         label: 'Controls',          story: '2.1' },
  { id: 'print',            label: 'Print',             story: '4.2' }
];

const PIPELINE_TABS = [
  { id: 'pipeline',    label: 'Pipeline',    story: '5.2' },
  { id: 'performance', label: 'Performance', story: '5.3' },
  { id: 'forecasting', label: 'Forecasting', story: '5.3' },
  { id: 'leads',       label: 'Leads',       story: '5.4' },
  { id: 'history',     label: 'History',     story: '5.5' },
  { id: 'controls',    label: 'Controls',    story: '5.1' },
  { id: 'print',       label: 'Print',       story: '5.6' }
];

let currentMode = 'finance';
let currentTabId = null;

/**
 * Get the tab definitions for the current mode.
 */
function getTabsForMode(mode) {
  return mode === 'finance' ? FINANCE_TABS : PIPELINE_TABS;
}

/**
 * Render the tab bar buttons for the given mode.
 */
function renderTabBar(mode) {
  const tabs = getTabsForMode(mode);
  const tabList = document.querySelector('.tab-bar__inner');

  tabList.innerHTML = tabs.map((tab, index) => `
    <button class="tab-bar__btn${index === 0 ? ' tab-bar__btn--active' : ''}"
            type="button"
            role="tab"
            aria-selected="${index === 0}"
            data-tab-id="${tab.id}">
      ${tab.label}
    </button>
  `).join('');

  tabList.querySelectorAll('.tab-bar__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tabId);
    });
  });
}

/**
 * Switch to a tab by ID — update active state and render content.
 */
function switchTab(tabId) {
  const tabs = getTabsForMode(currentMode);
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) {
    return;
  }

  currentTabId = tabId;

  // Update active tab button
  const tabList = document.querySelector('.tab-bar__inner');
  tabList.querySelectorAll('.tab-bar__btn').forEach(btn => {
    const isActive = btn.dataset.tabId === tabId;
    btn.classList.toggle('tab-bar__btn--active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  // Render tab content
  renderTabContent(tab);
}

/**
 * Render tab content — delegates to real module if implemented, else placeholder.
 */
function renderTabContent(tab) {
  const content = document.getElementById('app-content');

  // Implemented tab modules
  if (currentMode === 'finance' && tab.id === 'dashboard') {
    renderDashboard(content);
    return;
  }
  if (currentMode === 'finance' && tab.id === 'cash-forecast') {
    renderCashForecast(content);
    return;
  }
  if (currentMode === 'finance' && tab.id === 'revenue-pipeline') {
    renderRevenuePipeline(content);
    return;
  }
  if (currentMode === 'finance' && tab.id === 'print') {
    renderFinancePrint(content);
    return;
  }
  if (currentMode === 'finance' && tab.id === 'controls') {
    renderFinanceControls(content);
    return;
  }
  if (currentMode === 'pipeline' && tab.id === 'pipeline') {
    renderPipelineTab(content);
    return;
  }
  if (currentMode === 'pipeline' && tab.id === 'performance') {
    renderPerformance(content);
    return;
  }
  if (currentMode === 'pipeline' && tab.id === 'forecasting') {
    renderForecasting(content);
    return;
  }
  if (currentMode === 'pipeline' && tab.id === 'leads') {
    renderLeads(content);
    return;
  }
  if (currentMode === 'pipeline' && tab.id === 'history') {
    renderHistory(content);
    return;
  }
  if (currentMode === 'pipeline' && tab.id === 'controls') {
    renderPipelineControls(content);
    return;
  }
  if (currentMode === 'pipeline' && tab.id === 'print') {
    renderPipelineReport(content);
    return;
  }

  // Placeholder for tabs not yet implemented
  const modeLabel = currentMode === 'finance' ? 'Finance Report' : 'Pipeline Report';

  content.innerHTML = `
    <div class="tab-placeholder">
      <h2>${tab.label}</h2>
      <p>${modeLabel} — ${tab.label} tab</p>
      <p class="tab-placeholder__note">Coming in Story ${tab.story}</p>
    </div>
  `;
}

/**
 * Switch between Finance and Pipeline modes.
 */
function switchMode(mode) {
  if (mode === currentMode) {
    return;
  }

  currentMode = mode;

  // Update mode switcher buttons
  document.querySelectorAll('.mode-switcher__btn').forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('mode-switcher__btn--active', isActive);
    btn.setAttribute('aria-checked', isActive);
  });

  // Render new tab bar and switch to first tab
  renderTabBar(mode);
  const tabs = getTabsForMode(mode);
  switchTab(tabs[0].id);
}

/**
 * Initialise the application.
 */
async function startup() {
  await init();

  // Set up mode switcher
  document.querySelectorAll('.mode-switcher__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode(btn.dataset.mode);
    });
  });

  // Render initial state — Finance mode, Dashboard tab
  renderTabBar('finance');
  switchTab('dashboard');
}

document.addEventListener('DOMContentLoaded', startup);
