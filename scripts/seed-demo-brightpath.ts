// Run: npx tsx scripts/seed-demo-brightpath.ts
// Seeds a demo company "BrightPath Financial" with 8 completed manager assessments
// Uses the updated ELITE5 questions with reverse-scored items

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xmgdxjjimpofazxzwiti.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZ2R4amppbXBvZmF6eHp3aXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQ4MzUsImV4cCI6MjA5MDEzMDgzNX0.Lvo0O9bKBmgQp3qcT-nPbnE_-zaBvbCc0ykYsVTmRRA"
);

const MIDPOINT = 3.8;

// Question structure matching manager-questions.ts exactly
// Each entry: [axis, reverse?]
const QUESTION_MAP: [string, boolean][] = [
  // Aligned Goals
  ["accountability", false],  // "My team would say they always know..."
  ["accountability", true],   // "I sometimes discover a goal is off track..." (REVERSE)
  ["supportiveness", false],  // "My team would say they understand how..."
  ["supportiveness", false],  // "When priorities shift, I sit down..."
  ["accountability", false],  // "If someone's deliverable doesn't meet..."
  // Structured Feedback
  ["accountability", false],  // "My team members would say they receive..."
  ["accountability", true],   // "I sometimes catch myself hinting..." (REVERSE)
  ["supportiveness", false],  // "My team members would say they can push back..."
  ["supportiveness", false],  // "I spend as much time coaching..."
  ["accountability", true],   // "I've given feedback and then realized..." (REVERSE)
  // Active Management
  ["accountability", true],   // "I'm sometimes surprised to learn..." (REVERSE)
  ["accountability", true],   // "When I notice an early warning sign..." (REVERSE)
  ["supportiveness", false],  // "My team would say I'm easy to reach..."
  ["supportiveness", false],  // "I hold consistent one-on-ones..."
  ["accountability", false],  // "I run my week with a consistent..."
  // Recognition
  ["supportiveness", false],  // "My team members would say they feel appreciated..."
  ["supportiveness", true],   // "If I'm honest, I probably recognize..." (REVERSE)
  ["accountability", false],  // "When I recognize someone publicly..."
  ["supportiveness", false],  // "My team would say I notice and acknowledge..."
  ["accountability", false],  // "I'm deliberate about which wins..."
  // Tough Conversations
  ["accountability", true],   // "I've let a performance issue go on..." (REVERSE)
  ["accountability", false],  // "If someone commits to something..."
  ["accountability", false],  // "I'd rather have an uncomfortable..."
  ["supportiveness", false],  // "My team would say that even after a tough..."
  ["supportiveness", true],   // "After a difficult conversation, I sometimes..." (REVERSE)
];

const QUESTION_TEXTS = [
  // Aligned Goals
  "My team would say they always know exactly what's expected of them and by when.",
  "I sometimes discover a goal is off track later than I should have.",
  "My team would say they understand how their work connects to what the organization is trying to achieve.",
  "When priorities shift, I sit down with my team to talk through what's changing and why, rather than just reassigning work.",
  "If someone's deliverable doesn't meet the standard, I send it back rather than fixing it myself.",
  // Structured Feedback
  "My team members would say they receive consistent, scheduled feedback from me — not just when something goes wrong.",
  "I sometimes catch myself hinting at a problem rather than naming the specific behavior that needs to change.",
  "My team members would say they can push back on my decisions without it affecting how I treat them.",
  "I spend as much time coaching my team on what they're doing well as I do on what needs to improve.",
  "I've given feedback and then realized weeks later I never checked whether anything actually changed.",
  // Active Management
  "I'm sometimes surprised to learn that a direct report has been stuck or struggling without my knowledge.",
  "When I notice an early warning sign, I sometimes wait a few days to see if it resolves on its own before stepping in.",
  "My team would say I'm easy to reach and genuinely interested when they bring me a problem.",
  "I hold consistent one-on-ones with each direct report and rarely cancel or reschedule them.",
  "I run my week with a consistent management routine rather than reacting to whatever comes up.",
  // Recognition
  "My team members would say they feel genuinely appreciated for their work, not just their results.",
  "If I'm honest, I probably recognize most people on my team in roughly the same way rather than tailoring it to each person.",
  "When I recognize someone publicly, I tie it to a specific behavior or result I want the rest of the team to repeat.",
  "My team would say I notice and acknowledge their effort on ongoing work, not just finished projects with visible outcomes.",
  "I'm deliberate about which wins I highlight because I know what gets recognized gets repeated.",
  // Tough Conversations
  "I've let a performance issue go on longer than I should have because I was hoping it would improve on its own.",
  "If someone commits to something and doesn't deliver, I call it out directly.",
  "I'd rather have an uncomfortable ten-minute conversation today than let a problem grow for a month.",
  "My team would say that even after a tough conversation with me, they walk away feeling respected and supported.",
  "After a difficult conversation, I sometimes get pulled into other things and don't check back in as soon as I should.",
];

