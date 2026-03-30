/**
 * store.js — Data access wrapper for localStorage
 *
 * The sole gateway to localStorage in the application.
 * Maps clean key names to existing localStorage keys for backward compatibility
 * with data from the monolithic WWRI-toolkit.html.
 *
 * No other module should use localStorage directly.
 */

const STORAGE_KEYS = {
  deals:            'ww_db2',
  importLog:        'ww_log2',
  baselines:        'ww_bl2',
  snapshots:        'ww_snaps2',
  leads:            'ww_leads2',
  balanceSheet:     'ww_bs',
  profitLoss:       'ww_pl',
  revenue:          'ww_rev',
  expenses:         'ww_exp',
  clientDefaults:   'ww_ref',
  fxRates:          'ww_fx',
  xeroImport:       'ww_xero2',
  stageDefinitions: 'ww_sprobs2',
  lastUpdated:      'ww_lastup'
};

const SEED_FILES = {
  fxRates:          './data/fx-rates.json',
  stageDefinitions: './data/stage-definitions.json',
  expenses:         './data/expense-categories.json',
  clientDefaults:   './data/client-defaults.json',
  revenue:          './data/seed-revenue.json',
  snapshots:        './data/seed-snapshots.json',
  balanceSheet:     './data/seed-balance-sheet.json',
  profitLoss:       './data/seed-profit-loss.json',
  leads:            './data/seed-leads.json'
};

/**
 * Get data for a mapped key.
 * @param {string} key - Clean key name (e.g., 'deals', 'fxRates')
 * @returns {*} Parsed JSON data, or null if not found or corrupted
 */
function get(key) {
  const realKey = STORAGE_KEYS[key];
  if (!realKey) {
    return null;
  }

  try {
    const raw = localStorage.getItem(realKey);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Set data for a mapped key.
 * @param {string} key - Clean key name (e.g., 'deals', 'fxRates')
 * @param {*} data - Data to store (will be JSON-stringified)
 * @returns {{ ok: boolean, error?: string }}
 */
function set(key, data) {
  const realKey = STORAGE_KEYS[key];
  if (!realKey) {
    return { ok: false, error: `Unknown storage key: ${key}` };
  }

  try {
    localStorage.setItem(realKey, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Storage write failed for '${key}': ${err.message}` };
  }
}

/**
 * Get all mapped keys and their current values.
 * @returns {Object} Object with clean key names and their parsed values
 */
function getAll() {
  const result = {};
  for (const key of Object.keys(STORAGE_KEYS)) {
    result[key] = get(key);
  }
  return result;
}

/**
 * Remove all mapped keys from localStorage.
 */
function clear() {
  for (const realKey of Object.values(STORAGE_KEYS)) {
    try {
      localStorage.removeItem(realKey);
    } catch {
      // Ignore removal errors
    }
  }
}

/**
 * Initialise the store — load seed data for any key that has no existing value.
 * Must be called once at app startup before any tab renders.
 * @returns {Promise<void>}
 */
async function init() {
  for (const [key, path] of Object.entries(SEED_FILES)) {
    if (get(key) !== null) {
      continue;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      set(key, data);
    } catch {
      // Seed file fetch failed — non-critical, key stays null
    }
  }
}

export { get, set, getAll, clear, init };
