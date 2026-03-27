// Shared report rendering components used by both CEO-facing report page and admin dashboard

export interface DimensionScore {
  composite: number;
  spread: number;
  hasMixedSignals: boolean;
  ratings: { questionIndex: number; questionText: string; rating: number }[];
}

export interface TierScores {
  overall: number;
  dimensions: Record<string, DimensionScore>;
}

export interface ReportData {
  id: string;
  overall_score: number;
  tier_scores: Record<string, number>;
  dimension_scores: Record<string, TierScores>;
  generated_content: {
    section1_overview: string;
    section2_tier_analysis: string;
    section3_cross_tier: string;
    section4_priorities: string;
    section5_next_steps: string;
  };
  report_format?: string;
  version?: number;
}

export interface SurveyData {
  respondent_name: string;
  respondent_email: string;
  survey_path: string;
  companies: {
    name: string;
    industry: string | null;
    employee_count_range: string;
  };
}

// ============================================
// Color Helpers
// ============================================
export function getScoreColor(score: number): string {
  if (score <= 2.4) return "bg-magenta text-white";
  if (score <= 3.4) return "bg-amber text-navy";
  return "bg-blue text-white";
}

export function getScoreColorLight(score: number): string {
  if (score <= 2.4) return "text-magenta";
  if (score <= 3.4) return "text-amber";
  return "text-blue";
}

// ============================================
// Label Helpers
// ============================================
export function getTierLabel(key: string): string {
  switch (key) {
    case "slt":
      return "Senior Leadership";
    case "middle":
      return "Middle Management";
    case "frontline":
      return "Frontline Management";
    case "hybrid":
      return "Your Managers";
    default:
      return key;
  }
}

export function getDimensionLabel(key: string): string {
  switch (key) {
    case "trust":
      return "Trust";
    case "dialogue":
      return "Dialogue";
    case "ownership":
      return "Ownership";
    case "capability":
      return "Capability";
    case "alignment":
      return "Alignment";
    default:
      return key;
  }
}

// ============================================
// Heatmap Component
// ============================================
export function Heatmap({
  dimensionScores,
}: {
  dimensionScores: Record<string, TierScores>;
}) {
  const tiers = Object.keys(dimensionScores);
  const dimensions = ["trust", "dialogue", "ownership", "capability", "alignment"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-3 text-sm font-semibold text-navy/60"></th>
            {dimensions.map((dim) => (
              <th
                key={dim}
                className="p-3 text-center text-sm font-semibold text-navy/80"
              >
                {getDimensionLabel(dim)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier} className="border-t border-navy/10">
              <td className="p-3 text-sm font-semibold text-navy whitespace-nowrap">
                {getTierLabel(tier)}
              </td>
              {dimensions.map((dim) => {
                const dimData = dimensionScores[tier]?.dimensions[dim];
                if (!dimData) return <td key={dim} className="p-3" />;

                return (
                  <td key={dim} className="p-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-14 h-10 rounded-md font-bold text-sm ${getScoreColor(dimData.composite)}`}
                    >
                      {dimData.composite}
                      {dimData.hasMixedSignals && (
                        <span className="ml-0.5 text-xs">*</span>
                      )}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-navy/40 mt-2">
        * Mixed signal: high variance within this dimension.
      </p>
    </div>
  );
}

// ============================================
// Report Section Component
// ============================================
export function ReportSection({
  title,
  sectionNumber,
  html,
}: {
  title: string;
  sectionNumber: number;
  html: string;
}) {
  return (
    <section className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="bg-navy px-6 py-4">
        <h2 className="text-white font-bold text-lg">
          <span className="text-white/50 mr-2">{sectionNumber}.</span>
          {title}
        </h2>
      </div>
      <div
        className="p-6 prose prose-navy max-w-none
          [&_h3]:text-navy [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3
          [&_h4]:text-navy [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2
          [&_p]:text-navy/80 [&_p]:leading-relaxed [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
          [&_li]:text-navy/80 [&_li]:mb-1
          [&_strong]:text-navy
          [&_blockquote]:border-l-4 [&_blockquote]:border-blue [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-navy/70"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

// ============================================
// Full Report View Component
// ============================================
export function ReportView({
  report,
  survey,
}: {
  report: ReportData;
  survey: SurveyData | null;
}) {
  const content = report.generated_content;
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Report Header */}
      <div className="text-center space-y-3 pb-6 border-b border-navy/10">
        <p className="text-sm font-semibold text-blue uppercase tracking-wide">
          Leadership Health Pulse
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-navy">
          Leadership Health Report
        </h1>
        <p className="text-navy/60">
          Prepared for {survey?.respondent_name || "CEO"},{" "}
          {survey?.companies?.name || "Company"}
        </p>
        <p className="text-navy/40 text-sm">{today}</p>
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-8 text-center">
        <p className="text-sm font-semibold text-navy/60 uppercase tracking-wide mb-2">
          Overall Leadership Health Score
        </p>
        <p className={`text-6xl font-bold ${getScoreColorLight(report.overall_score)}`}>
          {report.overall_score}
          <span className="text-2xl text-navy/40">/5.0</span>
        </p>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-6">
        <h3 className="font-bold text-navy mb-4">Tier Health Heatmap</h3>
        <Heatmap dimensionScores={report.dimension_scores} />
      </div>

      {/* Report Sections */}
      <ReportSection sectionNumber={1} title="Leadership Health Overview" html={content.section1_overview} />
      <ReportSection sectionNumber={2} title="Tier-by-Tier Analysis" html={content.section2_tier_analysis} />
      <ReportSection sectionNumber={3} title="Cross-Tier Patterns" html={content.section3_cross_tier} />
      <ReportSection sectionNumber={4} title="Priority Map" html={content.section4_priorities} />
      <ReportSection sectionNumber={5} title="Next Steps" html={content.section5_next_steps} />
    </div>
  );
}
