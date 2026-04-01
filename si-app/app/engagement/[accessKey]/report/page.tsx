import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TOPIC_LIBRARY } from "@/lib/topic-library";
import { averageScores, applyCalibration, scoreColourClass } from "@/lib/calculations";

export default async function ReportPage({
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
        orderBy: { createdAt: "asc" },
        include: {
          sessions: {
            include: { scores: true },
          },
          assignments: { include: { interviewer: true } },
        },
      },
      benchmarks: true,
    },
  });

  if (!engagement) notFound();

  // Build topic config
  const topicConfigMap: Record<string, { enabled: boolean; selectedSubtopics: string[] }> = {};
  for (const tc of engagement.topicConfigs) {
    topicConfigMap[tc.topicId] = { enabled: tc.enabled, selectedSubtopics: tc.selectedSubtopics as string[] };
  }
  for (const topic of TOPIC_LIBRARY) {
    if (!topicConfigMap[topic.id]) {
      topicConfigMap[topic.id] = { enabled: true, selectedSubtopics: [topic.subtopics[0].id] };
    }
  }

  // Active topics
  const activeTopics = TOPIC_LIBRARY.filter((t) => topicConfigMap[t.id]?.enabled);

  // Compute scores per person
  const personScores = engagement.interviewees.map((person) => {
    const session = person.sessions[0];
    const allScores = session?.scores || [];
    const scoreMap = Object.fromEntries(allScores.map((s) => [s.criteriaId, s.value]));

    // Calibration
    const adjustments = person.assignments.map((a) => a.interviewer.adjustment);

    // Topic scores
    const topicScoreList = activeTopics.map((topic) => {
      const config = topicConfigMap[topic.id];
      const topicCriteria: number[] = [];
      for (const sub of topic.subtopics) {
        if (!config.selectedSubtopics.includes(sub.id)) continue;
        for (const crit of sub.crit) {
          if (scoreMap[crit.id] !== undefined) {
            topicCriteria.push(scoreMap[crit.id]);
          }
        }
      }
      const raw = averageScores(topicCriteria);
      return {
        topicId: topic.id,
        topicName: topic.name,
        score: applyCalibration(raw, adjustments),
        hasData: topicCriteria.length > 0,
      };
    });

    // Overall
    const allCriteriaScores = allScores.map((s) => s.value);
    const rawOverall = averageScores(allCriteriaScores);
    const overall = applyCalibration(rawOverall, adjustments);

    return {
      id: person.id,
      name: person.name,
      title: person.title || "",
      category: person.category,
      overall,
      topicScores: topicScoreList,
      hasData: allCriteriaScores.length > 0,
    };
  });

  const withData = personScores.filter((p) => p.hasData);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 print:px-4 print:py-2">
      {/* Report header */}
      <div className="mb-8 print:mb-4">
        <h1 className="text-lg font-semibold text-ww-text">Structured Interview Report</h1>
        <p className="text-md text-ww-text-secondary mt-1">{engagement.clientName}</p>
        <p className="text-sm text-ww-text-muted">
          {new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}
          {" · "}{withData.length} of {engagement.interviewees.length} interviews completed
        </p>
      </div>

      {/* Per-person sections */}
      {withData.map((person) => (
        <div key={person.id} className="mb-8 print:mb-4 page-break-inside-avoid">
          <div className="border-b border-ww-border pb-2 mb-4">
            <h2 className="text-md font-semibold text-ww-text">{person.name}</h2>
            <p className="text-sm text-ww-text-muted">{person.title} · {person.category}</p>
          </div>

          <div className="flex items-start gap-6">
            {/* Score breakdown */}
            <div className="flex-1">
              <table className="w-full text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left py-1 text-[11px] text-ww-text-muted uppercase tracking-wider">Topic</th>
                    <th className="text-right py-1 text-[11px] text-ww-text-muted uppercase tracking-wider w-20">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {person.topicScores.filter((t) => t.hasData).map((ts) => (
                    <tr key={ts.topicId} className="border-t border-ww-border">
                      <td className="py-2 text-ww-text">{ts.topicName}</td>
                      <td className="py-2 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-semibold text-[12px] ${scoreColourClass(ts.score)}`}>
                          {Math.round(ts.score)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-ww-border font-semibold">
                    <td className="py-2 text-ww-text">Overall</td>
                    <td className="py-2 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded font-mono font-semibold text-[12px] ${scoreColourClass(person.overall)}`}>
                        {Math.round(person.overall)}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {withData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-ww-text-muted">No completed interviews to report.</p>
        </div>
      )}

      {/* Print button (hidden in print) */}
      <div className="mt-8 text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-ww-teal text-white rounded-md text-sm font-semibold cursor-pointer hover:bg-ww-teal-hover"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
