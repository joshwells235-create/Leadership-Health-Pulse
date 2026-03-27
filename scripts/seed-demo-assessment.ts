// Run: npx tsx scripts/seed-demo-assessment.ts
// Seeds a demo company with 7 completed manager assessments

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xmgdxjjimpofazxzwiti.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZ2R4amppbXBvZmF6eHp3aXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQ4MzUsImV4cCI6MjA5MDEzMDgzNX0.Lvo0O9bKBmgQp3qcT-nPbnE_-zaBvbCc0ykYsVTmRRA"
);

const MIDPOINT = 3.8;

// 7 managers with varied profiles to make an interesting scatter plot
const MANAGERS = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@northstarlogistics.com",
    title: "VP of Operations",
    pi: "Captain",
    // Strong on both axes = Intentional
    accScores: [5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5],
    supScores: [4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5],
  },
  {
    name: "Marcus Johnson",
    email: "marcus.j@northstarlogistics.com",
    title: "Warehouse Director",
    pi: "Promoter",
    // High accountability, low supportiveness = Command & Control
    accScores: [5, 4, 5, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5],
    supScores: [2, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2, 3],
  },
  {
    name: "Emily Rodriguez",
    email: "emily.r@northstarlogistics.com",
    title: "Customer Success Manager",
    pi: "Altruist",
    // Low accountability, high supportiveness = Overly Supportive
    accScores: [2, 3, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2],
    supScores: [5, 4, 5, 5, 4, 5, 4, 5, 5, 4, 5, 4],
  },
  {
    name: "David Park",
    email: "david.p@northstarlogistics.com",
    title: "IT Manager",
    pi: "Individualist",
    // Low on both = Absent
    accScores: [2, 3, 2, 2, 3, 2, 2, 3, 2, 2, 3, 2, 2],
    supScores: [2, 2, 3, 2, 2, 3, 2, 2, 3, 2, 2, 3],
  },
  {
    name: "Jessica Torres",
    email: "jessica.t@northstarlogistics.com",
    title: "Sales Team Lead",
    pi: "Persuader",
    // Middling on both, leaning command & control
    accScores: [4, 3, 4, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4],
    supScores: [3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2],
  },
  {
    name: "Ryan Mitchell",
    email: "ryan.m@northstarlogistics.com",
    title: "Production Supervisor",
    pi: "Controller",
    // Nearly intentional but slightly below on supportiveness
    accScores: [4, 5, 4, 4, 5, 4, 5, 4, 4, 5, 4, 5, 4],
    supScores: [3, 4, 3, 4, 3, 3, 4, 3, 4, 3, 3, 4],
  },
  {
    name: "Amanda Foster",
    email: "amanda.f@northstarlogistics.com",
    title: "HR Business Partner",
    pi: "Collaborator",
    // High supportiveness, middling accountability = Overly Supportive
    accScores: [3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 3],
    supScores: [5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 5, 4],
  },
];

// ELITE5 dimensions and their questions (must match manager-questions.ts)
const DIMENSIONS = [
  { key: "aligned_goals", axes: ["accountability", "accountability", "supportiveness", "supportiveness", "accountability"] },
  { key: "structured_feedback", axes: ["accountability", "accountability", "supportiveness", "supportiveness", "accountability"] },
  { key: "active_management", axes: ["accountability", "accountability", "supportiveness", "supportiveness", "accountability"] },
  { key: "recognition", axes: ["supportiveness", "supportiveness", "accountability", "supportiveness", "accountability"] },
  { key: "tough_conversations", axes: ["accountability", "accountability", "accountability", "supportiveness", "supportiveness"] },
];

