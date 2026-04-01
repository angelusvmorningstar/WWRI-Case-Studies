"use client";

import { useState, useTransition } from "react";
import { SvgRadar } from "./SvgRadar";
import { SvgHeatmap, type HeatmapPerson, type HeatmapTopic } from "./SvgHeatmap";
import { SvgBar, type BarPerson, type BarBenchmarks } from "./SvgBar";
import { BenchmarkEditor, type BenchmarkRow } from "./BenchmarkEditor";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { saveBenchmarks } from "@/app/engagement/[accessKey]/results/actions";

const CAT_ORDER = ["Executive", "Senior Management", "Middle Management"];

function bColor(v: number | null): string {
  if (v == null) return "#888884";
  if (v >= 70) return "#1E8C4A";
  if (v >= 40) return "#C07A00";
  return "#C0392B";
}

export interface PersonResult {
  id: string;
  name: string;
  title: string;
  category: string;
  overallScore: number | null;
  topicScores: Record<string, number | null>;
  hasData: boolean;
}

export interface ActiveTopic {
  id: string;
  name: string;
}

interface ResultsClientProps {
  engagementId: string;
  accessKey: string;
  people: PersonResult[];
  activeTopics: ActiveTopic[];
  initialBenchmarks: BenchmarkRow[];
}

