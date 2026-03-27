import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import {
  calculateQuadrant,
  getDimensionScores,
  getGapToIntentional,
  QUADRANT_LABELS,
  type ResponseData,
} from "@/lib/quadrant-scoring";
import { ELITE5_DIMENSIONS } from "@/lib/manager-questions";

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

  // Fetch session
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

  // Calculate scores
  const responseData: ResponseData[] = responses.map((r) => ({
    rating: r.rating,
    axis: r.axis,
  }));
  const quadrantResult = calculateQuadrant(responseData);
  const dimensionScores = getDimensionScores(responses);
  const gap = getGapToIntentional(quadrantResult);

  // Build data summary for AI
  const dimensionNames: Record<string, string> = {};
  for (const dim of ELITE5_DIMENSIONS) {
    dimensionNames[dim.key] = dim.name;
  }

  let dataSummary = `MANAGER ASSESSMENT DATA
========================
Name: ${session.respondent_name}
Title: ${session.respondent_title || "Not provided"}
Company: ${(session.manager_assessments as Record<string, unknown>)?.companies ? ((session.manager_assessments as Record<string, unknown>).companies as Record<string, unknown>).name : "Unknown"}

OVERALL SCORES
Accountability (Y-axis): ${quadrantResult.yScore}/5.0
Supportiveness (X-axis): ${quadrantResult.xScore}/5.0
Quadrant: ${quadrantResult.quadrantLabel}

GAP TO INTENTIONAL LEADERSHIP
Accountability gap: ${gap.accountabilityGap} points
Supportiveness gap: ${gap.supportivenessGap} points
Primary gap area: ${gap.primaryGapAxis}

DIMENSION SCORES
`;

  for (const dim of dimensionScores) {
    dataSummary += `\n${dimensionNames[dim.dimension] || dim.dimension}:
  Overall: ${dim.average}/5.0
  Accountability questions: ${dim.accountabilityAvg ?? "N/A"}/5.0
  Supportiveness questions: ${dim.supportivenessAvg ?? "N/A"}/5.0
`;
  }

  dataSummary += "\nINDIVIDUAL RESPONSES\n";
  for (const dim of ELITE5_DIMENSIONS) {
    dataSummary += `\n${dim.name}:\n`;
    const dimResponses = responses.filter((r) => r.dimension === dim.key);
    for (const r of dimResponses) {
      dataSummary += `  "${r.question_text}" => ${r.rating}/5 (${r.axis})\n`;
    }
  }

  // System prompt
  const systemPrompt = `You are a senior leadership development consultant writing an individual assessment report for a manager who just completed the ELITE5 Management Assessment.

THE ELITE5 FRAMEWORK
The ELITE5 is a management system with five components:
1. Aligned Goals: Setting clear expectations and aligning teams to objectives
2. Structured Feedback: Providing consistent, meaningful feedback
3. Active Management: Being actively engaged in leading day-to-day
4. Recognition: Acknowledging and reinforcing good work
5. Tough Conversations: Addressing problems directly and holding people accountable

THE FOUR QUADRANTS
The assessment plots managers on two axes (Accountability and Supportiveness):
- Intentional Leadership (top right): Both accountable and supportive. The optimal state. These managers drive results AND develop their people.
- Command & Control (top left): High accountability, low supportiveness. They get results through pressure, not development. Teams perform but don't grow.
- Overly Supportive (bottom right): High supportiveness, low accountability. Great relationships but standards slip. Teams like them but underperform.
- Absent/Disengaged (bottom left): Low on both. These managers avoid managing. They're in the role but not doing the role.

YOUR VOICE
You write like a senior consultant with 20+ years in the room. Direct. Specific. Occasionally blunt but never cruel. You've seen this pattern a hundred times and you name it precisely.

CRITICAL RULES
- This is DEVELOPMENTAL, never judgmental. "Here's what you lean into" not "here's what's wrong with you."
- Every quadrant has genuine strengths. Lead with those before discussing gaps.
- The goal is Intentional Leadership. Frame gaps as the distance between where they are and where they could be.
- Use plain language. No jargon. No corporate buzzwords.
- NEVER use em-dashes. Use commas, semicolons, colons, or periods instead.
- NEVER use the "It's not X, it's Y" construction.
- NEVER use hollow intensifiers: innovative, cutting-edge, leverage, delve, navigate, landscape, robust, seamless, elevate, holistic, synergy, empower, optimize, actionable, stakeholder, best practices.
- NEVER use triadic lists as filler (three generic items in a row).
- NEVER use hedging: "It's important to note..." or "It's worth considering..."
- NEVER use generic openings.
- Vary sentence length and rhythm. Short sentences next to longer ones. Let the writing breathe.
- Write in prose paragraphs, not bullet points.
- Reference specific scores naturally in the narrative; don't stack them in parentheses.

OUTPUT FORMAT
Return a JSON object with exactly these four keys, each containing an HTML string (use <p> tags for paragraphs):

{
  "management_style": "2-3 paragraphs. What quadrant they're in. What that looks like day-to-day. The genuine strengths of their approach and where it serves their team well.",
  "hinders_performance": "2-3 paragraphs. The blind spots of their style. What their team likely experiences. Be specific to their scores, not generic.",
  "critical_gaps": "2-3 paragraphs. The specific ELITE5 dimensions where the gap to intentional leadership is widest. Ranked by impact. Connect the gaps to real management situations.",
  "focus_areas": "1-2 paragraphs. The 2-3 most concrete things this manager should focus on first. Specific to their pattern. Not generic advice."
}

Return ONLY the JSON object. No markdown code fences. No explanation.`;

  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: dataSummary,
        },
      ],
    });

    const rawText =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    // Parse JSON from response
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
      max_tokens: 4000,
      system: `You are an editorial quality control pass. Your job is to take a JSON object containing HTML report sections and eliminate anything that reads as AI-generated.

Go through every sentence and fix:
- Hollow intensifiers ("innovative," "cutting-edge," "leverage," "delve," "navigate," "landscape," "robust," "seamless," "elevate," "holistic," "synergy," "empower")
- Any "It's not X, it's Y" constructions
- Overly parallel sentence structures or triadic lists used as filler
- Hedging language ("It's important to note that...")
- Generic openings ("In today's fast-paced world..." or "When it comes to...")
- ALL em-dashes (replace with commas, semicolons, colons, or periods)
- Any phrasing that sounds templated rather than written by a person with decades of experience

Return the cleaned JSON object with the same four keys. Return ONLY the JSON. No code fences. No explanation.`,
      messages: [
        {
          role: "user",
          content: JSON.stringify(reportContent),
        },
      ],
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
        cleanedReport = reportContent; // fallback to original
      }
    } catch {
      cleanedReport = reportContent; // fallback to original
    }

    // Save report to database
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
