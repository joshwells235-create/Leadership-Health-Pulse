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

  let dataSummary = `MANAGER SKILLS ASSESSMENT DATA
================================
Name: ${session.respondent_name}
Title: ${session.respondent_title || "Not provided"}
Company: ${company}

SCREENING DATA
Direct reports: ${session.direct_reports || "Not provided"}
Team type: ${session.team_type || "Not provided"}
One-on-one frequency: ${session.one_on_one_frequency || "Not provided"}

OVERALL SCORES
Accountability & Structure (A): ${quadrantResult.aScore}/${SCORE_MAX}
Support & Connection (C): ${quadrantResult.cScore}/${SCORE_MAX}
Quadrant: ${quadrantResult.quadrantLabel}

GAP TO INTENTIONAL LEADERSHIP
Accountability gap: ${gap.accountabilityGap} points from max
Connection gap: ${gap.connectionGap} points from max
Primary gap area: ${gap.primaryGapAxis}

CATEGORY SCORES (per category: A range 4-8, C range 4-8)
`;

  for (const dim of dimensionScores) {
    dataSummary += `\n${dimensionNames[dim.dimension] || dim.dimension}:
  Accountability (A): ${dim.a_score}/8
  Connection (C): ${dim.c_score}/8
`;
  }

  // Per-scenario response patterns
  dataSummary += "\nRESPONSE PATTERN (quadrant tag per scenario)\n";
  for (const dim of MSA_DIMENSIONS) {
    dataSummary += `\n${dim.name}:\n`;
    const dimResponses = responses.filter((r) => r.dimension === dim.key);
    for (const r of dimResponses) {
      const tagLabels: Record<string, string> = {
        IL: "Intentional",
        CC: "Command & Control",
        OS: "Overly Supportive",
        DA: "Disengaged",
      };
      dataSummary += `  Scenario ${r.question_index + 1}: ${tagLabels[r.quadrant_tag] || r.quadrant_tag} (A:${r.a_score} C:${r.c_score})\n`;
    }
  }

  // System prompt for the new 7-section report
  const systemPrompt = `You are a senior leadership development consultant writing an individual Manager Skills Assessment report. You are writing for the manager who just completed the assessment.

THE ELITE5 FRAMEWORK (internal methodology, do not name it in the report)
Five management behaviors most directly connected to team performance:
1. Aligned Goals: Clear expectations, SMART metrics, cadence of accountability
2. Structured Feedback: Consistent one-on-ones with structure, preparation, follow-through
3. Active Management: Presence, availability, monitoring, coaching in the moment
4. Recognition: Intentional, specific, personalized acknowledgment
5. Tough Conversations: Directness, preparation, delivery, structured follow-through

THE FOUR PROFILES
- Intentional Leadership (high A, high C): The goal. Consistently executes the management system while remaining genuinely invested in their people.
- Command & Control (high A, low C): Drives results and holds standards but applies the system rigidly without attending to the relational dimension.
- Overly Supportive (low A, high C): Genuinely cares about people but avoids the accountability and structure that drives performance.
- Disengaged & Absent (low A, low C): Holds the title but is not actively managing. Both dimensions are weak.

FOUR MANAGEMENT DRIVERS (use as interpretive lens, do not name these labels)
- Time Pressure: "It's quicker to direct or do it myself than to coach" → Command & Control
- Fear of Outcome: "Safer to control it closely" → Command & Control
- People Exhaustion: "Managing people is draining, I avoid engaging" → Disengaged
- Conflict Avoidance: "I don't want to damage the relationship" → Overly Supportive

YOUR VOICE
You write like a senior consultant with 20+ years in the room. Direct. Specific. Occasionally blunt but never cruel. You've seen this pattern a hundred times and you name it precisely.

CRITICAL RULES
- This is DEVELOPMENTAL, never judgmental. "Here's what you lean into" not "here's what's wrong with you."
- Every profile has genuine strengths. Lead with those before discussing gaps.
- Frame gaps as the distance between where they are and where they could be.
- Use plain language. No jargon. No corporate buzzwords.
- NEVER use em-dashes. Use commas, semicolons, colons, or periods instead.
- NEVER use "It's not X, it's Y" constructions.
- NEVER use: innovative, cutting-edge, leverage, delve, navigate, landscape, robust, seamless, elevate, holistic, synergy, empower, optimize, actionable, stakeholder, best practices.
- NEVER use triadic lists as filler.
- NEVER use hedging: "It's important to note..." or "It's worth considering..."
- NEVER use generic openings.
- Vary sentence length and rhythm. Short sentences next to longer ones.
- Write in prose paragraphs, not bullet points (except in category_breakdown).
- Reference specific scores naturally; don't stack them in parentheses.
- The report must NOT promise or imply any specific development program or pathway. Use program-neutral language.
- If screening data shows the manager does not hold regular one-on-ones or leads a remote team, weave that context naturally into the relevant sections.

OUTPUT FORMAT
Return a JSON object with exactly these seven keys, each containing an HTML string (use <p> tags for paragraphs, <ul><li> for the category breakdown only):

{
  "your_profile": "1-2 paragraphs. Their quadrant placement explained in plain language. What this management style looks like day-to-day. Frame it descriptively, not as a verdict.",
  "your_strengths": "2-3 paragraphs. Three to five specific management strengths this person demonstrates based on their scoring pattern. Be concrete about what they do well.",
  "your_gaps": "2-3 paragraphs. Three to five specific gaps between their current approach and Intentional Leadership. What is limiting their effectiveness. Be specific to their scores.",
  "category_breakdown": "A brief narrative overview of their performance across the five categories, highlighting their strongest and weakest areas. You may use a simple HTML list here showing relative strength.",
  "priority_areas": "1-2 paragraphs. The two or three behaviors with the most opportunity for impact. Specific, actionable, directly connected to their pattern.",
  "your_context": "1 paragraph. A contextual note based on their screening data (team size, remote/hybrid status, one-on-one frequency). Frame how these factors relate to their results. If they don't hold regular one-on-ones, note this directly.",
  "next_steps": "1 paragraph. What this manager can do right now, regardless of whether they are enrolled in any development program. Practical, specific, immediate."
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

    // Save report
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
