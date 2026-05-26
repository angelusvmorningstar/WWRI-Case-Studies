import { lookupValue } from '../../state/assumptions.js';
import { FY_2627_MONTHS } from '../../state/compute.js';

const HS_COHORTS = ['ch18', 'ch19', 'ch20'];

function scenarioRoot(scenario) {
  return scenario
    ? scenario.id.replace('scenario-', '').replace(/-/g, '_')
    : 'primary_target';
}

function cohortSeatCost(assumptions, scenario, perSeatDiscountedRate) {
  const root = scenarioRoot(scenario);
  const seatsPerCohort = lookupValue(assumptions, `scenario.${root}.hubspot_seats_per_cohort`, 5);
  let total = 0;
  for (const cohort of HS_COHORTS) {
    const startMonth = lookupValue(assumptions, `cohort.timing.hubspot.${cohort}.start_month`, null);
    if (!startMonth) continue;
    const activeMonths = FY_2627_MONTHS.filter(ym => ym >= startMonth).length;
    total += activeMonths * seatsPerCohort * perSeatDiscountedRate;
  }
  return total;
}

function compositionString(parts) {
  return parts.filter(Boolean).join(' · ');
}

export function computeArchitectureMetrics(assumptions, scenario, discountOverride = null) {
  const discount = discountOverride ?? lookupValue(assumptions, 'hubspot.discount_rate', 0.40);
  const onboardingFee = lookupValue(assumptions, 'hubspot.arch.onboarding_fee_aud', 1500);

  // Architecture F
  const fListMonthly = lookupValue(assumptions, 'hubspot.arch.f.bundle_list_monthly_aud', 1836);
  const fCoreSeatList = lookupValue(assumptions, 'hubspot.arch.f.core_seat_list_price_aud', 80);
  const fBaseSeatCount = lookupValue(assumptions, 'hubspot.arch.f.base_seat_count', 12);
  const fBundleAnnual = fListMonthly * (1 - discount) * 12;
  const fCohortRate = fCoreSeatList * (1 - discount);
  const fCohortCost = cohortSeatCost(assumptions, scenario, fCohortRate);
  const fTotal = fBundleAnnual + fCohortCost;

  // Architecture 1
  const a1SeatList = lookupValue(assumptions, 'hubspot.arch.1.seat_list_price_aud', 20);
  const a1SeatCount = lookupValue(assumptions, 'hubspot.arch.1.base_seat_count', 7);
  const a1BundleAnnual = a1SeatList * (1 - discount) * a1SeatCount * 12;
  const a1CohortRate = a1SeatList * (1 - discount);
  const a1CohortCost = cohortSeatCost(assumptions, scenario, a1CohortRate);
  const a1Total = a1BundleAnnual + a1CohortCost;

  // Architecture 2
  const a2ProList = lookupValue(assumptions, 'hubspot.arch.2.pro_seat_list_price_aud', 100);
  const a2CoreList = lookupValue(assumptions, 'hubspot.arch.2.core_seat_list_price_aud', 50);
  const a2ProCount = lookupValue(assumptions, 'hubspot.arch.2.pro_seat_count', 1);
  const a2CoreCount = lookupValue(assumptions, 'hubspot.arch.2.core_seat_count', 6);
  const a2BundleAnnual = (a2ProList * a2ProCount + a2CoreList * a2CoreCount) * (1 - discount) * 12;
  const a2CohortRate = a2CoreList * (1 - discount);
  const a2CohortCost = cohortSeatCost(assumptions, scenario, a2CohortRate);
  const a2Total = a2BundleAnnual + a2CohortCost + onboardingFee;

  // Architecture 3
  const a3ProList = lookupValue(assumptions, 'hubspot.arch.3.pro_seat_list_price_aud', 100);
  const a3ProCount = lookupValue(assumptions, 'hubspot.arch.3.pro_seat_count', 7);
  const a3BundleAnnual = a3ProList * (1 - discount) * a3ProCount * 12;
  const a3CohortRate = a3ProList * (1 - discount);
  const a3CohortCost = cohortSeatCost(assumptions, scenario, a3CohortRate);
  const a3Total = a3BundleAnnual + a3CohortCost + onboardingFee;

  const discountPct = Math.round(discount * 100);

  return [
    {
      id: 'F',
      label: 'Architecture F',
      badge: 'Current',
      bundleAnnual: fBundleAnnual,
      cohortSeatCost: fCohortCost,
      onboardingFee: 0,
      yearOneTotal: fTotal,
      savingVsF: 0,
      compositionString: compositionString([
        `5 Hub seats + ${fBaseSeatCount - 5} Pro Core seats (${fBaseSeatCount} total)`,
        `AUD ${fCoreSeatList}/seat/mo list`,
        `${discountPct}% renewal discount`,
      ]),
    },
    {
      id: '1',
      label: 'Architecture 1',
      badge: null,
      bundleAnnual: a1BundleAnnual,
      cohortSeatCost: a1CohortCost,
      onboardingFee: 0,
      yearOneTotal: a1Total,
      savingVsF: fTotal - a1Total,
      compositionString: compositionString([
        `${a1SeatCount} Sales Hub Starter Core seats`,
        `AUD ${a1SeatList}/seat/mo list`,
        `${discountPct}% renewal discount`,
      ]),
    },
    {
      id: '2',
      label: 'Architecture 2',
      badge: null,
      bundleAnnual: a2BundleAnnual,
      cohortSeatCost: a2CohortCost,
      onboardingFee,
      yearOneTotal: a2Total,
      savingVsF: fTotal - a2Total,
      compositionString: compositionString([
        `${a2ProCount} Sales Pro seat + ${a2CoreCount} Pro Core seats`,
        `AUD ${a2ProList} + AUD ${a2CoreList}/seat/mo list`,
        `AUD ${onboardingFee.toLocaleString()} onboarding`,
        `${discountPct}% renewal discount`,
      ]),
    },
    {
      id: '3',
      label: 'Architecture 3',
      badge: null,
      bundleAnnual: a3BundleAnnual,
      cohortSeatCost: a3CohortCost,
      onboardingFee,
      yearOneTotal: a3Total,
      savingVsF: fTotal - a3Total,
      compositionString: compositionString([
        `${a3ProCount} Sales Pro seats`,
        `AUD ${a3ProList}/seat/mo list`,
        `AUD ${onboardingFee.toLocaleString()} onboarding`,
        `${discountPct}% renewal discount`,
      ]),
    },
  ];
}
