"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getScoreColorLight } from "@/components/report-components";

interface Stats {
  totalCompanies: number;
  activeAssessments: number;
  completedSurveys: number;
  newLeads: number;
}

interface CompanyCard {
  id: string;
  name: string;
  industry: string | null;
  employee_count_range: string;
  latestSurvey: {
    id: string;
    status: string;
    completed_at: string | null;
    overall_score: number | null;
  } | null;
  assessment: {
    id: string;
    name: string;
    slug: string;
    status: string;
    totalSessions: number;
    completedSessions: number;
  } | null;
  lastActivity: string;
}

export default function AdminCompanies() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [companies, setCompanies] = useState<CompanyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  useEffect(() => {
    fetchStats();
    fetchCompanies();
  }, []);

  async function fetchStats() {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }

  async function fetchCompanies() {
    const res = await fetch("/api/admin/companies");
    if (res.ok) {
      const data = await res.json();
      setCompanies(data.companies || []);
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newCompany.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newCompany,
          industry: newIndustry || null,
        }),
      });
      if (res.ok) {
        setNewCompany("");
        setNewIndustry("");
        setShowCreate(false);
        await fetchCompanies();
        await fetchStats();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to create assessment"}`);
      }
    } catch {
      alert("Failed to create assessment.");
    }
    setCreating(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Companies</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-blue/90"
        >
          New Assessment
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Companies" value={stats.totalCompanies} />
          <StatCard label="Active Assessments" value={stats.activeAssessments} />
          <StatCard label="Completed Surveys" value={stats.completedSurveys} />
          <StatCard
            label="New Leads"
            value={stats.newLeads}
            accent={stats.newLeads > 0}
          />
        </div>
      )}

      {/* Create Assessment Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-6">
          <h3 className="font-semibold text-navy mb-4">
            Deploy Assessment to a New Company
          </h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-navy/60 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-navy/20 text-sm text-navy"
                placeholder="Acme Corp"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-navy/60 mb-1">
                Industry (optional)
              </label>
              <input
                type="text"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-navy/20 text-sm text-navy"
                placeholder="Manufacturing"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!newCompany.trim() || creating}
              className="bg-navy text-white text-sm font-semibold px-6 py-2 rounded-md hover:bg-navy/90 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Company Cards */}
      {loading ? (
        <p className="text-navy/40 py-10 text-center">Loading...</p>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)]">
          <p className="text-navy/40">No companies yet.</p>
          <p className="text-navy/30 text-sm mt-1">
            Click &quot;New Assessment&quot; to deploy one to a client.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/admin/companies/${c.id}`}
              className="block bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-6 hover:border-blue/30 hover:shadow-[0px_4px_24px_rgba(0,126,250,0.1)] transition-all"
            >
              {/* Company header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-navy text-lg">{c.name}</h3>
                  <p className="text-sm text-navy/50">
                    {[c.industry, c.employee_count_range]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="text-xs text-navy/40">
                  {formatDate(c.lastActivity)}
                </span>
              </div>

              {/* Product line indicators */}
              <div className="grid grid-cols-2 gap-4">
                {/* CEO Diagnostic */}
                <div className="bg-navy/[0.03] rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-navy/40 uppercase tracking-wide mb-1">
                    CEO Diagnostic
                  </p>
                  {c.latestSurvey ? (
                    c.latestSurvey.status === "completed" &&
                    c.latestSurvey.overall_score ? (
                      <p
                        className={`text-lg font-bold ${getScoreColorLight(c.latestSurvey.overall_score)}`}
                      >
                        {c.latestSurvey.overall_score}/5.0
                      </p>
                    ) : (
                      <p className="text-sm text-amber font-medium">
                        In Progress
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-navy/30">No survey</p>
                  )}
                </div>

                {/* ELITE5 Assessment */}
                <div className="bg-navy/[0.03] rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-navy/40 uppercase tracking-wide mb-1">
                    ELITE5
                  </p>
                  {c.assessment ? (
                    <p className="text-lg font-bold text-navy">
                      {c.assessment.completedSessions}
                      <span className="text-sm font-normal text-navy/40">
                        /{c.assessment.totalSessions} completed
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-navy/30">Not deployed</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-5">
      <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-2xl font-bold mt-1 ${accent ? "text-magenta" : "text-navy"}`}
      >
        {value}
      </p>
    </div>
  );
}