export function ResultsClient({
  engagementId,
  accessKey,
  people,
  activeTopics,
  initialBenchmarks,
}: ResultsClientProps) {
  const [benchmarks, setBenchmarks] = useState<BenchmarkRow[]>(initialBenchmarks);
  const [editingBench, setEditingBench] = useState(false);
  const [requiredLevel, setRequiredLevel] = useState(65);
  const [isPending, startTransition] = useTransition();

  const benchmarkMap: BarBenchmarks = {};
  for (const b of benchmarks) {
    benchmarkMap[b.category] = { adequate: b.adequate, best: b.best };
  }

  const interviewed = people.filter((p) => p.hasData);
  const noData = interviewed.length === 0;

  const barData: BarPerson[] = interviewed
    .filter((p) => p.overallScore != null)
    .map((p) => ({
      pid: p.id,
      name: p.name
        .split(" ")
        .map((n, i) => (i === 0 ? n : n[0] + "."))
        .join(" "),
      fullName: p.name,
      category: p.category,
      score: p.overallScore!,
    }));

  const heatmapPeople: HeatmapPerson[] = interviewed.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    title: p.title,
    overallScore: p.overallScore,
    topicScores: p.topicScores,
    hasData: p.hasData,
  }));

  const heatmapTopics: HeatmapTopic[] = activeTopics.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  function handleBenchmarkChange(updated: BenchmarkRow[]) {
    setBenchmarks(updated);
    startTransition(async () => {
      await saveBenchmarks(engagementId, accessKey, updated);
    });
  }

  function sectionHeader(txt: string) {
    return (
      <div
        style={{
          fontSize: 11,
          color: "#888884",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        {txt}
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1100 }}>
      {/* Benchmark editor */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: editingBench ? 16 : 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
              Readiness benchmarks
            </h2>
            <p style={{ color: "#555550", fontSize: 13, margin: 0 }}>
              Adequate and best-in-class thresholds by seniority. Shown as
              reference lines on all charts.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setEditingBench((p) => !p)}
            disabled={isPending}
          >
            {editingBench ? "Done" : "\u270e Edit benchmarks"}
          </Button>
        </div>
        {editingBench && (
          <BenchmarkEditor
            benchmarks={benchmarks}
            onChange={handleBenchmarkChange}
          />
        )}
      </div>

      {noData ? (
        <Card
          style={{
            padding: "64px 32px",
            textAlign: "center",
            color: "#888884",
          }}
        >
          <p style={{ fontSize: 16, margin: 0 }}>No interview data yet.</p>
          <p style={{ fontSize: 14, marginTop: 6 }}>
            Complete at least one interview to see results here.
          </p>
        </Card>
      ) : (
        <div>
          {/* Bar chart */}
          <div style={{ marginBottom: 40 }}>
            {sectionHeader(
              "Overall change readiness \u2014 all interviewees"
            )}
            <Card style={{ padding: "20px 20px 12px" }}>
              <SvgBar data={barData} benchmarks={benchmarkMap} />
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: 12,
                  fontSize: 12,
                  color: "#555550",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 2,
                      background: "#1E8C4A",
                      display: "inline-block",
                    }}
                  />
                  Industry best
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 2,
                      background: "#C07A00",
                      display: "inline-block",
                    }}
                  />
                  Industry adequate
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      background: "#1E8C4A",
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  70%+
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      background: "#C07A00",
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  40&ndash;69%
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      background: "#C0392B",
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  Below 40%
                </span>
              </div>
            </Card>
          </div>

          {/* Heatmap */}
          <div style={{ marginBottom: 40 }}>
            {sectionHeader(
              "Readiness heatmap \u2014 all interviewees by topic"
            )}
            <Card style={{ padding: "20px 20px 16px", overflowX: "auto" }}>
              <SvgHeatmap
                people={heatmapPeople}
                activeTopics={heatmapTopics}
              />
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 14,
                  fontSize: 12,
                  color: "#555550",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#888884",
                    fontWeight: 600,
                    marginRight: 4,
                  }}
                >
                  SCORE:
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      background: "#1E8C4A",
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  70%+ strong
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      background: "#C07A00",
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  40&ndash;69% developing
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      background: "#C0392B",
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  Below 40% at risk
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      background: "#F0EFEC",
                      border: "1px solid #DDDBD6",
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  Not assessed
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "#888884",
                  }}
                >
                  &#x2508; Seniority group boundary
                </span>
              </div>
            </Card>
          </div>

          {/* Score distribution by topic */}
          <div style={{ marginBottom: 40 }}>
            {sectionHeader("Score distribution by topic")}
            <Card style={{ padding: "20px 24px" }}>
              <p
                style={{ fontSize: 13, color: "#555550", marginBottom: 20 }}
              >
                Each bar shows the range of scores across all interviewees.
                The dot marks the group average. Narrow band = consensus;
                wide band = polarisation.
              </p>
              {activeTopics
                .map((t) => {
                  const scores = interviewed
                    .map((p) => p.topicScores[t.id])
                    .filter((v): v is number => v != null);
                  if (!scores.length) return null;
                  const avg = Math.round(
                    scores.reduce((a, b) => a + b, 0) / scores.length
                  );
                  const lo = Math.min(...scores);
                  const hi = Math.max(...scores);
                  const sd = Math.round(
                    Math.sqrt(
                      scores.reduce(
                        (a, b) => a + Math.pow(b - avg, 2),
                        0
                      ) / scores.length
                    )
                  );
                  const col = bColor(avg);
                  const isPol = sd > 15;
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 210,
                          fontSize: 13,
                          color: "#555550",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ flex: 1 }}>{t.name}</span>
                        {isPol && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#C07A00",
                              fontWeight: 700,
                              background: "rgba(192,122,0,.1)",
                              borderRadius: 10,
                              padding: "1px 6px",
                              flexShrink: 0,
                            }}
                          >
                            polarised
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 28,
                          background: "#F0EFEC",
                          borderRadius: 4,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: lo + "%",
                            width: hi - lo + "%",
                            top: 4,
                            height: 20,
                            background: col,
                            opacity: 0.55,
                            borderRadius: 3,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: `calc(${avg}% - 5px)`,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: col,
                            border: "2px solid #fff",
                            zIndex: 2,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: 36,
                          textAlign: "right",
                          fontSize: 13,
                          fontWeight: 700,
                          color: col,
                          flexShrink: 0,
                        }}
                      >
                        {avg}%
                      </div>
                      <div
                        style={{
                          width: 64,
                          fontSize: 11,
                          color: "#888884",
                          flexShrink: 0,
                        }}
                      >
                        {lo}&ndash;{hi}%
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 16,
                  fontSize: 12,
                  color: "#555550",
                  flexWrap: "wrap",
                  borderTop: "1px solid #DDDBD6",
                  paddingTop: 12,
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 8,
                      background: "#1E8C4A",
                      opacity: 0.55,
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  Score range
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#1E8C4A",
                      border: "2px solid #fff",
                      display: "inline-block",
                    }}
                  />
                  Group average
                </span>
                <span
                  style={{
                    color: "#C07A00",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#C07A00",
                      fontWeight: 700,
                      background: "rgba(192,122,0,.1)",
                      borderRadius: 10,
                      padding: "1px 6px",
                    }}
                  >
                    polarised
                  </span>{" "}
                  SD &gt; 15 &mdash; divergent views
                </span>
              </div>
            </Card>
          </div>

          {/* Gap analysis */}
          <div style={{ marginBottom: 40 }}>
            {sectionHeader(
              "Gap analysis \u2014 current vs. required readiness"
            )}
            <Card style={{ padding: "20px 24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#555550",
                    flex: 1,
                    margin: 0,
                  }}
                >
                  Teal bar shows current average. The amber marker shows the
                  required level. Set the required level below.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      color: "#555550",
                      fontWeight: 600,
                    }}
                  >
                    Required level:
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={requiredLevel}
                    onChange={(e) =>
                      setRequiredLevel(parseInt(e.target.value))
                    }
                    style={{
                      width: 120,
                      height: 8,
                      borderRadius: 4,
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      background: `linear-gradient(to right,#C07A00 ${requiredLevel}%,#DDDBD6 ${requiredLevel}%)`,
                    }}
                  />
                  <span
                    style={{
                      minWidth: 36,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#C07A00",
                    }}
                  >
                    {requiredLevel}%
                  </span>
                </div>
              </div>

              {(() => {
                const gapRows = activeTopics
                  .map((t) => {
                    const scores = interviewed
                      .map((p) => p.topicScores[t.id])
                      .filter((v): v is number => v != null);
                    const avg = scores.length
                      ? Math.round(
                          scores.reduce((a, b) => a + b, 0) /
                            scores.length
                        )
                      : null;
                    const gap =
                      avg != null ? requiredLevel - avg : null;
                    return { t, avg, gap };
                  })
                  .filter(
                    (r): r is typeof r & { avg: number; gap: number } =>
                      r.avg != null
                  );
                gapRows.sort((a, b) => (b.gap || 0) - (a.gap || 0));
                return gapRows.map(({ t, avg, gap }) => {
                  const isGap = gap > 0;
                  const gapCol =
                    gap > 15
                      ? "#C0392B"
                      : gap > 0
                        ? "#C07A00"
                        : "#1E8C4A";
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 210,
                          fontSize: 13,
                          color: "#555550",
                          flexShrink: 0,
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 14,
                          background: "#F0EFEC",
                          borderRadius: 7,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            width: avg + "%",
                            height: "100%",
                            background: "#009898",
                            opacity: 0.75,
                            borderRadius: 7,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: `calc(${requiredLevel}% - 1.5px)`,
                            top: -4,
                            width: 3,
                            height: 22,
                            background: "#C07A00",
                            borderRadius: 1,
                            zIndex: 2,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: 80,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexShrink: 0,
                          justifyContent: "flex-end",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#009898",
                          }}
                        >
                          {avg}%
                        </span>
                        <span
                          style={{ fontSize: 12, color: "#888884" }}
                        >
                          &rarr;
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: gapCol,
                          }}
                        >
                          {requiredLevel}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: 44,
                          textAlign: "right",
                          fontSize: 13,
                          fontWeight: 700,
                          color: gapCol,
                          flexShrink: 0,
                        }}
                      >
                        {isGap ? "+" + gap + "%" : "\u2713"}
                      </div>
                    </div>
                  );
                });
              })()}

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 16,
                  fontSize: 12,
                  color: "#555550",
                  borderTop: "1px solid #DDDBD6",
                  paddingTop: 12,
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 8,
                      background: "#009898",
                      opacity: 0.75,
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  />
                  Current score
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 3,
                      height: 14,
                      background: "#C07A00",
                      borderRadius: 1,
                      display: "inline-block",
                    }}
                  />
                  Required level
                </span>
                <span style={{ color: "#C0392B", fontWeight: 600 }}>
                  &gt; 15% gap = priority
                </span>
                <span style={{ color: "#1E8C4A" }}>&check; = on target</span>
              </div>
            </Card>
          </div>

          {/* Cohort strengths & risks */}
          <div style={{ marginBottom: 40 }}>
            {sectionHeader("Cohort strengths & risks")}
            <Card style={{ padding: "20px 24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 24,
                }}
              >
                {/* Strengths */}
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1E8C4A",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "rgba(30,140,74,.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      &uarr;
                    </span>
                    Collective strengths
                  </div>
                  {[...activeTopics]
                    .map((t) => {
                      const vals = interviewed
                        .map((p) => p.topicScores[t.id])
                        .filter((v): v is number => v != null);
                      return {
                        name: t.name,
                        avg: vals.length
                          ? Math.round(
                              vals.reduce((a, b) => a + b, 0) /
                                vals.length
                            )
                          : null,
                      };
                    })
                    .filter(
                      (x): x is { name: string; avg: number } =>
                        x.avg != null
                    )
                    .sort((a, b) => b.avg - a.avg)
                    .slice(0, 3)
                    .map((x) => (
                      <div
                        key={x.name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 0",
                          borderBottom: "1px solid #F0EFEC",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "#555550" }}>{x.name}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: bColor(x.avg),
                          }}
                        >
                          {x.avg}%
                        </span>
                      </div>
                    ))}
                </div>

                {/* Risks */}
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#C0392B",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "rgba(192,57,43,.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      &darr;
                    </span>
                    Collective risks
                  </div>
                  {[...activeTopics]
                    .map((t) => {
                      const vals = interviewed
                        .map((p) => p.topicScores[t.id])
                        .filter((v): v is number => v != null);
                      return {
                        name: t.name,
                        avg: vals.length
                          ? Math.round(
                              vals.reduce((a, b) => a + b, 0) /
                                vals.length
                            )
                          : null,
                      };
                    })
                    .filter(
                      (x): x is { name: string; avg: number } =>
                        x.avg != null
                    )
                    .sort((a, b) => a.avg - b.avg)
                    .slice(0, 3)
                    .map((x) => (
                      <div
                        key={x.name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 0",
                          borderBottom: "1px solid #F0EFEC",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "#555550" }}>{x.name}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: bColor(x.avg),
                          }}
                        >
                          {x.avg}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Individual topic profiles (radar charts) */}
          <div>
            {sectionHeader("Individual topic profiles")}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {[...interviewed]
                .sort(
                  (a, b) =>
                    CAT_ORDER.indexOf(a.category) -
                    CAT_ORDER.indexOf(b.category)
                )
                .map((p) => {
                  const overall = p.overallScore;
                  const topicScores = activeTopics.map(
                    (t) => p.topicScores[t.id] ?? 0
                  );
                  const topicNames = activeTopics.map((t) => t.name);
                  const adq =
                    benchmarkMap[p.category]?.adequate ?? 40;
                  const best =
                    benchmarkMap[p.category]?.best ?? 85;
                  const ini = p.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("");
                  const pairs = activeTopics
                    .map((t) => ({
                      name: t.name,
                      score: p.topicScores[t.id],
                    }))
                    .filter(
                      (x): x is { name: string; score: number } =>
                        x.score != null
                    );
                  const srSorted = [...pairs].sort(
                    (a, b) => b.score - a.score
                  );
                  const top2 = srSorted.slice(0, 2);
                  const bot2 = srSorted.slice(-2).reverse();

                  return (
                    <Card key={p.id} style={{ padding: 20 }}>
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 16,
                          paddingBottom: 14,
                          borderBottom: "1px solid #DDDBD6",
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "#F0EFEC",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#009898",
                            flexShrink: 0,
                          }}
                        >
                          {ini}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>
                            {p.name}
                          </div>
                          <div
                            style={{ color: "#555550", fontSize: 12 }}
                          >
                            {p.title} &middot; {p.category}
                          </div>
                        </div>
                        {overall != null && (
                          <div
                            style={{
                              textAlign: "right",
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: bColor(overall),
                              }}
                            >
                              {overall}%
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#888884",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              Overall
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Body: radar + details */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 20,
                          alignItems: "start",
                        }}
                      >
                        {/* Left: radar + topic bars */}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              marginBottom: 10,
                            }}
                          >
                            <SvgRadar
                              topics={topicNames}
                              scores={topicScores}
                              adequate={adq}
                              best={best}
                              category={p.category}
                              size={220}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              justifyContent: "center",
                              fontSize: 11,
                              color: "#555550",
                              marginBottom: 12,
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  width: 14,
                                  height: 2,
                                  background: "#1E8C4A",
                                  display: "inline-block",
                                }}
                              />
                              Best
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  width: 14,
                                  height: 2,
                                  background: "#C07A00",
                                  display: "inline-block",
                                }}
                              />
                              Adequate
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  background: "#009898",
                                  opacity: 0.4,
                                  borderRadius: 2,
                                  display: "inline-block",
                                }}
                              />
                              Score
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 5,
                              borderTop: "1px solid #DDDBD6",
                              paddingTop: 10,
                            }}
                          >
                            {activeTopics.map((t, i) => {
                              const ts = topicScores[i];
                              return (
                                <div
                                  key={t.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
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
                                      width: 60,
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
                                      color:
                                        ts === 0
                                          ? "#888884"
                                          : bColor(ts),
                                      textAlign: "right",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {ts === 0 ? "\u2014" : ts + "%"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right: strengths, risks, benchmark */}
                        <div
                          style={{
                            borderLeft: "1px solid #DDDBD6",
                            paddingLeft: 20,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: "#1E8C4A",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              marginBottom: 10,
                            }}
                          >
                            Strengths
                          </div>
                          {top2.map((x) => (
                            <div
                              key={x.name}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "7px 0",
                                borderBottom:
                                  "1px solid #F0EFEC",
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
                                  background:
                                    bColor(x.score) + "15",
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
                              fontSize: 10,
                              color: "#C0392B",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              margin: "16px 0 10px",
                            }}
                          >
                            Risks
                          </div>
                          {bot2.map((x) => (
                            <div
                              key={x.name}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "7px 0",
                                borderBottom:
                                  "1px solid #F0EFEC",
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
                                  background:
                                    bColor(x.score) + "15",
                                  padding: "2px 8px",
                                  borderRadius: 10,
                                  flexShrink: 0,
                                }}
                              >
                                {x.score}%
                              </span>
                            </div>
                          ))}

                          {overall != null && (
                            <div
                              style={{
                                marginTop: 20,
                                padding: 14,
                                background: "#F0EFEC",
                                borderRadius: 8,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#888884",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                  marginBottom: 8,
                                  textAlign: "center",
                                }}
                              >
                                Benchmark ({p.category})
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 12,
                                  marginBottom: 4,
                                }}
                              >
                                <span style={{ color: "#555550" }}>
                                  Adequate
                                </span>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: "#C07A00",
                                  }}
                                >
                                  {benchmarkMap[p.category]
                                    ?.adequate ?? "\u2014"}
                                  %
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 12,
                                }}
                              >
                                <span style={{ color: "#555550" }}>
                                  Best in class
                                </span>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: "#1E8C4A",
                                  }}
                                >
                                  {benchmarkMap[p.category]
                                    ?.best ?? "\u2014"}
                                  %
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
