import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/admin-auth";

const anonSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: assessment } = await anonSupabase
    .from("manager_assessments")
    .select("*, companies(*)")
    .eq("id", id)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: sessions } = await anonSupabase
    .from("manager_sessions")
    .select("*")
    .eq("assessment_id", id)
    .order("created_at", { ascending: false });

  const { data: reports } = await anonSupabase
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

  const { id } = await params;

  const { error } = await anonSupabase
    .from("manager_assessments")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
