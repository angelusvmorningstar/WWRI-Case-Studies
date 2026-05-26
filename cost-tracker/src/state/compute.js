import { lookupValue, lookupAssumption } from './assumptions.js';
import { scenarioRootKey, monthlyHeadcountByRegion } from './cohort.js';

export const MONTHS_PER_FY = 12;

function generateMonths(startYear, startMonth, count) {
  return Array.from({ length: count }, (_, i) => {
    const totalMonth = startMonth - 1 + i;
    const year = startYear + Math.floor(totalMonth / MONTHS_PER_FY);
    const month = (totalMonth % MONTHS_PER_FY) + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  });
}

export const FY_2526_MONTHS = generateMonths(2025, 7, MONTHS_PER_FY);
export const FY_2627_MONTHS = generateMonths(2026, 7, MONTHS_PER_FY);
export const ALL_MONTHS = [...FY_2526_MONTHS, ...FY_2627_MONTHS];

export const FY_GROUPS = [
  { label: 'FY 25/26', months: FY_2526_MONTHS },
  { label: 'FY 26/27', months: FY_2627_MONTHS },
];

// Convention: scenario.fx_rate.aud_<iso> = FCY per 1 AUD → FCY→AUD = nativeAmount / rate
// Example: aud_usd = 0.645 means 1 AUD = 0.645 USD, so 1 USD = 1/0.645 ≈ 1.55 AUD
function toAud(nativeAmount, currency, assumptions) {
  if (currency === 'AUD') return nativeAmount;
  const fxKey = `scenario.fx_rate.aud_${currency.toLowerCase()}`;
  const fxRate = lookupValue(assumptions, fxKey, 1);
  return nativeAmount / fxRate;
}

export function activeStatusKey(subId) {
  return `subscription.${subId.replace(/^sub-/, '').replace(/-/g, '_')}.active_status`;
}

// Returns how many IEs in the register were active (trained + not deactivated) as at yearMonth.
// Returns null if the register is empty — callers should fall back to the cohort model.
export function registeredActiveAtMonth(ieRegister, ym) {
  const entries = Object.values(ieRegister || {});
  if (entries.length === 0) return null;
  return entries.filter(
    ie => ie.active !== false && ie.training && (ie.startMonth || '') <= ym
  ).length;
}

// Returns the total currently active (trained + not deactivated) IEs in the register.
// Returns null if the register is empty.
export function registeredActiveCurrent(ieRegister) {
  const entries = Object.values(ieRegister || {});
  if (entries.length === 0) return null;
  const count = entries.filter(ie => ie.active !== false && ie.training).length;
  return count > 0 ? count : null;
}

// Returns { value: AUD, nativeValue: FCY, nativeCurrency: string, primaryAssumptionKey: string }
// All inputs read from assumptions via lookupValue() — no magic numbers except MONTHS_PER_FY.
// scenario: the active scenario object (workbook.scenarios[activeScenarioId]) or null.
// totalIEOverride: when provided (non-null), replaces baseline+cohort seat calculation for
//   cohort_driven subscriptions with (totalIEOverride × attrRate). Use when the IE register
//   is the source of truth for headcount rather than the cohort model assumptions.
export function computeForecast(subscription, yearMonth, assumptions, scenario = null, totalIEOverride = null) {
  const { id, currency, cohort_driven, unit_cost_assumption_key, attribution_assumption_key, seat_count_assumption_key } = subscription;

  const activeAss = lookupAssumption(assumptions, activeStatusKey(id));
  if (activeAss?.value === 'not_active') {
    // Respect effective_from: if the pause hasn't taken effect yet for this month, treat as active
    const pauseFromYM = activeAss.effective_from ? activeAss.effective_from.slice(0, 7) : null;
    if (!pauseFromYM || yearMonth >= pauseFromYM) {
      return { value: 0, nativeValue: 0, nativeCurrency: currency || 'AUD', primaryAssumptionKey: activeStatusKey(id) };
    }
  }

  // HubSpot bundle: fixed two-phase pricing, no cohort component
  if (id === 'sub-hubspot-bundle') {
    const renewalStart = lookupValue(assumptions, 'subscription.hubspot.renewal_start_month', '2026-11');
    const value = yearMonth < renewalStart
      ? lookupValue(assumptions, 'subscription.hubspot.bundle_monthly_aud', 918)
      : lookupValue(assumptions, 'subscription.hubspot.renewal_monthly_aud', 1101.60);
    return { value, nativeValue: value, nativeCurrency: 'AUD', primaryAssumptionKey: 'subscription.hubspot.bundle_monthly_aud' };
  }

  // HubSpot cohort additions: per-seat
  // When totalIEOverride is provided (register-driven forecast model), behave like a normal
  // cohort_driven sub so the IE count flows through. Otherwise use the cohort-schedule logic.
  if (id === 'sub-hubspot-cohort' && totalIEOverride === null) {
    const cohortAdditionStart = lookupValue(assumptions, 'subscription.hubspot.cohort_addition_start_month', '2026-12');
    if (yearMonth < cohortAdditionStart) {
      return { value: 0, nativeValue: 0, nativeCurrency: 'AUD', primaryAssumptionKey: 'subscription.hubspot.per_seat_rate_aud_discounted' };
    }
    const perSeatRate = lookupValue(assumptions, 'subscription.hubspot.per_seat_rate_aud_discounted', 48);
    const scenarioRoot = scenarioRootKey(scenario);
    const seatsPerCohort = lookupValue(assumptions, `scenario.${scenarioRoot}.hubspot_seats_per_cohort`, 5);
    // HubSpot cohort schedule lags M365 by ~3 months: CH18=Dec26, CH19=Jan27, CH20=May27
    const cohortCount = ['ch18', 'ch19', 'ch20'].reduce((n, ch) => {
      const m = lookupValue(assumptions, `cohort.timing.hubspot.${ch}.start_month`, null);
      return (m && yearMonth >= m) ? n + 1 : n;
    }, 0);
    const value = perSeatRate * cohortCount * seatsPerCohort;
    return { value, nativeValue: value, nativeCurrency: 'AUD', primaryAssumptionKey: 'subscription.hubspot.per_seat_rate_aud_discounted' };
  }

  const unitCost = lookupValue(assumptions, unit_cost_assumption_key, 0);
  let nativeCost;

  if (cohort_driven) {
    const attrRate = lookupValue(assumptions, attribution_assumption_key, 1);
    let seats;
    if (totalIEOverride !== null) {
      // Register is the source of truth — total active IEs × attribution rate
      seats = Math.round(totalIEOverride * attrRate);
    } else {
      const baselineSeats = lookupValue(assumptions, seat_count_assumption_key, 0);
      const hc = monthlyHeadcountByRegion(yearMonth, scenario, assumptions);
      const forecastIEs = hc.apac + hc.americas + hc.emea;
      seats = baselineSeats + Math.round(forecastIEs * attrRate);
    }
    nativeCost = unitCost * seats;
  } else {
    const seats = seat_count_assumption_key
      ? lookupValue(assumptions, seat_count_assumption_key, 1)
      : 1;
    nativeCost = unitCost * seats;
  }

  const value = toAud(nativeCost, currency, assumptions);
  return { value, nativeValue: nativeCost, nativeCurrency: currency, primaryAssumptionKey: unit_cost_assumption_key };
}
