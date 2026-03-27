import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase } = auth;
  const { id: leadId } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    console.error("Lead update error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }

  return NextResponse.json({ lead: data });
}