const DIMENSIONS = [
  { key: "aligned_goals", startIdx: 0 },
  { key: "structured_feedback", startIdx: 5 },
  { key: "active_management", startIdx: 10 },
  { key: "recognition", startIdx: 15 },
  { key: "tough_conversations", startIdx: 20 },
];

// 8 managers with realistic response patterns
// For REVERSE questions, high ratings (4-5) mean "yes I do this bad thing" → scores low
// For normal questions, high ratings (4-5) mean "yes I do this good thing" → scores high
const MANAGERS = [
  {
    name: "Danielle Reeves",
    email: "danielle.r@brightpathfinancial.com",
    title: "Chief Operating Officer",
    pi: "Captain",
    // Strong intentional leader — high on normal Qs, low on reverse Qs
    ratings: [
      5, 2, 5, 4, 4,  // Aligned Goals: strong clarity, rarely off track
      4, 2, 5, 4, 1,   // Structured Feedback: consistent, direct, follows up
      1, 2, 5, 5, 4,   // Active Management: aware, proactive, accessible
      5, 2, 4, 4, 5,   // Recognition: appreciative, personalized, strategic
      1, 5, 5, 5, 1,   // Tough Conversations: acts fast, direct, follows up
    ],
  },
  {
    name: "Kevin Hartwell",
    email: "kevin.h@brightpathfinancial.com",
    title: "VP of Compliance",
    pi: "Controller",
    // Command & Control — high accountability, low supportiveness
    ratings: [
      4, 2, 2, 2, 5,  // Aligned Goals: clear standards but doesn't connect purpose
      3, 1, 2, 2, 2,   // Structured Feedback: direct but team can't push back
      2, 1, 2, 3, 5,   // Active Management: on top of things but not approachable
      2, 4, 5, 2, 5,   // Recognition: strategic but impersonal, doesn't personalize
      1, 5, 5, 2, 4,   // Tough Conversations: confronts fast but lacks warmth
    ],
  },
  {
    name: "Priya Sharma",
    email: "priya.s@brightpathfinancial.com",
    title: "Client Relations Director",
    pi: "Altruist",
    // Overly Supportive — great people skills, avoids accountability
    ratings: [
      2, 4, 5, 5, 2,  // Aligned Goals: connects purpose but loose on deadlines
      2, 4, 5, 5, 4,   // Structured Feedback: coaching focus but avoids directness
      4, 4, 5, 5, 2,   // Active Management: accessible but doesn't catch issues early
      5, 2, 2, 5, 2,   // Recognition: warm and personalized but not strategic
      4, 2, 2, 5, 2,   // Tough Conversations: respected but delays confrontation
    ],
  },
  {
    name: "Tom Nguyen",
    email: "tom.n@brightpathfinancial.com",
    title: "IT Infrastructure Manager",
    pi: "Individualist",
    // Absent/Disengaged — low on both axes
    ratings: [
      2, 4, 2, 2, 3,  // Aligned Goals: vague expectations, catches problems late
      2, 4, 3, 2, 4,   // Structured Feedback: inconsistent, avoids specifics
      4, 4, 2, 2, 2,   // Active Management: out of touch, cancels 1:1s
      2, 4, 2, 2, 3,   // Recognition: generic, infrequent
      5, 2, 2, 3, 4,   // Tough Conversations: avoids confrontation, slow to follow up
    ],
  },
  {
    name: "Rachel Kim",
    email: "rachel.k@brightpathfinancial.com",
    title: "Marketing Lead",
    pi: "Persuader",
    // Near-intentional, slight dip in accountability
    ratings: [
      4, 3, 4, 5, 3,  // Aligned Goals: mostly clear, occasionally misses tracking
      4, 3, 4, 5, 3,   // Structured Feedback: decent cadence, sometimes softens
      3, 3, 5, 4, 3,   // Active Management: accessible, occasionally reactive
      5, 2, 4, 5, 4,   // Recognition: strong people awareness, mostly strategic
      2, 4, 4, 5, 2,   // Tough Conversations: improving at directness
    ],
  },
  {
    name: "James Okafor",
    email: "james.o@brightpathfinancial.com",
    title: "Risk Assessment Director",
    pi: "Analyzer",
    // Strong accountability, middling supportiveness — leans command & control
    ratings: [
      5, 1, 3, 3, 5,  // Aligned Goals: crystal clear deadlines, weak on context
      5, 2, 3, 3, 1,   // Structured Feedback: structured and direct, moderate safety
      1, 1, 3, 3, 5,   // Active Management: very on top, somewhat accessible
      3, 3, 5, 3, 5,   // Recognition: strategic, could be warmer
      1, 5, 5, 3, 3,   // Tough Conversations: very fast, middling follow-through
    ],
  },
  {
    name: "Megan Calloway",
    email: "megan.c@brightpathfinancial.com",
    title: "Wealth Advisory Team Lead",
    pi: "Collaborator",
    // Solidly overly supportive — strong people, avoids hard conversations
    ratings: [
      3, 3, 5, 5, 2,  // Aligned Goals: great context, weak follow-through
      3, 3, 5, 5, 3,   // Structured Feedback: warm, avoids specifics
      3, 3, 5, 5, 2,   // Active Management: accessible, not proactive enough
      5, 1, 3, 5, 3,   // Recognition: very warm and personal, moderate strategy
      4, 3, 2, 5, 2,   // Tough Conversations: avoids confrontation, great aftercare
    ],
  },
  {
    name: "Derek Lawson",
    email: "derek.l@brightpathfinancial.com",
    title: "Operations Analyst Manager",
    pi: "Promoter",
    // Mixed/borderline — strong in some areas, weak in others
    ratings: [
      4, 3, 3, 3, 4,  // Aligned Goals: decent clarity, moderate purpose-connecting
      3, 3, 4, 3, 3,   // Structured Feedback: inconsistent cadence, moderate coaching
      3, 3, 4, 4, 3,   // Active Management: middling awareness, decent accessibility
      4, 3, 3, 3, 3,   // Recognition: modest effort, not terrible
      3, 4, 3, 4, 3,   // Tough Conversations: hesitant but follows up
    ],
  },
];

