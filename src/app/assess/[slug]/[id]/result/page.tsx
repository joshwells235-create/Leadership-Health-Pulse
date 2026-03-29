"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  QUADRANT_LABELS_MANAGER,
  SCORE_MIN,
  SCORE_MAX,
  MIDPOINT,
  type Quadrant,
} from "@/lib/quadrant-scoring";
import { generatePDF } from "@/lib/generate-pdf";
import { BrandedReport, ReportSection } from "@/components/branded-report";

interface SessionData {
  id: string;
  respondent_name: string;
  quadrant: Quadrant;
  x_score: number;
  y_score: number;
  completed_at: string;
}

interface ReportContent {
  your_profile: string;
  your_strengths: string;
  your_gaps: string;
  category_breakdown: string;
  priority_areas: string;
  your_context: string;
  next_steps: string;
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
      await generatePDF("manager-report-content", `MSA-Report-${name}.pdf`);
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

  // Mini chart positioning
  function scoreToPercent(score: number) {
    return ((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  }
  const dotLeft = scoreToPercent(session.x_score);
  const dotBottom = scoreToPercent(session.y_score);
  const midPercent = ((MIDPOINT - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;

  const sections = [
    { key: "your_profile", title: "Your Profile", accent: "#101d51" },
    { key: "your_strengths", title: "Your Strengths", accent: "#007efa" },
    { key: "your_gaps", title: "Your Gaps", accent: "#EA0C67" },
    { key: "category_breakdown", title: "Category Breakdown", accent: "#101d51" },
    { key: "priority_areas", title: "Priority Development Areas", accent: "#F5A623" },
    { key: "your_context", title: "Your Context", accent: "#101d51" },
    { key: "next_steps", title: "Next Steps", accent: "#007efa" },
  ];

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12">
      <div className="max-w-3xl w-full">
        {/* Branded report (captured for PDF) */}
        <div id="manager-report-content">
          <BrandedReport
            title="Manager Skills Assessment"
            subtitle={session.respondent_name}
            badge={{
              label: QUADRANT_LABELS_MANAGER[session.quadrant],
              color: quadrantColor,
            }}
          >
            {/* Mini Quadrant Visual */}
            <div className="flex justify-center">
              <div className="relative w-56 h-56 border border-navy/15 rounded-lg overflow-hidden bg-white">
                <div className="absolute top-2 left-2 text-[9px] text-navy/30 font-medium">
                  Results-Driven
                </div>
                <div className="absolute top-2 right-2 text-[9px] text-blue/60 font-medium">
                  Intentional
                </div>
                <div className="absolute bottom-2 left-2 text-[9px] text-navy/30 font-medium">
                  Emerging
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] text-navy/30 font-medium">
                  People-First
                </div>
                <div
                  className="absolute top-0 bottom-0 w-px bg-navy/8"
                  style={{ left: `${midPercent}%` }}
                />
                <div
                  className="absolute left-0 right-0 h-px bg-navy/8"
                  style={{ top: `${100 - midPercent}%` }}
                />
                <div
                  className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"
                  style={{
                    backgroundColor: quadrantColor,
                    left: `${dotLeft}%`,
                    bottom: `${dotBottom}%`,
                    transform: "translate(-50%, 50%)",
                  }}
                />
              </div>
            </div>

            {/* Report Sections */}
            {sections.map((s) => {
              const content = report[s.key as keyof ReportContent];
              if (!content) return null;
              return (
                <ReportSection
                  key={s.key}
                  title={s.title}
                  accentColor={s.accent}
                >
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </ReportSection>
              );
            })}
          </BrandedReport>
        </div>

        {/* Download button (outside capture area) */}
        <div className="mt-8 text-center">
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
