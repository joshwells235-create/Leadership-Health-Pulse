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

  // Convert score (1-5) to pixel position
  function toPixelX(score: number) {
    return padding + ((score - 1) / 4) * plotWidth;
  }

  function toPixelY(score: number) {
    return padding + (1 - (score - 1) / 4) * plotHeight;
  }

  const midX = toPixelX(MIDPOINT);
  const midY = toPixelY(MIDPOINT);

  // Quadrant background rects need to be sized to the actual threshold position
  const leftWidth = midX - padding;
  const rightWidth = padding + plotWidth - midX;
  const topHeight = midY - padding;
  const bottomHeight = padding + plotHeight - midY;

  return (
    <div className="relative inline-block">
      <svg width={width} height={height} className="overflow-visible">
        {/* Quadrant backgrounds - sized to actual threshold */}
        {/* Top right: Intentional */}
        <rect x={midX} y={padding} width={rightWidth} height={topHeight} fill={QUADRANT_BG_COLORS.intentional} />
        {/* Top left: Command & Control */}
        <rect x={padding} y={padding} width={leftWidth} height={topHeight} fill={QUADRANT_BG_COLORS.command_control} />
        {/* Bottom left: Absent */}
        <rect x={padding} y={midY} width={leftWidth} height={bottomHeight} fill={QUADRANT_BG_COLORS.absent} />
        {/* Bottom right: Overly Supportive */}
        <rect x={midX} y={midY} width={rightWidth} height={bottomHeight} fill={QUADRANT_BG_COLORS.overly_supportive} />

        {/* Border */}
        <rect
          x={padding} y={padding} width={plotWidth} height={plotHeight}
          fill="none" stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" rx="4"
        />

        {/* Crosshairs at threshold */}
        <line x1={midX} y1={padding} x2={midX} y2={padding + plotHeight} stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" />
        <line x1={padding} y1={midY} x2={padding + plotWidth} y2={midY} stroke="#101d51" strokeWidth="1" strokeOpacity="0.12" />

        {/* Quadrant labels - centered in each quadrant region */}
        {showLabels && (
          <>
            <text x={midX + rightWidth / 2} y={padding + topHeight / 2} textAnchor="middle" fill="#007efa" fontSize="11" fontWeight="600" opacity="0.5">
              Intentional
            </text>
            <text x={padding + leftWidth / 2} y={padding + topHeight / 2} textAnchor="middle" fill="#F5A623" fontSize="10" fontWeight="600" opacity="0.5">
              Command &amp; Control
            </text>
            <text x={padding + leftWidth / 2} y={midY + bottomHeight / 2} textAnchor="middle" fill="#EA0C67" fontSize="10" fontWeight="600" opacity="0.5">
              Absent
            </text>
            <text x={midX + rightWidth / 2} y={midY + bottomHeight / 2} textAnchor="middle" fill="#F5A623" fontSize="10" fontWeight="600" opacity="0.5">
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
