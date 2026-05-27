// Shared subscription model definitions used by Forecast and Dashboard views.
// Models define which cohort subscriptions are included and what attribution
// rates are projected (overrides stored assumptions for modelling purposes).

export const SUBSCRIPTION_MODELS = {
  basic: {
    id: 'basic',
    label: 'Basic',
    description: 'M365 Basic only — no Copilot, no HubSpot cohort seat, no Miro',
    attrOverrides: {},
    // Whitelist: only these subscription IDs appear in this model
    includeSubs: ['sub-m365-basic'],
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    description: 'M365 Standard + Copilot · HubSpot core seat (1 per IE) · Miro standard',
    // Force 100% attribution so the Standard model shows full projected cost
    attrOverrides: {
      'subscription.m365_standard_ie.attribution_rate': 1.0,
      'subscription.copilot_ie.attribution_rate':       1.0,
      'subscription.miro.attribution_rate':             1.0,
      'subscription.hubspot_core.attribution_rate':     1.0,
    },
    includeSubs: ['sub-m365-standard-cohort', 'sub-copilot-cohort', 'sub-miro', 'sub-hubspot-cohort'],
  },
};

// Returns a copy of assumptions with per-key value overrides applied.
export function buildModelAssumptions(assumptions, overrides) {
  const result = { ...assumptions };
  for (const [key, value] of Object.entries(overrides)) {
    const existing = Object.values(result).find(a => a.key === key);
    if (existing) {
      result[existing.id] = { ...existing, value };
    } else {
      const id = 'model-' + key.replace(/\./g, '-');
      result[id] = { id, key, value };
    }
  }
  return result;
}
