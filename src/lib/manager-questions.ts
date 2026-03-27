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
    description: "Setting clear expectations and aligning your team to objectives",
    questions: [
      {
        text: "I set specific, measurable goals for each member of my team.",
        axis: "accountability",
      },
      {
        text: "My team clearly understands what success looks like in their roles.",
        axis: "accountability",
      },
      {
        text: "I regularly check in to make sure my team's daily work connects to our larger objectives.",
        axis: "accountability",
      },
      {
        text: "I take time to explain the 'why' behind goals so my team feels ownership over the direction.",
        axis: "supportiveness",
      },
      {
        text: "When priorities shift, I communicate the change and help my team adjust quickly.",
        axis: "supportiveness",
      },
    ],
  },
  {
    key: "structured_feedback",
    name: "Structured Feedback",
    description: "Providing consistent, meaningful feedback to develop your people",
    questions: [
      {
        text: "I provide feedback to my team members on a regular, scheduled basis, not just when something goes wrong.",
        axis: "accountability",
      },
      {
        text: "When I give feedback, I reference specific behaviors and outcomes rather than general impressions.",
        axis: "accountability",
      },
      {
        text: "I follow up on feedback I've given to see if changes were made.",
        axis: "accountability",
      },
      {
        text: "I create a safe space for my team to give me feedback in return.",
        axis: "supportiveness",
      },
      {
        text: "I frame feedback as development, not criticism, so my team knows I'm invested in their growth.",
        axis: "supportiveness",
      },
    ],
  },
  {
    key: "active_management",
    name: "Active Management",
    description: "Being actively engaged in leading your team day-to-day",
    questions: [
      {
        text: "I have a consistent routine for how I manage my team each week.",
        axis: "accountability",
      },
      {
        text: "I know exactly where each of my direct reports stands on their key deliverables at any given time.",
        axis: "accountability",
      },
      {
        text: "When I see something going off track, I address it immediately rather than waiting.",
        axis: "accountability",
      },
      {
        text: "I make myself available and approachable so my team comes to me before problems escalate.",
        axis: "supportiveness",
      },
      {
        text: "I spend regular one-on-one time with each team member focused on their work and development.",
        axis: "supportiveness",
      },
    ],
  },
  {
    key: "recognition",
    name: "Recognition",
    description: "Acknowledging and reinforcing good work consistently",
    questions: [
      {
        text: "I tie recognition to specific results and behaviors that I want to see repeated.",
        axis: "accountability",
      },
      {
        text: "I recognize both outcomes and effort, depending on what the situation calls for.",
        axis: "supportiveness",
      },
      {
        text: "My team feels genuinely valued for their contributions.",
        axis: "supportiveness",
      },
      {
        text: "I recognize people in ways that are meaningful to them individually, not one-size-fits-all.",
        axis: "supportiveness",
      },
      {
        text: "I use recognition strategically to reinforce the standards and culture I want on my team.",
        axis: "accountability",
      },
    ],
  },
  {
    key: "tough_conversations",
    name: "Tough Conversations",
    description: "Addressing problems directly and holding people accountable",
    questions: [
      {
        text: "When someone on my team is underperforming, I address it directly rather than hoping it resolves itself.",
        axis: "accountability",
      },
      {
        text: "I hold people accountable to commitments they've made, even when it's uncomfortable.",
        axis: "accountability",
      },
      {
        text: "I don't avoid conflict. If something needs to be said, I say it.",
        axis: "accountability",
      },
      {
        text: "When I have a tough conversation, I lead with respect and make sure the person feels heard.",
        axis: "supportiveness",
      },
      {
        text: "After a difficult conversation, I follow up to support the person in making the needed changes.",
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
