"use client";

import { useState, useMemo } from "react";
import { MIDPOINT } from "@/lib/quadrant-scoring";

interface ManagerPoint {
  id: string;
  name: string;
  xScore: number; // Support & Connection (20-40)
  yScore: number; // Accountability & Structure (20-40)
  quadrant: string;
  attemptNumber?: number;
}

interface ScatterPlotProps {
  managers: ManagerPoint[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  previousPositions?: Record<string, { xScore: number; yScore: number }>;
}

const QUADRANT_COLORS = {
  intentional: "#007efa",
  command_control: "#F5A623",
  overly_supportive: "#F5A623",
  absent: "#EA0C67",
};

const QUADRANT_BG_COLORS = {
  intentional: "rgba(0, 126, 250, 0.06)",
  command_control: "rgba(245, 166, 35, 0.06)",
  overly_supportive: "rgba(245, 166, 35, 0.06)",
  absent: "rgba(234, 12, 103, 0.06)",
};

// Visual plot range — extends 2 points beyond the theoretical
// min/max so dots never sit on the edge of the plot area.
// Theoretical range is 20-40, but we show 18-42 for breathing room.
const PLOT_MIN = 18;
const PLOT_MAX = 42;

export default function ScatterPlot({
  managers,
  width = 500,
  height = 500,
  showLabels = true,
  previousPositions,
}: ScatterPlotProps) {
  const [hoveredManager, setHoveredManager] = useState<string | null>(null);

  const padding = 40;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  // Convert score to pixel position within the visible range
  function scoreToPercent(score: number) {
    return (score - PLOT_MIN) / (PLOT_MAX - PLOT_MIN);
  }

  function toPixelX(score: number) {
    return padding + scoreToPercent(score) * plotWidth;
  }

  function toPixelY(score: number) {
    return padding + (1 - scoreToPercent(score)) * plotHeight;
  }

  // Crosshairs at the midpoint (30)
  const visualMidX = toPixelX(MIDPOINT);
  const visualMidY = toPixelY(MIDPOINT);

  // Detect overlapping dots and apply jitter so all are visible.
  // Groups managers by their rounded pixel position, then fans them
  // out in a circle when 2+ dots share the same spot.
  const jitteredPositions = useMemo(() => {
    const DOT_RADIUS = 7;
    const JITTER_DISTANCE = DOT_RADIUS * 2.5; // spacing between overlapping dots

    // Group by grid cell (round to nearest pixel cluster)
    const groups = new Map<string, string[]>();
    const basePositions = new Map<string, { px: number; py: number }>();

    for (const m of managers) {
      const px = toPixelX(m.xScore);
      const py = toPixelY(m.yScore);
      basePositions.set(m.id, { px, py });

      // Round to detect overlaps (within DOT_RADIUS pixels = same spot)
      const gx = Math.round(px / (DOT_RADIUS * 2));
      const gy = Math.round(py / (DOT_RADIUS * 2));
      const key = `${gx},${gy}`;

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m.id);
    }

    // Apply jitter to groups with 2+ dots
    const result = new Map<string, { px: number; py: number }>();
    for (const [, ids] of groups) {
      if (ids.length === 1) {
        result.set(ids[0], basePositions.get(ids[0])!);
      } else {
        // Fan out in a circle around the center point
        const center = basePositions.get(ids[0])!;
        const angleStep = (2 * Math.PI) / ids.length;
        // Scale jitter distance based on count so large groups spread more
        const distance = Math.min(
          JITTER_DISTANCE * Math.min(ids.length, 6) * 0.4,
          plotWidth * 0.08
        );
        for (let i = 0; i < ids.length; i++) {
          const angle = angleStep * i - Math.PI / 2; // start at top
          result.set(ids[i], {
            px: center.px + Math.cos(angle) * distance,
            py: center.py + Math.sin(angle) * distance,
          });
        }
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managers, plotWidth, plotHeight]);

  // Adaptive dot size based on manager count
  const dotRadius = managers.length > 25 ? 5 : managers.length > 15 ? 6 : 7;
  const hoverRadius = dotRadius + 2;

  return (
    <div className="relative inline-block">
      <svg width={width} height={height} className="overflow-visible">
        {/* Quadrant backgrounds */}
        <rect x={visualMidX} y={padding} width={padding + plotWidth - visualMidX} height={visualMidY - padding} fill={QUADRANT_BG_COLORS.intentional} />
        <rect x={padding} y={padding} width={visualMidX - padding} height={visualMidY - padding} fill={QUADRANT_BG_COLORS.command_control} />
        <rect x={padding} y={visualMidY} width={visualMidX - padding} height={padding + plotHeight - visualMidY} fill={QUADRANT_BG_COLORS.absent} />
        <rect x={visualMidX} y={visualMidY} width={padding + plotWidth - visualMidX} height={padding + plotHeight - visualMidY} fill={QUADRANT_BG_COLORS.overly_supportive} />

        {/* Border */}
        <rect
          x={padding} y={padding} width={plotWidth} height={plotHeight}
          fill="none" stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" rx="4"
        />

        {/* Crosshairs at midpoint */}
        <line x1={visualMidX} y1={padding} x2={visualMidX} y2={padding + plotHeight} stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" />
        <line x1={padding} y1={visualMidY} x2={padding + plotWidth} y2={visualMidY} stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" />

        {/* Quadrant labels */}
        {showLabels && (
          <>
            <text x={visualMidX + (padding + plotWidth - visualMidX) / 2} y={padding + (visualMidY - padding) / 2} textAnchor="middle" fill="#007efa" fontSize="11" fontWeight="600" opacity="0.5">
              Intentional
            </text>
            <text x={padding + (visualMidX - padding) / 2} y={padding + (visualMidY - padding) / 2} textAnchor="middle" fill="#F5A623" fontSize="10" fontWeight="600" opacity="0.5">
              Command &amp; Control
            </text>
            <text x={padding + (visualMidX - padding) / 2} y={visualMidY + (padding + plotHeight - visualMidY) / 2} textAnchor="middle" fill="#EA0C67" fontSize="10" fontWeight="600" opacity="0.5">
              Disengaged
            </text>
            <text x={visualMidX + (padding + plotWidth - visualMidX) / 2} y={visualMidY + (padding + plotHeight - visualMidY) / 2} textAnchor="middle" fill="#F5A623" fontSize="10" fontWeight="600" opacity="0.5">
              Overly Supportive
            </text>
          </>
        )}

        {/* Axis labels */}
        <text x={padding + plotWidth / 2} y={height - 8} textAnchor="middle" fill="#101d51" fontSize="11" fontWeight="500" opacity="0.4">
          Support &amp; Connection &rarr;
        </text>
        <text x={12} y={padding + plotHeight / 2} textAnchor="middle" fill="#101d51" fontSize="11" fontWeight="500" opacity="0.4" transform={`rotate(-90, 12, ${padding + plotHeight / 2})`}>
          Accountability &rarr;
        </text>

        {/* Movement arrows (reassessment comparison) */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#101d51" fillOpacity="0.3" />
          </marker>
        </defs>

        {previousPositions &&
          managers.map((m) => {
            const prev = previousPositions[m.id];
            if (!prev) return null;
            return (
              <line
                key={`arrow-${m.id}`}
                x1={toPixelX(prev.xScore)} y1={toPixelY(prev.yScore)}
                x2={toPixelX(m.xScore)} y2={toPixelY(m.yScore)}
                stroke="#101d51" strokeWidth="1.5" strokeOpacity="0.3" markerEnd="url(#arrowhead)"
              />
            );
          })}

        {/* Previous positions (faded dots) */}
        {previousPositions &&
          managers.map((m) => {
            const prev = previousPositions[m.id];
            if (!prev) return null;
            return (
              <circle
                key={`prev-${m.id}`}
                cx={toPixelX(prev.xScore)} cy={toPixelY(prev.yScore)} r={dotRadius - 1}
                fill={QUADRANT_COLORS[m.quadrant as keyof typeof QUADRANT_COLORS] || "#101d51"}
                opacity={0.2} stroke="white" strokeWidth="1"
              />
            );
          })}

        {/* Manager dots (jittered to prevent overlap) */}
        {managers.map((m) => {
          const pos = jitteredPositions.get(m.id);
          if (!pos) return null;
          return (
            <g key={m.id}>
              <circle
                cx={pos.px} cy={pos.py}
                r={hoveredManager === m.id ? hoverRadius : dotRadius}
                fill={QUADRANT_COLORS[m.quadrant as keyof typeof QUADRANT_COLORS] || "#101d51"}
                stroke="white" strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredManager(m.id)}
                onMouseLeave={() => setHoveredManager(null)}
              />
              {hoveredManager === m.id && (
                <g>
                  <rect
                    x={pos.px - 60} y={pos.py - 38}
                    width="120" height="28" rx="4" fill="#101d51" opacity="0.9"
                  />
                  <text
                    x={pos.px} y={pos.py - 20}
                    textAnchor="middle" fill="white" fontSize="11" fontWeight="500"
                  >
                    {m.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
