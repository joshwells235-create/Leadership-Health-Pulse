import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Quick test endpoint: creates a company, survey, and dummy ratings,
// then redirects to the report page. Saves you from filling out the whole survey.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Create company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: "Test Corp",
        industry: "Professional Services",
        employee_count_range: "51-100",
      })
      .select()
      .single();

    if (companyError) throw companyError;

    // Create survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        company_id: company.id,
        respondent_name: "Test CEO",
        respondent_email: "josh@leadshift.com",
        survey_path: "three_tier",
        status: "completed",
        completed_at: new Date().toISOString(),
        source: "cold",
        capstone_one_response:
          "Middle management ownership. They wait for direction instead of driving execution.",
        capstone_two_response:
          "Having honest conversations with my SLT about who is really ready for the next stage.",
      })
      .select()
      .single();

    if (surveyError) throw surveyError;

    // Dummy ratings: SLT, Middle, Frontline across all 5 dimensions
    const ratings = [];
    const tiers = [
      { key: "slt", scores: { trust: [4, 3, 4, 2], dialogue: [3, 2, 4, 2], ownership: [4, 3, 3], capability: [4, 3, 3, 5], alignment: [3, 4, 3] } },
      { key: "middle", scores: { trust: [2, 2, 1], dialogue: [2, 1, 2, 2], ownership: [1, 1, 2], capability: [2, 3, 1, 2], alignment: [2, 2, 1] } },
      { key: "frontline", scores: { trust: [2, 1, 2], dialogue: [1, 2, 1], ownership: [2, 2, 1, 1], capability: [1, 1, 1], alignment: [2, 1, 2] } },
    ];

    const questionTexts: Record<string, Record<string, string[]>> = {
      slt: {
        trust: [
          "My senior leaders are genuinely open with each other about their mistakes and limitations.",
          "When one senior leader is struggling, others step in to help without being asked.",
          "My senior leaders give each other the benefit of the doubt rather than assuming negative intent.",
          "My senior leaders operate as a true team, not as representatives of their individual departments.",
        ],
        dialogue: [
          "My senior leaders will challenge each other directly in meetings rather than complaining privately afterward.",
          "When someone on the senior team has a concern about another leader's area, they raise it openly.",
          "My senior leaders can have heated debates and walk out of the room with no lasting damage to the relationship.",
          "I am not the only person on the senior team willing to name the elephant in the room.",
        ],
        ownership: [
          "When my senior leaders commit to a decision as a group, they follow through on it even if they personally disagreed.",
          "My senior leaders hold each other accountable without waiting for me to do it.",
          "Strategic initiatives at this level move forward consistently without needing me to push them along.",
        ],
        capability: [
          "My senior leaders have the skills and judgment needed for where this company is heading.",
          "My senior leaders actively invest in their own development without being prompted.",
          "I am confident that each person on my senior team is in the right role for the next phase.",
          "If I had to rebuild this senior team from scratch today, I would rehire most of them.",
        ],
        alignment: [
          "If I asked each senior leader to independently name our top three priorities, they would give the same answer.",
          "My senior leaders make decisions in their own areas that are consistent with our overall strategy.",
          "When priorities shift, my senior team understands the why behind the change.",
        ],
      },
      middle: {
        trust: [
          "My middle managers trust each other enough to share resources across departments.",
          "My middle managers see themselves as part of a leadership community.",
          "When a middle manager is underperforming, their peers will address it or flag it.",
        ],
        dialogue: [
          "My middle managers will push back on senior leadership when they believe a decision is wrong.",
          "My middle managers communicate difficult news upward in a timely way.",
          "There is not a meaningful gap between what my middle managers say in meetings and in the hallway.",
          "My middle managers are comfortable raising concerns without fear of political consequences.",
        ],
        ownership: [
          "My middle managers drive execution independently rather than waiting for direction from above.",
          "My middle managers take ownership of problems that cross departmental boundaries.",
          "When something falls through the cracks, middle managers own the miss.",
        ],
        capability: [
          "My middle managers were promoted because of their leadership potential, not just technical skill.",
          "My middle managers are effective at developing and coaching their reports.",
          "My middle managers can think strategically about their areas.",
          "The biggest capability gap at this level is one I am actively working to close.",
        ],
        alignment: [
          "My middle managers can clearly articulate the company's strategy.",
          "My middle managers receive consistent communication about company direction.",
          "When priorities change, my middle managers can translate that shift quickly.",
        ],
      },
      frontline: {
        trust: [
          "My frontline managers see themselves as part of the broader leadership team.",
          "My frontline managers trust that the organization has their back.",
          "My frontline managers collaborate across teams rather than operating in silos.",
        ],
        dialogue: [
          "My frontline managers feel safe raising problems without fear of being labeled as negative.",
          "My frontline managers can have direct performance conversations.",
          "My frontline managers receive honest feedback from the leaders above them.",
        ],
        ownership: [
          "My frontline managers take initiative to solve problems within their scope.",
          "My frontline managers follow through on commitments to their teams.",
          "If a frontline manager saw a cross-team problem, they would flag it.",
          "My frontline managers treat the business's goals as their own.",
        ],
        capability: [
          "My frontline managers have received meaningful training in how to manage people.",
          "My frontline managers know how to have difficult conversations and give feedback.",
          "I am confident my frontline managers can retain and develop talent.",
        ],
        alignment: [
          "My frontline managers understand why the company's current priorities matter.",
          "My frontline managers can connect daily work to the bigger picture.",
          "My frontline managers are equipped to answer questions about where the company is heading.",
        ],
      },
    };

    for (const tier of tiers) {
      for (const [dim, scores] of Object.entries(tier.scores)) {
        const texts = questionTexts[tier.key][dim];
        for (let i = 0; i < scores.length; i++) {
          ratings.push({
            survey_id: survey.id,
            tier: tier.key,
            dimension: dim,
            question_index: i + 1,
            question_text: texts[i],
            rating: scores[i],
          });
        }
      }
    }

    const { error: ratingsError } = await supabase.from("survey_ratings").insert(ratings);
    if (ratingsError) throw ratingsError;

    // Dummy open responses
    const openResponses = [
      { tier: "slt", dimension: "trust", prompt_text: "When your senior leaders disagree behind closed doors, what typically happens next?", response: "They usually defer to me. There's not a lot of direct conflict between them, which I think is actually a problem." },
      { tier: "slt", dimension: "dialogue", prompt_text: "Think of the last time something went wrong in the business. How did your senior team talk about it?", response: "It became a blame game. Nobody wanted to own it. I ended up having to mediate." },
      { tier: "slt", dimension: "ownership", prompt_text: "When a strategic initiative stalls, who notices first?", response: "Usually me. I'm the one checking in and pushing things forward." },
      { tier: "slt", dimension: "capability", prompt_text: "Which of your senior leaders would you bet on for the next stage?", response: "Two of the five are clear bets. Two more I'm unsure about. One I've been avoiding dealing with for too long." },
      { tier: "slt", dimension: "alignment", prompt_text: "How confident are you that your senior leaders are telling the same story?", response: "Maybe 60% confident. I think they know the direction but interpret priorities differently." },
      { tier: "middle", dimension: "trust", prompt_text: "If two middle managers had a conflict, would they resolve it directly?", response: "No. It would come to me or to their VP. They don't have that muscle." },
      { tier: "middle", dimension: "dialogue", prompt_text: "Is there anything your middle managers are thinking but not saying?", response: "Probably a lot. I think they feel like good soldiers who follow orders but don't speak up." },
      { tier: "middle", dimension: "ownership", prompt_text: "Do your middle managers drive execution independently?", response: "They're good at executing in their lane. But nothing that crosses boundaries gets done without senior involvement." },
      { tier: "middle", dimension: "capability", prompt_text: "Are your middle managers in their roles because they grew into them or because they were the best ICs?", response: "Mostly the latter. We promoted our best doers and hoped they'd figure out managing." },
      { tier: "middle", dimension: "alignment", prompt_text: "How do your middle managers learn about changes in direction?", response: "Through the grapevine, honestly. We don't have a structured way to cascade information." },
      { tier: "frontline", dimension: "trust", prompt_text: "Do your frontline managers see themselves as part of the leadership team?", response: "I doubt it. I don't think we've ever positioned them that way." },
      { tier: "frontline", dimension: "dialogue", prompt_text: "How would your frontline managers describe the quality of communication they receive?", response: "Probably 'inconsistent' at best. It depends on who their manager is." },
      { tier: "frontline", dimension: "ownership", prompt_text: "When something goes wrong at the front line, does it get resolved there?", response: "No, it travels up. They don't feel empowered to make decisions." },
      { tier: "frontline", dimension: "capability", prompt_text: "How much training have your frontline managers received in managing people?", response: "Almost none. We threw them in and expected them to figure it out." },
      { tier: "frontline", dimension: "alignment", prompt_text: "Could your frontline managers explain why the company's priorities matter?", response: "They'd repeat what they've been told but I don't think they could explain the why." },
    ];

    const { error: openError } = await supabase
      .from("survey_open_responses")
      .insert(openResponses.map((r) => ({ ...r, survey_id: survey.id })));

    if (openError) throw openError;

    // Redirect to report page
    return NextResponse.redirect(new URL(`/report/${survey.id}`, process.env.NEXT_PUBLIC_SUPABASE_URL ? "https://leadership-pulse.vercel.app" : "http://localhost:3000"));
  } catch (err) {
    console.error("Test report error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
