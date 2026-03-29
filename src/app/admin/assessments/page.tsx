"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AssessmentRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  companies: { name: string } | null;
  totalSessions: number;
  completedSessions: number;
}

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  useEffect(() => {
    fetchAssessments();
  }, []);

  async function fetchAssessments() {
    const res = await fetch("/api/admin/assessments");
    if (res.ok) {
      const data = await res.json();
      setAssessments(data.assessments);
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
        await fetchAssessments();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to create assessment"}`);
      }
    } catch (err) {
      console.error("Create assessment error:", err);
      alert("Failed to create assessment. Check the console for details.");
    }

    setCreating(false);
  }

  if (loading) {
    return <p className="text-navy/40 py-10 text-center">Loading...</p>;
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Manager Assessments
          </h1>
          <p className="text-sm text-navy/50 mt-1">
            Assessments deployed to client organizations
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-blue/90"
        >
          New Assessment
        </button>
      </div>

      {/* Create Assessment Form */}
      {showCreate && (
        <div className="bg-white rounded-lg border border-navy/10 p-6 mb-6">
          <h3 className="font-semibold text-navy mb-4">
            Create Assessment for a Company
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

      {/* Assessment List */}
      {assessments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-navy/10">
          <p className="text-navy/40">No assessments yet.</p>
          <p className="text-navy/30 text-sm mt-1">
            Click &quot;New Assessment&quot; to create one for a client.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy/10">
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Company
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Completed
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Link
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy/50 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-navy/5 hover:bg-navy/[0.02]"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/assessments/${a.id}`}
                      className="font-medium text-navy hover:text-blue"
                    >
                      {a.companies?.name || "Unknown"}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        a.status === "active"
                          ? "bg-blue/10 text-blue"
                          : "bg-navy/10 text-navy/50"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-navy/70">
                    {a.completedSessions} / {a.totalSessions}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        navigator.clipboard.writeText(
                          `${baseUrl}/assess/${a.slug}`
                        );
                        const btn = e.currentTarget;
                        btn.textContent = "Copied!";
                        setTimeout(() => { btn.textContent = "Copy Link"; }, 2000);
                      }}
                      className="text-xs text-blue hover:text-blue/80 font-medium px-2 py-1 rounded hover:bg-blue/5 transition-colors"
                    >
                      Copy Link
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-navy/50">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
