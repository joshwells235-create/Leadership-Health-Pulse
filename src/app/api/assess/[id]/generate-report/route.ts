import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import {
  calculateQuadrant,
  getDimensionScores,
  getGapToIntentional,
  QUADRANT_LABELS,
  SCORE_MAX,
  type ResponseScore,
} from "@/lib/quadrant-scoring";
import { MSA_DIMENSIONS } from "@/lib/manager-questions";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  // Fetch session with assessment and company
  const { data: session, error: sessionError } = await supabase
    .from("manager_sessions")
    .select("*, manager_assessments(*, companies(*))")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Fetch responses
  const { data: responses } = await supabase
    .from("manager_responses")
    .select("*")
    .eq("session_id", sessionId)
    .order("dimension")
    .order("question_index");

  if (!responses || responses.length === 0) {
    return NextResponse.json({ error: "No responses found" }, { status: 400 });
  }

  // Calculate scores using new binary model
  const responseData: ResponseScore[] = responses.map((r) => ({
    a_score: r.a_score,
    c_score: r.c_score,
    dimension: r.dimension,
  }));
  const quadrantResult = calculateQuadrant(responseData);
  const dimensionScores = getDimensionScores(
    responses.map((r) => ({
      dimension: r.dimension,
      a_score: r.a_score,
      c_score: r.c_score,
    }))
  );
  const gap = getGapToIntentional(quadrantResult);

  // Dimension name lookup
  const dimensionNames: Record<string, string> = {};
  for (const dim of MSA_DIMENSIONS) {
    dimensionNames[dim.key] = dim.name;
  }

  // Build data summary for AI
  const company = (session.manager_assessments as Record<string, unknown>)?.companies
    ? ((session.manager_assessments as Record<string, unknown>).companies as Record<string, unknown>).name
    : "Unknown";

  // Convert raw scores to relative strength labels for the AI
  // so it describes behaviors, not numbers
  function strengthLabel(score: number, max: number) {
    const pct = score / max;
    if (pct >= 0.9) return "very strong";
    if (pct >= 0.75) return "strong";
    if (pct >= 0.6) return "moderate";
    if (pct >= 0.45) return "weak";
    return "very weak";
  }

  function categoryStrength(score: number) {
    // Category scores range 4-8
    if (score >= 7) return "strong";
    if (score >= 6) return "moderate";
    if (score >= 5) return "weak";
    return "very weak";
  }

  let dataSummary = `INTERNAL SCORING DATA (for your analysis only — NEVER expose these numbers in the report)
================================
Name: ${session.respondent_name}
Title: ${session.respondent_title || "Not provided"}
Company: ${company}

SCREENING DATA
Direct reports: ${session.direct_reports || "Not provided"}
Team type: ${session.team_type ? session.team_type.replace("_", "-") : "Not provided"}
One-on-one frequency: ${session.one_on_one_frequency ? session.one_on_one_frequency.replace("_", " ") : "Not provided"}

PROFILE
Quadrant: ${quadrantResult.quadrantLabel}
Accountability & Structure: ${strengthLabel(quadrantResult.aScore, SCORE_MAX)} (${quadrantResult.aScore}/${SCORE_MAX} — DO NOT put this number in the report)
Support & Connection: ${strengthLabel(quadrantResult.cScore, SCORE_MAX)} (${quadrantResult.cScore}/${SCORE_MAX} — DO NOT put this number in the report)
Primary gap: ${gap.primaryGapAxis === "accountability" ? "Accountability & Structure" : "Support & Connection"}

CATEGORY PERFORMANCE (use category names in the report, not scores)
`;

  for (const dim of dimensionScores) {
    dataSummary += `\n${dimensionNames[dim.dimension] || dim.dimension}:
  Accountability: ${categoryStrength(dim.a_score)}
  Connection: ${categoryStrength(dim.c_score)}
`;
  }

  // Per-scenario response patterns (which profile each answer mapped to)
  const tagLabels: Record<string, string> = {
    IL: "Intentional",
    CC: "Command & Control",
    OS: "Overly Supportive",
    DA: "Disengaged",
  };
  dataSummary += "\nRESPONSE PATTERNS BY CATEGORY\n";
  for (const dim of MSA_DIMENSIONS) {
    const dimResponses = responses.filter((r) => r.dimension === dim.key);
    const tags = dimResponses.map((r) => tagLabels[r.quadrant_tag] || r.quadrant_tag);
    dataSummary += `${dim.name}: ${tags.join(", ")}\n`;
  }

  // System prompt for the individual manager report
  const systemPrompt = `You are a senior leadership development consultant writing an individual assessment report for a manager. You are writing directly to the manager who completed the assessment. They are not a data analyst. They want to know: what am I doing well, where am I falling short, and what should I do differently starting Monday.

WHAT THE ASSESSMENT MEASURES (your interpretive lens, never name these frameworks to the reader)
The assessment measures five management behaviors:
1. Aligned Goals: Setting clear expectations and holding people to them
2. Structured Feedback: Having consistent, prepared one-on-ones that go beyond status updates
3. Active Management: Being present, available, and catching problems early
4. Recognition: Acknowledging effort and results in a way that people actually feel
5. Tough Conversations: Addressing performance issues directly instead of avoiding them

These behaviors are scored across two dimensions:
- Accountability & Structure: Does this manager set clear standards and hold people to them?
- Support & Connection: Does this manager invest in their people and build trust?

THE FOUR PROFILES
- Intentional Leadership: The goal. Both accountable and connected. Drives results AND develops people.
- Command & Control: Gets results through structure and standards but misses the people side. Teams perform but don't grow.
- Overly Supportive: Great relationships but avoids the hard parts of managing. People like them, standards slip.
- Disengaged & Absent: Not actively managing. Both dimensions are weak.

UNDERLYING DRIVERS (use to add insight, never name these labels)
- Time Pressure and Fear of Outcome pull managers toward Command & Control
- People Exhaustion pulls toward Disengagement
- Conflict Avoidance pulls toward Overly Supportive

YOUR VOICE
Senior consultant, 20+ years. Direct. Specific. Occasionally blunt but never cruel.

CRITICAL RULES
- NEVER mention numerical scores, axis scores, percentages, or scoring ranges. The manager does not see these numbers and referencing them will confuse them. Describe strengths and gaps in behavioral terms: "You are strong at setting expectations but your follow-through drops off" not "Your A score is 37/40."
- NEVER mention "ELITE5", "Elite Five", or any internal framework name.
- NEVER mention "Accountability axis", "Connection axis", "A score", "C score", or any scoring terminology.
- Describe the five categories by name (Aligned Goals, Structured Feedback, etc.) but frame them as management behaviors, not assessment dimensions.
- This is DEVELOPMENTAL, never judgmental.
- Every profile has genuine strengths. Lead with those.
- Use plain language. No jargon.
- NEVER use em-dashes. Use commas, semicolons, colons, or periods.
- NEVER use "It's not X, it's Y" constructions.
- NEVER use: innovative, cutting-edge, leverage, delve, navigate, landscape, robust, seamless, elevate, holistic, synergy, empower, optimize, actionable, stakeholder, best practices.
- NEVER use triadic lists as filler or hedging language.
- Vary sentence length. Write in prose, not bullets (except category_breakdown).
- Program-neutral: do not promise or imply any specific development program.
- Weave screening context (team size, remote status, 1:1 frequency) naturally into relevant sections.

OUTPUT FORMAT
Return a JSON object with exactly these seven keys, each containing an HTML string (use <p> tags for paragraphs, <ul><li> for category_breakdown only):

{
  "your_profile": "1-2 paragraphs. Describe their management style in plain language. What it looks like day-to-day. Not a verdict, a description they'll recognize as accurate.",
  "your_strengths": "2-3 paragraphs. Three to five specific things this manager does well. Be concrete. 'You set clear expectations and your team knows what's required' not 'You scored high on accountability.'",
  "your_gaps": "2-3 paragraphs. Three to five specific behaviors that are limiting their effectiveness. Frame as the distance between where they are and Intentional Leadership.",
  "category_breakdown": "A narrative overview of their strongest and weakest areas across the five management behaviors. Use plain language descriptions of relative strength, never numbers. A simple HTML list is fine here.",
  "priority_areas": "1-2 paragraphs. The two or three most impactful things to change. Specific and behavioral. 'Start following up on commitments within 48 hours' not 'Improve your accountability score.'",
  "your_context": "1 paragraph. How their team setup (size, remote/hybrid, 1:1 habits) relates to their results. If they don't hold regular one-on-ones, name that directly.",
  "next_steps": "1 paragraph. What to do right now. Practical, specific, immediate. No program references."
}

Return ONLY the JSON object. No markdown code fences. No explanation.`;

  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      system: systemPrompt,
      messages: [{ role: "user", content: dataSummary }],
    });

    const rawText =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    let reportContent;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reportContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch {
      console.error("Failed to parse AI response:", rawText);
      return NextResponse.json(
        { error: "Failed to parse report" },
        { status: 500 }
      );
    }

    // AI Detection Sweep (second pass)
    const sweepResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      system: `You are an editorial quality control pass. Your job is to take a JSON object containing HTML report sections and eliminate anything that reads as AI-generated.

Go through every sentence and fix:
- Hollow intensifiers ("innovative," "cutting-edge," "leverage," "delve," "navigate," "landscape," "robust," "seamless," "elevate," "holistic," "synergy," "empower")
- Any "It's not X, it's Y" constructions
- Overly parallel sentence structures or triadic lists used as filler
- Hedging language ("It's important to note that...")
- Generic openings ("In today's fast-paced world..." or "When it comes to...")
- ALL em-dashes (replace with commas, semicolons, colons, or periods)
- Any phrasing that sounds templated rather than written by a person with decades of experience

Return the cleaned JSON object with the same seven keys. Return ONLY the JSON. No code fences. No explanation.`,
      messages: [{ role: "user", content: JSON.stringify(reportContent) }],
    });

    const sweepText =
      sweepResponse.content[0].type === "text"
        ? sweepResponse.content[0].text
        : "";

    let cleanedReport;
    try {
      const jsonMatch = sweepText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedReport = JSON.parse(jsonMatch[0]);
      } else {
        cleanedReport = reportContent;
      }
    } catch {
      cleanedReport = reportContent;
    }

    // Delete any existing individual reports for this session before saving
    await supabase
      .from("manager_reports")
      .delete()
      .eq("session_id", sessionId)
      .eq("report_type", "individual");

    const { error: saveError } = await supabase
      .from("manager_reports")
      .insert({
        session_id: sessionId,
        assessment_id: session.assessment_id,
        report_type: "individual",
        generated_content: cleanedReport,
        version: 1,
      });

    if (saveError) {
      console.error("Error saving report:", saveError);
    }

    return NextResponse.json({
      report: cleanedReport,
      quadrant: quadrantResult,
      dimensionScores,
      gap,
    });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
