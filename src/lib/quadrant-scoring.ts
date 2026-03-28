// Quadrant Scoring Algorithm for Manager Skills Assessment™
//
// Two axes (binary scoring per response: 1 or 2):
//   A-axis (Accountability & Structure): Sum across 20 scenarios → range 20-40
//   C-axis (Support & Connection): Sum across 20 scenarios → range 20-40
//
// Quadrants (threshold: > 30 = high):
//   Intentional Leadership: high A + high C
//   Command & Control: high A + low C
//   Overly Supportive: low A + high C
//   Disengaged & Absent: low A + low C

export type Quadrant =
  | "intentional"
  | "command_control"
  | "overly_supportive"
  | "absent";

export interface QuadrantResult {
  aScore: number; // Accountability & Structure (20-40)
  cScore: number; // Support & Connection (20-40)
  quadrant: Quadrant;
  quadrantLabel: string;
}

export interface ResponseScore {
  a_score: number; // 1 or 2
  c_score: number; // 1 or 2
  dimension?: string;
}

// The threshold for quadrant placement.
// Score > 30 = high on that dimension.
// Score <= 30 = low on that dimension.
// 20 scenarios × max 2 per axis = 40 max. Midpoint of 20-40 range = 30.
const MIDPOINT = 30;

// Min and max possible scores (for scatter plot scale)
export const SCORE_MIN = 20;
export const SCORE_MAX = 40;

// Internal/admin labels
const QUADRANT_LABELS: Record<Quadrant, string> = {
  intentional: "Intentional Leadership",
  command_control: "Command & Control",
  overly_supportive: "Overly Supportive",
  absent: "Disengaged & Absent",
};

// Manager-facing labels (developmental, not judgmental)
const QUADRANT_LABELS_MANAGER: Record<Quadrant, string> = {
  intentional: "Intentional Leadership",
  command_control: "Results-Driven",
  overly_supportive: "People-First",
  absent: "Emerging Leader",
};

export function calculateQuadrant(responses: ResponseScore[]): QuadrantResult {
  const aScore = responses.reduce((sum, r) => sum + r.a_score, 0);
  const cScore = responses.reduce((sum, r) => sum + r.c_score, 0);

  let quadrant: Quadrant;
  if (aScore > MIDPOINT && cScore > MIDPOINT) {
    quadrant = "intentional";
  } else if (aScore > MIDPOINT && cScore <= MIDPOINT) {
    quadrant = "command_control";
  } else if (aScore <= MIDPOINT && cScore > MIDPOINT) {
    quadrant = "overly_supportive";
  } else {
    quadrant = "absent";
  }

  return {
    aScore,
    cScore,
    quadrant,
    quadrantLabel: QUADRANT_LABELS[quadrant],
  };
}

// Get dimension-level A and C scores for detailed reporting
export function getDimensionScores(
  responses: { dimension: string; a_score: number; c_score: number }[]
) {
  const dimensions: Record<string, { a_total: number; c_total: number; count: number }> = {};

  for (const r of responses) {
    if (!dimensions[r.dimension]) {
      dimensions[r.dimension] = { a_total: 0, c_total: 0, count: 0 };
    }
    dimensions[r.dimension].a_total += r.a_score;
    dimensions[r.dimension].c_total += r.c_score;
    dimensions[r.dimension].count += 1;
  }

  return Object.entries(dimensions).map(([key, data]) => ({
    dimension: key,
    a_score: data.a_total, // Range: 4-8 (4 scenarios × 1 or 2)
    c_score: data.c_total, // Range: 4-8
    count: data.count,
  }));
}

// Calculate gap to intentional leadership (max is 40 on both axes)
export function getGapToIntentional(result: QuadrantResult) {
  return {
    accountabilityGap: SCORE_MAX - result.aScore,
    connectionGap: SCORE_MAX - result.cScore,
    totalGap: (SCORE_MAX - result.aScore) + (SCORE_MAX - result.cScore),
    primaryGapAxis:
      SCORE_MAX - result.aScore > SCORE_MAX - result.cScore
        ? ("accountability" as const)
        : ("connection" as const),
  };
}

export { QUADRANT_LABELS, QUADRANT_LABELS_MANAGER, MIDPOINT };
