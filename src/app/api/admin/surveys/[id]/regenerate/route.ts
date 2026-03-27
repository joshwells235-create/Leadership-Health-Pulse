import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 120;

// Use a direct supabase client for data fetching (not tied to cookies)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: surveyId } = await params;
  const body = await request.json().catch(() => ({}));
  const reportFormat = body.format || "full";

  // Get current max version for this survey + format
  const { data: existingReports } = await supabaseAdmin
    .from("reports")
    .select("version")
    .eq("survey_id", surveyId)
    .eq("report_format", reportFormat)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = existingReports && existingReports.length > 0
    ? existingReports[0].version + 1
    : 1;

  // Call the existing generate-report logic by making an internal request
  // We reuse the same endpoint but we need to handle versioning
  const generateRes = await fetch(
    new URL("/api/generate-report", request.url).toString(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surveyId }),
    }
  );

  if (!generateRes.ok) {
    const errData = await generateRes.json();
    return NextResponse.json(
      { error: errData.error || "Failed to regenerate report" },
      { status: 500 }
    );
  }

  const genData = await generateRes.json();

  // Update the newly created report with the correct version and format
  if (genData.reportId) {
    await supabaseAdmin
      .from("reports")
      .update({
        report_format: reportFormat,
        version: nextVersion,
        generated_by: auth.user.email || "consultant",
      })
      .eq("id", genData.reportId);
  }

  return NextResponse.json({
    success: true,
    reportId: genData.reportId,
    version: nextVersion,
    format: reportFormat,
  });
}
