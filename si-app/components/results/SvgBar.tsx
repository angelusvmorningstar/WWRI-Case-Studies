"use client";

import { useState } from "react";

export interface BarPerson {
  pid: string;
  name: string;
  fullName: string;
  category: string;
  score: number;
}

export interface BarBenchmarks {
  [category: string]: { adequate: number; best: number };
}

interface SvgBarProps {
  data: BarPerson[];
  benchmarks: BarBenchmarks;
}

const CAT_ORDER = ["Executive", "Senior Management", "Middle Management"];

function sColor(v: number): string {
  if (v >= 70) return "#1E8C4A";
  if (v >= 40) return "#C07A00";
  return "#C0392B";
}

export function SvgBar({ data, benchmarks }: SvgBarProps) {
  const [tooltip, setTooltip] = useState<{
    d: BarPerson;
    x: number;
    y: number;
  } | null>(null);

  const w = 700;
  const h = 300;
  const padL = 44;
  const padR = 80;
  const padT = 12;
  const padB = 72;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const sorted = [...data].sort(
    (a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category)
  );
  const n = sorted.length;

  if (n === 0) return null;

  const barW = Math.min(36, chartW / n - 8);
  const gap = chartW / n;

  function xPos(i: number): number {
    return padL + gap * i + gap / 2;
  }

  function yPos(v: number): number {
    return padT + chartH - (v / 100) * chartH;
  }

  function steppedLine(kind: "adequate" | "best"): string {
    if (n === 0) return "";
    const pts: string[] = [];
    let i = 0;
    while (i < n) {
      const cat = sorted[i].category;
      const val = (benchmarks[cat] || ({} as Record<string, number>))[kind] as
        | number
        | undefined;
      if (val == null) {
        i++;
        continue;
      }
      let j = i;
      while (j < n && sorted[j].category === cat) j++;
      const x1 = xPos(i) - gap / 2;
      const x2 = xPos(j - 1) + gap / 2;
      const y = yPos(val);
      pts.push(x1 + "," + y);
      pts.push(x2 + "," + y);
      i = j;
    }
    return pts.join(" ");
  }

  function segLabels(
    kind: "adequate" | "best"
  ): { key: string; x: number; y: number; label: string; color: string }[] {
    const labels: {
      key: string;
      x: number;
      y: number;
      label: string;
      color: string;
    }[] = [];
    let i = 0;
    while (i < n) {
      const cat = sorted[i].category;
      const val = (benchmarks[cat] || ({} as Record<string, number>))[kind] as
        | number
        | undefined;
      if (val == null) {
        i++;
        continue;
      }
      let j = i;
      while (j < n && sorted[j].category === cat) j++;
      labels.push({
        key: cat + kind,
        x: xPos(j - 1) + gap / 2 + 4,
        y: yPos(val),
        label: cat.split(" ")[0] + " " + kind,
        color: kind === "best" ? "#1E8C4A" : "#C07A00",
      });
      i = j;
    }
    return labels;
  }

  return (
    <div style={{ position: "relative" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: "block" }}
      >
        {/* Horizontal grid lines + axis labels */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={padL}
              y1={yPos(v)}
              x2={w - padR}
              y2={yPos(v)}
              stroke="#DDDBD6"
              strokeWidth={1}
              strokeDasharray={v === 0 ? "0" : "3 3"}
            />
            <text
              x={padL - 6}
              y={yPos(v)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="#888884"
              fontFamily="Calibri,Segoe UI,sans-serif"
            >
              {v}%
            </text>
          </g>
        ))}

        {/* Benchmark stepped lines (dashed) */}
        {(["best", "adequate"] as const).map((kind) => (
          <polyline
            key={kind}
            points={steppedLine(kind)}
            fill="none"
            stroke={kind === "best" ? "#1E8C4A" : "#C07A00"}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
        ))}

        {/* Benchmark segment labels */}
        {(["best", "adequate"] as const).flatMap((kind) =>
          segLabels(kind).map((l) => (
            <text
              key={l.key}
              x={l.x}
              y={l.y - 3}
              fontSize={9}
              fill={l.color}
              fontFamily="Calibri,Segoe UI,sans-serif"
            >
              {l.label}
            </text>
          ))
        )}

        {/* Category divider lines */}
        {CAT_ORDER.map((cat) => {
          const idx = sorted.map((d) => d.category).lastIndexOf(cat);
          if (idx < 0 || idx >= n - 1) return null;
          const x = xPos(idx) + gap / 2;
          return (
            <line
              key={cat + "_div"}
              x1={x}
              y1={padT}
              x2={x}
              y2={padT + chartH}
              stroke="#DDDBD6"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Bars */}
        {sorted.map((d, i) => {
          const bh = Math.max(2, (d.score / 100) * chartH);
          const by = yPos(d.score);
          const x = xPos(i);
          return (
            <g
              key={d.pid}
              onMouseEnter={() => setTooltip({ d, x, y: by })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: "default" }}
            >
              <rect
                x={x - barW / 2}
                y={by}
                width={barW}
                height={bh}
                fill="#009898"
                fillOpacity={0.75}
                rx={3}
              />
              <text
                x={x}
                y={by - 4}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={sColor(d.score)}
                fontFamily="Calibri,Segoe UI,sans-serif"
              >
                {d.score}%
              </text>
            </g>
          );
        })}

        {/* Name labels (rotated) */}
        {sorted.map((d, i) => (
          <text
            key={d.pid + "_lbl"}
            transform={`translate(${xPos(i)},${h - padB + 10}) rotate(-40)`}
            textAnchor="end"
            fontSize={11}
            fill="#555550"
            fontFamily="Calibri,Segoe UI,sans-serif"
          >
            {d.name}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: (tooltip.x / w) * 100 + "%",
            top: (tooltip.y / h) * 100 + "%",
            transform: "translate(-50%,-110%)",
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
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            {tooltip.d.fullName}
          </div>
          <div style={{ color: "#888884", fontSize: 12 }}>
            {tooltip.d.category}
          </div>
          <div
            style={{
              color: sColor(tooltip.d.score),
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            {tooltip.d.score}%
          </div>
        </div>
      )}
    </div>
  );
}
