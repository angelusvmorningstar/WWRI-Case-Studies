"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        height: 44,
        padding: "0 28px",
        background: "#009898",
        color: "#FFFFFF",
        border: "none",
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "Calibri, Segoe UI, sans-serif",
      }}
    >
      🖨️  Print / Save as PDF
    </button>
  );
}
