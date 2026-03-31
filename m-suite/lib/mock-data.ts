// In-memory data store for local development without PostgreSQL
// Replace with Prisma queries when database is connected

export type Opportunity = {
  id: string;
  clientName: string;
  prospect: string;
  description: string;
  currentStage: string;
  status: "ACTIVE" | "STOPPED" | "COMPLETED";
  ieId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StageHistoryEntry = {
  id: string;
  opportunityId: string;
  fromStage: string | null;
  toStage: string;
  decision: string | null;
  notes: string | null;
  userId: string;
  createdAt: Date;
};

const opportunities: Opportunity[] = [];
const stageHistory: StageHistoryEntry[] = [];
let nextId = 1;

export function getOpportunities(ieId?: string): Opportunity[] {
  if (ieId) return opportunities.filter((o) => o.ieId === ieId);
  return [...opportunities];
}

export function getOpportunity(id: string): Opportunity | undefined {
  return opportunities.find((o) => o.id === id);
}

export function createOpportunity(data: {
  clientName: string;
  prospect: string;
  description: string;
  ieId: string;
}): Opportunity {
  const opp: Opportunity = {
    id: `opp-${nextId++}`,
    clientName: data.clientName,
    prospect: data.prospect,
    description: data.description,
    currentStage: "M0",
    status: "ACTIVE",
    ieId: data.ieId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  opportunities.push(opp);

  stageHistory.push({
    id: `sh-${nextId++}`,
    opportunityId: opp.id,
    fromStage: null,
    toStage: "M0",
    decision: null,
    notes: null,
    userId: data.ieId,
    createdAt: new Date(),
  });

  return opp;
}

export function progressStage(
  opportunityId: string,
  decision: "pursue" | "stop",
  notes: string | null,
  userId: string
): Opportunity | null {
  const opp = opportunities.find((o) => o.id === opportunityId);
  if (!opp) return null;

  const stages = ["M0", "M1", "M2", "M3", "M4"];
  const currentIndex = stages.indexOf(opp.currentStage);

  if (decision === "stop") {
    opp.status = "STOPPED";
    stageHistory.push({
      id: `sh-${nextId++}`,
      opportunityId,
      fromStage: opp.currentStage,
      toStage: opp.currentStage,
      decision: "stop",
      notes,
      userId,
      createdAt: new Date(),
    });
  } else if (currentIndex < stages.length - 1) {
    const fromStage = opp.currentStage;
    opp.currentStage = stages[currentIndex + 1];
    opp.updatedAt = new Date();
    stageHistory.push({
      id: `sh-${nextId++}`,
      opportunityId,
      fromStage,
      toStage: opp.currentStage,
      decision: "pursue",
      notes,
      userId,
      createdAt: new Date(),
    });
  }

  return opp;
}

export function getStageHistory(opportunityId: string): StageHistoryEntry[] {
  return stageHistory.filter((h) => h.opportunityId === opportunityId);
}
