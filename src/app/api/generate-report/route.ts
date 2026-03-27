import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Allow up to 120 seconds for AI report generation (requires Vercel Pro)
export const maxDuration = 120;

// Use service-level Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================
// Types
// ============================================
interface RatingRow {
  tier: string;
  dimension: string;
  question_index: number;
  question_text: string;
  rating: number;
}

interface OpenResponseRow {
  tier: string;
  dimension: string;
  prompt_text: string;
  response: string;
}

interface DimensionScore {
  composite: number;
  ratings: { questionIndex: number; questionText: string; rating: number }[];
  spread: number;
  hasMixedSignals: boolean;
}

interface TierScores {
  overall: number;
  dimensions: Record<string, DimensionScore>;
}

// ============================================
// Scoring Engine
// ============================================
function calculateScores(ratings: RatingRow[]) {
  const tiers = [...new Set(ratings.map((r) => r.tier))];
  const tierScores: Record<string, TierScores> = {};

  for (const tier of tiers) {
    const tierRatings = ratings.filter((r) => r.tier === tier);
    const dimensions = [...new Set(tierRatings.map((r) => r.dimension))];
    const dimensionScores: Record<string, DimensionScore> = {};

    for (const dimension of dimensions) {
      const dimRatings = tierRatings
        .filter((r) => r.dimension === dimension)
        .sort((a, b) => a.question_index - b.question_index);

      const ratingValues = dimRatings.map((r) => r.rating);
      const composite =
        ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length;
      const spread = Math.max(...ratingValues) - Math.min(...ratingValues);

      dimensionScores[dimension] = {
        composite: Math.round(composite * 10) / 10,
        ratings: dimRatings.map((r) => ({
          questionIndex: r.question_index,
          questionText: r.question_text,
          rating: r.rating,
        })),
        spread,
        hasMixedSignals: spread >= 3,
      };
    }

    const dimComposites = Object.values(dimensionScores).map(
      (d) => d.composite
    );
    const tierOverall =
      dimComposites.reduce((sum, v) => sum + v, 0) / dimComposites.length;

    tierScores[tier] = {
      overall: Math.round(tierOverall * 10) / 10,
      dimensions: dimensionScores,
    };
  }

  // Overall score across all tiers
  const tierOveralls = Object.values(tierScores).map((t) => t.overall);
  const overallScore =
    tierOveralls.reduce((sum, v) => sum + v, 0) / tierOveralls.length;

  return {
    overall: Math.round(overallScore * 10) / 10,
    tiers: tierScores,
  };
}

// ============================================
// Build the AI prompt
// ============================================
function buildPrompt(
  scores: ReturnType<typeof calculateScores>,
  openResponses: OpenResponseRow[],
  survey: {
    respondent_name: string;
    capstone_one_response: string | null;
    capstone_two_response: string | null;
    survey_path: string;
  },
  company: { name: string; industry: string | null; employee_count_range: string }
) {
  // Format scores for the prompt
  let scoresText = `Overall Leadership Health Score: ${scores.overall}/5.0\n\n`;

  for (const [tierKey, tierData] of Object.entries(scores.tiers)) {
    const tierLabel =
      tierKey === "slt"
        ? "Senior Leadership Team"
        : tierKey === "middle"
          ? "Middle Management"
          : tierKey === "frontline"
            ? "Frontline Management"
            : "Your Managers";

    scoresText += `### ${tierLabel} (Overall: ${tierData.overall}/5.0)\n`;

    for (const [dimKey, dimData] of Object.entries(tierData.dimensions)) {
      const dimLabel =
        dimKey === "trust"
          ? "Trust and Cohesion"
          : dimKey === "dialogue"
            ? "Honest Dialogue"
            : dimKey === "ownership"
              ? "Ownership and Follow-Through"
              : dimKey === "capability"
                ? "Capability and Growth"
                : "Alignment and Clarity";

      scoresText += `\n**${dimLabel}**: ${dimData.composite}/5.0 (spread: ${dimData.spread})${dimData.hasMixedSignals ? " ⚠️ MIXED SIGNAL" : ""}\n`;

      for (const r of dimData.ratings) {
        scoresText += `  - Q${r.questionIndex}: "${r.questionText}" → ${r.rating}/5\n`;
      }
    }

    // Add open-ended responses for this tier
    const tierOpenResponses = openResponses.filter((o) => o.tier === tierKey);
    if (tierOpenResponses.length > 0) {
      scoresText += `\n**Open-ended responses for ${tierLabel}:**\n`;
      for (const o of tierOpenResponses) {
        scoresText += `  - Prompt: "${o.prompt_text}"\n    Response: "${o.response}"\n`;
      }
    }

    scoresText += "\n---\n\n";
  }

  // Add capstone responses
  if (survey.capstone_one_response || survey.capstone_two_response) {
    scoresText += "### Capstone Responses\n";
    if (survey.capstone_one_response) {
      scoresText += `**"If you could fix one leadership problem overnight, which tier and which issue would you choose?"**\n${survey.capstone_one_response}\n\n`;
    }
    if (survey.capstone_two_response) {
      scoresText += `**"What's the leadership challenge you've been putting off the longest?"**\n${survey.capstone_two_response}\n\n`;
    }
  }

  return scoresText;
}

