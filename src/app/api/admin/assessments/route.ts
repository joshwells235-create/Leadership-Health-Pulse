import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/admin-auth";

// Use anon client for data operations (RLS allows anon inserts on companies)
const anonSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: assessments, error } = await anonSupabase
    .from("manager_assessments")
    .select("*, companies(name, industry, employee_count_range)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get session counts for each assessment
  const enriched = await Promise.all(
    (assessments || []).map(async (a) => {
      const { count: totalSessions } = await anonSupabase
        .from("manager_sessions")
        .select("*", { count: "exact", head: true })
        .eq("assessment_id", a.id);

      const { count: completedSessions } = await anonSupabase
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

  return NextResponse.json({ assessments: enriched });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { companyName, industry, employeeRange, assessmentName } = body;

  // Create or find company
  let companyId = body.companyId;

  if (!companyId && companyName) {
    const { data: company, error: companyError } = await anonSupabase
      .from("companies")
      .insert({
        name: companyName,
        industry: industry || null,
        employee_count_range: employeeRange || "Unknown",
      })
      .select()
      .single();

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }
    companyId = company.id;
  }

  // Generate slug from company name
  const slug = (companyName || "assessment")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check if slug exists, append random if so
  const { data: existing } = await anonSupabase
    .from("manager_assessments")
    .select("id")
    .eq("slug", slug)
    .single();

  const finalSlug = existing
    ? `${slug}-${Math.random().toString(36).substring(2, 6)}`
    : slug;

  const { data: assessment, error: assessError } = await anonSupabase
    .from("manager_assessments")
    .insert({
      company_id: companyId,
      name: assessmentName || "Manager Skills Assessment",
      slug: finalSlug,
      status: "active",
    })
    .select()
    .single();

  if (assessError) {
    return NextResponse.json({ error: assessError.message }, { status: 500 });
  }

  return NextResponse.json({ assessment });
}