const QUESTION_TEXTS = [
  // Aligned Goals
  "I set clear deadlines for my team and follow up when they're missed.",
  "When a goal is off track, I step in early rather than waiting to see if it corrects itself.",
  "I take time to connect each person's work to the team's larger purpose so they feel invested in the outcome.",
  "When priorities shift, I sit down with my team to talk through what's changing and why, rather than just reassigning work.",
  "If someone's deliverable doesn't meet the standard, I send it back rather than fixing it myself.",
  // Structured Feedback
  "I have a regular cadence for giving each team member direct feedback on their performance.",
  "When something isn't working, I name the exact behavior that needs to change rather than hinting at it.",
  "My team members feel comfortable telling me when they disagree with a decision I've made.",
  "I spend as much time coaching my team on what they're doing well as I do on what needs to improve.",
  "After giving feedback, I circle back to see whether the change actually happened.",
  // Active Management
  "At any given moment, I could tell you where each of my direct reports stands on their most important work.",
  "When I see early signs of a problem, I address it that day rather than putting it off.",
  "My team would say I'm easy to reach and genuinely interested when they bring me a problem.",
  "I hold consistent one-on-ones with each direct report and rarely cancel or reschedule them.",
  "I run my week with a consistent management routine rather than reacting to whatever comes up.",
  // Recognition
  "My team members would say they feel genuinely appreciated for their work, not just their results.",
  "I know what kind of recognition matters to each person on my team and I deliver it that way.",
  "When I recognize someone publicly, I tie it to a specific behavior or result I want the rest of the team to repeat.",
  "I make a point to acknowledge effort and persistence, especially on work that doesn't have a visible finish line.",
  "I'm deliberate about which wins I highlight because I know what gets recognized gets repeated.",
  // Tough Conversations
  "When someone on my team is consistently underperforming, I have the conversation within days, not weeks.",
  "If someone commits to something and doesn't deliver, I call it out directly.",
  "I'd rather have an uncomfortable ten-minute conversation today than let a problem grow for a month.",
  "Even in my toughest conversations, the other person walks away knowing I respect them and want them to succeed.",
  "After a difficult conversation, I check in within the week to see how the person is doing and whether they need support.",
];

async function seed() {
  console.log("Creating demo company...");

  // Create company
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .insert({
      name: "NorthStar Logistics",
      industry: "Logistics & Distribution",
      employee_count_range: "101-250",
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
      slug: "northstar-logistics",
      status: "active",
    })
    .select()
    .single();

  if (assessErr) {
    console.error("Assessment error:", assessErr);
    return;
  }
  console.log("Assessment created:", assessment.id);

  // Build flat list of axes
  const allAxes: string[] = [];
  for (const dim of DIMENSIONS) {
    allAxes.push(...dim.axes);
  }

  // Create each manager
  for (const mgr of MANAGERS) {
    // Build all 25 ratings from their acc/sup score arrays
    const allRatings: number[] = [];
    let accIdx = 0;
    let supIdx = 0;
    for (const axis of allAxes) {
      if (axis === "accountability") {
        allRatings.push(mgr.accScores[accIdx % mgr.accScores.length]);
        accIdx++;
      } else {
        allRatings.push(mgr.supScores[supIdx % mgr.supScores.length]);
        supIdx++;
      }
    }

    // Calculate scores
    const accRatings = allRatings.filter((_, i) => allAxes[i] === "accountability");
    const supRatings = allRatings.filter((_, i) => allAxes[i] === "supportiveness");
    const yScore = Math.round((accRatings.reduce((a, b) => a + b, 0) / accRatings.length) * 100) / 100;
    const xScore = Math.round((supRatings.reduce((a, b) => a + b, 0) / supRatings.length) * 100) / 100;

    let quadrant: string;
    if (yScore >= MIDPOINT && xScore >= MIDPOINT) quadrant = "intentional";
    else if (yScore >= MIDPOINT && xScore < MIDPOINT) quadrant = "command_control";
    else if (yScore < MIDPOINT && xScore >= MIDPOINT) quadrant = "overly_supportive";
    else quadrant = "absent";

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

    // Insert responses
    let qIdx = 0;
    const responses = [];
    for (let d = 0; d < DIMENSIONS.length; d++) {
      const dim = DIMENSIONS[d];
      for (let q = 0; q < dim.axes.length; q++) {
        responses.push({
          session_id: session.id,
          dimension: dim.key,
          question_index: q,
          question_text: QUESTION_TEXTS[qIdx],
          rating: allRatings[qIdx],
          axis: dim.axes[q],
        });
        qIdx++;
      }
    }

    const { error: respErr } = await supabase
      .from("manager_responses")
      .insert(responses);

    if (respErr) {
      console.error(`Responses error for ${mgr.name}:`, respErr);
      continue;
    }

    console.log(`${mgr.name}: ${quadrant} (S:${xScore} A:${yScore})`);
  }

  console.log("\nDone! Go to /admin/assessments to see NorthStar Logistics.");
}

seed();