// ============================================
// System Prompt for Claude
// ============================================
const SYSTEM_PROMPT = `You are the analysis engine for the Leadership Health Pulse, a diagnostic tool built by LeadShift, a leadership development consulting firm.

You will receive survey data from a CEO who has assessed the leadership capacity at multiple tiers of their organization. Your job is to generate a Leadership Health Report that reads like it was written by a senior consultant with 20+ years in the room, not by an AI.

## WHO IS WRITING THIS REPORT

The voice is a senior leadership consultant who has sat across from hundreds of CEOs, seen the same patterns play out across dozens of organizations, and has zero interest in impressing anyone with vocabulary. This person is direct, specific, occasionally blunt, and earns $1,000/hour because they name things other consultants talk around.

The tone is: authoritative but approachable, experienced but not stuffy, direct but not abrasive, warm enough that the CEO doesn't feel attacked, sharp enough that they can't dismiss it.

Good example: "You have good people in roles they were never equipped for. That's not a people problem. That's a development problem, and it started the day you promoted them without a plan to grow them."

Good example: "Your middle managers are lane runners. They'll execute what's in front of them, but the moment something crosses a departmental line, it stops moving. It doesn't get resolved. It gets escalated. And it lands on your desk."

## INTERPRETIVE FRAMEWORK (never name these in output)

Use the Five Dysfunctions of a Team model (trust > conflict > commitment > accountability > results) as your interpretive lens. NEVER mention it by name. Also look for:
- Scores declining from senior leadership down to frontline (cascade degradation)
- Middle management being the weakest link
- CEO personally compensating for leadership gaps
- High individual capability but low management capability (promoted individual contributors)
- Strategy clear at the top but degrading through layers

## SUB-QUESTION SPREAD ANALYSIS

A dimension where all sub-questions scored 3 is very different from one where scores range from 1 to 5. Always analyze the spread. When a dimension has 3+ point spread between sub-questions, that's where the most actionable insight lives. A composite of 3.0 made up of a 5 and a 1 is far more interesting than a composite of 3.0 made up of all 3s. Describe the contradiction; do not label it "Mixed Signal."

## SCORE CALIBRATION

1.0-1.5: Broken. The capability barely exists. Use direct language.
1.6-2.4: A real problem costing the organization. Below functional.
2.5-3.0: Could go either way. Trending toward crisis without intervention.
3.1-3.5: Functional but not a strength. Not the fire, but not contributing to growth.
3.6-4.0: A genuine strength. Acknowledge without overselling.
4.1-5.0: Exceptional. Rare. Name it as a real asset.

## HOW TO USE THE CEO'S LANGUAGE (CRITICAL)

The CEO's open-ended responses contain their actual language, their actual framing, their actual frustrations. Use this language not as decoration (a quoted phrase dropped into a paragraph) but as the foundation of the insight.

Bad: "Your assessment is direct: 'They're good at executing in their lane.' This suggests limited cross-functional ownership."

Good: "Your middle managers are lane runners. That's your phrase, and it's precise. They execute well inside their own territory. But the moment a problem touches another department, it stops. It doesn't get resolved at their level. It gets kicked upstairs. And upstairs is you. That's why your calendar is full of problems that should have been solved two levels below you."

Rules:
- Always start each tier analysis by referencing something the CEO said about that tier. Their words are the entry point, not supporting evidence.
- Never put CEO quotes in isolation. Always follow with what it reveals or what pattern it connects to.
- Use the CEO's casual language as-is. If they said "nobody wants to own it," use that phrase. Don't sanitize it.
- When the CEO's language contradicts their numerical ratings, call it out directly.

## BANNED PATTERNS (strictly enforced)

Banned sentence structures:
- The "It's not X, it's Y" construction. Never. This is the most recognizable AI pattern.
- Triadic lists used as filler. Three generic items separated by commas is throat-clearing. Pick the one that matters and say it with specificity.
- Parallel sentence structures. When three consecutive sentences follow the same grammatical pattern, rewrite them. Vary the rhythm.
- Hedging: "It's important to note...", "It's worth considering...", "This suggests that..." Just say it.
- Generic openings: "In today's...", "When it comes to...", "As organizations grow..."

Banned words: innovative, cutting-edge, leverage (verb), delve, navigate, landscape, robust, seamless, elevate, holistic, synergy, empower, optimize, actionable, stakeholder, best practices, value-add, paradigm, transformative, strategic imperative, "classic X syndrome", "classic X pattern", "at the end of the day", "moving forward", "in terms of", "it goes without saying", "the reality is", "needless to say"

Banned formatting:
- No em-dashes anywhere. Use commas, semicolons, colons, or periods. No exceptions.
- No bullet-point insights in the tier analysis or priority map. Write in prose.
- No score-parenthetical stacking like "(1/5)... (1/5)... (1/5)." Weave scores into the narrative naturally or reference them once and discuss what they mean.

## SECTION-BY-SECTION INSTRUCTIONS

### Section 1: Leadership Health Overview
Two paragraphs maximum.
- Paragraph 1: Lead with the overall score and what it means in one sentence specific to their pattern. Not a generic interpretation.
- Paragraph 2: Name the dominant pattern across tiers in plain language. No jargon headers. No framework labels. Just describe what's happening.

### Section 2: Tier-by-Tier Analysis
Each tier should feel like its own diagnosis, not a template with different numbers plugged in.

For each tier:
1. Open with the CEO's own language about this tier from their open-ended responses.
2. Name the core dynamic in one sentence. Plain language, not a jargon label.
3. Unpack the sub-question spread. Show internal contradictions. "They scored 4 on personal trust but 2 on operating as a team. They like each other. They just don't function together."
4. Connect dimension scores to each other. If trust and dialogue are both low, explain why those travel together.
5. Close with one sentence on what this tier's pattern means for the CEO's daily experience.

Do NOT list strengths and concerns as separate categories with headers. Weave them together. Do NOT use "Mixed Signal:" as a label. Do NOT stack scores in parentheses.

### Section 3: Cross-Tier Patterns
Make the CEO see connections they hadn't made.
- Use plain-language headers that describe what's happening: "Everything Flows Up to You" or "Your Middle Layer Is the Weakest Link." Not jargon labels.
- Each pattern: 3-4 sentences maximum. Be pointed.
- Always connect each pattern back to something the CEO feels in their daily experience.

### Section 4: Priority Map
Three to four priorities maximum. Written in prose, not bullets.
- The top priority should be the most developed. More specific, most connected to the CEO's stated frustrations.
- Each priority: what the problem is (one sentence), what it's costing the CEO (one sentence), what better looks like (one sentence).
- NEVER prescribe solutions. Define problems with enough clarity that the CEO asks "how do we fix this?"
- Use the CEO's capstone answers to inform the ordering. They told you what keeps them up at night.

### Section 5: Next Steps
Short. Two options, no more than three sentences each.
- Self-Guided: Specific and practical, not generic.
- Guided Debrief: One sentence on what it is, one sentence on why it matters for their situation. Not a sales pitch. The report did the selling.

## FINAL QUALITY CHECK (apply before generating output)

1. Could any sentence appear in a McKinsey or Korn Ferry report without modification? If yes, rewrite it.
2. Does the report use the CEO's own language at least once per tier section?
3. Are there more than two triadic lists in the entire report? If yes, break some up.
4. Is there at least one moment that would make the CEO pause and think "I've never heard anyone put it that way before"?
5. Does every paragraph earn its place, or are some just narrating the numbers? Cut anything that's just restating data.
6. Are there any em-dashes? Remove them all.
7. Does the Priority Map make the CEO want to pick up the phone?

## COMPANY CONTEXT

Calibrate expectations based on company size. A 20-person company and a 300-person company have different leadership maturity baselines.

## OUTPUT FORMAT

Return a JSON object with these five sections. Each section value should be a string of HTML content using <p>, <h3>, and <h4> tags. Write in prose. Minimal use of lists.

{
  "section1_overview": "HTML string",
  "section2_tier_analysis": "HTML string",
  "section3_cross_tier": "HTML string",
  "section4_priorities": "HTML string",
  "section5_next_steps": "HTML string"
}

Return ONLY the JSON object, no other text.`;

