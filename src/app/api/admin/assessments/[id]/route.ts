import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { id } = await params;

  // Fetch assessment with company
  const { data: assessment } = await supabase
    .from("manager_assessments")
    .select("*, companies(*)")
    .eq("id", id)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch all sessions
  const { data: sessions } = await supabase
    .from("manager_sessions")
    .select("*")
    .eq("assessment_id", id)
    .order("created_at", { ascending: false });

  // Fetch all reports for this assessment
  const { data: reports } = await supabase
    .from("manager_reports")
    .select("*")
    .eq("assessment_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    assessment,
    sessions: sessions || [],
    reports: reports || [],
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("manager_assessments")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
