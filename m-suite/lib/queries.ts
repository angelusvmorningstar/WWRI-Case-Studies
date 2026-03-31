import { prisma } from "@/lib/db";
import type { Opportunity, StageHistory } from "@/app/generated/prisma/client";

export type { Opportunity, StageHistory };

export async function getOpportunities(ieId?: string): Promise<Opportunity[]> {
  if (ieId) {
    return prisma.opportunity.findMany({
      where: { ieId },
      orderBy: { updatedAt: "desc" },
    });
  }
  return prisma.opportunity.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  return prisma.opportunity.findUnique({ where: { id } });
}

export async function createOpportunity(data: {
  clientName: string;
  prospect: string;
  description: string;
  ieId: string;
}): Promise<Opportunity> {
  return prisma.opportunity.create({
    data: {
      clientName: data.clientName,
      prospect: data.prospect,
      description: data.description,
      currentStage: "M0",
      status: "ACTIVE",
      ieId: data.ieId,
      stageHistory: {
        create: {
          fromStage: null,
          toStage: "M0",
          decision: null,
          notes: null,
          userId: data.ieId,
        },
      },
    },
  });
}

export async function progressStage(
  opportunityId: string,
  decision: "pursue" | "stop",
  notes: string | null,
  userId: string
): Promise<Opportunity | null> {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  });
  if (!opp) return null;

  const stages = ["M0", "M1", "M2", "M3", "M4"];
  const currentIndex = stages.indexOf(opp.currentStage);

  if (decision === "stop") {
    await prisma.stageHistory.create({
      data: {
        opportunityId,
        fromStage: opp.currentStage,
        toStage: opp.currentStage,
        decision: "stop",
        notes,
        userId,
      },
    });
    return prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: "STOPPED" },
    });
  }

  if (currentIndex < stages.length - 1) {
    const nextStage = stages[currentIndex + 1];
    await prisma.stageHistory.create({
      data: {
        opportunityId,
        fromStage: opp.currentStage,
        toStage: nextStage,
        decision: "pursue",
        notes,
        userId,
      },
    });
    return prisma.opportunity.update({
      where: { id: opportunityId },
      data: { currentStage: nextStage },
    });
  }

  return opp;
}

export async function getStageHistory(opportunityId: string): Promise<StageHistory[]> {
  return prisma.stageHistory.findMany({
    where: { opportunityId },
    orderBy: { createdAt: "asc" },
  });
}
