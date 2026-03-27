// ELITE5 Manager Assessment - Question Definitions
// These are PLACEHOLDER questions until Steve finalizes his version.
// To update: just change the question text and axis mappings in this file.
// Everything else (survey UI, scoring, reports) adapts automatically.

export type Axis = "accountability" | "supportiveness";

export interface ManagerQuestion {
  text: string;
  axis: Axis;
  reverse?: boolean; // If true, scoring is inverted (6 - rating). Used for
  // questions phrased as common failure modes where agreeing = lower score.
}

export interface Elite5Dimension {
  key: string;
  name: string;
  description: string;
  questions: ManagerQuestion[];
}

export const ELITE5_DIMENSIONS: Elite5Dimension[] = [
  {
    key: "aligned_goals",
    name: "Aligned Goals",
    description: "How you set direction and hold the line on expectations",
    questions: [
      {
        // Accountability: "Team would say" reframe — forces outside-in perspective
        text: "My team would say they always know exactly what's expected of them and by when.",
        axis: "accountability",
      },
      {
        // Accountability: Reverse-scored failure mode — easier to admit a mild version
        text: "I sometimes discover a goal is off track later than I should have.",
        axis: "accountability",
        reverse: true,
      },
      {
        // Supportiveness: "Team would say" reframe
        text: "My team would say they understand how their work connects to what the organization is trying to achieve.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Behavioral anchor with scenario framing
        text: "When priorities shift, I sit down with my team to talk through what's changing and why, rather than just reassigning work.",
        axis: "supportiveness",
      },
      {
        // Accountability: Scenario-based forced choice framing
        text: "If someone's deliverable doesn't meet the standard, I send it back rather than fixing it myself.",
        axis: "accountability",
      },
    ],
  },
  {
    key: "structured_feedback",
    name: "Structured Feedback",
    description: "How consistently and directly you develop your people through feedback",
    questions: [
      {
        // Accountability: "Team would say" reframe — the team knows if feedback is regular
        text: "My team members would say they receive consistent, scheduled feedback from me — not just when something goes wrong.",
        axis: "accountability",
      },
      {
        // Accountability: Reverse-scored — most managers soften without realizing it
        text: "I sometimes catch myself hinting at a problem rather than naming the specific behavior that needs to change.",
        axis: "accountability",
        reverse: true,
      },
      {
        // Supportiveness: "Team would say" — they know if it's safe better than you do
        text: "My team members would say they can push back on my decisions without it affecting how I treat them.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Behavioral anchor
        text: "I spend as much time coaching my team on what they're doing well as I do on what needs to improve.",
        axis: "supportiveness",
      },
      {
        // Accountability: Reverse-scored — easy to forget to close the loop
        text: "I've given feedback and then realized weeks later I never checked whether anything actually changed.",
        axis: "accountability",
        reverse: true,
      },
    ],
  },
  {
    key: "active_management",
    name: "Active Management",
    description: "How present and engaged you are in the day-to-day work of your team",
    questions: [
      {
        // Accountability: Reverse-scored — honest version of "I know what's going on"
        text: "I'm sometimes surprised to learn that a direct report has been stuck or struggling without my knowledge.",
        axis: "accountability",
        reverse: true,
      },
      {
        // Accountability: Reverse-scored — most managers delay
        text: "When I notice an early warning sign, I sometimes wait a few days to see if it resolves on its own before stepping in.",
        axis: "accountability",
        reverse: true,
      },
      {
        // Supportiveness: "Team would say" — accessibility is felt by others, not self-assessed
        text: "My team would say I'm easy to reach and genuinely interested when they bring me a problem.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Behavioral anchor with specificity
        text: "I hold consistent one-on-ones with each direct report and rarely cancel or reschedule them.",
        axis: "supportiveness",
      },
      {
        // Accountability: Behavioral anchor — system vs. reactive
        text: "I run my week with a consistent management routine rather than reacting to whatever comes up.",
        axis: "accountability",
      },
    ],
  },
  {
    key: "recognition",
    name: "Recognition",
    description: "How you acknowledge effort and reinforce the behaviors you want to see",
    questions: [
      {
        // Supportiveness: "Team would say" — the team knows if they feel appreciated
        text: "My team members would say they feel genuinely appreciated for their work, not just their results.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Reverse-scored — most managers don't personalize
        text: "If I'm honest, I probably recognize most people on my team in roughly the same way rather than tailoring it to each person.",
        axis: "supportiveness",
        reverse: true,
      },
      {
        // Accountability: Behavioral anchor — strategic recognition
        text: "When I recognize someone publicly, I tie it to a specific behavior or result I want the rest of the team to repeat.",
        axis: "accountability",
      },
      {
        // Supportiveness: "Team would say" — grind recognition
        text: "My team would say I notice and acknowledge their effort on ongoing work, not just finished projects with visible outcomes.",
        axis: "supportiveness",
      },
      {
        // Accountability: Behavioral anchor — intentional about what gets celebrated
        text: "I'm deliberate about which wins I highlight because I know what gets recognized gets repeated.",
        axis: "accountability",
      },
    ],
  },
  {
    key: "tough_conversations",
    name: "Tough Conversations",
    description: "Your willingness to address problems head-on and hold people to their commitments",
    questions: [
      {
        // Accountability: Reverse-scored — easier to admit "sometimes" than deny "always"
        text: "I've let a performance issue go on longer than I should have because I was hoping it would improve on its own.",
        axis: "accountability",
        reverse: true,
      },
      {
        // Accountability: Behavioral anchor
        text: "If someone commits to something and doesn't deliver, I call it out directly.",
        axis: "accountability",
      },
      {
        // Accountability: Scenario-based
        text: "I'd rather have an uncomfortable ten-minute conversation today than let a problem grow for a month.",
        axis: "accountability",
      },
      {
        // Supportiveness: "Team would say" — they know if respect survived the conversation
        text: "My team would say that even after a tough conversation with me, they walk away feeling respected and supported.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Reverse-scored — easy to forget follow-up
        text: "After a difficult conversation, I sometimes get pulled into other things and don't check back in as soon as I should.",
        axis: "supportiveness",
        reverse: true,
      },
    ],
  },
];

// Flat list of all questions with dimension context (used by survey UI)
export function getAllQuestions() {
  return ELITE5_DIMENSIONS.flatMap((dim) =>
    dim.questions.map((q, index) => ({
      ...q,
      dimension: dim.key,
      dimensionName: dim.name,
      questionIndex: index,
    }))
  );
}

// Get total question count
export function getTotalQuestions() {
  return ELITE5_DIMENSIONS.reduce((sum, dim) => sum + dim.questions.length, 0);
}
