"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generatePDF } from "@/lib/generate-pdf";
import {
  ReportView,
  type ReportData,
  type SurveyData,
} from "@/components/report-components";
import { BrandedReport } from "@/components/branded-report";

export default function ReportPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [status, setStatus] = useState<
    "generating" | "loading" | "ready" | "error"
  >("generating");
  const [report, setReport] = useState<ReportData | null>(null);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

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
          const timeout = setTimeout(() => controller.abort(), 150000);

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

          // Send emails in background
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

  // Loading state
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

  // Error state
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

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      {/* Download Button */}
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

      <div id="report-content" className="max-w-3xl w-full">
        <BrandedReport
          title="Leadership Health Report"
          subtitle={`${survey?.respondent_name || "CEO"}, ${survey?.companies?.name || "Company"}`}
        >
          <ReportView report={report} survey={survey} />
        </BrandedReport>

        {/* CTA (outside branded container for visual distinction) */}
        <div className="bg-navy rounded-xl p-8 text-center space-y-4 mt-8">
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
      </div>
    </main>
  );
}
