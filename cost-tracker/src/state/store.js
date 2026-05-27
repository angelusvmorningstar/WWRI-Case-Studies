const {
  createContext, useContext, useReducer, useEffect,
  useCallback, useState, createElement: h,
} = window.__WWCT__;

const LS_WORKBOOK = 'wwct_workbook';
const LS_DIRTY    = 'wwct_dirty';

// ── Initial workbook shape ────────────────────────────────────────────────────

export function emptyWorkbook() {
  return {
    schemaVersion: 1,
    workbookId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeScenarioId: 'scenario-primary-target',
    scenarios: {},
    assumptions: {},
    subscriptions: {},
    monthlyEntries: {},
    opportunities: {},
    renewals: {},
    exportLog: [],
    ieRegister: {},
    intakeSchedule: [],   // ["YYYY-MM", ...] — months with a planned IE cohort intake
  };
}

function loadCached() {
  try {
    const raw = localStorage.getItem(LS_WORKBOOK);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.schemaVersion === 1 ? parsed : null;
  } catch {
    return null;
  }
}

// In bundled/distributed builds, the seed workbook is embedded on window so
// first-time users see populated state without needing to load a file.
function loadEmbeddedSeed() {
  try {
    const seed = typeof window !== 'undefined' && window.__WWCT_SEED__;
    if (!seed || seed.schemaVersion !== 1) return null;
    return seed;
  } catch {
    return null;
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function workbookReducer(state, action) {
  switch (action.type) {
    case 'WORKBOOK_LOADED':
      return { ...action.payload };

    case 'WORKBOOK_RESET':
      return emptyWorkbook();

    case 'ASSUMPTION_PROPOSED': {
      const a = action.payload;
      return {
        ...state,
        assumptions: { ...state.assumptions, [a.id]: a },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'ASSUMPTION_UPDATED': {
      const a = action.payload;
      return {
        ...state,
        assumptions: { ...state.assumptions, [a.id]: a },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'ASSUMPTION_SUPERSEDED': {
      const { next, prior } = action.payload;
      return {
        ...state,
        assumptions: {
          ...state.assumptions,
          [next.id]: next,
          [prior.id]: prior,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'SUBSCRIPTION_SAVED': {
      const { subscription, costAssumption } = action.payload;
      return {
        ...state,
        subscriptions: { ...state.subscriptions, [subscription.id]: subscription },
        assumptions: costAssumption
          ? { ...state.assumptions, [costAssumption.id]: costAssumption }
          : state.assumptions,
        updatedAt: new Date().toISOString(),
      };
    }

    case 'MONTHLY_ENTRIES_BATCH_UPDATED': {
      const entries = action.payload; // array of entry objects
      const updated = { ...state.monthlyEntries };
      for (const entry of entries) {
        updated[`${entry.subscriptionId}_${entry.yearMonth}`] = entry;
      }
      return { ...state, monthlyEntries: updated, updatedAt: new Date().toISOString() };
    }

    case 'MONTHLY_ENTRY_UPSERTED': {
      const entry = action.payload;
      const entryKey = `${entry.subscriptionId}_${entry.yearMonth}`;
      return {
        ...state,
        monthlyEntries: { ...state.monthlyEntries, [entryKey]: entry },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'SCENARIO_SWITCHED':
      return { ...state, activeScenarioId: action.payload, updatedAt: new Date().toISOString() };

    case 'INTAKE_SCHEDULE_UPDATED':
      return { ...state, intakeSchedule: action.payload, updatedAt: new Date().toISOString() };

    case 'SUBSCRIPTION_ARCHIVED': {
      const id = action.payload;
      const sub = state.subscriptions[id];
      if (!sub) return state;
      return {
        ...state,
        subscriptions: {
          ...state.subscriptions,
          [id]: { ...sub, status: 'archived' },
        },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'OPPORTUNITY_SAVED': {
      const opp = action.payload;
      return {
        ...state,
        opportunities: { ...(state.opportunities || {}), [opp.id]: opp },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'OPPORTUNITY_STATUS_CHANGED': {
      const { id, status } = action.payload;
      const existing = (state.opportunities || {})[id];
      if (!existing) return state;
      return {
        ...state,
        opportunities: {
          ...(state.opportunities || {}),
          [id]: { ...existing, status },
        },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'RENEWAL_UPSERTED': {
      const renewal = action.payload;
      return {
        ...state,
        renewals: { ...(state.renewals || {}), [renewal.subId]: renewal },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'RENEWAL_DOCUMENT_ADDED': {
      const { subId, doc } = action.payload;
      const existing = (state.renewals || {})[subId] || { subId, status: 'pending', notes: '', statusLog: [], documents: [] };
      return {
        ...state,
        renewals: {
          ...(state.renewals || {}),
          [subId]: { ...existing, documents: [...(existing.documents || []), doc] },
        },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'RENEWAL_DOCUMENT_REMOVED': {
      const { subId, docId } = action.payload;
      const existing = (state.renewals || {})[subId];
      if (!existing) return state;
      return {
        ...state,
        renewals: {
          ...(state.renewals || {}),
          [subId]: { ...existing, documents: (existing.documents || []).filter(d => d.id !== docId) },
        },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'EXPORT_LOG_APPENDED': {
      const entry = action.payload;
      return {
        ...state,
        exportLog: [...(state.exportLog || []), entry],
        updatedAt: new Date().toISOString(),
      };
    }

    case 'IE_SAVED': {
      const ie = action.payload;
      return {
        ...state,
        ieRegister: { ...(state.ieRegister || {}), [ie.id]: ie },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'IE_DEACTIVATED': {
      const id = action.payload;
      const ie = (state.ieRegister || {})[id];
      if (!ie) return state;
      return {
        ...state,
        ieRegister: { ...(state.ieRegister || {}), [id]: { ...ie, active: false } },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'IE_REACTIVATED': {
      const id = action.payload;
      const ie = (state.ieRegister || {})[id];
      if (!ie) return state;
      return {
        ...state,
        ieRegister: { ...(state.ieRegister || {}), [id]: { ...ie, active: true } },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'IE_DELETED': {
      const id = action.payload;
      const reg = { ...(state.ieRegister || {}) };
      delete reg[id];
      return { ...state, ieRegister: reg, updatedAt: new Date().toISOString() };
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

export const WorkbookContext = createContext(null);

export function WorkbookProvider({ children }) {
  const cached = loadCached();
  const seed = loadEmbeddedSeed();
  // Merge seed ieRegister into cached workbook by ID — seed IEs that don't
  // exist in the cache are added; existing cached IEs (with edits) are kept as-is.
  let initial;
  if (!cached) {
    initial = seed ?? emptyWorkbook();
  } else if (seed?.ieRegister) {
    const cachedReg = cached.ieRegister ?? {};
    const merged = { ...seed.ieRegister, ...cachedReg };
    initial = { ...cached, ieRegister: merged };
  } else {
    initial = cached;
  }
  const [workbook, dispatch] = useReducer(workbookReducer, initial);
  const [saveState, setSaveState] = useState(cached ? 'cached' : (seed ? 'cached' : 'saved'));
  const [skipFirst, setSkipFirst] = useState(true);

  useEffect(() => {
    if (skipFirst) { setSkipFirst(false); return; }
    try {
      localStorage.setItem(LS_WORKBOOK, JSON.stringify(workbook));
      localStorage.setItem(LS_DIRTY, '1');
      setSaveState('dirty');
    } catch (e) {
      console.error('[WWCT] localStorage write failed:', e);
    }
  }, [workbook]);

  const markSaved = useCallback(() => {
    localStorage.removeItem(LS_DIRTY);
    setSaveState('saved');
  }, []);

  return h(
    WorkbookContext.Provider,
    { value: { workbook, dispatch, saveState, markSaved } },
    children,
  );
}

export function useWorkbook() {
  const ctx = useContext(WorkbookContext);
  if (!ctx) throw new Error('useWorkbook must be used inside WorkbookProvider');
  return ctx;
}
