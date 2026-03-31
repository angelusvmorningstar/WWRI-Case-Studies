// Costing calculation engine — pure functions, shared between client and server
// Ported from WWRI-costing.html prototype

export interface PhaseExpertInput {
  dailyFee: number;
  actualFee: number | null;
  daysPerWeek: number;
  weeklyDays: (number | null)[];
  weeks: number;
}

export interface PhaseServiceInput {
  weeklyFee: number;
  weeklyActive: number[];
  weeks: number;
}

export interface PhaseResult {
  profFees: number;
  svcFees: number;
  wwriAmt: number;
  projectSubtotal: number;
  referralFee: number;
  clientCharge: number;
  experts: {
    days: number;
    rate: number;
    profFee: number;
    wwriContrib: number;
    clientCharge: number;
  }[];
  services: {
    weeks: number;
    fee: number;
    wwriContrib: number;
    charge: number;
  }[];
}

export interface ProjectResult {
  totals: {
    profFees: number;
    svcFees: number;
    wwriAmt: number;
    projectSubtotal: number;
    referralFee: number;
    clientCharge: number;
  };
  phases: (PhaseResult | null)[];
}

export function calcExpertDays(expert: PhaseExpertInput): number {
  let total = 0;
  for (let w = 0; w < expert.weeks; w++) {
    const dayVal = expert.weeklyDays[w];
    total += dayVal !== null && dayVal !== undefined ? dayVal : expert.daysPerWeek;
  }
  return total;
}

export function calcPhase(
  experts: PhaseExpertInput[],
  services: PhaseServiceInput[],
  wwriPct: number,
  referralPct: number
): PhaseResult {
  const feesShare = 1 - wwriPct;

  const expertResults = experts.map((exp) => {
    const days = calcExpertDays(exp);
    const rate = exp.actualFee !== null && exp.actualFee !== undefined ? exp.actualFee : exp.dailyFee;
    const profFee = days * rate;
    const wwriContrib = feesShare > 0 ? (profFee / feesShare) * wwriPct : 0;
    const clientCharge = profFee + wwriContrib;
    return { days, rate, profFee, wwriContrib, clientCharge };
  });

  const serviceResults = services.map((svc) => {
    const weeks = svc.weeklyActive.reduce((sum, v) => sum + (v || 0), 0);
    const fee = weeks * svc.weeklyFee;
    const wwriContrib = feesShare > 0 ? (fee / feesShare) * wwriPct : 0;
    const charge = fee + wwriContrib;
    return { weeks, fee, wwriContrib, charge };
  });

  const profFees = expertResults.reduce((sum, e) => sum + e.profFee, 0);
  const svcFees = serviceResults.reduce((sum, s) => sum + s.fee, 0);
  const wwriAmt = expertResults.reduce((sum, e) => sum + e.wwriContrib, 0) +
    serviceResults.reduce((sum, s) => sum + s.wwriContrib, 0);
  const projectSubtotal = profFees + svcFees + wwriAmt;
  const referralFee = projectSubtotal * referralPct;
  const clientCharge = projectSubtotal + referralFee;

  return {
    profFees,
    svcFees,
    wwriAmt,
    projectSubtotal,
    referralFee,
    clientCharge,
    experts: expertResults,
    services: serviceResults,
  };
}

export function calcTotals(
  phases: { active: boolean; experts: PhaseExpertInput[]; services: PhaseServiceInput[] }[],
  wwriPct: number,
  referralPct: number
): ProjectResult {
  const phaseResults = phases.map((p) =>
    p.active ? calcPhase(p.experts, p.services, wwriPct, referralPct) : null
  );

  const totals = {
    profFees: 0,
    svcFees: 0,
    wwriAmt: 0,
    projectSubtotal: 0,
    referralFee: 0,
    clientCharge: 0,
  };

  for (const pr of phaseResults) {
    if (!pr) continue;
    totals.profFees += pr.profFees;
    totals.svcFees += pr.svcFees;
    totals.wwriAmt += pr.wwriAmt;
    totals.projectSubtotal += pr.projectSubtotal;
    totals.referralFee += pr.referralFee;
    totals.clientCharge += pr.clientCharge;
  }

  return { totals, phases: phaseResults };
}

export function formatCurrency(n: number, currency: string = "AUD"): string {
  const symbol = { AUD: "$", USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "$", CNH: "¥", NZD: "$", SGD: "$" }[currency] || "$";
  return `${symbol}${Math.round(n).toLocaleString("en-AU")}`;
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}
