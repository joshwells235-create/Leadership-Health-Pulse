"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ManagerAssessmentIntake() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(null);
  const [company, setCompany] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    title: "",
    piProfile: "",
  });

  useEffect(() => {
    async function loadAssessment() {
      const { data: assess } = await supabase
        .from("manager_assessments")
        .select("*, companies(*)")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (!assess) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setAssessment(assess);
      setCompany(assess.companies as Record<string, unknown>);
      setLoading(false);
    }
    loadAssessment();
  }, [slug]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Check if this manager has taken it before (by email)
      const { data: existingSessions } = await supabase
        .from("manager_sessions")
        .select("id")
        .eq("assessment_id", (assessment as Record<string, unknown>).id)
        .eq("respondent_email", form.email)
        .eq("status", "completed");

      const attemptNumber = (existingSessions?.length || 0) + 1;

      const { data: session, error: sessionError } = await supabase
        .from("manager_sessions")
        .insert({
          assessment_id: (assessment as Record<string, unknown>).id,
          respondent_name: form.fullName,
          respondent_email: form.email,
          respondent_title: form.title || null,
          pi_profile: form.piProfile || null,
          attempt_number: attemptNumber,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      router.push(`/assess/${slug}/${session.id}`);
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-navy/40">Loading...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-navy">Assessment Not Found</h1>
        <p className="mt-2 text-navy/60">
          This assessment link is no longer active or doesn&apos;t exist.
        </p>
      </main>
    );
  }

  const isValid = form.fullName && form.email;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 bg-navy/5 rounded-full text-xs font-semibold text-navy/60 mb-4">
            {(company as Record<string, unknown>)?.name as string}
          </div>
          <h1 className="text-3xl font-bold text-navy">
            ELITE5 Management Assessment
          </h1>
          <p className="mt-3 text-navy/70">
            This assessment takes about 5 minutes. Your responses help identify
            your management style and where to focus your development.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="you@company.com"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Your Title / Role{" "}
              <span className="text-navy/40 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="e.g. Operations Manager, Team Lead"
            />
          </div>

          {/* PI Profile (optional) */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              PI Behavioral Profile{" "}
              <span className="text-navy/40 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.piProfile}
              onChange={(e) => updateField("piProfile", e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="e.g. Promoter, Individualist, Captain"
            />
            <p className="text-xs text-navy/40 mt-1">
              If you know your Predictive Index profile, enter it here. This
              won&apos;t affect your assessment results.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-magenta text-sm font-medium">{error}</p>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full bg-blue text-white text-lg font-semibold py-4 rounded-md hover:bg-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? "Getting started..." : "Begin Assessment"}
            </button>
          </div>

          <p className="text-center text-xs text-navy/40">
            Your responses are confidential. Results are shared only with your
            organization&apos;s leadership team.
          </p>
        </form>
      </div>
    </main>
  );
}
