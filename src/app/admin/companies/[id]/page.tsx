"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ScatterPlot from "@/components/scatter-plot";
import { QUADRANT_LABELS, type Quadrant } from "@/lib/quadrant-scoring";
import { getScoreColorLight } from "@/components/report-components";
import { generatePDF } from "@/lib/generate-pdf";
import { BrandedReport, ReportSection } from "@/components/branded-report";

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

interface SurveyRow {
  id: string;
  respondent_name: string;
  respondent_email: string;
  status: string;
  survey_path: string;
  source: string;
  completed_at: string | null;
  created_at: string;
  reports: { id: string; overall_score: number }[] | null;
}

interface AssessmentData {
  id: string;
  name: string;
  slug: string;
  status: string;
  totalSessions: number;
  completedSessions: number;
}

interface CompanyData {
  id: string;
  name: string;
  industry: string | null;
  employee_count_range: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgReport, setOrgReport] = useState<OrgReportContent | null>(null);
  const [generatingOrgReport, setGeneratingOrgReport] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [creatingAssessment, setCreatingAssessment] = useState(false);
  const [showDeleteCompany, setShowDeleteCompany] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const assessment = assessments.length > 0 ? assessments[0] : null;

  const fetchData = useCallback(async () => {
    // Fetch company overview
    const companyRes = await fetch(`/api/admin/companies/${companyId}`);
    if (!companyRes.ok) {
      setLoading(false);
      return;
    }
    const companyData = await companyRes.json();
    setCompany(companyData.company);
    setSurveys(companyData.surveys || []);
    setAssessments(companyData.assessments || []);

    // If there's an assessment, fetch its sessions and org report
    if (companyData.assessments && companyData.assessments.length > 0) {
      const assessmentId = companyData.assessments[0].id;
      const assessRes = await fetch(`/api/admin/assessments/${assessmentId}`);
      if (assessRes.ok) {
        const assessData = await assessRes.json();
        setSessions(assessData.sessions || []);
        const orgReports = (assessData.reports || []).filter(
          (r: Record<string, unknown>) => r.report_type === "organizational"
        );
        if (orgReports.length > 0) {
          setOrgReport(orgReports[0].generated_content as OrgReportContent);
        }
      }
    }

    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDeleteSession(sessionId: string) {
    if (!assessment) return;
    const res = await fetch(
      `/api/admin/assessments/${assessment.id}/${sessionId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setShowDeleteConfirm(null);
    }
  }

  async function handleGenerateOrgReport() {
    if (!assessment) return;
    setGeneratingOrgReport(true);
    try {
      const res = await fetch("/api/assess/org-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: assessment.id }),
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
      const companyName = (company?.name || "Company").replace(/\s+/g, "-");
      await generatePDF("org-report-content", `Org-Assessment-${companyName}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
    setIsDownloadingPDF(false);
  }

  async function handleDeployAssessment() {
    if (!company) return;
    setCreatingAssessment(true);
    try {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: company.name, companyId: company.id }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      alert("Failed to create assessment.");
    }
    setCreatingAssessment(false);
  }

  async function handleDeleteCompany() {
    setDeletingCompany(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to delete company"}`);
      }
    } catch {
      alert("Failed to delete company.");
    }
    setDeletingCompany(false);
  }

  if (loading) {
    return <p className="text-navy/40 py-10 text-center">Loading...</p>;
  }

  if (!company) {
    return <p className="text-navy/60 py-10 text-center">Company not found.</p>;
  }

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
  const assessmentLink = assessment ? `${baseUrl}/assess/${assessment.slug}` : "";

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/admin"
            className="text-sm text-navy/40 hover:text-navy/60 mb-2 inline-block"
          >
            &larr; All Companies
          </Link>
          <h1 className="text-2xl font-bold text-navy">{company.name}</h1>
          <p className="text-sm text-navy/50 mt-1">
            {[company.industry, company.employee_count_range]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <button
            onClick={() => setShowDeleteCompany(true)}
            className="mt-2 text-xs text-magenta/60 hover:text-magenta"
          >
            Delete Company
          </button>
        </div>
        {assessment && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(assessmentLink);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              className={`text-sm font-medium px-4 py-2 rounded-md border transition-all ${
                linkCopied
                  ? "bg-blue text-white border-blue"
                  : "text-blue border-blue/20 hover:bg-blue/5 hover:border-blue/40"
              }`}
            >
              {linkCopied ? "Copied!" : "Copy Assessment Link"}
            </button>
            {completedSessions.length >= 2 && (
              <button
                onClick={handleGenerateOrgReport}
                disabled={generatingOrgReport}
                className="bg-magenta text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-magenta/90 disabled:opacity-50"
              >
                {generatingOrgReport ? "Generating..." : "Generate Org Report"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Company Confirmation */}
      {showDeleteCompany && (
        <div className="mb-6 p-4 bg-magenta/5 border border-magenta/20 rounded-md">
          <p className="text-sm text-navy font-medium">
            Delete {company.name} and all associated data?
          </p>
          <p className="text-xs text-navy/60 mt-1">
            This will permanently remove all assessments, sessions, reports,
            surveys, and leads for this company. This cannot be undone.
          </p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleDeleteCompany}
              disabled={deletingCompany}
              className="bg-magenta text-white text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50"
            >
              {deletingCompany ? "Deleting..." : "Yes, Delete Everything"}
            </button>
            <button
              onClick={() => setShowDeleteCompany(false)}
              className="text-navy/60 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ===== SECTION 1: CEO DIAGNOSTIC ===== */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-4">CEO Diagnostic</h2>
        {surveys.length > 0 ? (
          <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-navy/5 border-b border-navy/10">
                  <th className="text-left p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                    Respondent
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                    Score
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide hidden md:table-cell">
                    Path
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((s) => {
                  const score =
                    s.reports && s.reports.length > 0
                      ? s.reports[0].overall_score
                      : null;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-navy/5 hover:bg-navy/[0.04] cursor-pointer transition-colors"
                      onClick={() =>
                        (window.location.href = `/admin/survey/${s.id}`)
                      }
                    >
                      <td className="p-4">
                        <div className="font-semibold text-navy text-sm">
                          {s.respondent_name}
                        </div>
                        <div className="text-navy/50 text-xs">
                          {s.respondent_email}
                        </div>
                      </td>
                      <td className="p-4 text-navy/60 text-sm hidden md:table-cell">
                        {formatDate(s.completed_at || s.created_at)}
                      </td>
                      <td className="p-4 text-center">
                        {score ? (
                          <span
                            className={`font-bold text-sm ${getScoreColorLight(score)}`}
                          >
                            {score}
                          </span>
                        ) : (
                          <span className="text-navy/30 text-sm">--</span>
                        )}
                      </td>
                      <td className="p-4 text-center hidden md:table-cell">
                        <span className="text-xs text-navy/50">
                          {s.survey_path === "three_tier" ? "3-Tier" : "2-Tier"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            s.status === "completed"
                              ? "bg-blue/10 text-blue"
                              : "bg-amber/20 text-amber"
                          }`}
                        >
                          {s.status === "completed" ? "Completed" : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-8 text-center">
            <p className="text-navy/40">
              No CEO diagnostic survey for this company yet.
            </p>
          </div>
        )}
      </div>

      {/* ===== SECTION 2: MANAGER SKILLS ASSESSMENT ===== */}
      <div>
        <h2 className="text-lg font-bold text-navy mb-4">
          Manager Skills Assessment
        </h2>

        {assessment ? (
          <>
            {/* Scatter Plot + Distribution */}
            {completedSessions.length > 0 ? (
              <>
                {/* PDF-capturable container */}
                <div id="org-report-content">
                  <BrandedReport
                    title="Organizational Assessment"
                    subtitle={company.name}
                  >
                    {/* Scatter Plot + Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-navy mb-3 text-sm uppercase tracking-wide">
                          Team Quadrant Map
                        </h3>
                        <div className="flex justify-center">
                          <ScatterPlot
                            managers={scatterData}
                            width={380}
                            height={380}
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-navy mb-3 text-sm uppercase tracking-wide">
                          Distribution
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(distribution).map(([quadrant, count]) => {
                            const pct =
                              completedSessions.length > 0
                                ? Math.round(
                                    (count / completedSessions.length) * 100
                                  )
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
                                <div className="w-full bg-navy/5 rounded-full h-2.5">
                                  <div
                                    className="h-2.5 rounded-full transition-all"
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

                        <div className="mt-6 pt-4 border-t border-navy/10">
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

                    {/* Report narrative sections */}
                    {orgReport && (
                      <>
                        {[
                          { title: "Overview", key: "overview", accent: "#101d51" },
                          { title: "Distribution Analysis", key: "distribution_analysis", accent: "#007efa" },
                          { title: "Collective Gaps", key: "collective_gaps", accent: "#EA0C67" },
                          { title: "Development Priorities", key: "development_priorities", accent: "#F5A623" },
                        ].map((section) => (
                          <ReportSection
                            key={section.key}
                            title={section.title}
                            accentColor={section.accent}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  orgReport[section.key as keyof OrgReportContent],
                              }}
                            />
                          </ReportSection>
                        ))}
                      </>
                    )}
                  </BrandedReport>
                </div>

                {/* Action buttons (outside the PDF container) */}
                {orgReport && (
                  <div className="flex justify-end gap-2 mt-4 mb-8">
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
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg border border-navy/10 p-10 text-center mb-8">
                <p className="text-navy/40">
                  No completed assessments yet. Share the link with managers to
                  get started.
                </p>
                <p className="text-sm text-navy/30 mt-2 font-mono">
                  {assessmentLink}
                </p>
              </div>
            )}

            {/* Generating indicator */}
            {generatingOrgReport && !orgReport && (
              <div className="mb-8 bg-white rounded-lg border border-navy/10 p-10 text-center">
                <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-4" />
                <p className="text-navy/60">
                  Generating organizational report. This takes 30 to 60
                  seconds...
                </p>
              </div>
            )}

            {/* Sessions Table */}
            <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-navy/10">
                <h3 className="font-semibold text-navy">Individual Sessions</h3>
              </div>
              {sessions.length === 0 ? (
                <p className="text-navy/40 text-center py-10">
                  No sessions yet.
                </p>
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
                              href={`/admin/assessments/${assessment.id}/${s.id}`}
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
          </>
        ) : (
          <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-8 text-center">
            <p className="text-navy/40 mb-4">
              No assessment deployed for this company.
            </p>
            <button
              onClick={handleDeployAssessment}
              disabled={creatingAssessment}
              className="bg-blue text-white text-sm font-semibold px-6 py-2 rounded-md hover:bg-blue/90 disabled:opacity-50"
            >
              {creatingAssessment ? "Deploying..." : "Deploy Assessment"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
