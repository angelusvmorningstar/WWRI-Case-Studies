// Pure calculation functions for scoring — no side effects, no imports from server/db/React

export function averageScores(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export function applyCalibration(
  rawScore: number,
  interviewerAdjustments: number[]
): number {
  if (interviewerAdjustments.length === 0) return rawScore;
  const avgAdj = interviewerAdjustments.reduce((sum, a) => sum + a, 0) / interviewerAdjustments.length;
  return Math.max(0, Math.min(100, rawScore + avgAdj));
}

export function scoreColour(score: number): "green" | "amber" | "red" | "grey" {
  if (score >= 70) return "green";
  if (score >= 40) return "amber";
  if (score > 0) return "red";
  return "grey";
}

export function scoreColourClass(score: number): string {
  const c = scoreColour(score);
  switch (c) {
    case "green": return "text-ww-green bg-ww-green/10";
    case "amber": return "text-ww-amber bg-ww-amber/10";
    case "red": return "text-ww-red bg-ww-red/10";
    default: return "text-ww-text-muted bg-ww-text-muted/10";
  }
}

export function scoreBgClass(score: number): string {
  const c = scoreColour(score);
  switch (c) {
    case "green": return "bg-ww-green";
    case "amber": return "bg-ww-amber";
    case "red": return "bg-ww-red";
    default: return "bg-ww-text-muted";
  }
}
