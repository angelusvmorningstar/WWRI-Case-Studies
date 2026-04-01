"use client";

interface SvgRadarProps {
  topics: string[];
  scores: number[];
  adequate: number;
  best: number;
  category?: string;
  size?: number;
}

export function SvgRadar({
  topics,
  scores,
  adequate,
  best,
  size = 220,
}: SvgRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 36;
  const n = topics.length;

  if (n < 3) return null;

  function pt(val: number, i: number): [number, number] {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (val / 100) * maxR;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function ptLabel(i: number): [number, number] {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = maxR + 18;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function ring(val: number): string {
    return topics
      .map((_, i) => pt(val, i).join(","))
      .join(" ");
  }

  function anchor(i: number): "start" | "middle" | "end" {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    if (Math.abs(Math.cos(a)) < 0.1) return "middle";
    return Math.cos(a) > 0 ? "start" : "end";
  }

  function splitLabel(text: string): string[] {
    if (text.length > 14) {
      const mid = Math.ceil(text.length / 2);
      return [text.slice(0, mid), text.slice(mid)];
    }
    return [text];
  }

  const scorePolygon = topics
    .map((_, i) => pt(scores[i] || 0, i).join(","))
    .join(" ");

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      {/* Concentric grid rings */}
      {[25, 50, 75, 100].map((v) => (
        <polygon
          key={v}
          points={ring(v)}
          fill="none"
          stroke="#DDDBD6"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines from centre to each vertex */}
      {topics.map((_, i) => {
        const [x, y] = pt(100, i);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#DDDBD6"
            strokeWidth={1}
          />
        );
      })}

      {/* Best-in-class benchmark ring (dashed green) */}
      <polygon
        points={ring(best)}
        fill="#1E8C4A"
        fillOpacity={0.06}
        stroke="#1E8C4A"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* Adequate benchmark ring (dashed amber) */}
      <polygon
        points={ring(adequate)}
        fill="#C07A00"
        fillOpacity={0.06}
        stroke="#C07A00"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* Score polygon (filled teal) */}
      <polygon
        points={scorePolygon}
        fill="#009898"
        fillOpacity={0.18}
        stroke="#009898"
        strokeWidth={2}
      />

      {/* Score dots */}
      {topics.map((_, i) => {
        const [x, y] = pt(scores[i] || 0, i);
        return (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r={3.5}
            fill="#009898"
          />
        );
      })}

      {/* Topic labels */}
      {topics.map((t, i) => {
        const [x, y] = ptLabel(i);
        const words = splitLabel(t);
        return (
          <text
            key={`label-${i}`}
            x={x}
            y={y}
            textAnchor={anchor(i)}
            dominantBaseline="middle"
            fontSize={9}
            fill="#555550"
            fontFamily="Calibri,Segoe UI,sans-serif"
          >
            {words.length === 1 ? (
              words[0]
            ) : (
              <>
                <tspan x={x} dy="-0.5em">
                  {words[0]}
                </tspan>
                <tspan x={x} dy="1.1em">
                  {words[1]}
                </tspan>
              </>
            )}
          </text>
        );
      })}
    </svg>
  );
}
