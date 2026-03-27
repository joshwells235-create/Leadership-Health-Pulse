"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { generatePDF } from "@/lib/generate-pdf";
import {
  ReportView,
  getTierLabel,
  getDimensionLabel,
  type ReportData,
  type SurveyData,
} from "@/components/report-components";

type Tab = "report" | "ratings" | "responses";

interface RatingRow {
  tier: string;
  dimension: string;
  question_index: number;
  question_text: string;
  rating: number;
}

interface OpenResponseRow {
  tier: string;
  dimension: string;
  prompt_text: string;
  response: string;
}

interface LeadData {
  id: string;
  status: string;
  notes: string | null;
}

export default function AdminSurveyDetail() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Record<string, unknown> | null>(null);
  const [company, setCompany] = useState<Record<string, unknown> | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [openResponses, setOpenResponses] = useState<OpenResponseRow[]>([]);
  const [lead, setLead] = useState<LeadData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("report");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [leadNotes, setLeadNotes] = useState("");
  const [leadStatus, setLeadStatus] = useState("");

  useEffect(() => {
    fetchDetail();
  }, [surveyId]);

  async function fetchDetail() {
    const res = await fetch(`/api/admin/surveys/${surveyId}`);
    if (!res.ok) return;
    const data = await res.json();
    setSurvey(data.survey);
    setCompany(data.company);
    setReports(data.reports || []);
    setRatings(data.ratings || []);
    setOpenResponses(data.openResponses || []);
    setLead(data.lead || null);
    setLeadNotes(data.lead?.notes || "");
    setLeadStatus(data.lead?.status || "new");
    setLoading(false);
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "full" }),
      });
      if (res.ok) {
        await fetchDetail();
      }
    } catch (err) {
      console.error("Regeneration failed:", err);
    }
    setIsRegenerating(false);
  }

  async function handleDownloadPDF() {
    setIsDownloading(true);
    try {
      const companyName = (company?.name as string) || "Company";
      const filename = `Leadership-Health-Report-${companyName.replace(/\s+/g, "-")}.pdf`;
      await generatePDF("admin-report-content", filename);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
    setIsDownloading(false);
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        alert("Failed to delete survey.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete survey.");
    }
    setIsDeleting(false);
  }

  async function handleUpdateLead() {
    if (!lead) return;
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: leadStatus, notes: leadNotes }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-navy/40">Loading...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-20">
        <p className="text-navy/60">Survey not found.</p>
      </div>
    );
  }

  const latestReport = reports.length > 0 ? reports[0] : null;
  const surveyData: SurveyData | null = company
    ? {
        respondent_name: survey.respondent_name as string,
        respondent_email: survey.respondent_email as string,
        survey_path: survey.survey_path as string,
        companies: {
          name: company.name as string,
          industry: (company.industry as string) || null,
          employee_count_range: company.employee_count_range as string,
        },
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin"
        className="text-blue text-sm font-medium hover:underline"
      >
        &larr; Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {survey.respondent_name as string}
            </h1>
            <p className="text-navy/60 text-sm">
              {company?.name as string} · {company?.employee_count_range as string}{" "}
              employees
              {company?.industry ? ` · ${company.industry}` : ""}
            </p>
            <p className="text-navy/40 text-xs mt-1">
              {survey.respondent_email as string} ·{" "}
              {(survey.survey_path as string) === "three_tier"
                ? "3-Tier"
                : "2-Tier"}{" "}
              · {survey.source as string} path
              {survey.referred_by ? ` · Referred by ${survey.referred_by}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading || !latestReport}
              className="bg-navy text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-navy/90 disabled:opacity-50"
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
              className="bg-white text-magenta text-sm font-semibold px-4 py-2 rounded-md border border-magenta/30 hover:bg-magenta/5"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-magenta/5 border border-magenta/20 rounded-md">
            <p className="text-sm text-navy font-medium">
              Are you sure you want to delete this survey and all associated data?
              This includes all ratings, open-ended responses, generated reports, and lead records.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-magenta text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-magenta/90 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Permanently"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-navy/60 text-sm font-medium hover:text-navy"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {reports.length > 1 && (
          <p className="text-xs text-navy/40 mt-3">
            {reports.length} report versions generated. Showing latest (v
            {latestReport?.version || 1}).
          </p>
        )}
      </div>

      {/* Lead Management (cold path only) */}
      {lead && (
        <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-bold text-navy text-sm mb-3">Lead Management</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">
                Status
              </label>
              <select
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value)}
                className="px-3 py-2 rounded-md border border-navy/20 text-sm text-navy"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-navy/60 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-navy/20 text-sm text-navy"
                placeholder="Add notes..."
              />
            </div>
            <button
              onClick={handleUpdateLead}
              className="bg-navy text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-navy/90"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-navy/10">
        {(["report", "ratings", "responses"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue text-blue"
                : "border-transparent text-navy/50 hover:text-navy"
            }`}
          >
            {tab === "report"
              ? "Report"
              : tab === "ratings"
                ? "Raw Ratings"
                : "Open Responses"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "report" && latestReport && (
        <div id="admin-report-content">
          <ReportView report={latestReport} survey={surveyData} />
        </div>
      )}

      {activeTab === "report" && !latestReport && (
        <div className="text-center py-12 text-navy/40">
          <p>No report generated yet.</p>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="mt-4 bg-blue text-white text-sm font-semibold px-6 py-2 rounded-md hover:bg-blue/90 disabled:opacity-50"
          >
            {isRegenerating ? "Generating..." : "Generate Report"}
          </button>
        </div>
      )}

      {activeTab === "ratings" && (
        <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 border-b border-navy/10">
                <th className="text-left p-3 text-xs font-semibold text-navy/60 uppercase">
                  Tier
                </th>
                <th className="text-left p-3 text-xs font-semibold text-navy/60 uppercase">
                  Dimension
                </th>
                <th className="text-left p-3 text-xs font-semibold text-navy/60 uppercase">
                  Question
                </th>
                <th className="text-center p-3 text-xs font-semibold text-navy/60 uppercase">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((r, i) => (
                <tr key={i} className="border-b border-navy/5">
                  <td className="p-3 text-navy font-medium whitespace-nowrap">
                    {getTierLabel(r.tier)}
                  </td>
                  <td className="p-3 text-navy/70 whitespace-nowrap">
                    {getDimensionLabel(r.dimension)}
                  </td>
                  <td className="p-3 text-navy/70">{r.question_text}</td>
                  <td className="p-3 text-center font-bold text-navy">
                    {r.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "responses" && (
        <div className="space-y-4">
          {openResponses.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-5"
            >
              <div className="flex gap-2 mb-2">
                <span className="text-xs font-semibold text-blue bg-blue/10 px-2 py-0.5 rounded">
                  {getTierLabel(r.tier)}
                </span>
                <span className="text-xs font-semibold text-navy/50 bg-navy/5 px-2 py-0.5 rounded">
                  {getDimensionLabel(r.dimension)}
                </span>
              </div>
              <p className="text-sm font-medium text-navy mb-2">
                {r.prompt_text}
              </p>
              <p className="text-sm text-navy/70 leading-relaxed bg-light-gray rounded-md p-3">
                {r.response}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
