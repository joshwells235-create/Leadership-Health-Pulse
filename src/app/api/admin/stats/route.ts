import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;

  // Total surveys
  const { count: totalSurveys } = await supabase
    .from("surveys")
    .select("*", { count: "exact", head: true });

  // Completed surveys
  const { count: completedSurveys } = await supabase
    .from("surveys")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  // Completed this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: completedThisWeek } = await supabase
    .from("surveys")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("completed_at", weekAgo.toISOString());

  // Average overall score
  const { data: reports } = await supabase
    .from("reports")
    .select("overall_score");

  let avgScore = 0;
  if (reports && reports.length > 0) {
    avgScore =
      Math.round(
        (reports.reduce((sum, r) => sum + (r.overall_score || 0), 0) /
          reports.length) *
          10
      ) / 10;
  }

  // Active manager assessments
  const { count: activeAssessments } = await supabase
    .from("manager_assessments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Count distinct companies that have at least one survey or assessment
  const { data: surveyCompanies } = await supabase
    .from("surveys")
    .select("company_id");
  const { data: assessmentCompanies } = await supabase
    .from("manager_assessments")
    .select("company_id");
  const companyIds = new Set([
    ...(surveyCompanies || []).map((r) => r.company_id),
    ...(assessmentCompanies || []).map((r) => r.company_id),
  ]);
  const totalCompanies = companyIds.size;

  // Total leads (cold path)
  const { count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  // New leads
  const { count: newLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  return NextResponse.json({
    totalCompanies,
    activeAssessments: activeAssessments || 0,
    totalSurveys: totalSurveys || 0,
    completedSurveys: completedSurveys || 0,
    completedThisWeek: completedThisWeek || 0,
    avgScore,
    totalLeads: totalLeads || 0,
    newLeads: newLeads || 0,
  });
}
