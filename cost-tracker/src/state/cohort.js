import { lookupValue } from './assumptions.js';

const REGIONS = ['apac', 'americas', 'emea'];
const COHORT_FY2627 = ['ch18', 'ch19', 'ch20', 'ch21', 'ch22'];

export function scenarioRootKey(scenario) {
  if (!scenario) return 'primary_target';
  return scenario.id.replace('scenario-', '').replace(/-/g, '_');
}

// Returns total active IE headcount for yearMonth derived from cohort timing and
// scenario intake parameters. This is the load-bearing path for subscription costs.
// CH17 (FY25/26 cohort) counts if started. FY26/27 cohorts count up to the
// scenario's num_cohorts_fy2627 limit (e.g. Minimum viable = 4 → excludes CH22).
// Returns cumulative cohort intake at yearMonth. Pre-CH17 returns 0 — per-subscription
// baselines (current seat counts) are added separately in computeForecast.
export function activeCohortIEs(yearMonth, scenario, assumptions) {
  const root = scenarioRootKey(scenario);
  const iesPerCohort = lookupValue(assumptions, `scenario.${root}.ies_per_cohort`, 10);

  const ch17Month = lookupValue(assumptions, 'cohort.timing.ch17.start_month', null);
  const ch17IEs = (ch17Month && yearMonth >= ch17Month) ? iesPerCohort : 0;

  const numFy2627 = lookupValue(assumptions, `scenario.${root}.num_cohorts_fy2627`, 5);
  const fy2627IEs = COHORT_FY2627.slice(0, numFy2627).reduce((total, ch) => {
    const m = lookupValue(assumptions, `cohort.timing.${ch}.start_month`, null);
    return (m && yearMonth >= m) ? total + iesPerCohort : total;
  }, 0);

  return ch17IEs + fy2627IEs;
}

const COMPUTED_FYS = [27, 28, 29];

export function runForecastModel(assumptions, registeredCount = null) {
  const targets = {
    26: registeredCount !== null ? registeredCount : lookupValue(assumptions, 'forecast.model.target.fy26', 22),
    27: lookupValue(assumptions, 'forecast.model.target.fy27', 60),
    28: lookupValue(assumptions, 'forecast.model.target.fy28', 99),
    29: lookupValue(assumptions, 'forecast.model.target.fy29', 150),
  };
  const regionWeights = {
    apac:     lookupValue(assumptions, 'forecast.model.region_weight.apac',     0.333),
    americas: lookupValue(assumptions, 'forecast.model.region_weight.americas', 0.333),
    emea:     lookupValue(assumptions, 'forecast.model.region_weight.emea',     0.334),
  };
  const attritionRates = {
    apac:     lookupValue(assumptions, 'forecast.model.attrition_rate.apac',     0.10),
    americas: lookupValue(assumptions, 'forecast.model.attrition_rate.americas', 0.10),
    emea:     lookupValue(assumptions, 'forecast.model.attrition_rate.emea',     0.10),
  };
  const vetToShortRate     = lookupValue(assumptions, 'forecast.model.vet_to_short_rate',     0.40);
  const shortToOnboardRate = lookupValue(assumptions, 'forecast.model.short_to_onboard_rate', 0.50);
  const cohortsPerYear     = lookupValue(assumptions, 'forecast.model.cohorts_per_year',      5);

  const activeIEs = { apac: {}, americas: {}, emea: {} };
  const attrition = { apac: {}, americas: {}, emea: {} };
  const shortlist = { apac: {}, americas: {}, emea: {} };
  const longlist  = { apac: {}, americas: {}, emea: {} };
  const sourced   = { apac: {}, americas: {}, emea: {} };

  // FY26 baseline — actuals only
  for (const r of REGIONS) {
    activeIEs[r][26] = Math.round(targets[26] * regionWeights[r]);
  }

  // FY27–29 — backward pipeline per region
  for (const fy of COMPUTED_FYS) {
    for (const r of REGIONS) {
      activeIEs[r][fy] = Math.round(targets[fy] * regionWeights[r]);
      attrition[r][fy] = Math.ceil(activeIEs[r][fy - 1] * attritionRates[r]);
      shortlist[r][fy] = Math.max(activeIEs[r][fy] - activeIEs[r][fy - 1] + attrition[r][fy], 0);
      longlist[r][fy]  = shortlist[r][fy] > 0 ? Math.ceil(shortlist[r][fy] / shortToOnboardRate) : 0;
      sourced[r][fy]   = longlist[r][fy]  > 0 ? Math.ceil(longlist[r][fy]  / vetToShortRate)     : 0;
    }
  }

  // Global totals for FY27–29
  const globalTotals = {};
  for (const fy of COMPUTED_FYS) {
    globalTotals[fy] = {
      activeIEs: REGIONS.reduce((s, r) => s + activeIEs[r][fy], 0),
      attrition: REGIONS.reduce((s, r) => s + attrition[r][fy], 0),
      shortlist: REGIONS.reduce((s, r) => s + shortlist[r][fy], 0),
      longlist:  REGIONS.reduce((s, r) => s + longlist[r][fy],  0),
      sourced:   REGIONS.reduce((s, r) => s + sourced[r][fy],   0),
    };
  }

  // Sanity check: avg onboards per cohort (target band 10–15)
  const sanity = {};
  for (const fy of COMPUTED_FYS) {
    const avgOnboards = globalTotals[fy].shortlist / cohortsPerYear;
    const withinBand  = avgOnboards >= 10 && avgOnboards <= 15;
    sanity[fy] = {
      avgOnboards: Math.round(avgOnboards * 10) / 10,
      withinBand,
      band: withinBand ? 'Within band' : avgOnboards < 10 ? 'Below band' : 'Above band',
    };
  }

  return {
    params: { targets, regionWeights, attritionRates, vetToShortRate, shortToOnboardRate, cohortsPerYear },
    regions: REGIONS,
    fys: [26, ...COMPUTED_FYS],
    activeIEs, attrition, shortlist, longlist, sourced,
    globalTotals,
    sanity,
  };
}

// Phase 2 implementation.
// Signature (yearMonth, scenario, assumptions) → { apac, americas, emea } is stable.
export function monthlyHeadcountByRegion(yearMonth, scenario, assumptions) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year  = Number(yearStr);
  const month = Number(monthStr);
  // FY ends June: month 7–12 → FY starts in that calendar year; month 1–6 → FY ends in that calendar year
  const fyFull  = month >= 7 ? year + 1 : year;
  const fyShort = fyFull % 100;

  const globalTarget = lookupValue(assumptions, `forecast.model.target.fy${fyShort}`, 0);

  // FY26 baseline has no variance; FY27+ follows scenario
  const varianceFactor = fyShort <= 26 ? 1.0
    : scenario?.id === 'scenario-minimum-viable'
      ? lookupValue(assumptions, 'forecast.model.variance.min', 0.80)
    : scenario?.id === 'scenario-optimal-maximum'
      ? lookupValue(assumptions, 'forecast.model.variance.max', 1.20)
    : 1.00;

  const adjusted = Math.round(globalTarget * varianceFactor);

  const wApac     = lookupValue(assumptions, 'forecast.model.region_weight.apac',     0.333);
  const wAmericas = lookupValue(assumptions, 'forecast.model.region_weight.americas', 0.333);
  const wEmea     = lookupValue(assumptions, 'forecast.model.region_weight.emea',     0.334);

  return {
    apac:     Math.round(adjusted * wApac),
    americas: Math.round(adjusted * wAmericas),
    emea:     Math.round(adjusted * wEmea),
  };
}