function calculateScores(ratings: number[]) {
  let accTotal = 0, accCount = 0;
  let supTotal = 0, supCount = 0;

  for (let i = 0; i < ratings.length; i++) {
    const [axis, reverse] = QUESTION_MAP[i];
    // For reverse questions: a rating of 5 ("I do this bad thing a lot") = effective score of 1
    const effectiveScore = reverse ? 6 - ratings[i] : ratings[i];

    if (axis === "accountability") {
      accTotal += effectiveScore;
      accCount++;
    } else {
      supTotal += effectiveScore;
      supCount++;
    }
  }

  const yScore = Math.round((accTotal / accCount) * 100) / 100;
  const xScore = Math.round((supTotal / supCount) * 100) / 100;

  let quadrant: string;
  if (yScore >= MIDPOINT && xScore >= MIDPOINT) quadrant = "intentional";
  else if (yScore >= MIDPOINT && xScore < MIDPOINT) quadrant = "command_control";
  else if (yScore < MIDPOINT && xScore >= MIDPOINT) quadrant = "overly_supportive";
  else quadrant = "absent";

  return { xScore, yScore, quadrant };
}

async function seed() {
  console.log("Creating BrightPath Financial demo...\n");

  // Create company
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .insert({
      name: "BrightPath Financial",
      industry: "Financial Services",
      employee_count_range: "251-500",
    })
    .select()
    .single();

  if (companyErr) {
    console.error("Company error:", companyErr);
    return;
  }
  console.log("Company created:", company.id);

  // Create assessment
  const { data: assessment, error: assessErr } = await supabase
    .from("manager_assessments")
    .insert({
      company_id: company.id,
      name: "ELITE5 Management Assessment",
      slug: "brightpath-financial",
      status: "active",
    })
    .select()
    .single();

  if (assessErr) {
    console.error("Assessment error:", assessErr);
    return;
  }
  console.log("Assessment created:", assessment.id);

  // Create each manager
  for (const mgr of MANAGERS) {
    const { xScore, yScore, quadrant } = calculateScores(mgr.ratings);

    // Create session
    const { data: session, error: sessErr } = await supabase
      .from("manager_sessions")
      .insert({
        assessment_id: assessment.id,
        respondent_name: mgr.name,
        respondent_email: mgr.email,
        respondent_title: mgr.title,
        pi_profile: mgr.pi,
        attempt_number: 1,
        status: "completed",
        quadrant,
        x_score: xScore,
        y_score: yScore,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessErr) {
      console.error(`Session error for ${mgr.name}:`, sessErr);
      continue;
    }

    // Insert responses (raw ratings — reverse scoring is applied at report time)
    const responses = [];
    let globalIdx = 0;
    for (const dim of DIMENSIONS) {
      for (let q = 0; q < 5; q++) {
        const qMapIdx = dim.startIdx + q;
        responses.push({
          session_id: session.id,
          dimension: dim.key,
          question_index: q,
          question_text: QUESTION_TEXTS[qMapIdx],
          rating: mgr.ratings[qMapIdx],
          axis: QUESTION_MAP[qMapIdx][0],
        });
        globalIdx++;
      }
    }

    const { error: respErr } = await supabase
      .from("manager_responses")
      .insert(responses);

    if (respErr) {
      console.error(`Responses error for ${mgr.name}:`, respErr);
      continue;
    }

    console.log(
      `  ${mgr.name.padEnd(22)} ${quadrant.padEnd(18)} S:${xScore}  A:${yScore}`
    );
  }

  console.log("\nDone! Go to /admin/assessments to see BrightPath Financial.");
}

seed();
