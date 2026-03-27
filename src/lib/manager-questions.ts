// ELITE5 Manager Assessment - Question Definitions
// These are PLACEHOLDER questions until Steve finalizes his version.
// To update: just change the question text and axis mappings in this file.
// Everything else (survey UI, scoring, reports) adapts automatically.

export type Axis = "accountability" | "supportiveness";

export interface ManagerQuestion {
  text: string;
  axis: Axis;
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
        // Accountability: Do you set hard targets or leave things vague?
        text: "I set clear deadlines for my team and follow up when they're missed.",
        axis: "accountability",
      },
      {
        // Accountability: Do you track progress or trust it'll get done?
        text: "When a goal is off track, I step in early rather than waiting to see if it corrects itself.",
        axis: "accountability",
      },
      {
        // Supportiveness: Do you help your team understand the bigger picture?
        text: "I take time to connect each person's work to the team's larger purpose so they feel invested in the outcome.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Do you help people navigate change or just announce it?
        text: "When priorities shift, I sit down with my team to talk through what's changing and why, rather than just reassigning work.",
        axis: "supportiveness",
      },
      {
        // Accountability: Do you hold people to the standard or let things slide?
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
        // Accountability: Is feedback scheduled or reactive?
        text: "I have a regular cadence for giving each team member direct feedback on their performance.",
        axis: "accountability",
      },
      {
        // Accountability: Do you name the specific issue or dance around it?
        text: "When something isn't working, I name the exact behavior that needs to change rather than hinting at it.",
        axis: "accountability",
      },
      {
        // Supportiveness: Do you make it safe for people to be honest with you?
        text: "My team members feel comfortable telling me when they disagree with a decision I've made.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Do you invest in growth or just correct mistakes?
        text: "I spend as much time coaching my team on what they're doing well as I do on what needs to improve.",
        axis: "supportiveness",
      },
      {
        // Accountability: Do you check if feedback actually changed anything?
        text: "After giving feedback, I circle back to see whether the change actually happened.",
        axis: "accountability",
      },
    ],
  },
  {
    key: "active_management",
    name: "Active Management",
    description: "How present and engaged you are in the day-to-day work of your team",
    questions: [
      {
        // Accountability: Are you on top of what's happening or flying blind?
        text: "At any given moment, I could tell you where each of my direct reports stands on their most important work.",
        axis: "accountability",
      },
      {
        // Accountability: Do you intervene fast or let problems fester?
        text: "When I see early signs of a problem, I address it that day rather than putting it off.",
        axis: "accountability",
      },
      {
        // Supportiveness: Are you accessible or behind a closed door?
        text: "My team would say I'm easy to reach and genuinely interested when they bring me a problem.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Do you invest time in each person individually?
        text: "I hold consistent one-on-ones with each direct report and rarely cancel or reschedule them.",
        axis: "supportiveness",
      },
      {
        // Accountability: Do you have a system or wing it?
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
        // Supportiveness: Do people feel seen by you?
        text: "My team members would say they feel genuinely appreciated for their work, not just their results.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Do you tailor how you recognize people?
        text: "I know what kind of recognition matters to each person on my team and I deliver it that way.",
        axis: "supportiveness",
      },
      {
        // Accountability: Do you use recognition to reinforce standards?
        text: "When I recognize someone publicly, I tie it to a specific behavior or result I want the rest of the team to repeat.",
        axis: "accountability",
      },
      {
        // Supportiveness: Do you acknowledge the grind or just the wins?
        text: "I make a point to acknowledge effort and persistence, especially on work that doesn't have a visible finish line.",
        axis: "supportiveness",
      },
      {
        // Accountability: Are you intentional about what you celebrate?
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
        // Accountability: Do you confront underperformance or avoid it?
        text: "When someone on my team is consistently underperforming, I have the conversation within days, not weeks.",
        axis: "accountability",
      },
      {
        // Accountability: Do you hold people to what they said they'd do?
        text: "If someone commits to something and doesn't deliver, I call it out directly.",
        axis: "accountability",
      },
      {
        // Accountability: Do you address tension or let it build?
        text: "I'd rather have an uncomfortable ten-minute conversation today than let a problem grow for a month.",
        axis: "accountability",
      },
      {
        // Supportiveness: Can you be direct without being destructive?
        text: "Even in my toughest conversations, the other person walks away knowing I respect them and want them to succeed.",
        axis: "supportiveness",
      },
      {
        // Supportiveness: Do you follow through after a hard conversation?
        text: "After a difficult conversation, I check in within the week to see how the person is doing and whether they need support.",
        axis: "supportiveness",
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
