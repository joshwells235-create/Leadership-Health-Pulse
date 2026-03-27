import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { QUADRANT_LABELS, type Quadrant } from "@/lib/quadrant-scoring";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  const { assessmentId } = await request.json();

  if (!assessmentId) {
    return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
  }

  // Fetch assessment with company
  const { data: assessment } = await supabase
    .from("manager_assessments")
    .select("*, companies(*)")
    .eq("id", assessmentId)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Fetch all completed sessions
  const { data: sessions } = await supabase
    .from("manager_sessions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("status", "completed")
    .order("respondent_name");

  if (!sessions || sessions.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 completed sessions for an org report" },
      { status: 400 }
    );
  }

  // Fetch all responses for these sessions
  const sessionIds = sessions.map((s) => s.id);
  const { data: allResponses } = await supabase
    .from("manager_responses")
    .select("*")
    .in("session_id", sessionIds);

  // Build distribution
  const distribution: Record<string, number> = {
    intentional: 0,
    command_control: 0,
    overly_supportive: 0,
    absent: 0,
  };

  for (const s of sessions) {
    if (s.quadrant) distribution[s.quadrant]++;
  }

  // Calculate aggregate dimension scores
  const dimensionTotals: Record<string, { sum: number; count: number }> = {};
  for (const r of allResponses || []) {
    if (!dimensionTotals[r.dimension]) {
      dimensionTotals[r.dimension] = { sum: 0, count: 0 };
    }
    dimensionTotals[r.dimension].sum += r.rating;
    dimensionTotals[r.dimension].count += 1;
  }

  // Build data summary
  const company = assessment.companies as Record<string, unknown>;
  let dataSummary = `ORGANIZATIONAL ASSESSMENT SUMMARY
===================================
Company: ${company?.name || "Unknown"}
Total Managers Assessed: ${sessions.length}

QUADRANT DISTRIBUTION
`;
  for (const [q, count] of Object.entries(distribution)) {
    const pct = Math.round((count / sessions.length) * 100);
    dataSummary += `${QUADRANT_LABELS[q as Quadrant]}: ${count} (${pct}%)\n`;
  }

  dataSummary += `\nTEAM AVERAGES BY DIMENSION\n`;
  for (const [dim, data] of Object.entries(dimensionTotals)) {
    const avg = (data.sum / data.count).toFixed(2);
    dataSummary += `${dim.replace(/_/g, " ")}: ${avg}/5.0\n`;
  }

  // Average accountability and supportiveness
  const accResponses = (allResponses || []).filter(
    (r) => r.axis === "accountability"
  );
  const supResponses = (allResponses || []).filter(
    (r) => r.axis === "supportiveness"
  );
  const avgAcc =
    accResponses.length > 0
      ? (
          accResponses.reduce((s, r) => s + r.rating, 0) / accResponses.length
        ).toFixed(2)
      : "N/A";
  const avgSup =
    supResponses.length > 0
      ? (
          supResponses.reduce((s, r) => s + r.rating, 0) / supResponses.length
        ).toFixed(2)
      : "N/A";

  dataSummary += `\nOVERALL AXIS AVERAGES
Accountability: ${avgAcc}/5.0
Supportiveness: ${avgSup}/5.0

INDIVIDUAL PLACEMENTS
`;

  for (const s of sessions) {
    dataSummary += `${s.respondent_name} (${s.respondent_title || "No title"}): ${
      QUADRANT_LABELS[(s.quadrant as Quadrant) || "absent"]
    } - S:${s.x_score} A:${s.y_score}\n`;
  }

  const systemPrompt = `You are a senior leadership development consultant writing an organizational assessment report. This report is for the CEO or Chief People Officer, not individual managers.

THE CONTEXT
A group of managers at this company completed the ELITE5 Management Assessment. You are analyzing the collective results: where managers cluster, where the biggest gaps are, and what it means for the organization.

YOUR VOICE
Direct. Specific. Experienced. You've seen this pattern across dozens of organizations. You name what's happening without hedging. The CEO reads this and knows exactly where to focus.

REPORT STRUCTURE
Return a JSON object with these keys, each containing an HTML string:

{
  "overview": "2-3 paragraphs. The headline finding. How many managers, where they cluster, what the dominant pattern is. Make it specific to this team's data.",
  "distribution_analysis": "3-4 paragraphs. What each quadrant's count means for the organization. Where the concentration is and why it matters. Connect the pattern to business impact.",
  "collective_gaps": "2-3 paragraphs. The biggest development gaps across the team as a whole. Which ELITE5 dimensions are weakest? What does that produce in daily operations?",
  "development_priorities": "2-3 paragraphs. The 2-3 most important areas to focus development resources. Rank by impact. Frame as problems to solve, not solutions to implement. The goal is Intentional Leadership through ELITE5."
}

RULES
- Write in prose paragraphs, never bullet points.
- Never use em-dashes. Use commas, semicolons, colons, or periods.
- Never use the "It's not X, it's Y" construction.
- No hollow intensifiers or corporate buzzwords.
- No hedging language.
- Vary sentence length. Let the writing breathe.
- Reference specific numbers from the data naturally.
- This report creates demand for development (ELITE5/Ascend). Never prescribe solutions explicitly. Make the need obvious.

Return ONLY the JSON object. No markdown code fences.`;

  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: dataSummary }],
    });

    const rawText =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    let reportContent;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      reportContent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!reportContent) throw new Error("No JSON");
    } catch {
      return NextResponse.json(
        { error: "Failed to parse report" },
        { status: 500 }
      );
    }

    // Save org report
    await supabase.from("manager_reports").insert({
      session_id: null,
      assessment_id: assessmentId,
      report_type: "organizational",
      generated_content: reportContent,
      version: 1,
    });

    return NextResponse.json({ report: reportContent });
  } catch (err) {
    console.error("Org report generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
