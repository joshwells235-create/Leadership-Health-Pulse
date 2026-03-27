"use client";

import { useState } from "react";
import { MIDPOINT } from "@/lib/quadrant-scoring";

interface ManagerPoint {
  id: string;
  name: string;
  xScore: number; // supportiveness
  yScore: number; // accountability
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

  // Convert score (1-5) to pixel position.
  // The MIDPOINT (3.8) maps to the visual center (50%).
  // Scores 1 to 3.8 fill the left/bottom half.
  // Scores 3.8 to 5 fill the right/top half.
  function scoreToPercent(score: number) {
    if (score <= MIDPOINT) {
      // Map 1..MIDPOINT to 0..0.5
      return ((score - 1) / (MIDPOINT - 1)) * 0.5;
    } else {
      // Map MIDPOINT..5 to 0.5..1
      return 0.5 + ((score - MIDPOINT) / (5 - MIDPOINT)) * 0.5;
    }
  }

  function toPixelX(score: number) {
    return padding + scoreToPercent(score) * plotWidth;
  }

  function toPixelY(score: number) {
    return padding + (1 - scoreToPercent(score)) * plotHeight;
  }

  // Visual crosshairs at the center (equal quadrants visually)
  const visualMidX = padding + plotWidth / 2;
  const visualMidY = padding + plotHeight / 2;

  return (
    <div className="relative inline-block">
      <svg width={width} height={height} className="overflow-visible">
        {/* Quadrant backgrounds - equal visual quadrants */}
        <rect x={visualMidX} y={padding} width={plotWidth / 2} height={plotHeight / 2} fill={QUADRANT_BG_COLORS.intentional} />
        <rect x={padding} y={padding} width={plotWidth / 2} height={plotHeight / 2} fill={QUADRANT_BG_COLORS.command_control} />
        <rect x={padding} y={visualMidY} width={plotWidth / 2} height={plotHeight / 2} fill={QUADRANT_BG_COLORS.absent} />
        <rect x={visualMidX} y={visualMidY} width={plotWidth / 2} height={plotHeight / 2} fill={QUADRANT_BG_COLORS.overly_supportive} />

        {/* Border */}
        <rect
          x={padding} y={padding} width={plotWidth} height={plotHeight}
          fill="none" stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" rx="4"
        />

        {/* Crosshairs at visual center */}
        <line x1={visualMidX} y1={padding} x2={visualMidX} y2={padding + plotHeight} stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" />
        <line x1={padding} y1={visualMidY} x2={padding + plotWidth} y2={visualMidY} stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" />

        {/* Quadrant labels - centered in each quadrant region */}
        {showLabels && (
          <>
            <text x={visualMidX + plotWidth / 4} y={padding + plotHeight / 4} textAnchor="middle" fill="#007efa" fontSize="11" fontWeight="600" opacity="0.5">
              Intentional
            </text>
            <text x={padding + plotWidth / 4} y={padding + plotHeight / 4} textAnchor="middle" fill="#F5A623" fontSize="10" fontWeight="600" opacity="0.5">
              Command &amp; Control
            </text>
            <text x={padding + plotWidth / 4} y={visualMidY + plotHeight / 4} textAnchor="middle" fill="#EA0C67" fontSize="10" fontWeight="600" opacity="0.5">
              Absent
            </text>
            <text x={visualMidX + plotWidth / 4} y={visualMidY + plotHeight / 4} textAnchor="middle" fill="#F5A623" fontSize="10" fontWeight="600" opacity="0.5">
              Overly Supportive
            </text>
          </>
        )}

        {/* Axis labels - clean, no numbers */}
        <text x={padding + plotWidth / 2} y={height - 8} textAnchor="middle" fill="#101d51" fontSize="11" fontWeight="500" opacity="0.4">
          Supportiveness →
        </text>
        <text x={12} y={padding + plotHeight / 2} textAnchor="middle" fill="#101d51" fontSize="11" fontWeight="500" opacity="0.4" transform={`rotate(-90, 12, ${padding + plotHeight / 2})`}>
          Accountability →
        </text>

        {/* Movement arrows (for reassessment comparison) */}
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
                cx={toPixelX(prev.xScore)} cy={toPixelY(prev.yScore)} r={6}
                fill={QUADRANT_COLORS[m.quadrant as keyof typeof QUADRANT_COLORS] || "#101d51"}
                opacity={0.2} stroke="white" strokeWidth="1"
              />
            );
          })}

        {/* Manager dots */}
        {managers.map((m) => (
          <g key={m.id}>
            <circle
              cx={toPixelX(m.xScore)} cy={toPixelY(m.yScore)}
              r={hoveredManager === m.id ? 9 : 7}
              fill={QUADRANT_COLORS[m.quadrant as keyof typeof QUADRANT_COLORS] || "#101d51"}
              stroke="white" strokeWidth="2"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredManager(m.id)}
              onMouseLeave={() => setHoveredManager(null)}
            />
            {hoveredManager === m.id && (
              <g>
                <rect
                  x={toPixelX(m.xScore) - 60} y={toPixelY(m.yScore) - 38}
                  width="120" height="28" rx="4" fill="#101d51" opacity="0.9"
                />
                <text
                  x={toPixelX(m.xScore)} y={toPixelY(m.yScore) - 20}
                  textAnchor="middle" fill="white" fontSize="11" fontWeight="500"
                >
                  {m.name}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
