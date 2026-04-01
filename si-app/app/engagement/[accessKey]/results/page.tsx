import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TOPIC_LIBRARY } from "@/lib/topic-library";
import { averageScores, applyCalibration } from "@/lib/calculations";
import {
  ResultsClient,
  type PersonResult,
  type ActiveTopic,
} from "@/components/results/ResultsClient";
import type { BenchmarkRow } from "@/components/results/BenchmarkEditor";
import Link from "next/link";

const DEFAULT_CATEGORIES = ["Executive", "Senior Management", "Middle Management"];

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;

  const engagement = await prisma.engagement.findUnique({
    where: { accessKey },
    include: {
      topicConfigs: true,
      interviewees: {
        include: {
          assignments: {
            include: { interviewer: true },
          },
          sessions: {
            include: { scores: true },
          },
        },
      },
      interviewers: true,
      benchmarks: true,
    },
  });

  if (!engagement) notFound();

  // ── Determine active topics ──────────────────────────────────────────────
  // A topic is active if it has a TopicConfig with enabled=true and at least
  // one selected subtopic.
  const topicConfigMap: Record<
    string,
    { enabled: boolean; selectedSubtopics: string[] }
  > = {};
  for (const tc of engagement.topicConfigs) {
    topicConfigMap[tc.topicId] = {
      enabled: tc.enabled,
      selectedSubtopics: (tc.selectedSubtopics ?? []) as string[],
    };
  }

  const activeTopics: ActiveTopic[] = TOPIC_LIBRARY.filter((t) => {
    const tc = topicConfigMap[t.id];
    return tc && tc.enabled && tc.selectedSubtopics.length > 0;
  }).map((t) => ({ id: t.id, name: t.name }));

  // ── Build a flat list of active criteria IDs grouped by topic ────────────
  // For each active topic, gather criteria IDs from selected subtopics.
  const topicCriteriaMap: Record<string, string[]> = {};
  const allActiveCriteriaIds: string[] = [];

  for (const topic of TOPIC_LIBRARY) {
    const tc = topicConfigMap[topic.id];
    if (!tc || !tc.enabled) continue;
    const selectedSts = tc.selectedSubtopics;
    const criteriaIds: string[] = [];
    for (const st of topic.subtopics) {
      if (selectedSts.includes(st.id)) {
        for (const c of st.crit) {
          criteriaIds.push(c.id);
          allActiveCriteriaIds.push(c.id);
        }
      }
    }
    if (criteriaIds.length > 0) {
      topicCriteriaMap[topic.id] = criteriaIds;
    }
  }

  // ── Compute scores per person ────────────────────────────────────────────
  const people: PersonResult[] = engagement.interviewees.map((person) => {
    // Collect all score records from completed sessions
    const allScores: Record<string, number> = {};
    let hasData = false;
    for (const session of person.sessions) {
      if (session.scores.length > 0) {
        hasData = true;
        for (const s of session.scores) {
          // Use the latest score if multiple sessions exist
          allScores[s.criteriaId] = s.value;
        }
      }
    }

    // Compute calibration adjustment: average of all assigned interviewers' adjustments
    const interviewerAdjustments = person.assignments.map(
      (a) => a.interviewer.adjustment
    );

    // Topic scores: for each active topic, average the criteria scores
    const topicScores: Record<string, number | null> = {};
    for (const [topicId, criteriaIds] of Object.entries(topicCriteriaMap)) {
      const vals = criteriaIds
        .map((cid) => allScores[cid])
        .filter((v): v is number => v != null && v > 0);
      if (vals.length > 0 && hasData) {
        const raw = averageScores(vals);
        topicScores[topicId] = Math.round(
          applyCalibration(raw, interviewerAdjustments)
        );
      } else {
        topicScores[topicId] = null;
      }
    }

    // Overall score: average of ALL active criteria scores (not averaged-of-averages)
    let overallScore: number | null = null;
    if (hasData) {
      const allVals = allActiveCriteriaIds
        .map((cid) => allScores[cid])
        .filter((v): v is number => v != null && v > 0);
      if (allVals.length > 0) {
        const raw = averageScores(allVals);
        overallScore = Math.round(
          applyCalibration(raw, interviewerAdjustments)
        );
      }
    }

    return {
      id: person.id,
      name: person.name,
      title: person.title || "",
      category: person.category,
      overallScore,
      topicScores,
      hasData,
    };
  });

  // ── Load or default benchmarks ───────────────────────────────────────────
  const benchmarkRows: BenchmarkRow[] = DEFAULT_CATEGORIES.map((cat) => {
    const existing = engagement.benchmarks.find((b) => b.category === cat);
    return {
      category: cat,
      adequate: existing?.adequate ?? 40,
      best: existing?.best ?? 85,
    };
  });

  return (
    <div className="px-4 py-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/engagement/${accessKey}`}
            className="text-sm text-ww-teal no-underline hover:underline"
          >
            &larr; {engagement.clientName}
          </Link>
        </div>

        <h1 className="text-lg font-semibold text-ww-text mb-1">Results</h1>
        <p className="text-sm text-ww-text-muted mb-6">
          Readiness scores, benchmarks, and visualisations for{" "}
          {engagement.clientName}.
        </p>

        <ResultsClient
          engagementId={engagement.id}
          accessKey={accessKey}
          people={people}
          activeTopics={activeTopics}
          initialBenchmarks={benchmarkRows}
        />
      </div>
    </div>
  );
}
