"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { calcTotals, formatCurrency, formatPct } from "@/lib/calculations";
import type { PhaseExpertInput, PhaseServiceInput } from "@/lib/calculations";
import { loadCostingSheet, saveCostingSheet } from "@/actions/costingActions";

interface Expert {
  id: string;
  name: string;
  role: string;
  dailyFee: number;
}

interface Service {
  id: string;
  name: string;
  weeklyFee: number;
}

interface Phase {
  name: string;
  active: boolean;
  startDate: string;
  weeks: number;
  expertAllocations: { daysPerWeek: number; actualFee: number | null; weeklyDays: (number | null)[] }[];
  serviceAllocations: { weeklyActive: number[] }[];
}

const CURRENCIES = ["AUD", "USD", "EUR", "GBP", "JPY", "CAD", "CNH", "NZD", "SGD"];
const IMPOST_OPTIONS = [
  { value: "GST", label: "GST (10%)" },
  { value: "VAT", label: "VAT (10%)" },
  { value: "None", label: "None" },
];

const IMPOST_RATES: Record<string, number> = { GST: 0.10, VAT: 0.10, None: 0 };

let nextId = 1;
function genId() { return `id-${nextId++}`; }

export default function CostingPage() {
  const params = useParams();
  const opportunityId = params.id as string;
  const [isPending, startTransition] = useTransition();
  const [costingSheetId, setCostingSheetId] = useState<string | undefined>();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(true);

  // Project setup
  const [projectTitle, setProjectTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [legalEntity, setLegalEntity] = useState("");
  const [shortName, setShortName] = useState("");
  const [currency, setCurrency] = useState("AUD");
  const [govtImpost, setGovtImpost] = useState("GST");
  const [wwriPct, setWwriPct] = useState(0.30);
  const [referralPartner, setReferralPartner] = useState("");
  const [referralActive, setReferralActive] = useState(false);
  const [referralPct, setReferralPct] = useState(0.05);

  // Experts
  const [experts, setExperts] = useState<Expert[]>([
    { id: genId(), name: "Expert 1", role: "Lead", dailyFee: 3000 },
  ]);

  // Services
  const [services, setServices] = useState<Service[]>([
    { id: genId(), name: "Project Management", weeklyFee: 2000 },
  ]);

  // Phases
  const [phases, setPhases] = useState<Phase[]>([
    {
      name: "Phase 1",
      active: true,
      startDate: "",
      weeks: 4,
      expertAllocations: [{ daysPerWeek: 3, actualFee: null, weeklyDays: [null, null, null, null] }],
      serviceAllocations: [{ weeklyActive: [1, 1, 1, 1] }],
    },
  ]);

  // Active tab
  const [activeTab, setActiveTab] = useState<"setup" | "phases" | "summary">("setup");

  // Load existing costing sheet from database
  useEffect(() => {
    loadCostingSheet(opportunityId).then((sheet) => {
      if (sheet) {
        setCostingSheetId(sheet.id);
        setProjectTitle(sheet.projectTitle || "");
        setClientName(sheet.clientName || "");
        setLegalEntity(sheet.legalEntity || "");
        setShortName(sheet.shortName || "");
        setCurrency(sheet.currency);
        setGovtImpost(sheet.govtImpost);
        setWwriPct(sheet.wwriPct);
        setReferralPartner(sheet.referralPartner || "");
        setReferralActive(sheet.referralActive);
        setReferralPct(sheet.referralPct);

        if (sheet.experts.length > 0) {
          setExperts(sheet.experts.map((e) => ({
            id: e.id,
            name: e.name,
            role: e.role || "",
            dailyFee: e.dailyFee,
          })));
        }

        if (sheet.services.length > 0) {
          setServices(sheet.services.map((s) => ({
            id: s.id,
            name: s.name,
            weeklyFee: s.weeklyFee,
          })));
        }

        if (sheet.phases.length > 0) {
          setPhases(sheet.phases.map((p) => ({
            name: p.name,
            active: p.active,
            startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
            weeks: p.weeks,
            expertAllocations: sheet.experts.map((exp) => {
              const pe = p.phaseExperts.find((a) => a.expertId === exp.id);
              return {
                daysPerWeek: pe?.daysPerWeek ?? 0,
                actualFee: pe?.actualFee ?? null,
                weeklyDays: (pe?.weeklyDays as (number | null)[] | null) ?? Array(p.weeks).fill(null),
              };
            }),
            serviceAllocations: sheet.services.map((svc) => {
              const ps = p.phaseServices.find((a) => a.serviceId === svc.id);
              return {
                weeklyActive: (ps?.weeklyActive as number[] | null) ?? Array(p.weeks).fill(0),
              };
            }),
          })));
        }
      }
      setLoading(false);
    });
  }, [opportunityId]);

  // Save handler
  const handleSave = () => {
    setSaveStatus("saving");
    startTransition(async () => {
      const result = await saveCostingSheet({
        opportunityId,
        costingSheetId,
        projectTitle,
        clientName,
        legalEntity,
        shortName,
        currency,
        govtImpost,
        govtImpostRate: IMPOST_RATES[govtImpost] ?? 0.10,
        wwriPct,
        referralPartner,
        referralActive,
        referralPct,
        experts: experts.map((e) => ({ name: e.name, role: e.role, dailyFee: e.dailyFee })),
        services: services.map((s) => ({ name: s.name, weeklyFee: s.weeklyFee })),
        phases: phases.map((p, i) => ({
          name: p.name,
          active: p.active,
          startDate: p.startDate || null,
          weeks: p.weeks,
          sortOrder: i,
          expertAllocations: p.expertAllocations,
          serviceAllocations: p.serviceAllocations,
        })),
      });
      setCostingSheetId(result.id);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    });
  };

  // Sync allocations when experts/services change
  const syncAllocations = useCallback((
    newExperts: Expert[],
    newServices: Service[],
    currentPhases: Phase[]
  ): Phase[] => {
    return currentPhases.map((p) => ({
      ...p,
      expertAllocations: newExperts.map((_, ei) =>
        p.expertAllocations[ei] || { daysPerWeek: 0, actualFee: null, weeklyDays: Array(p.weeks).fill(null) }
      ),
      serviceAllocations: newServices.map((_, si) =>
        p.serviceAllocations[si] || { weeklyActive: Array(p.weeks).fill(0) }
      ),
    }));
  }, []);

  // Calculate totals
  const phaseInputs = phases.map((p) => ({
    active: p.active,
    experts: experts.map((exp, ei): PhaseExpertInput => ({
      dailyFee: exp.dailyFee,
      actualFee: p.expertAllocations[ei]?.actualFee ?? null,
      daysPerWeek: p.expertAllocations[ei]?.daysPerWeek ?? 0,
      weeklyDays: p.expertAllocations[ei]?.weeklyDays ?? Array(p.weeks).fill(null),
      weeks: p.weeks,
    })),
    services: services.map((svc, si): PhaseServiceInput => ({
      weeklyFee: svc.weeklyFee,
      weeklyActive: p.serviceAllocations[si]?.weeklyActive ?? Array(p.weeks).fill(0),
      weeks: p.weeks,
    })),
  }));

  const result = calcTotals(phaseInputs, wwriPct, referralPct);

  // Expert handlers
  const addExpert = () => {
    const newExperts = [...experts, { id: genId(), name: `Expert ${experts.length + 1}`, role: "", dailyFee: 0 }];
    setExperts(newExperts);
    setPhases(syncAllocations(newExperts, services, phases));
  };

  const removeExpert = (idx: number) => {
    if (experts.length <= 1) return;
    const newExperts = experts.filter((_, i) => i !== idx);
    setExperts(newExperts);
    setPhases((prev) => prev.map((p) => ({
      ...p,
      expertAllocations: p.expertAllocations.filter((_, i) => i !== idx),
    })));
  };

  // Service handlers
  const addService = () => {
    const newServices = [...services, { id: genId(), name: `Service ${services.length + 1}`, weeklyFee: 0 }];
    setServices(newServices);
    setPhases(syncAllocations(experts, newServices, phases));
  };

  const removeService = (idx: number) => {
    if (services.length <= 1) return;
    const newServices = services.filter((_, i) => i !== idx);
    setServices(newServices);
    setPhases((prev) => prev.map((p) => ({
      ...p,
      serviceAllocations: p.serviceAllocations.filter((_, i) => i !== idx),
    })));
  };

  // Phase handlers
  const addPhase = () => {
    if (phases.length >= 4) return;
    setPhases([...phases, {
      name: `Phase ${phases.length + 1}`,
      active: true,
      startDate: "",
      weeks: 4,
      expertAllocations: experts.map(() => ({ daysPerWeek: 0, actualFee: null, weeklyDays: [null, null, null, null] })),
      serviceAllocations: services.map(() => ({ weeklyActive: [0, 0, 0, 0] })),
    }]);
  };

  const updatePhaseWeeks = (pi: number, weeks: number) => {
    setPhases((prev) => prev.map((p, i) => {
      if (i !== pi) return p;
      return {
        ...p,
        weeks,
        expertAllocations: p.expertAllocations.map((ea) => ({
          ...ea,
          weeklyDays: Array(weeks).fill(null).map((_, w) => ea.weeklyDays[w] ?? null),
        })),
        serviceAllocations: p.serviceAllocations.map((sa) => ({
          ...sa,
          weeklyActive: Array(weeks).fill(0).map((_, w) => sa.weeklyActive[w] ?? 0),
        })),
      };
    }));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-ww-text-muted">Loading costing sheet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/opportunity/${opportunityId}/m2`} className="text-sm text-ww-teal no-underline hover:underline">
            &larr; Back to M2
          </Link>
          <h1 className="text-lg font-semibold text-ww-text">Costing Sheet</h1>
          {shortName && <Badge variant="teal">{shortName}</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "saved" && (
            <span className="text-sm text-ww-green font-medium">Saved</span>
          )}
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ww-border mb-6">
        {(["setup", "phases", "summary"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === tab
                ? "text-ww-teal border-ww-teal"
                : "text-ww-text-muted border-transparent hover:text-ww-text-secondary"
            }`}
          >
            {tab === "setup" ? "Project Setup" : tab === "phases" ? "Phases & Allocation" : "Summary"}
          </button>
        ))}
      </div>

      {/* Sticky Summary Bar */}
      <div className="sticky top-14 z-40 bg-ww-surface border border-ww-border rounded-lg px-4 py-2 mb-6 flex items-center gap-6 text-sm">
        <div>
          <span className="text-ww-text-muted text-[11px] uppercase tracking-wider">Prof Fees</span>
          <div className="font-mono font-semibold text-ww-text">{formatCurrency(result.totals.profFees, currency)}</div>
        </div>
        <div>
          <span className="text-ww-text-muted text-[11px] uppercase tracking-wider">Services</span>
          <div className="font-mono font-semibold text-ww-text">{formatCurrency(result.totals.svcFees, currency)}</div>
        </div>
        <div>
          <span className="text-ww-text-muted text-[11px] uppercase tracking-wider">WWRI ({formatPct(wwriPct)})</span>
          <div className="font-mono font-semibold text-ww-teal">{formatCurrency(result.totals.wwriAmt, currency)}</div>
        </div>
        <div>
          <span className="text-ww-text-muted text-[11px] uppercase tracking-wider">Referral</span>
          <div className="font-mono font-semibold text-ww-text">{formatCurrency(result.totals.referralFee, currency)}</div>
        </div>
        <div className="ml-auto">
          <span className="text-ww-text-muted text-[11px] uppercase tracking-wider">Client Charge</span>
          <div className="font-mono font-semibold text-lg text-ww-teal">{formatCurrency(result.totals.clientCharge, currency)}</div>
        </div>
      </div>

      {/* === PROJECT SETUP TAB === */}
      {activeTab === "setup" && (
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="text-md font-semibold text-ww-text mb-4">Project Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Project Title" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
              <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <Input label="Legal Entity" value={legalEntity} onChange={(e) => setLegalEntity(e.target.value)} />
              <Input label="Short Name" value={shortName} onChange={(e) => setShortName(e.target.value)} />
              <div className="flex gap-4">
                <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
                <Select label="Tax" value={govtImpost} onChange={(e) => setGovtImpost(e.target.value)}>
                  {IMPOST_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-md font-semibold text-ww-text mb-4">Financial Parameters</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="ww-label block">WWRI %</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="100" step="1"
                    value={wwriPct * 100}
                    onChange={(e) => setWwriPct(Number(e.target.value) / 100)}
                    className="w-20 px-2 py-2 border border-ww-border rounded-[6px] text-[13px] font-mono text-right outline-none focus:border-ww-teal"
                  />
                  <span className="text-sm text-ww-text-muted">%</span>
                  {wwriPct !== 0.3 && <Badge variant="amber">Non-standard</Badge>}
                </div>
              </div>
              <div>
                <label className="ww-label block">Referral Partner</label>
                <Input value={referralPartner} onChange={(e) => setReferralPartner(e.target.value)} placeholder="Name (leave empty if none)" />
              </div>
              {referralPartner && (
                <div>
                  <label className="ww-label block">Referral Fee</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-sm text-ww-text-secondary cursor-pointer">
                      <input type="checkbox" checked={referralActive} onChange={(e) => {
                        setReferralActive(e.target.checked);
                        setReferralPct(e.target.checked ? 0.10 : 0.05);
                      }} />
                      Active involvement
                    </label>
                    <span className="font-mono text-sm">{formatPct(referralPct)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-semibold text-ww-text">Experts</h2>
              <Button size="sm" onClick={addExpert}>Add Expert</Button>
            </div>
            <div className="flex flex-col gap-3">
              {experts.map((exp, i) => (
                <div key={exp.id} className="flex items-end gap-3">
                  <Input label={i === 0 ? "Name" : undefined} value={exp.name}
                    onChange={(e) => setExperts((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <Input label={i === 0 ? "Role" : undefined} value={exp.role}
                    onChange={(e) => setExperts((prev) => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} />
                  <div>
                    {i === 0 && <label className="ww-label block">Daily Fee</label>}
                    <input type="number" min="0" step="100" value={exp.dailyFee}
                      onChange={(e) => setExperts((prev) => prev.map((x, j) => j === i ? { ...x, dailyFee: Number(e.target.value) } : x))}
                      className="w-28 px-2 py-2 border border-ww-border rounded-[6px] text-[13px] font-mono text-right outline-none focus:border-ww-teal"
                    />
                  </div>
                  {experts.length > 1 && (
                    <Button variant="danger" size="sm" onClick={() => removeExpert(i)}>Remove</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-semibold text-ww-text">Services</h2>
              <Button size="sm" onClick={addService}>Add Service</Button>
            </div>
            <div className="flex flex-col gap-3">
              {services.map((svc, i) => (
                <div key={svc.id} className="flex items-end gap-3">
                  <Input label={i === 0 ? "Name" : undefined} value={svc.name}
                    onChange={(e) => setServices((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <div>
                    {i === 0 && <label className="ww-label block">Weekly Fee</label>}
                    <input type="number" min="0" step="100" value={svc.weeklyFee}
                      onChange={(e) => setServices((prev) => prev.map((x, j) => j === i ? { ...x, weeklyFee: Number(e.target.value) } : x))}
                      className="w-28 px-2 py-2 border border-ww-border rounded-[6px] text-[13px] font-mono text-right outline-none focus:border-ww-teal"
                    />
                  </div>
                  {services.length > 1 && (
                    <Button variant="danger" size="sm" onClick={() => removeService(i)}>Remove</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setActiveTab("phases")}>Continue to Phases &rarr;</Button>
          </div>
        </div>
      )}

      {/* === PHASES TAB === */}
      {activeTab === "phases" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-semibold text-ww-text">Phases</h2>
            {phases.length < 4 && <Button size="sm" onClick={addPhase}>Add Phase</Button>}
          </div>

          {phases.map((phase, pi) => (
            <Card key={pi} className={!phase.active ? "opacity-50" : ""}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Input value={phase.name}
                    onChange={(e) => setPhases((prev) => prev.map((p, i) => i === pi ? { ...p, name: e.target.value } : p))}
                    className="!w-40"
                  />
                  <label className="flex items-center gap-1 text-sm text-ww-text-secondary cursor-pointer">
                    <input type="checkbox" checked={phase.active}
                      onChange={(e) => setPhases((prev) => prev.map((p, i) => i === pi ? { ...p, active: e.target.checked } : p))} />
                    Active
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Input label="Start" type="date" value={phase.startDate}
                    onChange={(e) => setPhases((prev) => prev.map((p, i) => i === pi ? { ...p, startDate: e.target.value } : p))}
                    className="!w-36"
                  />
                  <div>
                    <label className="ww-label block">Weeks</label>
                    <input type="number" min="1" max="52" value={phase.weeks}
                      onChange={(e) => updatePhaseWeeks(pi, Number(e.target.value))}
                      className="w-16 px-2 py-2 border border-ww-border rounded-[6px] text-[13px] font-mono text-right outline-none focus:border-ww-teal"
                    />
                  </div>
                </div>
              </div>

              {phase.active && (
                <>
                  {/* Expert allocation grid */}
                  <h3 className="ww-label mb-2">Expert Days Per Week</h3>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr>
                          <th className="text-left px-2 py-1 text-[11px] text-ww-text-muted uppercase tracking-wider w-32">Expert</th>
                          <th className="text-right px-2 py-1 text-[11px] text-ww-text-muted uppercase tracking-wider w-16">Default</th>
                          {Array.from({ length: phase.weeks }).map((_, w) => (
                            <th key={w} className="text-right px-1 py-1 text-[11px] text-ww-text-muted w-12">W{w + 1}</th>
                          ))}
                          <th className="text-right px-2 py-1 text-[11px] text-ww-text-muted uppercase tracking-wider">Total</th>
                          <th className="text-right px-2 py-1 text-[11px] text-ww-text-muted uppercase tracking-wider">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experts.map((exp, ei) => {
                          const alloc = phase.expertAllocations[ei];
                          if (!alloc) return null;
                          const phaseResult = result.phases[pi];
                          const expertResult = phaseResult?.experts[ei];
                          return (
                            <tr key={exp.id} className="border-t border-ww-border">
                              <td className="px-2 py-1 text-ww-text font-medium truncate">{exp.name}</td>
                              <td className="px-2 py-1">
                                <input type="number" min="0" max="7" step="0.5" value={alloc.daysPerWeek}
                                  onChange={(e) => setPhases((prev) => prev.map((p, i) => {
                                    if (i !== pi) return p;
                                    const newAlloc = [...p.expertAllocations];
                                    newAlloc[ei] = { ...newAlloc[ei], daysPerWeek: Number(e.target.value) };
                                    return { ...p, expertAllocations: newAlloc };
                                  }))}
                                  className="w-14 px-1 py-1 border border-ww-border rounded text-[12px] font-mono text-right outline-none focus:border-ww-teal"
                                />
                              </td>
                              {Array.from({ length: phase.weeks }).map((_, w) => (
                                <td key={w} className="px-1 py-1">
                                  <input type="number" min="0" max="7" step="0.5"
                                    value={alloc.weeklyDays[w] ?? ""}
                                    placeholder={String(alloc.daysPerWeek)}
                                    onChange={(e) => setPhases((prev) => prev.map((p, i) => {
                                      if (i !== pi) return p;
                                      const newAlloc = [...p.expertAllocations];
                                      const newWeekly = [...newAlloc[ei].weeklyDays];
                                      newWeekly[w] = e.target.value === "" ? null : Number(e.target.value);
                                      newAlloc[ei] = { ...newAlloc[ei], weeklyDays: newWeekly };
                                      return { ...p, expertAllocations: newAlloc };
                                    }))}
                                    className="w-10 px-1 py-1 border border-ww-border rounded text-[11px] font-mono text-right outline-none focus:border-ww-teal placeholder:text-ww-text-muted/40"
                                  />
                                </td>
                              ))}
                              <td className="px-2 py-1 font-mono text-right font-semibold text-ww-text">
                                {expertResult?.days ?? 0}
                              </td>
                              <td className="px-2 py-1 font-mono text-right text-ww-teal font-semibold">
                                {formatCurrency(expertResult?.profFee ?? 0, currency)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Service allocation */}
                  <h3 className="ww-label mb-2">Services Per Week</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr>
                          <th className="text-left px-2 py-1 text-[11px] text-ww-text-muted uppercase tracking-wider w-32">Service</th>
                          {Array.from({ length: phase.weeks }).map((_, w) => (
                            <th key={w} className="text-center px-1 py-1 text-[11px] text-ww-text-muted w-12">W{w + 1}</th>
                          ))}
                          <th className="text-right px-2 py-1 text-[11px] text-ww-text-muted uppercase tracking-wider">Weeks</th>
                          <th className="text-right px-2 py-1 text-[11px] text-ww-text-muted uppercase tracking-wider">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((svc, si) => {
                          const alloc = phase.serviceAllocations[si];
                          if (!alloc) return null;
                          const phaseResult = result.phases[pi];
                          const svcResult = phaseResult?.services[si];
                          return (
                            <tr key={svc.id} className="border-t border-ww-border">
                              <td className="px-2 py-1 text-ww-text font-medium truncate">{svc.name}</td>
                              {Array.from({ length: phase.weeks }).map((_, w) => (
                                <td key={w} className="px-1 py-1 text-center">
                                  <input type="checkbox"
                                    checked={alloc.weeklyActive[w] === 1}
                                    onChange={(e) => setPhases((prev) => prev.map((p, i) => {
                                      if (i !== pi) return p;
                                      const newAlloc = [...p.serviceAllocations];
                                      const newWeekly = [...newAlloc[si].weeklyActive];
                                      newWeekly[w] = e.target.checked ? 1 : 0;
                                      newAlloc[si] = { ...newAlloc[si], weeklyActive: newWeekly };
                                      return { ...p, serviceAllocations: newAlloc };
                                    }))}
                                    className="cursor-pointer"
                                  />
                                </td>
                              ))}
                              <td className="px-2 py-1 font-mono text-right font-semibold text-ww-text">
                                {svcResult?.weeks ?? 0}
                              </td>
                              <td className="px-2 py-1 font-mono text-right text-ww-teal font-semibold">
                                {formatCurrency(svcResult?.fee ?? 0, currency)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
          ))}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setActiveTab("setup")}>&larr; Back to Setup</Button>
            <Button onClick={() => setActiveTab("summary")}>View Summary &rarr;</Button>
          </div>
        </div>
      )}

      {/* === SUMMARY TAB === */}
      {activeTab === "summary" && (
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="text-md font-semibold text-ww-text mb-4">Charges by Phase</h2>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Phase</th>
                  <th className="text-right px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Prof Fees</th>
                  <th className="text-right px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Services</th>
                  <th className="text-right px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">WWRI</th>
                  <th className="text-right px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Referral</th>
                  <th className="text-right px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Client Charge</th>
                </tr>
              </thead>
              <tbody>
                {phases.map((phase, pi) => {
                  const pr = result.phases[pi];
                  if (!pr || !phase.active) return null;
                  return (
                    <tr key={pi} className="border-b border-ww-border">
                      <td className="px-3 py-2 font-medium text-ww-text">{phase.name}</td>
                      <td className="px-3 py-2 font-mono text-right">{formatCurrency(pr.profFees, currency)}</td>
                      <td className="px-3 py-2 font-mono text-right">{formatCurrency(pr.svcFees, currency)}</td>
                      <td className="px-3 py-2 font-mono text-right text-ww-teal">{formatCurrency(pr.wwriAmt, currency)}</td>
                      <td className="px-3 py-2 font-mono text-right">{formatCurrency(pr.referralFee, currency)}</td>
                      <td className="px-3 py-2 font-mono text-right font-semibold">{formatCurrency(pr.clientCharge, currency)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-ww-bg font-semibold">
                  <td className="px-3 py-2 text-ww-text">Total</td>
                  <td className="px-3 py-2 font-mono text-right">{formatCurrency(result.totals.profFees, currency)}</td>
                  <td className="px-3 py-2 font-mono text-right">{formatCurrency(result.totals.svcFees, currency)}</td>
                  <td className="px-3 py-2 font-mono text-right text-ww-teal">{formatCurrency(result.totals.wwriAmt, currency)}</td>
                  <td className="px-3 py-2 font-mono text-right">{formatCurrency(result.totals.referralFee, currency)}</td>
                  <td className="px-3 py-2 font-mono text-right text-lg text-ww-teal">{formatCurrency(result.totals.clientCharge, currency)}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          <Card>
            <h2 className="text-md font-semibold text-ww-text mb-4">Income by Expert</h2>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Expert</th>
                  <th className="text-right px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Total Days</th>
                  <th className="text-right px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Rate</th>
                  <th className="text-right px-3 py-2 text-[11px] text-ww-text-muted uppercase tracking-wider border-b border-ww-border">Prof Fee</th>
                </tr>
              </thead>
              <tbody>
                {experts.map((exp, ei) => {
                  let totalDays = 0;
                  let totalFee = 0;
                  result.phases.forEach((pr) => {
                    if (!pr) return;
                    totalDays += pr.experts[ei]?.days ?? 0;
                    totalFee += pr.experts[ei]?.profFee ?? 0;
                  });
                  return (
                    <tr key={exp.id} className="border-b border-ww-border">
                      <td className="px-3 py-2 font-medium text-ww-text">{exp.name}</td>
                      <td className="px-3 py-2 font-mono text-right">{totalDays}</td>
                      <td className="px-3 py-2 font-mono text-right">{formatCurrency(exp.dailyFee, currency)}/day</td>
                      <td className="px-3 py-2 font-mono text-right font-semibold">{formatCurrency(totalFee, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setActiveTab("phases")}>&larr; Back to Phases</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save Costing Sheet"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
