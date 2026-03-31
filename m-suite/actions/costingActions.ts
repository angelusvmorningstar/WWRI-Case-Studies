"use server";

import { prisma } from "@/lib/db";
import type { CostingSheet, Phase, Expert, Service, PhaseExpert, PhaseService } from "@/app/generated/prisma/client";

export type CostingSheetFull = CostingSheet & {
  phases: (Phase & {
    phaseExperts: PhaseExpert[];
    phaseServices: PhaseService[];
  })[];
  experts: Expert[];
  services: Service[];
};

export async function loadCostingSheet(opportunityId: string): Promise<CostingSheetFull | null> {
  return prisma.costingSheet.findFirst({
    where: { opportunityId },
    include: {
      phases: {
        include: { phaseExperts: true, phaseServices: true },
        orderBy: { sortOrder: "asc" },
      },
      experts: true,
      services: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function saveCostingSheet(data: {
  opportunityId: string;
  costingSheetId?: string;
  projectTitle: string;
  clientName: string;
  legalEntity: string;
  shortName: string;
  currency: string;
  govtImpost: string;
  govtImpostRate: number;
  wwriPct: number;
  referralPartner: string;
  referralActive: boolean;
  referralPct: number;
  experts: { name: string; role: string; dailyFee: number }[];
  services: { name: string; weeklyFee: number }[];
  phases: {
    name: string;
    active: boolean;
    startDate: string | null;
    weeks: number;
    sortOrder: number;
    expertAllocations: { daysPerWeek: number; actualFee: number | null; weeklyDays: (number | null)[] }[];
    serviceAllocations: { weeklyActive: number[] }[];
  }[];
}): Promise<CostingSheetFull> {
  // Delete existing costing sheet if updating
  if (data.costingSheetId) {
    await prisma.costingSheet.delete({ where: { id: data.costingSheetId } });
  }

  // Create fresh (cascade delete handles children)
  const sheet = await prisma.costingSheet.create({
    data: {
      opportunityId: data.opportunityId,
      projectTitle: data.projectTitle,
      clientName: data.clientName,
      legalEntity: data.legalEntity,
      shortName: data.shortName,
      currency: data.currency,
      govtImpost: data.govtImpost,
      govtImpostRate: data.govtImpostRate,
      wwriPct: data.wwriPct,
      referralPartner: data.referralPartner,
      referralActive: data.referralActive,
      referralPct: data.referralPct,
      experts: {
        create: data.experts.map((e) => ({
          name: e.name,
          role: e.role,
          dailyFee: e.dailyFee,
        })),
      },
      services: {
        create: data.services.map((s) => ({
          name: s.name,
          weeklyFee: s.weeklyFee,
        })),
      },
    },
    include: { experts: true, services: true },
  });

  // Create phases with allocations
  for (const phase of data.phases) {
    const createdPhase = await prisma.phase.create({
      data: {
        costingSheetId: sheet.id,
        name: phase.name,
        active: phase.active,
        startDate: phase.startDate ? new Date(phase.startDate) : null,
        weeks: phase.weeks,
        sortOrder: phase.sortOrder,
      },
    });

    // Expert allocations for this phase
    for (let ei = 0; ei < sheet.experts.length; ei++) {
      const alloc = phase.expertAllocations[ei];
      if (!alloc) continue;
      await prisma.phaseExpert.create({
        data: {
          phaseId: createdPhase.id,
          expertId: sheet.experts[ei].id,
          daysPerWeek: alloc.daysPerWeek,
          actualFee: alloc.actualFee,
          weeklyDays: alloc.weeklyDays,
        },
      });
    }

    // Service allocations for this phase
    for (let si = 0; si < sheet.services.length; si++) {
      const alloc = phase.serviceAllocations[si];
      if (!alloc) continue;
      await prisma.phaseService.create({
        data: {
          phaseId: createdPhase.id,
          serviceId: sheet.services[si].id,
          weeklyActive: alloc.weeklyActive,
        },
      });
    }
  }

  // Return the full sheet
  return loadCostingSheet(data.opportunityId) as Promise<CostingSheetFull>;
}
