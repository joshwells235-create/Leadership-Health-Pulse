import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { id: surveyId } = await params;

  // Fetch survey with company
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("*")
    .eq("id", surveyId)
    .single();

  if (surveyError || !survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  // Fetch company
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", survey.company_id)
    .single();

  // Fetch all reports (all versions/formats)
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("survey_id", surveyId)
    .order("version", { ascending: false });

  // Fetch ratings
  const { data: ratings } = await supabase
    .from("survey_ratings")
    .select("*")
    .eq("survey_id", surveyId)
    .order("tier")
    .order("dimension")
    .order("question_index");

  // Fetch open responses
  const { data: openResponses } = await supabase
    .from("survey_open_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .order("tier")
    .order("dimension");

  // Fetch lead if exists
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("survey_id", surveyId)
    .single();

  return NextResponse.json({
    survey,
    company,
    reports: reports || [],
    ratings: ratings || [],
    openResponses: openResponses || [],
    lead,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { id: surveyId } = await params;

  // Fetch survey to get company_id
  const { data: survey } = await supabase
    .from("surveys")
    .select("company_id")
    .eq("id", surveyId)
    .single();

  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  // Delete in order (child records first, CASCADE handles most but be explicit)
  // Leads, reports, open_responses, ratings are all CASCADE from surveys
  const { error } = await supabase
    .from("surveys")
    .delete()
    .eq("id", surveyId);

  if (error) {
    console.error("Delete survey error:", error);
    return NextResponse.json({ error: "Failed to delete survey" }, { status: 500 });
  }

  // Check if the company has any other surveys; if not, delete the company too
  const { count } = await supabase
    .from("surveys")
    .select("*", { count: "exact", head: true })
    .eq("company_id", survey.company_id);

  if (count === 0) {
    await supabase.from("companies").delete().eq("id", survey.company_id);
  }

  return NextResponse.json({ success: true });
}
