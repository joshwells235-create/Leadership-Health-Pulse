// Quadrant Scoring Algorithm for ELITE5 Manager Assessment
//
// Two axes:
//   X-axis (supportiveness): How much the manager develops people, builds trust, communicates
//   Y-axis (accountability): How much the manager drives execution, holds standards, addresses issues
//
// Quadrants:
//   Top Right: Intentional Leadership (high accountability + high supportiveness) = OPTIMAL
//   Top Left: Command & Control (high accountability + low supportiveness)
//   Bottom Right: Overly Supportive (low accountability + high supportiveness)
//   Bottom Left: Absent/Disengaged (low accountability + low supportiveness)

export type Quadrant =
  | "intentional"
  | "command_control"
  | "overly_supportive"
  | "absent";

export interface QuadrantResult {
  xScore: number; // supportiveness (1-5 scale)
  yScore: number; // accountability (1-5 scale)
  quadrant: Quadrant;
  quadrantLabel: string;
}

export interface ResponseData {
  rating: number;
  axis: "accountability" | "supportiveness";
}

// The threshold for Intentional Leadership.
// Set at 3.8 (not 3.0) because:
// 1. Self-assessment bias: most people rate themselves 3+ even when they're mediocre
// 2. A 3/5 on "I address underperformance within days" means you often don't. That's not intentional.
// 3. Intentional Leadership should mean something. It's the goal, not the default.
// 4. This ensures the scatter plot actually differentiates managers rather than
//    clustering everyone in the top-right quadrant.
const MIDPOINT = 3.8;

const QUADRANT_LABELS: Record<Quadrant, string> = {
  intentional: "Intentional Leadership",
  command_control: "Command & Control",
  overly_supportive: "Overly Supportive",
  absent: "Absent / Disengaged",
};

export function calculateQuadrant(responses: ResponseData[]): QuadrantResult {
  const accountabilityResponses = responses.filter(
    (r) => r.axis === "accountability"
  );
  const supportivenessResponses = responses.filter(
    (r) => r.axis === "supportiveness"
  );

  const yScore =
    accountabilityResponses.length > 0
      ? accountabilityResponses.reduce((sum, r) => sum + r.rating, 0) /
        accountabilityResponses.length
      : MIDPOINT;

  const xScore =
    supportivenessResponses.length > 0
      ? supportivenessResponses.reduce((sum, r) => sum + r.rating, 0) /
        supportivenessResponses.length
      : MIDPOINT;

  let quadrant: Quadrant;
  if (yScore >= MIDPOINT && xScore >= MIDPOINT) {
    quadrant = "intentional";
  } else if (yScore >= MIDPOINT && xScore < MIDPOINT) {
    quadrant = "command_control";
  } else if (yScore < MIDPOINT && xScore >= MIDPOINT) {
    quadrant = "overly_supportive";
  } else {
    quadrant = "absent";
  }

  return {
    xScore: Math.round(xScore * 100) / 100,
    yScore: Math.round(yScore * 100) / 100,
    quadrant,
    quadrantLabel: QUADRANT_LABELS[quadrant],
  };
}

// Get dimension-level scores for detailed reporting
export function getDimensionScores(
  responses: { dimension: string; rating: number; axis: string }[]
) {
  const dimensions: Record<
    string,
    { total: number; count: number; accountability: number[]; supportiveness: number[] }
  > = {};

  for (const r of responses) {
    if (!dimensions[r.dimension]) {
      dimensions[r.dimension] = {
        total: 0,
        count: 0,
        accountability: [],
        supportiveness: [],
      };
    }
    dimensions[r.dimension].total += r.rating;
    dimensions[r.dimension].count += 1;
    if (r.axis === "accountability") {
      dimensions[r.dimension].accountability.push(r.rating);
    } else {
      dimensions[r.dimension].supportiveness.push(r.rating);
    }
  }

  return Object.entries(dimensions).map(([key, data]) => ({
    dimension: key,
    average: Math.round((data.total / data.count) * 100) / 100,
    accountabilityAvg:
      data.accountability.length > 0
        ? Math.round(
            (data.accountability.reduce((a, b) => a + b, 0) /
              data.accountability.length) *
              100
          ) / 100
        : null,
    supportivenessAvg:
      data.supportiveness.length > 0
        ? Math.round(
            (data.supportiveness.reduce((a, b) => a + b, 0) /
              data.supportiveness.length) *
              100
          ) / 100
        : null,
  }));
}

// Calculate gap to intentional leadership (5.0 on both axes)
export function getGapToIntentional(result: QuadrantResult) {
  return {
    accountabilityGap: Math.round((5.0 - result.yScore) * 100) / 100,
    supportivenessGap: Math.round((5.0 - result.xScore) * 100) / 100,
    totalGap:
      Math.round((5.0 - result.yScore + (5.0 - result.xScore)) * 100) / 100,
    primaryGapAxis:
      5.0 - result.yScore > 5.0 - result.xScore
        ? ("accountability" as const)
        : ("supportiveness" as const),
  };
}

export { QUADRANT_LABELS };
