import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TOPIC_LIBRARY } from "@/lib/topic-library";
import { averageScores, applyCalibration } from "@/lib/calculations";
import { SvgRadar } from "@/components/results/SvgRadar";
import { PrintButton } from "@/components/report/PrintButton";

/* ── Colour helpers (inline, matching prototype exactly) ───────────── */
function bColor(v: number | null): string {
  if (v == null) return "#888884";
  if (v >= 70) return "#1E8C4A";
  if (v >= 40) return "#C07A00";
  return "#C0392B";
}
function bBg(v: number | null): string {
  if (v == null) return "#F0EFEC";
  if (v >= 70) return "rgba(30,140,74,.12)";
  if (v >= 40) return "rgba(192,122,0,.1)";
  return "rgba(192,57,43,.1)";
}
function bLabel(v: number | null): string {
  if (v == null) return "Not assessed";
  if (v >= 70) return "Strong";
  if (v >= 40) return "Developing";
  return "At risk";
}

/* ── Shared inline style constants ─────────────────────────────────── */
const pageStyle: React.CSSProperties = {
  background: "#FFFFFF",
  padding: "48px 56px",
  maxWidth: 860,
  margin: "0 auto 40px",
  boxShadow: "0 2px 24px rgba(0,0,0,.08)",
  borderRadius: 4,
  position: "relative",
};
const ruleStyle: React.CSSProperties = {
  borderTop: "2px solid #009898",
  marginBottom: 24,
};
const sectionHeadStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#009898",
  marginBottom: 16,
};
const pageFooterStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 32,
  left: 56,
  right: 56,
  display: "flex",
  justifyContent: "space-between",
  fontSize: 11,
  color: "#BBBBBB",
  borderTop: "1px solid #EEECE8",
  paddingTop: 12,
};

const CAT_ORDER = ["Executive", "Senior Management", "Middle Management"];

