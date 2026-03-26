import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const LEADSHIFT_EMAIL = process.env.LEADSHIFT_NOTIFICATION_EMAIL || "josh@leadshift.com";
const DEBRIEF_URL = process.env.DEBRIEF_BOOKING_URL || "https://mysig.io/9873O1O8";

// ============================================
// Helper: Build heatmap HTML for email
// ============================================
function buildHeatmapHtml(dimensionScores: Record<string, { overall: number; dimensions: Record<string, { composite: number; hasMixedSignals: boolean }> }>) {
  const tiers = Object.keys(dimensionScores);
  const dimensions = ["trust", "dialogue", "ownership", "capability", "alignment"];
  const dimLabels: Record<string, string> = {
    trust: "Trust",
    dialogue: "Dialogue",
    ownership: "Ownership",
    capability: "Capability",
    alignment: "Alignment",
  };
  const tierLabels: Record<string, string> = {
    slt: "Senior Leadership",
    middle: "Middle Management",
    frontline: "Frontline Management",
    hybrid: "Your Managers",
  };

  function scoreColor(score: number): string {
    if (score <= 2.4) return "background-color: #EA0C67; color: white;";
    if (score <= 3.4) return "background-color: #F5A623; color: #101d51;";
    return "background-color: #007efa; color: white;";
  }

  let html = `<table style="width:100%; border-collapse:collapse; font-family:Raleway,Arial,sans-serif; font-size:14px;">
    <thead><tr>
      <th style="text-align:left; padding:8px; color:#101d51;"></th>`;

  for (const dim of dimensions) {
    html += `<th style="padding:8px; text-align:center; color:#101d51; font-size:12px;">${dimLabels[dim]}</th>`;
  }
  html += `</tr></thead><tbody>`;

  for (const tier of tiers) {
    html += `<tr style="border-top:1px solid #e0e0e0;">
      <td style="padding:8px; font-weight:600; color:#101d51; white-space:nowrap;">${tierLabels[tier] || tier}</td>`;
    for (const dim of dimensions) {
      const dimData = dimensionScores[tier]?.dimensions[dim];
      if (!dimData) {
        html += `<td style="padding:8px;"></td>`;
        continue;
      }
      html += `<td style="padding:8px; text-align:center;">
        <span style="${scoreColor(dimData.composite)} padding:6px 12px; border-radius:4px; font-weight:700; font-size:13px;">
          ${dimData.composite}${dimData.hasMixedSignals ? "*" : ""}
        </span>
      </td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody></table>
    <p style="font-size:11px; color:#999; margin-top:6px;">* Mixed signal: high variance within this dimension.</p>`;

  return html;
}

// ============================================
// Helper: Build report section HTML for email
// ============================================
function buildReportEmailHtml(
  respondentName: string,
  companyName: string,
  overallScore: number,
  dimensionScores: Record<string, { overall: number; dimensions: Record<string, { composite: number; hasMixedSignals: boolean }> }>,
  generatedContent: {
    section1_overview: string;
    section2_tier_analysis: string;
    section3_cross_tier: string;
    section4_priorities: string;
    section5_next_steps: string;
  },
  includeDebrief: boolean
) {
  const scoreColor = overallScore <= 2.4 ? "#EA0C67" : overallScore <= 3.4 ? "#F5A623" : "#007efa";
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background-color:#f3f3f3; font-family:Raleway,Arial,sans-serif;">
  <div style="max-width:640px; margin:0 auto; padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center; padding-bottom:24px; border-bottom:1px solid #e0e0e0;">
      <p style="font-size:12px; font-weight:600; color:#007efa; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px;">Leadership Health Pulse</p>
      <h1 style="font-size:28px; font-weight:700; color:#101d51; margin:0 0 8px;">Leadership Health Report</h1>
      <p style="color:#666; margin:0;">Prepared for ${respondentName}, ${companyName}</p>
      <p style="color:#999; font-size:13px; margin:4px 0 0;">${date}</p>
    </div>

    <!-- Overall Score -->
    <div style="text-align:center; padding:32px 0;">
      <p style="font-size:12px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px;">Overall Leadership Health Score</p>
      <p style="font-size:48px; font-weight:700; color:${scoreColor}; margin:0;">${overallScore}<span style="font-size:20px; color:#999;">/5.0</span></p>
    </div>

    <!-- Heatmap -->
    <div style="background:white; border-radius:6px; padding:20px; margin-bottom:24px; box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <h3 style="color:#101d51; font-size:16px; font-weight:700; margin:0 0 16px;">Tier Health Heatmap</h3>
      ${buildHeatmapHtml(dimensionScores)}
    </div>

    <!-- Section 1 -->
    <div style="background:white; border-radius:6px; overflow:hidden; margin-bottom:24px; box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <div style="background:#101d51; padding:16px 20px;">
        <h2 style="color:white; font-size:16px; font-weight:700; margin:0;"><span style="opacity:0.5; margin-right:6px;">1.</span>Leadership Health Overview</h2>
      </div>
      <div style="padding:20px; color:#333; line-height:1.6; font-size:14px;">${generatedContent.section1_overview}</div>
    </div>

    <!-- Section 2 -->
    <div style="background:white; border-radius:6px; overflow:hidden; margin-bottom:24px; box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <div style="background:#101d51; padding:16px 20px;">
        <h2 style="color:white; font-size:16px; font-weight:700; margin:0;"><span style="opacity:0.5; margin-right:6px;">2.</span>Tier-by-Tier Analysis</h2>
      </div>
      <div style="padding:20px; color:#333; line-height:1.6; font-size:14px;">${generatedContent.section2_tier_analysis}</div>
    </div>

    <!-- Section 3 -->
    <div style="background:white; border-radius:6px; overflow:hidden; margin-bottom:24px; box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <div style="background:#101d51; padding:16px 20px;">
        <h2 style="color:white; font-size:16px; font-weight:700; margin:0;"><span style="opacity:0.5; margin-right:6px;">3.</span>Cross-Tier Patterns</h2>
      </div>
      <div style="padding:20px; color:#333; line-height:1.6; font-size:14px;">${generatedContent.section3_cross_tier}</div>
    </div>

    <!-- Section 4 -->
    <div style="background:white; border-radius:6px; overflow:hidden; margin-bottom:24px; box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <div style="background:#101d51; padding:16px 20px;">
        <h2 style="color:white; font-size:16px; font-weight:700; margin:0;"><span style="opacity:0.5; margin-right:6px;">4.</span>Priority Map</h2>
      </div>
      <div style="padding:20px; color:#333; line-height:1.6; font-size:14px;">${generatedContent.section4_priorities}</div>
    </div>

    <!-- Section 5 -->
    <div style="background:white; border-radius:6px; overflow:hidden; margin-bottom:24px; box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <div style="background:#101d51; padding:16px 20px;">
        <h2 style="color:white; font-size:16px; font-weight:700; margin:0;"><span style="opacity:0.5; margin-right:6px;">5.</span>Next Steps</h2>
      </div>
      <div style="padding:20px; color:#333; line-height:1.6; font-size:14px;">${generatedContent.section5_next_steps}</div>
    </div>

    ${includeDebrief ? `
    <!-- Debrief CTA -->
    <div style="background:#101d51; border-radius:6px; padding:32px; text-align:center; margin-bottom:24px;">
      <h2 style="color:white; font-size:22px; font-weight:700; margin:0 0 12px;">Want to Talk Through These Results?</h2>
      <p style="color:rgba(255,255,255,0.7); margin:0 0 20px; font-size:14px; max-width:400px; margin-left:auto; margin-right:auto;">
        Book a 30-minute guided debrief with a LeadShift consultant. We'll help you interpret the patterns and identify the highest-leverage intervention points.
      </p>
      <a href="${DEBRIEF_URL}" style="display:inline-block; background:#EA0C67; color:white; font-weight:600; padding:14px 32px; border-radius:4px; text-decoration:none; font-size:16px;">Book a Debrief</a>
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="text-align:center; padding:16px 0; color:#999; font-size:12px;">
      <p style="margin:0;">Leadership Health Pulse by LeadShift</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// API Route Handler
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { surveyId } = await request.json();

    if (!surveyId) {
      return NextResponse.json({ error: "surveyId is required" }, { status: 400 });
    }

    // Fetch survey
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

    // Fetch report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("survey_id", surveyId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const companyName = company?.name || "Company";
    const respondentName = survey.respondent_name;
    const respondentEmail = survey.respondent_email;

    // Build the full report HTML
    const ceoReportHtml = buildReportEmailHtml(
      respondentName,
      companyName,
      report.overall_score,
      report.dimension_scores,
      report.generated_content,
      true // include debrief CTA
    );

    const leadshiftReportHtml = buildReportEmailHtml(
      respondentName,
      companyName,
      report.overall_score,
      report.dimension_scores,
      report.generated_content,
      false // no debrief CTA for internal copy
    );

    // Build LeadShift notification with context at the top
    const leadshiftEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background-color:#f3f3f3; font-family:Raleway,Arial,sans-serif;">
  <div style="max-width:640px; margin:0 auto; padding:32px 16px;">

    <!-- Notification Banner -->
    <div style="background:#007efa; border-radius:6px; padding:20px 24px; margin-bottom:24px; color:white;">
      <h2 style="margin:0 0 8px; font-size:18px; font-weight:700;">New Pulse Survey Completed</h2>
      <p style="margin:0; font-size:14px; opacity:0.9;"><strong>${respondentName}</strong> at <strong>${companyName}</strong> just completed the Leadership Health Pulse.</p>
    </div>

    <!-- Quick Facts -->
    <div style="background:white; border-radius:6px; padding:20px; margin-bottom:24px; box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <table style="width:100%; font-size:14px; color:#101d51;">
        <tr><td style="padding:6px 0; font-weight:600;">Name:</td><td style="padding:6px 0;">${respondentName}</td></tr>
        <tr><td style="padding:6px 0; font-weight:600;">Email:</td><td style="padding:6px 0;"><a href="mailto:${respondentEmail}" style="color:#007efa;">${respondentEmail}</a></td></tr>
        <tr><td style="padding:6px 0; font-weight:600;">Company:</td><td style="padding:6px 0;">${companyName}</td></tr>
        <tr><td style="padding:6px 0; font-weight:600;">Industry:</td><td style="padding:6px 0;">${company?.industry || "Not specified"}</td></tr>
        <tr><td style="padding:6px 0; font-weight:600;">Size:</td><td style="padding:6px 0;">${company?.employee_count_range || "Not specified"} employees</td></tr>
        <tr><td style="padding:6px 0; font-weight:600;">Survey Path:</td><td style="padding:6px 0;">${survey.survey_path === "three_tier" ? "3-tier (SLT + Middle + Frontline)" : "2-tier (SLT + Managers)"}</td></tr>
        <tr><td style="padding:6px 0; font-weight:600;">Overall Score:</td><td style="padding:6px 0; font-weight:700; font-size:18px; color:${report.overall_score <= 2.4 ? "#EA0C67" : report.overall_score <= 3.4 ? "#F5A623" : "#007efa"}">${report.overall_score}/5.0</td></tr>
        <tr><td style="padding:6px 0; font-weight:600;">Source:</td><td style="padding:6px 0;">${survey.source === "warm" ? `Warm (referred by ${survey.referred_by || "unknown"})` : "Cold (website)"}</td></tr>
      </table>
    </div>

    <hr style="border:none; border-top:2px solid #101d51; margin:24px 0;">
    <p style="text-align:center; color:#101d51; font-weight:700; font-size:16px; margin-bottom:24px;">Full Report Below</p>

    ${leadshiftReportHtml}
  </div>
</body>
</html>`;

    // Send email to CEO
    const emailResults = [];

    try {
      const ceoEmail = await resend.emails.send({
        from: "Leadership Health Pulse <onboarding@resend.dev>",
        to: respondentEmail,
        subject: `Your Leadership Health Report, ${respondentName}`,
        html: ceoReportHtml,
      });
      emailResults.push({ recipient: "ceo", success: true, id: ceoEmail.data?.id });
    } catch (err) {
      console.error("Failed to send CEO email:", err);
      emailResults.push({ recipient: "ceo", success: false, error: String(err) });
    }

    // Send full report copy to LeadShift
    try {
      const lsEmail = await resend.emails.send({
        from: "Leadership Health Pulse <onboarding@resend.dev>",
        to: LEADSHIFT_EMAIL,
        subject: `[Pulse Report] ${respondentName} at ${companyName} (${report.overall_score}/5.0)`,
        html: leadshiftEmail,
      });
      emailResults.push({ recipient: "leadshift", success: true, id: lsEmail.data?.id });
    } catch (err) {
      console.error("Failed to send LeadShift email:", err);
      emailResults.push({ recipient: "leadshift", success: false, error: String(err) });
    }

    return NextResponse.json({ success: true, emails: emailResults });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
