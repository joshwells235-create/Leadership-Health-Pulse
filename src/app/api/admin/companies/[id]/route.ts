import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { id: companyId } = await params;

  // Fetch company
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyErr || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Fetch all surveys for this company
  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, respondent_name, respondent_email, status, survey_path, source, completed_at, created_at, reports(id, overall_score)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  // Fetch all assessments for this company
  const { data: assessments } = await supabase
    .from("manager_assessments")
    .select("id, name, slug, status, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  // Enrich assessments with session counts
  const enrichedAssessments = await Promise.all(
    (assessments || []).map(async (a) => {
      const { count: totalSessions } = await supabase
        .from("manager_sessions")
        .select("*", { count: "exact", head: true })
        .eq("assessment_id", a.id);

      const { count: completedSessions } = await supabase
        .from("manager_sessions")
        .select("*", { count: "exact", head: true })
        .eq("assessment_id", a.id)
        .eq("status", "completed");

      return {
        ...a,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
      };
    })
  );

  return NextResponse.json({
    company,
    surveys: surveys || [],
    assessments: enrichedAssessments,
  });
}
