"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generatePDF } from "@/lib/generate-pdf";

// ============================================
// Types
// ============================================
interface DimensionScore {
  composite: number;
  spread: number;
  hasMixedSignals: boolean;
  ratings: { questionIndex: number; questionText: string; rating: number }[];
}

interface TierScores {
  overall: number;
  dimensions: Record<string, DimensionScore>;
}

interface ReportData {
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
}

interface SurveyData {
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
// Heatmap Color Helper
// ============================================
function getScoreColor(score: number): string {
  if (score <= 2.4) return "bg-magenta text-white";
  if (score <= 3.4) return "bg-amber text-navy";
  return "bg-blue text-white";
}

function getScoreColorLight(score: number): string {
  if (score <= 2.4) return "text-magenta";
  if (score <= 3.4) return "text-amber";
  return "text-blue";
}

// ============================================
// Tier Label Helper
// ============================================
function getTierLabel(key: string): string {
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

function getDimensionLabel(key: string): string {
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
function Heatmap({
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
        * Mixed signal — high variance within this dimension. See tier analysis
        for details.
      </p>
    </div>
  );
}

// ============================================
// Report Section Component
// ============================================
function ReportSection({
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
// Main Report Page
// ============================================
export default function ReportPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [status, setStatus] = useState<
    "generating" | "loading" | "ready" | "error"
  >("generating");
  const [report, setReport] = useState<ReportData | null>(null);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function generateAndLoad() {
      // First check if a report already exists
      const { data: existingReport } = await supabase
        .from("reports")
        .select("*")
        .eq("survey_id", surveyId)
        .single();

      if (existingReport) {
        setReport(existingReport as ReportData);

        // Load survey + company data
        const { data: surveyData } = await supabase
          .from("surveys")
          .select("respondent_name, respondent_email, survey_path, companies(*)")
          .eq("id", surveyId)
          .single();

        if (surveyData) {
          setSurvey(surveyData as unknown as SurveyData);
        }

        setStatus("ready");
      } else {
        // Generate the report
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 150000); // 150s timeout

          const res = await fetch("/api/generate-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ surveyId }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Failed to generate report");
          }
          setReport(data.report as ReportData);
          setSurvey(data.survey as SurveyData);
          setStatus("ready");

          // Send emails (CEO gets full report + debrief link, LeadShift gets full copy)
          fetch("/api/send-report-emails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ surveyId }),
          }).catch((err) => console.error("Email send failed:", err));
        } catch (err) {
          console.error("Report generation failed:", err);
          setErrorMessage(
            err instanceof Error ? err.message : "Something went wrong"
          );
          setStatus("error");
          return;
        }
      }
    }

    generateAndLoad();
  }, [surveyId]);

  // ============================================
  // RENDER: Generating
  // ============================================
  if (status === "generating") {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 border-4 border-navy/20 border-t-blue rounded-full animate-spin mx-auto" />
          <h1 className="text-2xl font-bold text-navy">
            Generating Your Report
          </h1>
          <p className="text-navy/60">
            We&apos;re analyzing your responses and building your personalized
            Leadership Health Report. This usually takes 30-60 seconds.
          </p>
        </div>
      </main>
    );
  }

  // ============================================
  // RENDER: Error
  // ============================================
  if (status === "error") {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-navy">
            Something Went Wrong
          </h1>
          <p className="text-navy/60">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-navy text-white font-semibold px-8 py-3 rounded-md hover:bg-navy/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!report || !report.generated_content) return null;

  const content = report.generated_content;
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ============================================
  // RENDER: Report
  // ============================================
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownloadPDF() {
    setIsDownloading(true);
    try {
      const companyName = survey?.companies?.name || "Company";
      const filename = `Leadership-Health-Report-${companyName.replace(/\s+/g, "-")}.pdf`;
      await generatePDF("report-content", filename);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF. Please try again.");
    }
    setIsDownloading(false);
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      {/* Download Button - fixed at top */}
      <div className="max-w-3xl w-full flex justify-end mb-4">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="bg-navy text-white font-semibold px-6 py-2.5 rounded-md hover:bg-navy/90 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
        >
          {isDownloading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      <div id="report-content" className="max-w-3xl w-full space-y-8">
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
          <p
            className={`text-6xl font-bold ${getScoreColorLight(report.overall_score)}`}
          >
            {report.overall_score}
            <span className="text-2xl text-navy/40">/5.0</span>
          </p>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-bold text-navy mb-4">
            Tier Health Heatmap
          </h3>
          <Heatmap dimensionScores={report.dimension_scores} />
        </div>

        {/* Section 1: Overview */}
        <ReportSection
          sectionNumber={1}
          title="Leadership Health Overview"
          html={content.section1_overview}
        />

        {/* Section 2: Tier Analysis */}
        <ReportSection
          sectionNumber={2}
          title="Tier-by-Tier Analysis"
          html={content.section2_tier_analysis}
        />

        {/* Section 3: Cross-Tier Patterns */}
        <ReportSection
          sectionNumber={3}
          title="Cross-Tier Patterns"
          html={content.section3_cross_tier}
        />

        {/* Section 4: Priority Map */}
        <ReportSection
          sectionNumber={4}
          title="Priority Map"
          html={content.section4_priorities}
        />

        {/* Section 5: Next Steps */}
        <ReportSection
          sectionNumber={5}
          title="Next Steps"
          html={content.section5_next_steps}
        />

        {/* CTA */}
        <div className="bg-navy rounded-xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Want to Talk Through These Results?
          </h2>
          <p className="text-white/70 max-w-md mx-auto">
            Book a 30-minute guided debrief with a LeadShift consultant. We&apos;ll
            help you interpret the patterns and identify the highest-leverage
            intervention points.
          </p>
          <a
            href="https://mysig.io/9873O1O8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-magenta text-white font-semibold px-10 py-4 rounded-md hover:bg-magenta/90 transition-colors"
          >
            Book a Debrief
          </a>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-navy/40">
          <p>
            Leadership Health Pulse by LeadShift &mdash; {today}
          </p>
        </div>
      </div>
    </main>
  );
}
