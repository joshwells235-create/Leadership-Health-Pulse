import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { sessionId } = await params;

  // Fetch session
  const { data: session } = await supabase
    .from("manager_sessions")
    .select("*, manager_assessments(*, companies(*))")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch responses
  const { data: responses } = await supabase
    .from("manager_responses")
    .select("*")
    .eq("session_id", sessionId)
    .order("dimension")
    .order("question_index");

  // Fetch reports
  const { data: reports } = await supabase
    .from("manager_reports")
    .select("*")
    .eq("session_id", sessionId)
    .order("version", { ascending: false });

  // Fetch previous attempts by same email for reassessment comparison
  const { data: previousSessions } = await supabase
    .from("manager_sessions")
    .select("id, attempt_number, quadrant, x_score, y_score, completed_at")
    .eq("assessment_id", session.assessment_id)
    .eq("respondent_email", session.respondent_email)
    .eq("status", "completed")
    .order("attempt_number", { ascending: true });

  return NextResponse.json({
    session,
    responses: responses || [],
    reports: reports || [],
    previousSessions: previousSessions || [],
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { sessionId } = await params;

  const { error } = await supabase
    .from("manager_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