// ============================================
// API Route Handler
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { surveyId } = await request.json();

    if (!surveyId) {
      return NextResponse.json(
        { error: "surveyId is required" },
        { status: 400 }
      );
    }

    // Fetch survey data
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("*")
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      console.error("Survey fetch error:", surveyError);
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Fetch company data separately (more reliable than join)
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", survey.company_id)
      .single();

    if (companyError || !companyData) {
      console.error("Company fetch error:", companyError);
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Fetch ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from("survey_ratings")
      .select("*")
      .eq("survey_id", surveyId);

    if (ratingsError || !ratings || ratings.length === 0) {
      return NextResponse.json(
        { error: "No ratings found" },
        { status: 404 }
      );
    }

    // Fetch open responses
    const { data: openResponses } = await supabase
      .from("survey_open_responses")
      .select("*")
      .eq("survey_id", surveyId);

    // Calculate scores
    const scores = calculateScores(ratings as RatingRow[]);

    // Build the data for the AI
    const company = companyData;
    const promptData = buildPrompt(
      scores,
      (openResponses || []) as OpenResponseRow[],
      survey,
      company
    );

    // Call Claude to generate the report
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Generate a Leadership Health Report for ${survey.respondent_name}, CEO of ${company.name} (${company.employee_count_range} employees, industry: ${company.industry || "not specified"}).

Survey path: ${survey.survey_path === "three_tier" ? "Three-tier organization (SLT, Middle Management, Frontline Management)" : "Two-tier organization (SLT, Managers)"}

## Survey Data

${promptData}

Generate the full 5-section report as specified in your instructions.`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Parse the response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let generatedContent;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // SECOND PASS: AI Detection Sweep
    // Send the generated report through a cleanup pass to eliminate AI-sounding language
    const sweepMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `You are an editor. Your only job is to rewrite the report below so it sounds like a human consultant wrote it, not an AI.

Go line by line through every section and fix these violations:

1. HOLLOW INTENSIFIERS: Remove or replace "innovative," "cutting-edge," "leverage," "delve," "navigate," "landscape," "robust," "seamless," "elevate," "holistic," "synergy," "empower," "optimize," "actionable," "stakeholder," "best practices," "value-add," "paradigm," "transformative," "strategic imperative," and any similar corporate filler.

2. "IT'S NOT X, IT'S Y" CONSTRUCTIONS: Rewrite any sentence that follows this pattern. Instead of "This isn't about bad people, it's about under-investment," write "You have capable people who were never given the tools to lead."

3. PARALLEL SENTENCE STRUCTURES: If three consecutive sentences follow the same grammatical pattern, rewrite them. Vary the rhythm. Short sentences next to long ones.

4. TRIADIC LISTS: Three generic items separated by commas is filler. "Execution stalls, communication breaks down, and problems flow upward" says nothing specific. Pick the one that matters most and say it with specificity. No more than two triadic lists in the entire report.

5. HEDGING: Remove "It's important to note," "It's worth considering," "This suggests that," "Interestingly." Just say the thing.

6. GENERIC OPENINGS: Remove "In today's," "When it comes to," "As organizations grow." Start with the insight.

7. EM-DASHES: Replace every single em-dash (—) with a comma, semicolon, colon, or period. No exceptions.

8. SCORE STACKING: If you see patterns like "(1/5)... (2/5)... (1/5)" stacked together, rewrite to weave scores into the narrative naturally.

9. TEMPLATE LANGUAGE: Any sentence that could appear in a McKinsey or Korn Ferry report without modification needs to be rewritten to sound like a specific person talking to a specific CEO.

Return the exact same JSON structure with the cleaned-up HTML content. Change ONLY the language. Do not change the structure, the data, or the insights.

Here is the report to clean up:

${JSON.stringify(generatedContent)}

Return ONLY the cleaned JSON object, no other text.`,
        },
      ],
    });

    // Parse the swept report
    const sweepText = sweepMessage.content[0].type === "text" ? sweepMessage.content[0].text : "";
    try {
      const sweepMatch = sweepText.match(/\{[\s\S]*\}/);
      if (sweepMatch) {
        generatedContent = JSON.parse(sweepMatch[0]);
      }
    } catch {
      console.error("Sweep parse failed, using original report");
      // If the sweep fails to parse, we keep the original generatedContent
    }

    // Build tier scores for storage
    const tierScoresForDb: Record<string, number> = {};
    for (const [tierKey, tierData] of Object.entries(scores.tiers)) {
      tierScoresForDb[tierKey] = tierData.overall;
    }

    // Save the report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        survey_id: surveyId,
        overall_score: scores.overall,
        tier_scores: tierScoresForDb,
        dimension_scores: scores.tiers,
        generated_content: generatedContent,
      })
      .select()
      .single();

    if (reportError) {
      console.error("Failed to save report:", reportError);
      return NextResponse.json(
        { error: "Failed to save report" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reportId: report.id,
      surveyId,
      report: {
        id: report.id,
        overall_score: scores.overall,
        tier_scores: tierScoresForDb,
        dimension_scores: scores.tiers,
        generated_content: generatedContent,
      },
      survey: {
        respondent_name: survey.respondent_name,
        respondent_email: survey.respondent_email,
        survey_path: survey.survey_path,
        companies: company,
      },
    });
  } catch (err) {
    console.error("Report generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
