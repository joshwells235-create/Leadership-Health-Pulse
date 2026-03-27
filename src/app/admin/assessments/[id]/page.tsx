"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ScatterPlot from "@/components/scatter-plot";
import { QUADRANT_LABELS, type Quadrant } from "@/lib/quadrant-scoring";
import { generatePDF } from "@/lib/generate-pdf";

interface OrgReportContent {
  overview: string;
  distribution_analysis: string;
  collective_gaps: string;
  development_priorities: string;
}

interface SessionRow {
  id: string;
  respondent_name: string;
  respondent_email: string;
  respondent_title: string | null;
  pi_profile: string | null;
  attempt_number: number;
  status: string;
  quadrant: Quadrant | null;
  x_score: number | null;
  y_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export default function AdminAssessmentDetail() {
  const params = useParams();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [generatingOrgReport, setGeneratingOrgReport] = useState(false);
  const [orgReport, setOrgReport] = useState<OrgReportContent | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  useEffect(() => {
    fetchData();
  }, [assessmentId]);

  async function fetchData() {
    const res = await fetch(`/api/admin/assessments/${assessmentId}`);
    if (res.ok) {
      const data = await res.json();
      setAssessment(data.assessment);
      setSessions(data.sessions);
      // Find the latest org report
      const orgReports = (data.reports || []).filter(
        (r: Record<string, unknown>) => r.report_type === "organizational"
      );
      if (orgReports.length > 0) {
        setOrgReport(orgReports[0].generated_content as OrgReportContent);
      }
    }
    setLoading(false);
  }

  async function handleDeleteSession(sessionId: string) {
    const res = await fetch(
      `/api/admin/assessments/${assessmentId}/${sessionId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setShowDeleteConfirm(null);
    }
  }

  async function handleGenerateOrgReport() {
    setGeneratingOrgReport(true);
    try {
      const res = await fetch("/api/assess/org-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrgReport(data.report as OrgReportContent);
      }
      await fetchData();
    } catch (err) {
      console.error("Org report generation failed:", err);
    }
    setGeneratingOrgReport(false);
  }

  async function handleDownloadOrgPDF() {
    setIsDownloadingPDF(true);
    try {
      const companyName = ((company as Record<string, unknown>)?.name as string || "Company").replace(/\s+/g, "-");
      await generatePDF("org-report-content", `ELITE5-Org-Report-${companyName}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
    setIsDownloadingPDF(false);
  }

  if (loading) {
    return <p className="text-navy/40 py-10 text-center">Loading...</p>;
  }

  if (!assessment) {
    return <p className="text-navy/60 py-10 text-center">Assessment not found.</p>;
  }

  const company = assessment.companies as Record<string, unknown> | null;
  const completedSessions = sessions.filter((s) => s.status === "completed");

  // Scatter plot data
  const scatterData = completedSessions
    .filter((s) => s.x_score !== null && s.y_score !== null)
    .map((s) => ({
      id: s.id,
      name: s.respondent_name,
      xScore: s.x_score!,
      yScore: s.y_score!,
      quadrant: s.quadrant || "absent",
    }));

  // Quadrant distribution
  const distribution: Record<string, number> = {
    intentional: 0,
    command_control: 0,
    overly_supportive: 0,
    absent: 0,
  };
  for (const s of completedSessions) {
    if (s.quadrant) distribution[s.quadrant]++;
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const assessmentLink = `${baseUrl}/assess/${assessment.slug}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/admin/assessments"
            className="text-sm text-navy/40 hover:text-navy/60 mb-2 inline-block"
          >
            &larr; All Assessments
          </Link>
          <h1 className="text-2xl font-bold text-navy">
            {company?.name as string}
          </h1>
          <p className="text-sm text-navy/50 mt-1">
            {assessment.name as string}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(assessmentLink)}
            className="text-sm text-blue font-medium hover:text-blue/80 border border-blue/20 px-4 py-2 rounded-md"
          >
            Copy Assessment Link
          </button>
          {completedSessions.length >= 2 && (
            <button
              onClick={handleGenerateOrgReport}
              disabled={generatingOrgReport}
              className="bg-blue text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-blue/90 disabled:opacity-50"
            >
              {generatingOrgReport
                ? "Generating..."
                : "Generate Org Report"}
            </button>
          )}
        </div>
      </div>

      {/* Stats + Scatter Plot */}
      {completedSessions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Scatter Plot */}
          <div className="bg-white rounded-lg border border-navy/10 p-6">
            <h2 className="font-semibold text-navy mb-4">
              Team Quadrant Map
            </h2>
            <div className="flex justify-center">
              <ScatterPlot managers={scatterData} width={420} height={420} />
            </div>
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-lg border border-navy/10 p-6">
            <h2 className="font-semibold text-navy mb-4">Distribution</h2>
            <div className="space-y-4">
              {Object.entries(distribution).map(([quadrant, count]) => {
                const pct =
                  completedSessions.length > 0
                    ? Math.round((count / completedSessions.length) * 100)
                    : 0;
                const colors: Record<string, string> = {
                  intentional: "#007efa",
                  command_control: "#F5A623",
                  overly_supportive: "#F5A623",
                  absent: "#EA0C67",
                };
                return (
                  <div key={quadrant}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-navy">
                        {QUADRANT_LABELS[quadrant as Quadrant]}
                      </span>
                      <span className="text-navy/50">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-navy/5 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: colors[quadrant],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-navy/10">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-navy">
                    {completedSessions.length}
                  </p>
                  <p className="text-xs text-navy/50">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy">
                    {sessions.filter((s) => s.status === "in_progress").length}
                  </p>
                  <p className="text-xs text-navy/50">In Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-navy/10 p-10 text-center mb-8">
          <p className="text-navy/40">
            No completed assessments yet. Share the link with managers to get started.
          </p>
          <p className="text-sm text-navy/30 mt-2 font-mono">
            {assessmentLink}
          </p>
        </div>
      )}

      {/* Organizational Report */}
      {orgReport && (
        <div className="mb-8" id="org-report-content">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy">
              Organizational Report
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadOrgPDF}
                disabled={isDownloadingPDF}
                className="text-sm text-navy font-medium border border-navy/20 px-4 py-2 rounded-md hover:bg-navy/5 disabled:opacity-50"
              >
                {isDownloadingPDF ? "Generating..." : "Download PDF"}
              </button>
              <button
                onClick={handleGenerateOrgReport}
                disabled={generatingOrgReport}
                className="text-sm text-blue font-medium border border-blue/20 px-4 py-2 rounded-md hover:bg-blue/5 disabled:opacity-50"
              >
                {generatingOrgReport ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <section className="bg-white rounded-lg border border-navy/10 p-8">
              <h3 className="text-lg font-bold text-navy mb-4">Overview</h3>
              <div
                className="prose prose-navy max-w-none text-navy/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: orgReport.overview }}
              />
            </section>
            <section className="bg-white rounded-lg border border-navy/10 p-8">
              <h3 className="text-lg font-bold text-navy mb-4">
                Distribution Analysis
              </h3>
              <div
                className="prose prose-navy max-w-none text-navy/80 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: orgReport.distribution_analysis,
                }}
              />
            </section>
            <section className="bg-white rounded-lg border border-navy/10 p-8">
              <h3 className="text-lg font-bold text-navy mb-4">
                Collective Gaps
              </h3>
              <div
                className="prose prose-navy max-w-none text-navy/80 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: orgReport.collective_gaps,
                }}
              />
            </section>
            <section className="bg-white rounded-lg border border-navy/10 p-8">
              <h3 className="text-lg font-bold text-navy mb-4">
                Development Priorities
              </h3>
              <div
                className="prose prose-navy max-w-none text-navy/80 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: orgReport.development_priorities,
                }}
              />
            </section>
          </div>
        </div>
      )}

      {/* Generating indicator */}
      {generatingOrgReport && !orgReport && (
        <div className="mb-8 bg-white rounded-lg border border-navy/10 p-10 text-center">
          <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy/60">
            Generating organizational report. This takes 30 to 60 seconds...
          </p>
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-navy/10">
          <h2 className="font-semibold text-navy">Individual Sessions</h2>
        </div>
        {sessions.length === 0 ? (
          <p className="text-navy/40 text-center py-10">No sessions yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy/10">
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Quadrant
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Attempt
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-navy/5 hover:bg-navy/[0.02]"
                >
                  <td className="px-6 py-4">
                    {s.status === "completed" ? (
                      <Link
                        href={`/admin/assessments/${assessmentId}/${s.id}`}
                        className="font-medium text-navy hover:text-blue"
                      >
                        {s.respondent_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-navy/50">
                        {s.respondent_name}
                      </span>
                    )}
                    <div className="text-xs text-navy/40">
                      {s.respondent_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-navy/60">
                    {s.respondent_title || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {s.quadrant ? (
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            s.quadrant === "intentional"
                              ? "rgba(0,126,250,0.1)"
                              : s.quadrant === "absent"
                              ? "rgba(234,12,103,0.1)"
                              : "rgba(245,166,35,0.1)",
                          color:
                            s.quadrant === "intentional"
                              ? "#007efa"
                              : s.quadrant === "absent"
                              ? "#EA0C67"
                              : "#F5A623",
                        }}
                      >
                        {QUADRANT_LABELS[s.quadrant]}
                      </span>
                    ) : (
                      <span className="text-xs text-navy/30">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-navy/50">
                    #{s.attempt_number}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold ${
                        s.status === "completed"
                          ? "text-blue"
                          : "text-navy/40"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {showDeleteConfirm === s.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="text-xs text-magenta font-semibold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="text-xs text-navy/40"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(s.id)}
                        className="text-xs text-magenta/60 hover:text-magenta"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
