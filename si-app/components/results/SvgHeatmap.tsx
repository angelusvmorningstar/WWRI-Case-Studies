"use client";

import { useState } from "react";

export interface HeatmapPerson {
  id: string;
  name: string;
  category: string;
  overallScore: number | null;
  topicScores: Record<string, number | null>;
  hasData: boolean;
}

export interface HeatmapTopic {
  id: string;
  name: string;
}

interface SvgHeatmapProps {
  people: HeatmapPerson[];
  activeTopics: HeatmapTopic[];
}

const CAT_ORDER = ["Executive", "Senior Management", "Middle Management"];
const CELL_W = 72;
const CELL_H = 36;
const NAME_W = 160;
const OVERALL_W = 56;
const HEAD_H = 80;

function cellFill(v: number | null): string {
  if (v == null) return "#F0EFEC";
  if (v >= 70) return "#1E8C4A";
  if (v >= 40) return "#C07A00";
  return "#C0392B";
}

function cellText(v: number | null): string {
  return v == null ? "#888884" : "#FFFFFF";
}

function shortLabel(name: string): [string, string] {
  const words = name.split(" ");
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export function SvgHeatmap({ people, activeTopics }: SvgHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    topic: string;
    score: number | null;
    x: number;
    y: number;
  } | null>(null);

  const rows = [...people].sort(
    (a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category)
  );
  const cols = activeTopics;
  const totalW = NAME_W + OVERALL_W + cols.length * CELL_W + 2;
  const totalH = HEAD_H + rows.length * CELL_H + 2;

  return (
    <div style={{ overflowX: "auto", position: "relative" }}>
      <svg
        width={totalW}
        height={totalH}
        style={{ display: "block", fontFamily: "Calibri,Segoe UI,sans-serif" }}
      >
        {/* Header: INTERVIEWEE */}
        <rect x={0} y={0} width={NAME_W} height={HEAD_H} fill="#F5F4F0" />
        <text x={12} y={HEAD_H - 12} fontSize={11} fontWeight={700} fill="#888884">
          INTERVIEWEE
        </text>

        {/* Header: OVERALL */}
        <rect x={NAME_W} y={0} width={OVERALL_W} height={HEAD_H} fill="#F0EFEC" />
        {["OVER", "ALL"].map((w, i) => (
          <text
            key={i}
            x={NAME_W + OVERALL_W / 2}
            y={HEAD_H - 22 + i * 14}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill="#555550"
          >
            {w}
          </text>
        ))}

        {/* Topic column headers */}
        {cols.map((t, ci) => {
          const x = NAME_W + OVERALL_W + ci * CELL_W;
          const [l1, l2] = shortLabel(t.name);
          return (
            <g key={t.id}>
              <rect x={x} y={0} width={CELL_W} height={HEAD_H} fill={ci % 2 === 0 ? "#F5F4F0" : "#ECEAE4"} />
              <line x1={x} y1={0} x2={x} y2={HEAD_H} stroke="#DDDBD6" strokeWidth={1} />
              <text x={x + CELL_W / 2} y={HEAD_H - 28} textAnchor="middle" fontSize={9} fill="#555550">
                {l1}
              </text>
              {l2 && (
                <text x={x + CELL_W / 2} y={HEAD_H - 16} textAnchor="middle" fontSize={9} fill="#555550">
                  {l2}
                </text>
              )}
            </g>
          );
        })}

        {/* Header bottom line */}
        <line x1={0} y1={HEAD_H} x2={totalW} y2={HEAD_H} stroke="#DDDBD6" strokeWidth={1.5} />

        {/* Data rows */}
        {rows.map((p, ri) => {
          const y = HEAD_H + ri * CELL_H;
          const overall = p.overallScore;
          const isEven = ri % 2 === 0;
          const hasSess = p.hasData;

          return (
            <g key={p.id}>
              <rect x={0} y={y} width={NAME_W} height={CELL_H} fill={isEven ? "#FFFFFF" : "#FAFAF8"} />
              <line x1={0} y1={y + CELL_H} x2={totalW} y2={y + CELL_H} stroke="#DDDBD6" strokeWidth={0.5} />
              <text x={12} y={y + CELL_H / 2 - 4} fontSize={13} fontWeight={700} fill="#1A1A1A" dominantBaseline="auto">
                {p.name}
              </text>
              <text x={12} y={y + CELL_H / 2 + 9} fontSize={10} fill="#888884" dominantBaseline="auto">
                {p.category}
              </text>

              {/* Overall cell */}
              <rect x={NAME_W} y={y} width={OVERALL_W} height={CELL_H} fill={hasSess ? cellFill(overall) : "#F0EFEC"} />
              <line x1={NAME_W} y1={y} x2={NAME_W} y2={y + CELL_H} stroke="#DDDBD6" strokeWidth={1} />
              <text
                x={NAME_W + OVERALL_W / 2}
                y={y + CELL_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontWeight={800}
                fill={hasSess ? cellText(overall) : "#888884"}
              >
                {hasSess && overall != null ? overall + "%" : "\u2014"}
              </text>

              {/* Topic score cells */}
              {cols.map((t, ci) => {
                const cx = NAME_W + OVERALL_W + ci * CELL_W;
                const score = p.topicScores[t.id] ?? null;
                return (
                  <g
                    key={t.id}
                    onMouseEnter={() => setTooltip({ name: p.name, topic: t.name, score, x: cx + CELL_W / 2, y })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: "default" }}
                  >
                    <rect x={cx} y={y} width={CELL_W} height={CELL_H} fill={hasSess ? cellFill(score) : "#F0EFEC"} />
                    <line x1={cx} y1={y} x2={cx} y2={y + CELL_H} stroke="rgba(255,255,255,.15)" strokeWidth={1} />
                    <text
                      x={cx + CELL_W / 2}
                      y={y + CELL_H / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={12}
                      fontWeight={700}
                      fill={hasSess ? cellText(score) : "#888884"}
                    >
                      {hasSess && score != null ? score + "%" : "\u2014"}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Category divider lines (dashed teal) */}
        {CAT_ORDER.map((cat) => {
          const fi = rows.findIndex((r) => r.category === cat);
          if (fi <= 0) return null;
          const y = HEAD_H + fi * CELL_H;
          return (
            <line key={cat} x1={0} y1={y} x2={totalW} y2={y} stroke="#009898" strokeWidth={1.5} strokeDasharray="4 3" />
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%,-100%)",
            background: "#FFFFFF",
            border: "1px solid #DDDBD6",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0,0,0,.12)",
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.name}</div>
          <div style={{ color: "#888884", fontSize: 12, marginBottom: 4 }}>{tooltip.topic}</div>
          {tooltip.score != null ? (
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: tooltip.score >= 70 ? "#1E8C4A" : tooltip.score >= 40 ? "#C07A00" : "#C0392B",
              }}
            >
              {tooltip.score}%
            </div>
          ) : (
            <div style={{ color: "#888884" }}>No data</div>
          )}
        </div>
      )}
    </div>
  );
}
