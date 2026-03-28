// Run: npx tsx scripts/seed-msa-demo.ts
// Seeds BrightPath Financial with 8 managers using the new MSA scenario-based format.
// Also re-creates the company since old data was wiped.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xmgdxjjimpofazxzwiti.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZ2R4amppbXBvZmF6eHp3aXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQ4MzUsImV4cCI6MjA5MDEzMDgzNX0.Lvo0O9bKBmgQp3qcT-nPbnE_-zaBvbCc0ykYsVTmRRA"
);

// Quadrant tags for each response: IL=Intentional, CC=Command&Control, OS=Overly Supportive, DA=Disengaged
type QTag = "IL" | "CC" | "OS" | "DA";

const SCORE_MAP: Record<QTag, { a: 1 | 2; c: 1 | 2 }> = {
  IL: { a: 2, c: 2 },
  CC: { a: 2, c: 1 },
  OS: { a: 1, c: 2 },
  DA: { a: 1, c: 1 },
};

// Scenario question texts (first line of each scenario)
const SCENARIO_TEXTS = [
  "One of your direct reports has been in their role for three months...",
  "Your team has been informed of a significant shift in company priorities...",
  "During a routine check in you notice that one of your stronger performers has slipped...",
  "You set goals with each of your team members at the start of the quarter...",
  "A team member you manage has been asking for more guidance and support lately...",
  "You have a one on one scheduled with a team member later today...",
  "You are midway through a check in with a team member and realize the conversation has been status updates...",
  "You had a conversation with a team member two weeks ago about two specific actions...",
  "One of your team members has seemed less engaged than usual over the past two weeks...",
  "It has been an unusually demanding week and you realize on Thursday afternoon...",
  "A team member comes to you with a problem they are stuck on...",
  "You have given a team member clear direction on a project but they took a different approach...",
  "A team member has gone significantly above and beyond over the past few weeks...",
  "You have a team member who consistently performs well but rarely receives recognition...",
  "You have just learned that a team member prefers not to be recognized publicly...",
  "Your team has had a strong month and collectively hit a significant milestone...",
  "A team member's performance has been below standard for several weeks...",
  "You need to deliver feedback to a team member about a behavior affecting the team...",
  "You have had a tough conversation with a team member about their performance...",
  "A team member has pushed back strongly on feedback you delivered...",
];

const DIMENSIONS = [
  { key: "aligned_goals", scenarios: [0, 1, 2, 3] },
  { key: "structured_feedback", scenarios: [4, 5, 6, 7] },
  { key: "active_management", scenarios: [8, 9, 10, 11] },
  { key: "recognition", scenarios: [12, 13, 14, 15] },
  { key: "tough_conversations", scenarios: [16, 17, 18, 19] },
];

