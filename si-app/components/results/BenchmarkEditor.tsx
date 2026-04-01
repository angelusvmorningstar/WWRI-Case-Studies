"use client";

export interface BenchmarkRow {
  category: string;
  adequate: number;
  best: number;
}

interface BenchmarkEditorProps {
  benchmarks: BenchmarkRow[];
  onChange: (benchmarks: BenchmarkRow[]) => void;
}

const C = {
  amb: "#C07A00",
  grn: "#1E8C4A",
  wht: "#1A1A1A",
  sub: "#555550",
  mut: "#888884",
  brd: "#DDDBD6",
};

export function BenchmarkEditor({ benchmarks, onChange }: BenchmarkEditorProps) {
  function update(category: string, field: "adequate" | "best", value: number) {
    onChange(benchmarks.map((b) => (b.category === category ? { ...b, [field]: value } : b)));
  }

  function resetDefaults() {
    onChange(benchmarks.map((b) => ({ ...b, adequate: 40, best: 85 })));
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DDDBD6",
        borderRadius: 10,
        padding: "20px 24px",
        marginTop: 14,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {benchmarks.map((b) => (
          <div key={b.category}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: C.wht }}>{b.category}</div>
            {(["adequate", "best"] as const).map((k) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 4, fontWeight: 600 }}>
                  {k === "adequate" ? "Industry adequate (%)" : "Industry best (%)"}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={b[k]}
                    onChange={(e) => update(b.category, k, parseInt(e.target.value))}
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      background: `linear-gradient(to right,${k === "adequate" ? C.amb : C.grn} ${b[k]}%,#DDDBD6 ${b[k]}%)`,
                    }}
                  />
                  <span style={{ minWidth: 36, fontSize: 13, fontWeight: 700, color: k === "adequate" ? C.amb : C.grn, textAlign: "right" }}>
                    {b[k]}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        onClick={resetDefaults}
        style={{
          marginTop: 14,
          background: "none",
          border: "none",
          color: C.mut,
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        {"\u21ba"} Reset to defaults
      </button>
    </div>
  );
}
