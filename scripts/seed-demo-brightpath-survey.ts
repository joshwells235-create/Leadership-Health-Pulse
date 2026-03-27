// Run: npx tsx scripts/seed-demo-brightpath-survey.ts
// Seeds a CEO diagnostic survey for BrightPath Financial (the existing company)
// with realistic ratings and open responses for a 3-tier org

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xmgdxjjimpofazxzwiti.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZ2R4amppbXBvZmF6eHp3aXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQ4MzUsImV4cCI6MjA5MDEzMDgzNX0.Lvo0O9bKBmgQp3qcT-nPbnE_-zaBvbCc0ykYsVTmRRA"
);

async function seed() {
  console.log("Finding BrightPath Financial...");

  // Find the existing BrightPath Financial company
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("name", "BrightPath Financial");

  if (!companies || companies.length === 0) {
    console.error("BrightPath Financial not found! Run seed-demo-brightpath.ts first.");
    return;
  }

  const companyId = companies[0].id;
  console.log("Found company:", companyId);

  // Create survey — CEO of a 251-500 person financial services company
  // Story: CEO sees strong SLT but knows middle management is a bottleneck.
  // Frontline is undertrained. Classic "promoted-IC" problem at mid-level.
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .insert({
      company_id: companyId,
      respondent_name: "Catherine Walsh",
      respondent_email: "cwalsh@brightpathfinancial.com",
      survey_path: "three_tier",
      status: "completed",
      completed_at: new Date().toISOString(),
      source: "warm",
      referred_by: "Josh Wells",
      capstone_one_response:
        "Getting our middle managers to stop being individual contributors who happen to have direct reports. They're brilliant at the work but they don't manage.",
      capstone_two_response:
        "Whether my senior team is actually aligned or just agreeing with me to avoid conflict. I genuinely don't know.",
    })
    .select()
    .single();

  if (surveyError) {
    console.error("Survey creation error:", surveyError);
    return;
  }
  console.log("Survey created:", survey.id);

  // Ratings: realistic pattern for a financial services firm
  // SLT: generally strong but dialogue is weak (they avoid conflict)
  // Middle: weak across the board, especially ownership and capability
  // Frontline: very weak, undertrained, but some trust
  const tiers = [
    {
      key: "slt",
      scores: {
        trust: [4, 4, 3, 4],       // decent trust, some department-first thinking
        dialogue: [2, 2, 3, 2],     // poor — they avoid conflict, defer to CEO
        ownership: [4, 3, 4],       // solid but CEO still pushes things
        capability: [4, 4, 3, 5],   // strong talent, one question mark
        alignment: [3, 4, 3],       // know the direction, interpret differently
      },
    },
    {
      key: "middle",
      scores: {
        trust: [2, 2, 1],           // siloed, don't see themselves as community
        dialogue: [2, 1, 2, 2],     // don't push back, don't communicate up
        ownership: [1, 2, 1],       // wait for direction, don't own cross-boundary
        capability: [2, 1, 2, 2],   // promoted ICs, can't coach, weak strategy
        alignment: [2, 2, 1],       // hear about changes through grapevine
      },
    },
    {
      key: "frontline",
      scores: {
        trust: [3, 2, 2],           // some identity as leaders, limited trust
        dialogue: [1, 2, 1],        // don't feel safe raising issues
        ownership: [2, 2, 1, 1],    // escalate everything, don't feel empowered
        capability: [1, 1, 1],      // zero training in people management
        alignment: [2, 1, 1],       // can't explain why priorities matter
      },
    },
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

  // Insert ratings
  const ratings = [];
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

  const { error: ratingsError } = await supabase
    .from("survey_ratings")
    .insert(ratings);

  if (ratingsError) {
    console.error("Ratings error:", ratingsError);
    return;
  }
  console.log(`Inserted ${ratings.length} ratings`);

  // Open responses — written in the CEO's voice, specific to financial services
  const openResponses = [
    {
      tier: "slt",
      dimension: "trust",
      prompt_text: "When your senior leaders disagree behind closed doors, what typically happens next?",
      response: "They nod in the room and then go work around each other. The CFO and the Chief Revenue Officer have fundamentally different views on where to invest, and instead of hashing it out they just protect their own budgets.",
    },
    {
      tier: "slt",
      dimension: "dialogue",
      prompt_text: "Think of the last time something went wrong in the business. How did your senior team talk about it?",
      response: "We lost a major institutional client last quarter. The postmortem was polite. Nobody said what we all knew — that the relationship had been mismanaged for months and the signals were there. I had to be the one to say it.",
    },
    {
      tier: "slt",
      dimension: "ownership",
      prompt_text: "When a strategic initiative stalls, who notices first?",
      response: "Me. Our wealth management platform migration has been stuck for two months and nobody escalated it. I found out in a board prep meeting.",
    },
    {
      tier: "slt",
      dimension: "capability",
      prompt_text: "Which of your senior leaders would you bet on for the next stage?",
      response: "Danielle Reeves absolutely. The CFO is solid. Our Chief Revenue Officer I'm less sure about — he's great at the work but I'm not sure he can lead through the scale we're heading toward. And I have one VP who might just be in over their head.",
    },
    {
      tier: "slt",
      dimension: "alignment",
      prompt_text: "How confident are you that your senior leaders are telling the same story?",
      response: "About 65% confident. They know the three pillars but they weight them differently. The revenue side thinks growth is priority one, the ops side thinks it's risk management. Both are right but they're not integrated.",
    },
    {
      tier: "middle",
      dimension: "trust",
      prompt_text: "If two middle managers had a conflict, would they resolve it directly?",
      response: "Never. It would go up to their respective VPs. Our middle managers don't even know each other across departments. We've never given them a reason to.",
    },
    {
      tier: "middle",
      dimension: "dialogue",
      prompt_text: "Is there anything your middle managers are thinking but not saying?",
      response: "I think they know our compliance processes are choking execution but they're afraid to say it because the compliance VP is intimidating. They just work around it quietly.",
    },
    {
      tier: "middle",
      dimension: "ownership",
      prompt_text: "Do your middle managers drive execution independently?",
      response: "Within their lanes, sometimes. But anything that crosses a departmental line just dies. Nobody picks it up because nobody thinks it's their job.",
    },
    {
      tier: "middle",
      dimension: "capability",
      prompt_text: "Are your middle managers in their roles because they grew into them or because they were the best ICs?",
      response: "Almost all were our best analysts, best advisors, best underwriters. We promoted them because they were brilliant at the work. Nobody taught them how to manage people. That's on us.",
    },
    {
      tier: "middle",
      dimension: "alignment",
      prompt_text: "How do your middle managers learn about changes in direction?",
      response: "Inconsistently. Some VPs are good at cascading information, others aren't. The wealth advisory middle managers probably hear things a week before the risk side does. There's no system.",
    },
    {
      tier: "frontline",
      dimension: "trust",
      prompt_text: "Do your frontline managers see themselves as part of the leadership team?",
      response: "I'd be surprised. We've never included them in anything leadership-related. They're seen as supervisors, not leaders. That's probably a mistake.",
    },
    {
      tier: "frontline",
      dimension: "dialogue",
      prompt_text: "How would your frontline managers describe the quality of communication they receive?",
      response: "They'd probably say they find out about things after clients do. We had a product change last year that frontline heard about from a client call before internal comms went out.",
    },
    {
      tier: "frontline",
      dimension: "ownership",
      prompt_text: "When something goes wrong at the front line, does it get resolved there?",
      response: "No. Everything escalates. They don't have decision-making authority and they know it. Even small client issues go up two levels before anyone acts.",
    },
    {
      tier: "frontline",
      dimension: "capability",
      prompt_text: "How much training have your frontline managers received in managing people?",
      response: "A compliance onboarding and that's it. No leadership training. No coaching skills. No feedback frameworks. We've invested nothing in developing them as managers.",
    },
    {
      tier: "frontline",
      dimension: "alignment",
      prompt_text: "Could your frontline managers explain why the company's priorities matter?",
      response: "They could list them. I don't think they could explain why they matter or how their team's work connects. The strategy feels like something that happens three floors above them.",
    },
  ];

  const { error: openError } = await supabase
    .from("survey_open_responses")
    .insert(openResponses.map((r) => ({ ...r, survey_id: survey.id })));

  if (openError) {
    console.error("Open responses error:", openError);
    return;
  }
  console.log(`Inserted ${openResponses.length} open responses`);

  console.log(`\nDone! CEO Diagnostic survey created for BrightPath Financial.`);
  console.log(`Survey ID: ${survey.id}`);
  console.log(`Respondent: Catherine Walsh (CEO)`);
  console.log(`\nView at: /admin/companies/${companyId}`);
  console.log(`Report at: /report/${survey.id}`);
}

seed();
