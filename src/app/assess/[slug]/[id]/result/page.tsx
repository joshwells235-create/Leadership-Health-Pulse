"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QUADRANT_LABELS_MANAGER, MIDPOINT, type Quadrant } from "@/lib/quadrant-scoring";
import { generatePDF } from "@/lib/generate-pdf";

interface SessionData {
  id: string;
  respondent_name: string;
  quadrant: Quadrant;
  x_score: number;
  y_score: number;
  completed_at: string;
}

interface ReportContent {
  management_style: string;
  hinders_performance: string;
  critical_gaps: string;
  focus_areas: string;
}

export default function ManagerAssessmentResult() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [report, setReport] = useState<ReportContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadResult() {
      // Load session
      const { data: sess } = await supabase
        .from("manager_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!sess || sess.status !== "completed") {
        setError("Assessment not found or not yet completed.");
        setLoading(false);
        return;
      }

      setSession(sess as SessionData);

      // Check for existing report
      const { data: existingReport } = await supabase
        .from("manager_reports")
        .select("*")
        .eq("session_id", sessionId)
        .eq("report_type", "individual")
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (existingReport?.generated_content) {
        setReport(existingReport.generated_content as ReportContent);
        setLoading(false);
        return;
      }

      // Generate report
      setGenerating(true);
      setLoading(false);

      try {
        const res = await fetch(`/api/assess/${sessionId}/generate-report`, {
          method: "POST",
        });

        if (!res.ok) throw new Error("Report generation failed");

        const data = await res.json();
        setReport(data.report as ReportContent);
      } catch (err) {
        console.error("Report generation error:", err);
        setError("Failed to generate your report. Please try again.");
      }

      setGenerating(false);
    }

    loadResult();
  }, [sessionId]);

  async function handleDownloadPDF() {
    setIsDownloading(true);
    try {
      const name = session?.respondent_name?.replace(/\s+/g, "-") || "Manager";
      await generatePDF(
        "manager-report-content",
        `ELITE5-Assessment-${name}.pdf`
      );
    } catch (err) {
      console.error("PDF download failed:", err);
    }
    setIsDownloading(false);
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-navy/40">Loading your results...</p>
      </main>
    );
  }

  if (error && !report) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-navy">Something Went Wrong</h1>
        <p className="mt-2 text-navy/60">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-3 bg-navy text-white font-semibold rounded-md"
        >
          Try Again
        </button>
      </main>
    );
  }

  if (generating) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy">
            Building Your Assessment Report
          </h2>
          <p className="mt-2 text-navy/60">
            This usually takes 30 to 60 seconds...
          </p>
        </div>
      </main>
    );
  }

  if (!session || !report) return null;

  const quadrantColors: Record<Quadrant, string> = {
    intentional: "#007efa",
    command_control: "#F5A623",
    overly_supportive: "#F5A623",
    absent: "#EA0C67",
  };

  const quadrantColor = quadrantColors[session.quadrant] || "#101d51";

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12">
      <div className="max-w-3xl w-full" id="manager-report-content">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-navy">
            Your ELITE5 Assessment
          </h1>
          <p className="mt-2 text-navy/60">{session.respondent_name}</p>
        </div>

        {/* Quadrant Badge */}
        <div className="text-center mb-10">
          <div
            className="inline-block px-6 py-3 rounded-lg text-white font-bold text-xl"
            style={{ backgroundColor: quadrantColor }}
          >
            {QUADRANT_LABELS_MANAGER[session.quadrant]}
          </div>
        </div>

        {/* Mini Quadrant Visual */}
        {(() => {
          // Map score so MIDPOINT lands at 50% visually
          function scoreToPercent(score: number) {
            if (score <= MIDPOINT) {
              return ((score - 1) / (MIDPOINT - 1)) * 50;
            }
            return 50 + ((score - MIDPOINT) / (5 - MIDPOINT)) * 50;
          }
          const dotLeft = scoreToPercent(session.x_score);
          const dotBottom = scoreToPercent(session.y_score);
          return (
            <div className="flex justify-center mb-10">
              <div className="relative w-64 h-64 border-2 border-navy/20 rounded-lg overflow-hidden">
                {/* Quadrant labels */}
                <div className="absolute top-2 left-2 text-[10px] text-navy/40 font-medium">
                  Results-Driven
                </div>
                <div className="absolute top-2 right-2 text-[10px] text-blue font-medium">
                  Intentional
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] text-navy/40 font-medium">
                  Emerging
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-navy/40 font-medium">
                  People-First
                </div>
                {/* Crosshairs at visual center */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-navy/10" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-navy/10" />
                {/* Dot */}
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md"
                  style={{
                    backgroundColor: quadrantColor,
                    left: `${dotLeft}%`,
                    bottom: `${dotBottom}%`,
                    transform: "translate(-50%, 50%)",
                  }}
                />
              </div>
            </div>
          );
        })()}

        {/* Report Sections */}
        <div className="space-y-8">
          {/* Management Style */}
          <section className="bg-white rounded-lg border border-navy/10 p-8">
            <h2 className="text-xl font-bold text-navy mb-4">
              Your Management Style
            </h2>
            <div
              className="prose prose-navy max-w-none text-navy/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: report.management_style }}
            />
          </section>

          {/* Where It Hinders */}
          <section className="bg-white rounded-lg border border-navy/10 p-8">
            <h2 className="text-xl font-bold text-navy mb-4">
              Where It Hinders Performance
            </h2>
            <div
              className="prose prose-navy max-w-none text-navy/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: report.hinders_performance }}
            />
          </section>

          {/* Critical Gaps */}
          <section className="bg-white rounded-lg border border-navy/10 p-8">
            <h2 className="text-xl font-bold text-navy mb-4">
              Critical Gaps to Intentional Leadership
            </h2>
            <div
              className="prose prose-navy max-w-none text-navy/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: report.critical_gaps }}
            />
          </section>

          {/* What to Focus On */}
          <section className="bg-white rounded-lg border border-navy/10 p-8">
            <h2 className="text-xl font-bold text-navy mb-4">
              What to Focus On
            </h2>
            <div
              className="prose prose-navy max-w-none text-navy/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: report.focus_areas }}
            />
          </section>
        </div>

        {/* Download */}
        <div className="mt-10 text-center">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-8 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy/90 disabled:opacity-50 transition-colors"
          >
            {isDownloading ? "Generating PDF..." : "Download PDF Report"}
          </button>
        </div>
      </div>
    </main>
  );
}
