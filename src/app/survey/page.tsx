"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const EMPLOYEE_RANGES = [
  "1-25",
  "26-50",
  "51-100",
  "101-250",
  "251-500",
  "500+",
];

const MANAGEMENT_LAYERS = [
  {
    value: "one",
    label: "One layer",
    description:
      "My direct reports manage the people doing the work. There's no layer between them and the front line.",
  },
  {
    value: "two_or_more",
    label: "Two or more layers",
    description:
      "There's at least one additional management layer between my direct reports and the people doing the work.",
  },
  {
    value: "not_sure",
    label: "Not sure",
    description: "I'd have to think about it.",
  },
];

export default function SurveyIntake() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    companyName: "",
    industry: "",
    employeeRange: "",
    directReports: "",
    managementLayers: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Determine survey path based on management layers answer
      // "not_sure" defaults to two-tier per the product spec
      const surveyPath =
        form.managementLayers === "two_or_more" ? "three_tier" : "two_tier";

      // Create the company record
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: form.companyName,
          industry: form.industry || null,
          employee_count_range: form.employeeRange,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create the survey record
      const { data: survey, error: surveyError } = await supabase
        .from("surveys")
        .insert({
          company_id: company.id,
          respondent_name: form.fullName,
          respondent_email: form.email,
          survey_path: surveyPath,
          source: "cold",
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Navigate to the survey questions page
      router.push(`/survey/${survey.id}`);
    } catch (err) {
      console.error("Error creating survey:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  const isValid =
    form.fullName &&
    form.email &&
    form.companyName &&
    form.employeeRange &&
    form.managementLayers;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-navy">
            Before We Begin
          </h1>
          <p className="mt-3 text-navy/70">
            Tell us a bit about you and your organization so we can tailor the
            diagnostic.
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
              placeholder="Jane Smith"
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
              placeholder="jane@company.com"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Company Name
            </label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Acme Corp"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Industry{" "}
              <span className="text-navy/40 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => updateField("industry", e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="e.g. Manufacturing, Professional Services, Tech"
            />
          </div>

          {/* Employee Count */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Approximate Number of Employees
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EMPLOYEE_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => updateField("employeeRange", range)}
                  className={`px-4 py-3 rounded-md border text-sm font-medium transition-colors ${
                    form.employeeRange === range
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-navy border-navy/20 hover:border-navy/40"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Reports */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              How many people report directly to you?
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={form.directReports}
              onChange={(e) => updateField("directReports", e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="e.g. 6"
            />
          </div>

          {/* Management Layers - The Key Question */}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-navy mb-1">
              How many layers of management exist between you and the people
              doing the day-to-day work?
            </label>
            <div className="space-y-3 mt-3">
              {MANAGEMENT_LAYERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateField("managementLayers", option.value)
                  }
                  className={`w-full text-left px-5 py-4 rounded-md border transition-colors ${
                    form.managementLayers === option.value
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-navy border-navy/20 hover:border-navy/40"
                  }`}
                >
                  <div className="font-semibold text-sm">{option.label}</div>
                  <div
                    className={`text-sm mt-1 ${
                      form.managementLayers === option.value
                        ? "text-white/80"
                        : "text-navy/60"
                    }`}
                  >
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
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
              {isSubmitting ? "Setting up your diagnostic..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