// 8 managers with varied response patterns (20 responses each)
const MANAGERS: {
  name: string;
  email: string;
  title: string;
  pi: string;
  directReports: number;
  teamType: "in_person" | "hybrid" | "remote";
  oneOnOneFreq: "weekly_biweekly" | "monthly" | "occasional" | "never";
  responses: QTag[];
}[] = [
  {
    name: "Danielle Reeves",
    email: "danielle.r@brightpathfinancial.com",
    title: "Chief Operating Officer",
    pi: "Captain",
    directReports: 6,
    teamType: "hybrid",
    oneOnOneFreq: "weekly_biweekly",
    // Strong Intentional leader — mostly IL picks
    responses: ["IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL", "IL"],
  },
  {
    name: "Kevin Hartwell",
    email: "kevin.h@brightpathfinancial.com",
    title: "VP of Compliance",
    pi: "Controller",
    directReports: 8,
    teamType: "in_person",
    oneOnOneFreq: "weekly_biweekly",
    // Command & Control — high accountability, low connection
    responses: ["CC", "CC", "CC", "CC", "CC", "CC", "CC", "CC", "CC", "CC", "CC", "CC", "CC", "IL", "CC", "CC", "CC", "CC", "CC", "CC"],
  },
  {
    name: "Priya Sharma",
    email: "priya.s@brightpathfinancial.com",
    title: "Client Relations Director",
    pi: "Altruist",
    directReports: 5,
    teamType: "hybrid",
    oneOnOneFreq: "monthly",
    // Overly Supportive — high connection, low accountability
    responses: ["OS", "OS", "IL", "OS", "OS", "OS", "OS", "OS", "OS", "OS", "OS", "OS", "OS", "OS", "IL", "OS", "OS", "OS", "OS", "OS"],
  },
  {
    name: "Tom Nguyen",
    email: "tom.n@brightpathfinancial.com",
    title: "IT Infrastructure Manager",
    pi: "Individualist",
    directReports: 4,
    teamType: "remote",
    oneOnOneFreq: "occasional",
    // Disengaged — low on both axes
    responses: ["DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA", "DA"],
  },
  {
    name: "Rachel Kim",
    email: "rachel.k@brightpathfinancial.com",
    title: "Marketing Lead",
    pi: "Persuader",
    directReports: 7,
    teamType: "hybrid",
    oneOnOneFreq: "weekly_biweekly",
    // Near intentional, a few OS pulls
    responses: ["IL", "IL", "IL", "OS", "IL", "IL", "IL", "OS", "IL", "IL", "IL", "IL", "IL", "OS", "IL", "IL", "IL", "IL", "OS", "IL"],
  },
  {
    name: "James Okafor",
    email: "james.o@brightpathfinancial.com",
    title: "Risk Assessment Director",
    pi: "Analyzer",
    directReports: 10,
    teamType: "in_person",
    oneOnOneFreq: "monthly",
    // Leans CC with some IL
    responses: ["CC", "IL", "CC", "CC", "IL", "CC", "CC", "IL", "CC", "CC", "CC", "IL", "CC", "CC", "IL", "CC", "CC", "IL", "CC", "CC"],
  },
  {
    name: "Megan Calloway",
    email: "megan.c@brightpathfinancial.com",
    title: "Wealth Advisory Team Lead",
    pi: "Collaborator",
    directReports: 6,
    teamType: "in_person",
    oneOnOneFreq: "weekly_biweekly",
    // OS leaning with some IL
    responses: ["OS", "IL", "OS", "OS", "IL", "OS", "IL", "OS", "OS", "IL", "OS", "OS", "IL", "OS", "IL", "OS", "OS", "IL", "OS", "OS"],
  },
  {
    name: "Derek Lawson",
    email: "derek.l@brightpathfinancial.com",
    title: "Operations Analyst Manager",
    pi: "Promoter",
    directReports: 5,
    teamType: "hybrid",
    oneOnOneFreq: "occasional",
    // Mixed — some DA, some CC, some IL
    responses: ["IL", "DA", "CC", "DA", "IL", "DA", "CC", "IL", "DA", "CC", "IL", "DA", "CC", "IL", "DA", "CC", "IL", "DA", "CC", "DA"],
  },
];

async function seed() {
  console.log("Creating BrightPath Financial (MSA format)...\n");

  // Check if BrightPath already exists (from CEO survey)
  const { data: existingCompanies } = await supabase
    .from("companies")
    .select("id")
    .eq("name", "BrightPath Financial");

  let companyId: string;
  if (existingCompanies && existingCompanies.length > 0) {
    companyId = existingCompanies[0].id;
    console.log("Found existing company:", companyId);
  } else {
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
    companyId = company.id;
    console.log("Created company:", companyId);
  }

  // Create assessment
  const { data: assessment, error: assessErr } = await supabase
    .from("manager_assessments")
    .insert({
      company_id: companyId,
      name: "Manager Skills Assessment",
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

  for (const mgr of MANAGERS) {
    // Calculate scores
    let totalA = 0;
    let totalC = 0;
    for (const tag of mgr.responses) {
      totalA += SCORE_MAP[tag].a;
      totalC += SCORE_MAP[tag].c;
    }

    let quadrant: string;
    if (totalA > 30 && totalC > 30) quadrant = "intentional";
    else if (totalA > 30 && totalC <= 30) quadrant = "command_control";
    else if (totalA <= 30 && totalC > 30) quadrant = "overly_supportive";
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
        x_score: totalC, // x = Support & Connection
        y_score: totalA, // y = Accountability & Structure
        direct_reports: mgr.directReports,
        team_type: mgr.teamType,
        one_on_one_frequency: mgr.oneOnOneFreq,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessErr) {
      console.error(`Session error for ${mgr.name}:`, sessErr);
      continue;
    }

    // Insert responses
    const responseRows = [];
    for (let i = 0; i < 20; i++) {
      const tag = mgr.responses[i];
      const scores = SCORE_MAP[tag];
      const dim = DIMENSIONS.find((d) => d.scenarios.includes(i))!;
      const qIdx = dim.scenarios.indexOf(i);

      responseRows.push({
        session_id: session.id,
        dimension: dim.key,
        question_index: qIdx,
        question_text: SCENARIO_TEXTS[i],
        quadrant_tag: tag,
        a_score: scores.a,
        c_score: scores.c,
        display_order: [0, 1, 2, 3], // default order for seed data
      });
    }

    const { error: respErr } = await supabase
      .from("manager_responses")
      .insert(responseRows);

    if (respErr) {
      console.error(`Responses error for ${mgr.name}:`, respErr);
      continue;
    }

    console.log(
      `  ${mgr.name.padEnd(22)} ${quadrant.padEnd(18)} A:${totalA}  C:${totalC}`
    );
  }

  console.log("\nDone! View at /admin");
}

seed();
