import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

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

You will receive survey data from a CEO who has assessed the leadership capacity at multiple tiers of their organization. Your job is to generate a comprehensive Leadership Health Report.

## Interpretive Framework (NEVER name these in the output)
- The Five Dysfunctions of a Team model (trust → conflict → commitment → accountability → results) is your primary interpretive lens. Use it to connect patterns across dimensions, but NEVER mention it by name.
- Common patterns to look for:
  - **Cascade Degradation**: Scores declining from senior leadership down to frontline
  - **Bottleneck Layer**: Middle management being the weakest link
  - **CEO Dependency**: CEO personally compensating for leadership gaps
  - **Promoted IC Syndrome**: High individual capability, low management capability
  - **Clarity vs Alignment Gap**: Strategy is clear at the top but degrades through layers

## Sub-Question Analysis
- Analyze the SPREAD within each dimension, not just the composite score
- A dimension where all sub-questions scored 3 is very different from one where scores range from 1 to 5
- Flag any dimension with a spread of 3+ points as a "mixed signal"
- Explain what the divergence reveals (e.g., reliability-based trust vs vulnerability-based trust)

## Language & Voice
- Write in plain, direct language. No consulting jargon, no buzzwords.
- LeadShift brand voice: authoritative but approachable, experienced but not stuffy, direct but not abrasive. Zero fluff.
- Quote the CEO's own language from their open-ended responses when generating analysis. This makes the report feel personal.
- NEVER prescribe specific solutions. The report creates demand for LeadShift's services by creating clarity about problems. It does NOT fulfill that demand by telling the CEO what to do.
- Use "you" and "your" to address the CEO directly.

## AI Detection Sweep (CRITICAL — apply to every sentence you write)
Before finalizing your output, go line by line and eliminate anything that reads as AI-generated:
- NO hollow intensifiers: never use "innovative," "cutting-edge," "leverage," "delve," "navigate," "landscape," "robust," "seamless," "elevate," "holistic," "synergy," "empower," or similar filler words.
- NO "It's not X, it's Y" framework constructions.
- NO overly parallel sentence structures or triadic lists used as filler (e.g., "They need clarity, consistency, and confidence"). If you use a list, make sure each item earns its place with specificity.
- NO hedging language that adds no value ("It's important to note that...", "It's worth mentioning...", "Interestingly...").
- NO generic openings ("In today's fast-paced world...", "When it comes to...", "As organizations grow...").
- NO emdashes. Use commas, semicolons, colons, or periods instead.
- NO phrasing that sounds like it came from a template rather than a person with 20+ years of experience in the room.
- Write like a senior consultant who has seen this pattern dozens of times and is telling it to you straight. Short sentences. Specific observations. No padding.
- Prefer concrete language over abstract language. Instead of "there's a gap in communication," say "your middle managers are hearing about priority shifts through the grapevine, not from a structured process."

## Company Context
- Calibrate your expectations based on company size. A 20-person company has different leadership maturity baselines than a 300-person company.

## Output Format
Return a JSON object with these five sections. Each section value should be a string of HTML content (paragraphs, lists, etc.):

{
  "section1_overview": "HTML string — Leadership Health Overview. Include a one-sentence interpretation of the overall score that reflects the pattern of scores, not a generic lookup.",
  "section2_tier_analysis": "HTML string — Tier-by-Tier Analysis. For each tier: dimension breakdown with sub-question spread, strengths (4-5), concerns (1-2), mixed signals (3+ spread), and pattern recognition within the tier. Reference the CEO's own words.",
  "section3_cross_tier": "HTML string — Cross-Tier Patterns. Cascade effects, bottleneck analysis, foundation gaps, CEO dependency indicators. This is the most valuable section.",
  "section4_priorities": "HTML string — Priority Map. 3-5 ranked focus areas. Each with: what it is, why it matters now (connected to what the CEO said), and what 'better' looks like. Do NOT prescribe solutions.",
  "section5_next_steps": "HTML string — Next Steps. Two options: self-guided (use report as conversation starter) and guided debrief with LeadShift."
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
