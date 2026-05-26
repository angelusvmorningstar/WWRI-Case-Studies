import { ValidationError, CODES } from '../shared/errors.js';
import { getAuthor } from './identity.js';

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export const STATUS = {
  PROPOSED:          'Proposed',
  UNDER_DISCUSSION:  'Under Discussion',
  RESOLVED:          'Resolved',
  SUPERSEDED:        'Superseded',
  WITHDRAWN:         'Withdrawn',
};

const ALLOWED_TRANSITIONS = {
  [STATUS.PROPOSED]:         [STATUS.UNDER_DISCUSSION, STATUS.RESOLVED, STATUS.WITHDRAWN],
  [STATUS.UNDER_DISCUSSION]: [STATUS.RESOLVED, STATUS.WITHDRAWN],
  [STATUS.RESOLVED]:         [STATUS.SUPERSEDED, STATUS.WITHDRAWN],
  [STATUS.SUPERSEDED]:       [],
  [STATUS.WITHDRAWN]:        [],
};

export const CONFIDENCE = {
  HIGH:        'high',
  MEDIUM:      'medium',
  LOW:         'low',
  PLACEHOLDER: 'placeholder',
};

export const CATEGORIES = [
  'Headcount', 'Subscription cost', 'Licence count',
  'Scenario input', 'FX rate', 'Attribution rate',
  'HubSpot', 'Renewal', 'Savings', 'Governance',
];

// ── Factory ───────────────────────────────────────────────────────────────────

export function createAssumption(fields) {
  const {
    key, label, value, unit = '',
    category = 'Subscription cost',
    rationale = '', source = '',
    confidence = CONFIDENCE.PLACEHOLDER,
    effective_from = new Date().toISOString().slice(0, 10),
    effective_to = null,
    applies_to = [],
    tags = [],
  } = fields;

  if (!key)   throw new ValidationError(CODES.ASSUMPTION_KEY_REQUIRED,   'key is required', ['key']);
  if (!label) throw new ValidationError(CODES.ASSUMPTION_LABEL_REQUIRED, 'label is required', ['label']);
  if (value === undefined || value === null)
              throw new ValidationError(CODES.ASSUMPTION_VALUE_REQUIRED, 'value is required', ['value']);

  return {
    id: crypto.randomUUID(),
    key,
    label,
    value,
    unit,
    category,
    rationale,
    source,
    confidence,
    status: STATUS.PROPOSED,
    author: getAuthor() || 'Unknown',
    decided_on: new Date().toISOString(),
    effective_from,
    effective_to,
    applies_to,
    tags,
    supersedes: null,
    superseded_by: null,
  };
}

// ── Lifecycle transitions ─────────────────────────────────────────────────────

export function resolveAssumption(assumption, { rationale, source, confidence, decided_on } = {}) {
  const r = rationale ?? assumption.rationale;
  const s = source    ?? assumption.source;

  if (!r || !r.trim())
    throw new ValidationError(CODES.ASSUMPTION_RATIONALE_REQUIRED,
      'Rationale is required to resolve an assumption.', ['rationale']);
  if (!s || !s.trim())
    throw new ValidationError(CODES.ASSUMPTION_SOURCE_REQUIRED,
      'Source is required to resolve an assumption.', ['source']);

  assertTransition(assumption.status, STATUS.RESOLVED);

  return {
    ...assumption,
    status:    STATUS.RESOLVED,
    rationale: r.trim(),
    source:    s.trim(),
    confidence: confidence ?? assumption.confidence,
    decided_on: decided_on ?? new Date().toISOString(),
  };
}

export function markUnderDiscussion(assumption) {
  assertTransition(assumption.status, STATUS.UNDER_DISCUSSION);
  return { ...assumption, status: STATUS.UNDER_DISCUSSION };
}

export function withdrawAssumption(assumption) {
  assertTransition(assumption.status, STATUS.WITHDRAWN);
  return { ...assumption, status: STATUS.WITHDRAWN };
}

function assertTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new ValidationError(
      CODES.INVALID_LIFECYCLE_TRANSITION,
      `Cannot transition assumption from ${from} to ${to}.`,
    );
  }
}

// ── Auto-supersession ─────────────────────────────────────────────────────────
// Returns { next, prior } payload for ASSUMPTION_SUPERSEDED dispatch, or null if
// no prior Resolved assumption exists for the same key.

export function buildSupersessionPayload(assumptions, newResolved) {
  const priorEntry = Object.values(assumptions).find(
    a => a.key === newResolved.key && a.status === STATUS.RESOLVED,
  );

  if (!priorEntry) return null;

  const effectiveFrom = newResolved.effective_from
    ?? new Date().toISOString().slice(0, 10);

  const priorEffectiveTo = subtractOneDay(effectiveFrom);

  const prior = {
    ...priorEntry,
    status:       STATUS.SUPERSEDED,
    effective_to: priorEffectiveTo,
    superseded_by: newResolved.id,
  };

  const next = {
    ...newResolved,
    supersedes: priorEntry.id,
  };

  return { next, prior };
}

function subtractOneDay(isoDateString) {
  const d = new Date(isoDateString);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ── Lookup (pure, reads from workbook.assumptions map) ───────────────────────

export function lookupAssumption(assumptions, key) {
  const resolved = Object.values(assumptions).find(
    a => a.key === key && a.status === STATUS.RESOLVED,
  );
  return resolved ?? null;
}

export function lookupValue(assumptions, key, fallback = null) {
  return lookupAssumption(assumptions, key)?.value ?? fallback;
}

// ── Supersession chain ────────────────────────────────────────────────────────

export function supersessionChain(assumptions, assumptionId) {
  const chain = [];
  let current = assumptions[assumptionId];
  while (current?.supersedes) {
    const prior = assumptions[current.supersedes];
    if (prior) chain.push(prior);
    current = prior;
  }
  return chain;
}
