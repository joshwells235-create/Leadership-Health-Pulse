import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;

  // Fetch all companies
  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .order("name");

  if (!companies || companies.length === 0) {
    return NextResponse.json({ companies: [] });
  }

  // Enrich each company with survey + assessment data
  const enriched = await Promise.all(
    companies.map(async (company) => {
      // Latest completed survey with score
      const { data: surveys } = await supabase
        .from("surveys")
        .select("id, status, completed_at, reports(overall_score)")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const latestSurvey =
        surveys && surveys.length > 0
          ? {
              id: surveys[0].id,
              status: surveys[0].status,
              completed_at: surveys[0].completed_at,
              overall_score:
                surveys[0].reports && surveys[0].reports.length > 0
                  ? (surveys[0].reports[0] as Record<string, unknown>)
                      .overall_score
                  : null,
            }
          : null;

      // Latest assessment with session counts
      const { data: assessments } = await supabase
        .from("manager_assessments")
        .select("id, name, slug, status")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(1);

      let assessment = null;
      if (assessments && assessments.length > 0) {
        const a = assessments[0];
        const { count: totalSessions } = await supabase
          .from("manager_sessions")
          .select("*", { count: "exact", head: true })
          .eq("assessment_id", a.id);

        const { count: completedSessions } = await supabase
          .from("manager_sessions")
          .select("*", { count: "exact", head: true })
          .eq("assessment_id", a.id)
          .eq("status", "completed");

        assessment = {
          id: a.id,
          name: a.name,
          slug: a.slug,
          status: a.status,
          totalSessions: totalSessions || 0,
          completedSessions: completedSessions || 0,
        };
      }

      // Only include companies that have at least one survey or assessment
      if (!latestSurvey && !assessment) return null;

      // Last activity: most recent timestamp across both products
      const timestamps = [
        latestSurvey?.completed_at,
        company.created_at,
      ].filter(Boolean) as string[];

      // Get most recent session completed_at for assessment
      if (assessment && assessment.completedSessions > 0) {
        const { data: lastSession } = await supabase
          .from("manager_sessions")
          .select("completed_at")
          .eq("assessment_id", assessment.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1);
        if (lastSession && lastSession.length > 0 && lastSession[0].completed_at) {
          timestamps.push(lastSession[0].completed_at);
        }
      }

      const lastActivity = timestamps.sort().reverse()[0] || company.created_at;

      return {
        ...company,
        latestSurvey,
        assessment,
        lastActivity,
      };
    })
  );

  return NextResponse.json({
    companies: enriched.filter(Boolean),
  });
}