/* ── Page component (server) ───────────────────────────────────────── */
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
            include: { scores: true, background: true },
          },
          assignments: { include: { interviewer: true } },
        },
      },
      benchmarks: true,
    },
  });

  if (!engagement) notFound();

  /* ── Build topic config map ──────────────────────────────────────── */
  const topicConfigMap: Record<
    string,
    { enabled: boolean; selectedSubtopics: string[] }
  > = {};
  for (const tc of engagement.topicConfigs) {
    topicConfigMap[tc.topicId] = {
      enabled: tc.enabled,
      selectedSubtopics: tc.selectedSubtopics as string[],
    };
  }
  for (const topic of TOPIC_LIBRARY) {
    if (!topicConfigMap[topic.id]) {
      topicConfigMap[topic.id] = {
        enabled: true,
        selectedSubtopics: [topic.subtopics[0].id],
      };
    }
  }

  /* ── Active topics ───────────────────────────────────────────────── */
  const activeTopics = TOPIC_LIBRARY.filter(
    (t) =>
      topicConfigMap[t.id]?.enabled &&
      (topicConfigMap[t.id]?.selectedSubtopics || []).length > 0
  );

  /* ── Per-person scoring ──────────────────────────────────────────── */
  const personScores = engagement.interviewees.map((person) => {
    const session = person.sessions[0];
    const allScores = session?.scores || [];
    const scoreMap = Object.fromEntries(
      allScores.map((s) => [s.criteriaId, s.value])
    );
    const adjustments = person.assignments.map((a) => a.interviewer.adjustment);
    const interviewerNames = person.assignments.map(
      (a) => a.interviewer.name
    );

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
        score: topicCriteria.length > 0 ? Math.round(applyCalibration(raw, adjustments)) : 0,
        hasData: topicCriteria.length > 0,
      };
    });

    const allCriteriaScores = allScores.map((s) => s.value);
    const rawOverall = averageScores(allCriteriaScores);
    const overall =
      allCriteriaScores.length > 0
        ? Math.round(applyCalibration(rawOverall, adjustments))
        : null;

    // Background data from session
    const bg = session?.background?.data as Record<string, string> | null;

    return {
      id: person.id,
      name: person.name,
      title: person.title || "",
      category: person.category,
      overall,
      topicScores: topicScoreList,
      hasData: allCriteriaScores.length > 0,
      interviewerNames,
      background: bg,
    };
  });

  const interviewed = personScores.filter((p) => p.hasData);

  /* ── Cohort stats ────────────────────────────────────────────────── */
  const cohortAvg = (() => {
    const vals = interviewed
      .map((p) => p.overall)
      .filter((v): v is number => v != null);
    return vals.length
      ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      : null;
  })();

  const topicAvgs = activeTopics.map((t) => {
    const vals = interviewed
      .map((p) => {
        const ts = p.topicScores.find((x) => x.topicId === t.id);
        return ts && ts.hasData ? ts.score : null;
      })
      .filter((v): v is number => v != null);
    return {
      name: t.name,
      avg: vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : null,
    };
  });

  const strength = [...topicAvgs]
    .filter((x) => x.avg != null)
    .sort((a, b) => b.avg! - a.avg!)[0];
  const risk = [...topicAvgs]
    .filter((x) => x.avg != null)
    .sort((a, b) => a.avg! - b.avg!)[0];

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const noData = interviewed.length === 0;
  const eng = engagement.clientName;

  /* ── Sorted people for individual pages ──────────────────────────── */
  const sortedPeople = [...interviewed].sort(
    (a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category)
  );

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        background: "#F0EFEC",
        padding: "32px 24px",
        minHeight: "100vh",
        fontFamily: "Calibri, Segoe UI, sans-serif",
      }}
    >
      {/* ── Toolbar (hidden in print) ──────────────────────────────── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          maxWidth: 860,
          margin: "0 auto 28px",
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
            Change Readiness Report
          </h2>
          <p style={{ color: "#555550", fontSize: 13, margin: 0 }}>
            Preview below. Click Print to save as PDF — select &quot;Save as
            PDF&quot; in the print dialog.
          </p>
        </div>
        <PrintButton />
      </div>

      {/* ── PAGE 1: Cover ──────────────────────────────────────────── */}
      <div
        className="report-page"
        style={{
          ...pageStyle,
          minHeight: 760,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            borderBottom: "3px solid #1A1A1A",
            paddingBottom: 24,
            marginBottom: 40,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ww-logo.jpg"
            alt="Whitewater Reinventions"
            style={{ height: 44, display: "block" }}
          />
        </div>
        {/* Centre content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#009898",
              marginBottom: 16,
            }}
          >
            Confidential
          </div>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#1A1A1A",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Change Readiness
            <br />
            Assessment
          </h1>
          <div
            style={{
              width: 48,
              height: 3,
              background: "#009898",
              marginBottom: 24,
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: "#1A1A1A",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            {eng || "Engagement"}
          </div>
          <div style={{ fontSize: 15, color: "#555550" }}>
            Prepared by Whitewater Reinventions
          </div>
        </div>
        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #DDDBD6",
            paddingTop: 20,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#888884",
          }}
        >
          <span>{today}</span>
          <span>whitewater-ri.com</span>
        </div>
      </div>

      {/* ── PAGE 2: Cohort Summary ─────────────────────────────────── */}
      <div className="report-page" style={pageStyle}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ww-logo.jpg"
            alt="Logo"
            style={{ height: 28, opacity: 0.7 }}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: "#888884" }}>
            <div>{eng}</div>
            <div>Change Readiness Assessment</div>
          </div>
        </div>
        <div style={ruleStyle} />
        <div style={sectionHeadStyle}>01 Cohort overview</div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 24,
            color: "#1A1A1A",
          }}
        >
          Executive summary
        </h2>

        {noData ? (
          <p style={{ color: "#888884" }}>
            No interview data available yet.
          </p>
        ) : (
          <div>
            {/* Stat cards row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {/* Interviewed */}
              <div
                style={{
                  background: "#F5F4F0",
                  borderRadius: 8,
                  padding: "20px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#888884",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  Interviewed
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#1A1A1A",
                  }}
                >
                  {interviewed.length}
                </div>
                <div style={{ fontSize: 12, color: "#888884" }}>
                  of {engagement.interviewees.length} planned
                </div>
              </div>
              {/* Cohort average */}
              <div
                style={{
                  background: "#F5F4F0",
                  borderRadius: 8,
                  padding: "20px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#888884",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  Cohort average
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: bColor(cohortAvg),
                  }}
                >
                  {cohortAvg != null ? cohortAvg + "%" : "—"}
                </div>
                <div
                  style={{ fontSize: 12, color: bColor(cohortAvg) }}
                >
                  {bLabel(cohortAvg)}
                </div>
              </div>
              {/* Strongest topic */}
              <div
                style={{
                  background: "#F5F4F0",
                  borderRadius: 8,
                  padding: "20px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#888884",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  Strongest topic
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1E8C4A",
                    marginBottom: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {strength?.name || "—"}
                </div>
                <div style={{ fontSize: 12, color: "#888884" }}>
                  {strength?.avg != null ? strength.avg + "% avg" : ""}
                </div>
              </div>
              {/* Priority risk */}
              <div
                style={{
                  background: "#F5F4F0",
                  borderRadius: 8,
                  padding: "20px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#888884",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  Priority risk
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: bColor(risk?.avg ?? null),
                    marginBottom: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {risk?.name || "—"}
                </div>
                <div style={{ fontSize: 12, color: "#888884" }}>
                  {risk?.avg != null ? risk.avg + "% avg" : ""}
                </div>
              </div>
            </div>

            {/* Topic summary table */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1A1A1A",
                  marginBottom: 12,
                }}
              >
                Cohort scores by topic
              </div>
              {topicAvgs
                .filter((x) => x.avg != null)
                .map((x) => (
                  <div
                    key={x.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 220,
                        fontSize: 13,
                        color: "#555550",
                        flexShrink: 0,
                      }}
                    >
                      {x.name}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 18,
                        background: "#F0EFEC",
                        borderRadius: 3,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          width: x.avg + "%",
                          height: "100%",
                          background: bColor(x.avg!),
                          opacity: 0.7,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 40,
                        fontSize: 13,
                        fontWeight: 700,
                        color: bColor(x.avg!),
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {x.avg}%
                    </div>
                    <div
                      style={{
                        width: 80,
                        fontSize: 11,
                        color: bColor(x.avg!),
                        background: bBg(x.avg!),
                        padding: "2px 8px",
                        borderRadius: 10,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {bLabel(x.avg!)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Page footer */}
        <div style={pageFooterStyle}>
          <span>Confidential — Whitewater Reinventions</span>
          <span>2</span>
        </div>
      </div>

      {/* ── PAGE 3+: Individual profiles ───────────────────────────── */}
      {sortedPeople.map((p, pi) => {
        const overall = p.overall;
        const topicScores = activeTopics.map((t) => {
          const ts = p.topicScores.find((x) => x.topicId === t.id);
          return ts ? ts.score : 0;
        });
        const topicNames = activeTopics.map((t) => t.name);
        const pairs = activeTopics
          .map((t) => {
            const ts = p.topicScores.find((x) => x.topicId === t.id);
            return ts && ts.hasData ? { name: t.name, score: ts.score } : null;
          })
          .filter((x): x is NonNullable<typeof x> => x != null);
        const srSorted = [...pairs].sort((a, b) => b.score - a.score);
        const top3 = srSorted.slice(0, 3);
        const bot3 = srSorted.slice(-3).reverse();
        const ini = p.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("");

        // Benchmark: find for this person's category
        const benchmark = engagement.benchmarks.find(
          (b) => b.category === p.category
        );
        const adequate = benchmark?.adequate ?? 30;
        const best = benchmark?.best ?? 70;

        return (
          <div key={p.id} className="report-page" style={pageStyle}>
            {/* Page header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ww-logo.jpg"
                alt="Logo"
                style={{ height: 28, opacity: 0.7 }}
              />
              <div
                style={{
                  textAlign: "right",
                  fontSize: 11,
                  color: "#888884",
                }}
              >
                <div>{eng}</div>
                <div>Change Readiness Assessment</div>
              </div>
            </div>
            <div style={ruleStyle} />
            <div style={sectionHeadStyle}>
              {String(pi + 2).padStart(2, "0")} Individual profile
            </div>

            {/* Person header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 28,
                paddingBottom: 20,
                borderBottom: "1px solid #EEECE8",
              }}
            >
              {/* Avatar circle */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(0,152,152,.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#009898",
                  flexShrink: 0,
                }}
              >
                {ini}
              </div>
              {/* Name & meta */}
              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#1A1A1A",
                    marginBottom: 3,
                  }}
                >
                  {p.name}
                </h2>
                <div style={{ fontSize: 14, color: "#555550" }}>
                  {p.title} · {p.category}
                  {p.interviewerNames.length > 0 &&
                    ` · Interviewed by ${p.interviewerNames.join(", ")}`}
                </div>
              </div>
              {/* Overall score badge */}
              {overall != null && (
                <div
                  style={{
                    textAlign: "right",
                    background: bBg(overall),
                    borderRadius: 10,
                    padding: "12px 20px",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: bColor(overall),
                      lineHeight: 1,
                    }}
                  >
                    {overall}%
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: bColor(overall),
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginTop: 4,
                    }}
                  >
                    Overall
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: bColor(overall),
                      marginTop: 2,
                    }}
                  >
                    {bLabel(overall)}
                  </div>
                </div>
              )}
            </div>

            {/* Two-col: radar + scores | Strengths & risks */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 32,
              }}
            >
              {/* Left: radar + topic scores */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#888884",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 12,
                  }}
                >
                  Topic radar
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <SvgRadar
                    topics={topicNames}
                    scores={topicScores}
                    adequate={adequate}
                    best={best}
                    size={200}
                  />
                </div>
                {/* Legend */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "center",
                    fontSize: 10,
                    color: "#888884",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 2,
                        background: "#1E8C4A",
                        display: "inline-block",
                      }}
                    />
                    {" "}
                    Best
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 2,
                        background: "#C07A00",
                        display: "inline-block",
                      }}
                    />
                    {" "}
                    Adequate
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        background: "#009898",
                        opacity: 0.4,
                        borderRadius: 2,
                        display: "inline-block",
                      }}
                    />
                    {" "}
                    Score
                  </span>
                </div>
                {/* Topic score bars */}
                {activeTopics.map((t, i) => {
                  const ts = topicScores[i];
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 7,
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontSize: 11,
                          color: "#555550",
                          lineHeight: 1.3,
                        }}
                      >
                        {t.name}
                      </span>
                      <div
                        style={{
                          width: 70,
                          height: 5,
                          background: "#F0EFEC",
                          borderRadius: 3,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {ts > 0 && (
                          <div
                            style={{
                              width: ts + "%",
                              height: "100%",
                              background: bColor(ts),
                              borderRadius: 3,
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          minWidth: 30,
                          fontSize: 11,
                          fontWeight: 700,
                          color: ts === 0 ? "#888884" : bColor(ts),
                          textAlign: "right",
                          fontFamily: "monospace",
                        }}
                      >
                        {ts === 0 ? "—" : ts + "%"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Right: Strengths & Risks */}
              <div
                style={{
                  borderLeft: "1px solid #EEECE8",
                  paddingLeft: 28,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#888884",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 14,
                  }}
                >
                  Strengths &amp; risks
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1E8C4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Strengths
                </div>
                {top3.map((x) => (
                  <div
                    key={x.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "7px 0",
                      borderBottom: "1px solid #F0EFEC",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#555550",
                        flex: 1,
                        paddingRight: 8,
                        lineHeight: 1.35,
                      }}
                    >
                      {x.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: bColor(x.score),
                        background: bBg(x.score),
                        padding: "2px 8px",
                        borderRadius: 10,
                        flexShrink: 0,
                      }}
                    >
                      {x.score}%
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#C0392B",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: "16px 0 10px",
                  }}
                >
                  Development priorities
                </div>
                {bot3.map((x) => (
                  <div
                    key={x.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "7px 0",
                      borderBottom: "1px solid #F0EFEC",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#555550",
                        flex: 1,
                        paddingRight: 8,
                        lineHeight: 1.35,
                      }}
                    >
                      {x.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: bColor(x.score),
                        background: bBg(x.score),
                        padding: "2px 8px",
                        borderRadius: 10,
                        flexShrink: 0,
                      }}
                    >
                      {x.score}%
                    </span>
                  </div>
                ))}

                {/* Background info if available */}
                {p.background &&
                  Object.values(p.background).some((v) => v) && (
                    <div
                      style={{
                        marginTop: 20,
                        padding: 14,
                        background: "#F5F4F0",
                        borderRadius: 6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#888884",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 8,
                        }}
                      >
                        Background
                      </div>
                      {(
                        [
                          ["Time with organisation", "tenure"],
                          ["Time in current role", "timeInRole"],
                          ["Reports to", "reportsTo"],
                          ["Direct reports", "directReports"],
                        ] as const
                      )
                        .filter(([, key]) => p.background?.[key])
                        .map(([label, key]) => (
                          <div
                            key={label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ color: "#888884" }}>{label}</span>
                            <span
                              style={{ color: "#1A1A1A", fontWeight: 600 }}
                            >
                              {p.background![key]}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Page footer */}
            <div style={pageFooterStyle}>
              <span>Confidential — Whitewater Reinventions</span>
              <span>{pi + 3}</span>
            </div>
          </div>
        );
      })}

      {/* ── Print styles ───────────────────────────────────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              .report-page {
                page-break-after: always;
                box-shadow: none !important;
                margin: 0 !important;
                border-radius: 0 !important;
              }
              body { background: white !important; }
            }
          `,
        }}
      />
    </div>
  );
}
