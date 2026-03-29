"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface LeadRow {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  surveys: {
    id: string;
    respondent_name: string;
    respondent_email: string;
    completed_at: string | null;
    companies: {
      name: string;
      employee_count_range: string;
      industry: string | null;
    };
  };
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-magenta/10 text-magenta",
  contacted: "bg-amber/20 text-amber",
  converted: "bg-blue/10 text-blue",
  closed: "bg-navy/10 text-navy/50",
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  async function fetchLeads() {
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*, surveys(id, respondent_name, respondent_email, completed_at, companies(name, employee_count_range, industry))")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setLeads((data as unknown as LeadRow[]) || []);
    setLoading(false);
  }

  async function updateStatus(leadId: string, newStatus: string) {
    await fetch(`/api/admin/leads/${leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    // Update locally
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Leads</h1>

      {/* Filter */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-md border border-navy/20 bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-blue"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-navy/5 border-b border-navy/10">
              <th className="text-left p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                Contact
              </th>
              <th className="text-left p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                Company
              </th>
              <th className="text-left p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide hidden md:table-cell">
                Date
              </th>
              <th className="text-center p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide hidden md:table-cell">
                Notes
              </th>
              <th className="p-4 text-xs font-semibold text-navy/60 uppercase tracking-wide">
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
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-navy/40">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b border-navy/5 hover:bg-navy/[0.03] transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-navy text-sm">
                      {lead.surveys?.respondent_name}
                    </div>
                    <div className="text-navy/50 text-xs">
                      {lead.surveys?.respondent_email}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-navy text-sm">
                      {lead.surveys?.companies?.name}
                    </div>
                    <div className="text-navy/50 text-xs">
                      {lead.surveys?.companies?.employee_count_range}
                      {lead.surveys?.companies?.industry
                        ? ` · ${lead.surveys.companies.industry}`
                        : ""}
                    </div>
                  </td>
                  <td className="p-4 text-navy/60 text-sm hidden md:table-cell">
                    {formatDate(lead.surveys?.completed_at || lead.created_at)}
                  </td>
                  <td className="p-4 text-center">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${STATUS_COLORS[lead.status] || ""}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-4 text-navy/60 text-xs hidden md:table-cell max-w-[200px] truncate">
                    {lead.notes || ""}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() =>
                        router.push(`/admin/survey/${lead.surveys?.id}`)
                      }
                      className="text-blue text-xs font-medium hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
