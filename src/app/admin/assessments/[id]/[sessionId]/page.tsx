"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QUADRANT_LABELS, QUADRANT_LABELS_MANAGER, type Quadrant } from "@/lib/quadrant-scoring";
import { generatePDF } from "@/lib/generate-pdf";
import { BrandedReport, ReportSection } from "@/components/branded-report";

interface SessionData {
  id: string;
  respondent_name: string;
  respondent_email: string;
  respondent_title: string | null;
  pi_profile: string | null;
  attempt_number: number;
  quadrant: Quadrant;
  x_score: number;
  y_score: number;
  completed_at: string;
  assessment_id: string;
}

interface ResponseRow {
  dimension: string;
  question_index: number;
  question_text: string;
  rating: number | null;
  axis: string | null;
  quadrant_tag: string | null;
  a_score: number | null;
  c_score: number | null;
}

interface ReportData {
  generated_content: Record<string, string>;
  version: number;
}

interface PreviousSession {
  id: string;
  attempt_number: number;
  quadrant: Quadrant;
  x_score: number;
  y_score: number;
  completed_at: string;
}

export default function AdminSessionDetail() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [previousSessions, setPreviousSessions] = useState<PreviousSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"report" | "responses" | "history">("report");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [assessmentId, sessionId]);

  async function fetchData() {
    const res = await fetch(
      `/api/admin/assessments/${assessmentId}/${sessionId}`
    );
    if (res.ok) {
      const data = await res.json();
      setSession(data.session as SessionData);
      setResponses(data.responses);
      setReports(data.reports);
      setPreviousSessions(data.previousSessions);
    }
    setLoading(false);
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    try {
      await fetch(`/api/assess/${sessionId}/generate-report`, {
        method: "POST",
      });
      await fetchData();
    } catch (err) {
      console.error("Regeneration failed:", err);
    }
    setIsRegenerating(false);
  }

  async function handleDownloadPDF() {
    setIsDownloading(true);
    try {
      const name = session?.respondent_name?.replace(/\s+/g, "-") || "Manager";
      await generatePDF(
        "admin-manager-report",
        `MSA-Report-${name}.pdf`
      );
    } catch (err) {
      console.error("PDF download failed:", err);
    }
    setIsDownloading(false);
  }

  async function handleDelete() {
    const res = await fetch(
      `/api/admin/assessments/${assessmentId}/${sessionId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      router.push(`/admin/assessments/${assessmentId}`);
    }
  }

  if (loading) {
    return <p className="text-navy/40 py-10 text-center">Loading...</p>;
  }

  if (!session) {
    return <p className="text-navy/60 py-10 text-center">Session not found.</p>;
  }

  const latestReport = reports.length > 0 ? reports[0] : null;
  const report = latestReport?.generated_content;

  // Group responses by dimension
  const dimensionGroups: Record<string, ResponseRow[]> = {};
  for (const r of responses) {
    if (!dimensionGroups[r.dimension]) dimensionGroups[r.dimension] = [];
    dimensionGroups[r.dimension].push(r);
  }

  const quadrantColor =
    session.quadrant === "intentional"
      ? "#007efa"
      : session.quadrant === "absent"
      ? "#EA0C67"
      : "#F5A623";

  return (
    <div>
      {/* Breadcrumb + Header */}
      <Link
        href={`/admin/assessments/${assessmentId}`}
        className="text-sm text-navy/40 hover:text-navy/60 mb-2 inline-block"
      >
        &larr; Back to Assessment
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {session.respondent_name}
          </h1>
          <p className="text-sm text-navy/50 mt-1">
            {session.respondent_email}
            {session.respondent_title && ` | ${session.respondent_title}`}
            {session.pi_profile && ` | PI: ${session.pi_profile}`}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: quadrantColor }}
            >
              {QUADRANT_LABELS[session.quadrant]}
            </span>
            <span className="text-xs text-navy/40">
              Attempt #{session.attempt_number}
            </span>
            <span className="text-xs text-navy/40">
              A: {session.y_score}/40 | C: {session.x_score}/40
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading || !report}
            className="text-sm text-navy font-medium border border-navy/20 px-4 py-2 rounded-md hover:bg-navy/5 disabled:opacity-50"
          >
            {isDownloading ? "Generating..." : "Download PDF"}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="bg-blue text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-blue/90 disabled:opacity-50"
          >
            {isRegenerating ? "Regenerating..." : "Regenerate Report"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-magenta text-sm font-semibold px-4 py-2 rounded-md border border-magenta/30 hover:bg-magenta/5"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mb-6 p-4 bg-magenta/5 border border-magenta/20 rounded-md">
          <p className="text-sm text-navy">
            Delete this session and all associated data? This cannot be undone.
          </p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleDelete}
              className="bg-magenta text-white text-sm font-semibold px-4 py-2 rounded-md"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-navy/60 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reassessment History */}
      {previousSessions.length > 1 && (
        <div className="bg-white rounded-lg border border-navy/10 p-6 mb-6">
          <h3 className="font-semibold text-navy mb-3">Assessment History</h3>
          <div className="flex gap-4">
            {previousSessions.map((ps) => (
              <div
                key={ps.id}
                className={`flex-1 p-3 rounded-md border ${
                  ps.id === sessionId
                    ? "border-blue bg-blue/5"
                    : "border-navy/10"
                }`}
              >
                <div className="text-xs text-navy/50">
                  Attempt #{ps.attempt_number}
                </div>
                <div className="text-sm font-medium text-navy mt-1">
                  {QUADRANT_LABELS[ps.quadrant]}
                </div>
                <div className="text-xs text-navy/40 mt-1">
                  A: {ps.y_score}/40 | C: {ps.x_score}/40
                </div>
                <div className="text-xs text-navy/30 mt-1">
                  {new Date(ps.completed_at).toLocaleDateString()}
                </div>
                {ps.id !== sessionId && (
                  <Link
                    href={`/admin/assessments/${assessmentId}/${ps.id}`}
                    className="text-xs text-blue mt-2 inline-block"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(["report", "responses", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? "bg-navy text-white"
                : "text-navy/60 hover:bg-navy/5"
            }`}
          >
            {tab === "report"
              ? "Report"
              : tab === "responses"
              ? "Responses"
              : "History"}
          </button>
        ))}
      </div>

      {/* Report Tab */}
      <div style={{ display: activeTab === "report" ? "block" : "none" }}>
        <div id="admin-manager-report">
          {report ? (
            <BrandedReport
                title="Manager Skills Assessment"
                subtitle={session.respondent_name}
                badge={{
                  label: QUADRANT_LABELS_MANAGER[session.quadrant],
                  color: quadrantColor,
                }}
              >
                {(() => {
                  const sections = [
                    { key: "your_profile", title: "Your Profile", accent: "#101d51" },
                    { key: "your_strengths", title: "Your Strengths", accent: "#007efa" },
                    { key: "your_gaps", title: "Your Gaps", accent: "#EA0C67" },
                    { key: "category_breakdown", title: "Category Breakdown", accent: "#101d51" },
                    { key: "priority_areas", title: "Priority Development Areas", accent: "#F5A623" },
                    { key: "your_context", title: "Your Context", accent: "#101d51" },
                    { key: "next_steps", title: "Next Steps", accent: "#007efa" },
                    // Legacy keys
                    { key: "management_style", title: "Management Style", accent: "#101d51" },
                    { key: "hinders_performance", title: "Where It Hinders Performance", accent: "#EA0C67" },
                    { key: "critical_gaps", title: "Critical Gaps", accent: "#EA0C67" },
                    { key: "focus_areas", title: "What to Focus On", accent: "#F5A623" },
                  ];
                  return sections.map((s) => {
                    const html = report[s.key];
                    if (!html) return null;
                    return (
                      <ReportSection key={s.key} title={s.title} accentColor={s.accent}>
                        <div dangerouslySetInnerHTML={{ __html: html }} />
                      </ReportSection>
                    );
                  });
                })()}
              </BrandedReport>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg border border-navy/10">
                <p className="text-navy/40">No report generated yet.</p>
                <button
                  onClick={handleRegenerate}
                  className="mt-4 bg-blue text-white text-sm font-semibold px-6 py-2 rounded-md"
                >
                  Generate Report
                </button>
              </div>
            )}
          </div>
      </div>

      {/* Responses Tab */}
      {activeTab === "responses" && (
        <div className="space-y-6">
          {Object.entries(dimensionGroups).map(([dim, resps]) => (
            <div
              key={dim}
              className="bg-white rounded-lg border border-navy/10 p-6"
            >
              <h3 className="font-semibold text-navy mb-4 capitalize">
                {dim.replace(/_/g, " ")}
              </h3>
              <div className="space-y-3">
                {resps
                  .sort((a, b) => a.question_index - b.question_index)
                  .map((r) => (
                    <div
                      key={`${r.dimension}-${r.question_index}`}
                      className="flex items-start justify-between gap-4"
                    >
                      <p className="text-sm text-navy/70 flex-1">
                        {r.question_text}
                      </p>
                      <div className="flex items-center gap-2">
                        {r.quadrant_tag ? (
                          <>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                r.quadrant_tag === "IL"
                                  ? "bg-blue/10 text-blue"
                                  : r.quadrant_tag === "DA"
                                  ? "bg-magenta/10 text-magenta"
                                  : "bg-amber/10 text-amber-600"
                              }`}
                            >
                              {r.quadrant_tag}
                            </span>
                            <span className="text-[10px] text-navy/30">
                              A:{r.a_score} C:{r.c_score}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-navy/50">
                            {r.rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-lg border border-navy/10 p-6">
          {previousSessions.length <= 1 ? (
            <p className="text-navy/40 text-center py-6">
              This is the first assessment for this manager. Reassessment
              history will appear here after they complete the assessment again.
            </p>
          ) : (
            <div>
              <h3 className="font-semibold text-navy mb-4">
                Movement Over Time
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy/10">
                    <th className="text-left py-2 text-xs font-semibold text-navy/50">
                      Attempt
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-navy/50">
                      Date
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-navy/50">
                      Quadrant
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-navy/50">
                      Accountability (A)
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-navy/50">
                      Connection (C)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previousSessions.map((ps, i) => {
                    const prev = i > 0 ? previousSessions[i - 1] : null;
                    const xDelta = prev
                      ? ps.x_score - prev.x_score
                      : 0;
                    const yDelta = prev
                      ? ps.y_score - prev.y_score
                      : 0;
                    return (
                      <tr key={ps.id} className="border-b border-navy/5">
                        <td className="py-3 text-sm text-navy">
                          #{ps.attempt_number}
                        </td>
                        <td className="py-3 text-sm text-navy/60">
                          {new Date(ps.completed_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-sm font-medium text-navy">
                          {QUADRANT_LABELS[ps.quadrant]}
                        </td>
                        <td className="py-3 text-sm text-navy/70">
                          {ps.y_score}/40
                          {prev && yDelta !== 0 && (
                            <span
                              className={`ml-1 text-xs ${
                                yDelta > 0 ? "text-blue" : "text-magenta"
                              }`}
                            >
                              ({yDelta > 0 ? "+" : ""}
                              {yDelta})
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-navy/70">
                          {ps.x_score}/40
                          {prev && xDelta !== 0 && (
                            <span
                              className={`ml-1 text-xs ${
                                xDelta > 0 ? "text-blue" : "text-magenta"
                              }`}
                            >
                              ({xDelta > 0 ? "+" : ""}
                              {xDelta})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
