"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getScoreColorLight } from "@/components/report-components";

interface Stats {
  totalSurveys: number;
  completedSurveys: number;
  completedThisWeek: number;
  avgScore: number;
  totalLeads: number;
  newLeads: number;
}

interface SurveyRow {
  id: string;
  respondent_name: string;
  respondent_email: string;
  status: string;
  survey_path: string;
  source: string;
  referred_by: string | null;
  created_at: string;
  completed_at: string | null;
  companies: {
    name: string;
    industry: string | null;
    employee_count_range: string;
  } | null;
  reports: { id: string; overall_score: number }[] | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchStats();
    fetchSurveys();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSurveys(), 300);
    return () => clearTimeout(timer);
  }, [search, sourceFilter, statusFilter]);

  async function fetchStats() {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      setStats(await res.json());
    }
  }

  async function fetchSurveys() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sourceFilter) params.set("source", sourceFilter);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/admin/surveys?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setSurveys(data.surveys || []);
    }
    setLoading(false);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Surveys" value={stats.totalSurveys} />
          <StatCard label="Completed This Week" value={stats.completedThisWeek} />
          <StatCard
            label="Avg Score"
            value={stats.avgScore ? `${stats.avgScore}/5.0` : "N/A"}
          />
          <StatCard
            label="New Leads"
            value={stats.newLeads}
            accent={stats.newLeads > 0}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-md border border-navy/20 bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-blue w-64"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2 rounded-md border border-navy/20 bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-blue"
        >
          <option value="">All Sources</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-md border border-navy/20 bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-blue"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
        </select>
      </div>

      {/* Survey Table */}
      <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-navy/5 border-b border-navy/10">
              <th className="text-left p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                Respondent
              </th>
              <th className="text-left p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                Company
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
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-navy/40">
                  Loading...
                </td>
              </tr>
            ) : surveys.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-navy/40">
                  No surveys found.
                </td>
              </tr>
            ) : (
              surveys.map((s) => {
                const score =
                  s.reports && s.reports.length > 0
                    ? s.reports[0].overall_score
                    : null;
                return (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/admin/survey/${s.id}`)}
                    className="border-b border-navy/5 hover:bg-navy/3 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-navy text-sm">
                        {s.respondent_name}
                      </div>
                      <div className="text-navy/50 text-xs">
                        {s.respondent_email}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-navy text-sm">
                        {s.companies?.name || "Unknown"}
                      </div>
                      <div className="text-navy/50 text-xs">
                        {s.companies?.employee_count_range || ""}{" "}
                        {s.companies?.industry ? `· ${s.companies.industry}` : ""}
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
              })
            )}
          </tbody>
        </table>
      </div>
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
