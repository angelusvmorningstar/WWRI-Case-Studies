"use client";

import { SvgHeatmap, type HeatmapPerson } from "@/components/results/SvgHeatmap";

const C = { tel: "#009898", amb: "#C07A00", grn: "#1E8C4A", red: "#C0392B", bg: "#F5F4F0", sur: "#FFFFFF", elv: "#F0EFEC", brd: "#DDDBD6", mut: "#888884", sub: "#555550", wht: "#1A1A1A" };
function bColor(v: number | null) { if (v == null) return C.mut; if (v >= 70) return C.grn; if (v >= 40) return C.amb; return C.red; }

interface PersonData {
  id: string;
  name: string;
  title: string;
  category: string;
  overall: number | null;
  topicScores: { topicId: string; topicName: string; score: number; hasData: boolean }[];
  [key: string]: unknown;
}

interface TopicInfo {
  id: string;
  name: string;
}

export function ReportCohortAnalysis({
  people,
  activeTopics,
}: {
  people: PersonData[];
  activeTopics: TopicInfo[];
}) {
  const interviewed = people.filter((p) => p.topicScores.some((t) => t.hasData));
  if (interviewed.length === 0) return null;

  // Helpers
  const topicAvg = (topicId: string) => {
    const scores = interviewed.map((p) => p.topicScores.find((t) => t.topicId === topicId)?.score).filter((v): v is number => v != null && v > 0);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  };

  const topicAvgs = activeTopics.map((t) => ({ ...t, avg: topicAvg(t.id) })).filter((t) => t.avg != null);
  const sorted = [...topicAvgs].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const strengths = sorted.slice(0, 3);
  const risks = [...sorted].reverse().slice(0, 3);

  // Heatmap data
  const heatmapPeople: HeatmapPerson[] = interviewed.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    overallScore: p.overall,
    topicScores: Object.fromEntries(
      p.topicScores.filter((t) => t.hasData).map((t) => [t.topicId, t.score])
    ),
    hasData: p.topicScores.some((t) => t.hasData),
  }));

  const sH = (txt: string) => (
    <div style={{ fontSize: 11, color: C.mut, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 14 }}>{txt}</div>
  );

  return (
    <>
      {/* ── Heatmap page ── */}
      <div className="report-page" style={{ padding: "40px 48px", background: C.sur, minHeight: "100vh", position: "relative", maxWidth: 860, margin: "0 auto" }}>
        {sH("Readiness heatmap — all interviewees by topic")}
        <div style={{ border: `1px solid ${C.brd}`, borderRadius: 10, padding: "20px 20px 16px", overflowX: "auto", background: C.sur }}>
          <SvgHeatmap
            people={heatmapPeople}
            activeTopics={activeTopics}
          />
          <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: C.sub, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.mut, fontWeight: 600, marginRight: 4 }}>SCORE:</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 14, background: C.grn, borderRadius: 2, display: "inline-block" }} />70%+ strong</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 14, background: C.amb, borderRadius: 2, display: "inline-block" }} />40–69% developing</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 14, background: C.red, borderRadius: 2, display: "inline-block" }} />Below 40% at risk</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 14, background: C.elv, border: `1px solid ${C.brd}`, borderRadius: 2, display: "inline-block" }} />Not assessed</span>
          </div>
        </div>

        {/* Score distribution */}
        <div style={{ marginTop: 32 }}>
          {sH("Score distribution by topic")}
          <div style={{ border: `1px solid ${C.brd}`, borderRadius: 10, padding: "20px 24px", background: C.sur }}>
            <p style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>Each bar shows the range of scores across all interviewees. The dot marks the group average.</p>
            {activeTopics.map((t) => {
              const scores = interviewed.map((p) => p.topicScores.find((ts) => ts.topicId === t.id)?.score).filter((v): v is number => v != null && v > 0);
              if (!scores.length) return null;
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              const lo = Math.min(...scores), hi = Math.max(...scores);
              const sd = Math.round(Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length));
              const col = bColor(avg), isPol = sd > 15;
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 210, fontSize: 13, color: C.sub, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ flex: 1 }}>{t.name}</span>
                    {isPol && <span style={{ fontSize: 10, color: C.amb, fontWeight: 700, background: "rgba(192,122,0,.1)", borderRadius: 10, padding: "1px 6px", flexShrink: 0 }}>polarised</span>}
                  </div>
                  <div style={{ flex: 1, height: 28, background: C.elv, borderRadius: 4, position: "relative" }}>
                    <div style={{ position: "absolute", left: `${lo}%`, width: `${hi - lo}%`, top: 4, height: 20, background: col, opacity: 0.55, borderRadius: 3 }} />
                    <div style={{ position: "absolute", left: `calc(${avg}% - 5px)`, top: "50%", transform: "translateY(-50%)", width: 10, height: 10, borderRadius: "50%", background: col, border: "2px solid #fff", zIndex: 2 }} />
                  </div>
                  <div style={{ width: 36, textAlign: "right", fontSize: 13, fontWeight: 700, color: col, flexShrink: 0 }}>{avg}%</div>
                  <div style={{ width: 64, fontSize: 11, color: C.mut, flexShrink: 0 }}>{lo}–{hi}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 20, left: 48, right: 48, display: "flex", justifyContent: "space-between", fontSize: 10, color: C.mut }}>
          <span>Confidential — Whitewater Reinventions</span><span>3</span>
        </div>
      </div>

      {/* ── Gap analysis + Strengths/Risks page ── */}
      <div className="report-page" style={{ padding: "40px 48px", background: C.sur, minHeight: "100vh", position: "relative", maxWidth: 860, margin: "0 auto" }}>
        {/* Gap analysis */}
        {sH("Gap analysis — current vs. required readiness")}
        <div style={{ border: `1px solid ${C.brd}`, borderRadius: 10, padding: "20px 24px", background: C.sur, marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>Teal bar shows current average. The amber marker shows a 65% required level.</p>
          {(() => {
            const requiredLevel = 65;
            const rows = topicAvgs.map((t) => ({ ...t, gap: t.avg != null ? requiredLevel - t.avg : null }));
            rows.sort((a, b) => ((b.gap ?? 0) - (a.gap ?? 0)));
            return rows.map(({ id, name, avg, gap }) => {
              const isGap = (gap ?? 0) > 0;
              const gapCol = (gap ?? 0) > 15 ? C.red : (gap ?? 0) > 0 ? C.amb : C.grn;
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 210, fontSize: 13, color: C.sub, flexShrink: 0 }}>{name}</div>
                  <div style={{ flex: 1, height: 14, background: C.elv, borderRadius: 7, position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, width: `${avg}%`, height: "100%", background: C.tel, opacity: 0.75, borderRadius: 7 }} />
                    <div style={{ position: "absolute", left: `calc(${requiredLevel}% - 1.5px)`, top: -4, width: 3, height: 22, background: C.amb, borderRadius: 1, zIndex: 2 }} />
                  </div>
                  <div style={{ width: 80, display: "flex", alignItems: "center", gap: 4, flexShrink: 0, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.tel }}>{avg}%</span>
                    <span style={{ fontSize: 12, color: C.mut }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: gapCol }}>{requiredLevel}%</span>
                  </div>
                  <div style={{ width: 44, textAlign: "right", fontSize: 13, fontWeight: 700, color: gapCol, flexShrink: 0 }}>{isGap ? `+${gap}%` : "✓"}</div>
                </div>
              );
            });
          })()}
        </div>

        {/* Cohort strengths & risks */}
        {sH("Cohort strengths & risks")}
        <div style={{ border: `1px solid ${C.brd}`, borderRadius: 10, padding: "20px 24px", background: C.sur }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.grn, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(30,140,74,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>↑</span>
                Collective strengths
              </div>
              {strengths.map((x) => (
                <div key={x.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.elv}`, fontSize: 13 }}>
                  <span style={{ color: C.sub }}>{x.name}</span>
                  <span style={{ fontWeight: 700, color: bColor(x.avg) }}>{x.avg}%</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(192,57,43,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>↓</span>
                Collective risks
              </div>
              {risks.map((x) => (
                <div key={x.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.elv}`, fontSize: 13 }}>
                  <span style={{ color: C.sub }}>{x.name}</span>
                  <span style={{ fontWeight: 700, color: bColor(x.avg) }}>{x.avg}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 20, left: 48, right: 48, display: "flex", justifyContent: "space-between", fontSize: 10, color: C.mut }}>
          <span>Confidential — Whitewater Reinventions</span><span>4</span>
        </div>
      </div>
    </>
  );
}
