// Source of truth: leadership-health-pulse-questions.md
// Each tier has 5 dimensions, each dimension has 3-4 rating questions and 1 open-ended prompt.

export type Tier = "slt" | "middle" | "frontline" | "hybrid";
export type Dimension =
  | "trust"
  | "dialogue"
  | "ownership"
  | "capability"
  | "alignment";

export interface RatingQuestion {
  text: string;
}

export interface DimensionData {
  label: string;
  ratingQuestions: RatingQuestion[];
  openEndedPrompt: string;
}

export interface TierData {
  key: Tier;
  label: string;
  introText: string;
  dimensions: Record<Dimension, DimensionData>;
}

const DIMENSIONS_ORDER: Dimension[] = [
  "trust",
  "dialogue",
  "ownership",
  "capability",
  "alignment",
];

export { DIMENSIONS_ORDER };

// ============================================
// TIER 1: SENIOR LEADERSHIP TEAM
// ============================================
const SLT_TIER: TierData = {
  key: "slt",
  label: "Senior Leadership Team",
  introText:
    "Think about the group of leaders who report directly to you. Answer these questions based on how this group actually operates today, not how you wish they operated.",
  dimensions: {
    trust: {
      label: "Trust and Cohesion",
      ratingQuestions: [
        {
          text: "My senior leaders are genuinely open with each other about their mistakes and limitations.",
        },
        {
          text: "When one senior leader is struggling, others step in to help without being asked.",
        },
        {
          text: "My senior leaders give each other the benefit of the doubt rather than assuming negative intent.",
        },
        {
          text: "My senior leaders operate as a true team, not as representatives of their individual departments.",
        },
      ],
      openEndedPrompt:
        "When your senior leaders disagree behind closed doors, what typically happens next?",
    },
    dialogue: {
      label: "Honest Dialogue",
      ratingQuestions: [
        {
          text: "My senior leaders will challenge each other directly in meetings rather than complaining privately afterward.",
        },
        {
          text: "When someone on the senior team has a concern about another leader's area, they raise it openly.",
        },
        {
          text: "My senior leaders can have heated debates and walk out of the room with no lasting damage to the relationship.",
        },
        {
          text: "I am not the only person on the senior team willing to name the elephant in the room.",
        },
      ],
      openEndedPrompt:
        "Think of the last time something went wrong in the business. How did your senior team talk about it?",
    },
    ownership: {
      label: "Ownership and Follow-Through",
      ratingQuestions: [
        {
          text: "When my senior leaders commit to a decision as a group, they follow through on it even if they personally disagreed.",
        },
        {
          text: "My senior leaders hold each other accountable without waiting for me to do it.",
        },
        {
          text: "Strategic initiatives at this level move forward consistently without needing me to push them along.",
        },
      ],
      openEndedPrompt:
        "When a strategic initiative stalls, who notices first, and what happens?",
    },
    capability: {
      label: "Capability and Growth",
      ratingQuestions: [
        {
          text: "My senior leaders have the skills and judgment needed for where this company is heading, not just where it has been.",
        },
        {
          text: "My senior leaders actively invest in their own development without being prompted.",
        },
        {
          text: "I am confident that each person on my senior team is in the right role for the next phase of the business.",
        },
        {
          text: "If I had to rebuild this senior team from scratch today, I would rehire most of them.",
        },
      ],
      openEndedPrompt:
        "Which of your senior leaders would you bet on for the next stage of the company's growth, and which ones give you pause?",
    },
    alignment: {
      label: "Alignment and Clarity",
      ratingQuestions: [
        {
          text: "If I asked each senior leader to independently name our top three priorities, they would give the same answer.",
        },
        {
          text: "My senior leaders make decisions in their own areas that are consistent with our overall strategy.",
        },
        {
          text: "When priorities shift, my senior team understands the \"why\" behind the change, not just the \"what.\"",
        },
      ],
      openEndedPrompt:
        "How confident are you that your senior leaders are telling the same story about where this company is going?",
    },
  },
};

// ============================================
// TIER 2: MIDDLE MANAGEMENT
// ============================================
const MIDDLE_TIER: TierData = {
  key: "middle",
  label: "Middle Management",
  introText:
    "Think about your middle management layer: department heads, directors, senior managers. The people between your senior leaders and the front line. Answer based on how this group operates as a whole, not just the best or worst among them.",
  dimensions: {
    trust: {
      label: "Trust and Cohesion",
      ratingQuestions: [
        {
          text: "My middle managers trust each other enough to share resources, information, and credit across departments.",
        },
        {
          text: "My middle managers see themselves as part of a leadership community, not just as heads of their own areas.",
        },
        {
          text: "When a middle manager is underperforming, their peers will address it or flag it rather than work around them.",
        },
      ],
      openEndedPrompt:
        "If two of your middle managers had a conflict about resources or priorities, would they resolve it directly or escalate it to someone above them?",
    },
    dialogue: {
      label: "Honest Dialogue",
      ratingQuestions: [
        {
          text: "My middle managers will push back on senior leadership when they believe a decision is wrong.",
        },
        {
          text: "My middle managers communicate difficult news upward in a timely way rather than waiting until it becomes a crisis.",
        },
        {
          text: "There is not a meaningful gap between what my middle managers say in meetings and what they say in the hallway afterward.",
        },
        {
          text: "My middle managers are comfortable raising concerns about peers or processes without fear of political consequences.",
        },
      ],
      openEndedPrompt:
        "Is there anything your middle managers are thinking but not saying to senior leadership?",
    },
    ownership: {
      label: "Ownership and Follow-Through",
      ratingQuestions: [
        {
          text: "My middle managers drive execution independently rather than waiting for detailed direction from above.",
        },
        {
          text: "My middle managers take ownership of problems that cross departmental boundaries rather than passing them up or sideways.",
        },
        {
          text: "When something falls through the cracks at this level, middle managers own the miss rather than blaming circumstances or other teams.",
        },
      ],
      openEndedPrompt:
        "Do your middle managers drive execution independently, or do they wait for direction from the top?",
    },
    capability: {
      label: "Capability and Growth",
      ratingQuestions: [
        {
          text: "My middle managers were promoted into their roles because of their leadership potential, not just their technical skill.",
        },
        {
          text: "My middle managers are effective at developing and coaching the people who report to them.",
        },
        {
          text: "My middle managers can think strategically about their areas, not just manage the day-to-day operations.",
        },
        {
          text: "The biggest capability gap at this level is one I am actively working to close.",
        },
      ],
      openEndedPrompt:
        "Are your middle managers in their roles because they grew into them or because they were the best individual contributors?",
    },
    alignment: {
      label: "Alignment and Clarity",
      ratingQuestions: [
        {
          text: "My middle managers can clearly articulate the company's strategy and how their area connects to it.",
        },
        {
          text: "My middle managers receive consistent, structured communication about company direction, not just what filters down informally.",
        },
        {
          text: "When priorities change at the top, my middle managers can translate that shift to their teams quickly and accurately.",
        },
      ],
      openEndedPrompt:
        "How do your middle managers learn about changes in company direction: from a structured process or through the grapevine?",
    },
  },
};

// ============================================
// TIER 3: FRONTLINE MANAGEMENT
// ============================================
const FRONTLINE_TIER: TierData = {
  key: "frontline",
  label: "Frontline Management",
  introText:
    "Think about your frontline managers: team leads, supervisors, first-time managers. The people closest to the actual work and the actual workforce. If you don't have direct visibility into how this group operates, that itself is useful information. Answer as honestly as you can.",
  dimensions: {
    trust: {
      label: "Trust and Cohesion",
      ratingQuestions: [
        {
          text: "My frontline managers see themselves as part of the broader leadership team, not as a separate, lower tier.",
        },
        {
          text: "My frontline managers trust that the organization has their back when they make difficult decisions.",
        },
        {
          text: "My frontline managers collaborate across teams rather than operating in silos.",
        },
      ],
      openEndedPrompt:
        "Do your frontline managers see themselves as part of the leadership team, or as a separate tier? What makes you say that?",
    },
    dialogue: {
      label: "Honest Dialogue",
      ratingQuestions: [
        {
          text: "My frontline managers feel safe raising problems or concerns to their own managers without fear of being labeled as negative.",
        },
        {
          text: "My frontline managers can have direct performance conversations with their team members rather than avoiding them.",
        },
        {
          text: "My frontline managers receive honest, actionable feedback from the leaders above them on a regular basis.",
        },
      ],
      openEndedPrompt:
        "How would your frontline managers describe the quality of communication they receive from above?",
    },
    ownership: {
      label: "Ownership and Follow-Through",
      ratingQuestions: [
        {
          text: "My frontline managers take initiative to solve problems within their scope rather than escalating everything.",
        },
        {
          text: "My frontline managers follow through on commitments to their teams consistently.",
        },
        {
          text: "If a frontline manager saw a problem that crossed into another team's territory, they would flag it rather than staying in their lane.",
        },
        {
          text: "My frontline managers treat the business's goals as their own, not as mandates handed down from above.",
        },
      ],
      openEndedPrompt:
        "When something goes wrong at the front line, does it get resolved there, or does it travel up two levels before anyone acts on it?",
    },
    capability: {
      label: "Capability and Growth",
      ratingQuestions: [
        {
          text: "My frontline managers have received meaningful training in how to actually manage people, not just how to do the work.",
        },
        {
          text: "My frontline managers know how to have difficult conversations, give feedback, and coach their direct reports.",
        },
        {
          text: "I am confident that my frontline managers can retain and develop talent on their teams.",
        },
      ],
      openEndedPrompt:
        "How much training or development have your frontline managers received in actually managing people?",
    },
    alignment: {
      label: "Alignment and Clarity",
      ratingQuestions: [
        {
          text: "My frontline managers understand why the company's current priorities matter, not just what the priorities are.",
        },
        {
          text: "My frontline managers can connect the daily work of their teams to the bigger picture of the organization.",
        },
        {
          text: "My frontline managers are equipped to answer questions from their teams about where the company is heading.",
        },
      ],
      openEndedPrompt:
        "Could your frontline managers explain why the company's current priorities matter, or would they just repeat what they've been told?",
    },
  },
};

// ============================================
// HYBRID TIER (for 2-tier organizations)
// Draws the most diagnostically useful questions from Middle and Frontline tiers.
// ============================================
const HYBRID_TIER: TierData = {
  key: "hybrid",
  label: "Your Managers",
  introText:
    "Think about the managers who report to your leadership team — the people who both translate strategy from above and manage the people doing the day-to-day work. Answer based on how this group operates as a whole.",
  dimensions: {
    trust: {
      label: "Trust and Cohesion",
      ratingQuestions: [
        {
          text: "My managers trust each other enough to share resources, information, and credit across departments.",
        },
        {
          text: "My managers see themselves as part of the broader leadership team, not as a separate, lower tier.",
        },
        {
          text: "My managers collaborate across teams rather than operating in silos.",
        },
      ],
      openEndedPrompt:
        "If two of your managers had a conflict about resources or priorities, would they resolve it directly or escalate it to someone above them?",
    },
    dialogue: {
      label: "Honest Dialogue",
      ratingQuestions: [
        {
          text: "My managers will push back on senior leadership when they believe a decision is wrong.",
        },
        {
          text: "My managers communicate difficult news upward in a timely way rather than waiting until it becomes a crisis.",
        },
        {
          text: "My managers can have direct performance conversations with their team members rather than avoiding them.",
        },
      ],
      openEndedPrompt:
        "Is there anything your managers are thinking but not saying to senior leadership?",
    },
    ownership: {
      label: "Ownership and Follow-Through",
      ratingQuestions: [
        {
          text: "My managers drive execution independently rather than waiting for detailed direction from above.",
        },
        {
          text: "My managers take ownership of problems that cross departmental boundaries rather than passing them up or sideways.",
        },
        {
          text: "My managers follow through on commitments to their teams consistently.",
        },
      ],
      openEndedPrompt:
        "Do your managers drive execution independently, or do they wait for direction from the top?",
    },
    capability: {
      label: "Capability and Growth",
      ratingQuestions: [
        {
          text: "My managers were promoted into their roles because of their leadership potential, not just their technical skill.",
        },
        {
          text: "My managers are effective at developing and coaching the people who report to them.",
        },
        {
          text: "My managers have received meaningful training in how to actually manage people, not just how to do the work.",
        },
      ],
      openEndedPrompt:
        "Are your managers in their roles because they grew into them or because they were the best individual contributors?",
    },
    alignment: {
      label: "Alignment and Clarity",
      ratingQuestions: [
        {
          text: "My managers can clearly articulate the company's strategy and how their area connects to it.",
        },
        {
          text: "My managers can connect the daily work of their teams to the bigger picture of the organization.",
        },
        {
          text: "When priorities change at the top, my managers can translate that shift to their teams quickly and accurately.",
        },
      ],
      openEndedPrompt:
        "How do your managers learn about changes in company direction: from a structured process or through the grapevine?",
    },
  },
};

// ============================================
// CAPSTONE QUESTIONS
// ============================================
export const CAPSTONE_QUESTIONS = [
  "If you could fix one leadership problem overnight, which tier and which issue would you choose?",
  "What's the leadership challenge you've been putting off the longest?",
];

// ============================================
// Helper to get the tiers for a survey path
// ============================================
export function getTiersForPath(surveyPath: "two_tier" | "three_tier"): TierData[] {
  if (surveyPath === "three_tier") {
    return [SLT_TIER, MIDDLE_TIER, FRONTLINE_TIER];
  }
  return [SLT_TIER, HYBRID_TIER];
}

export { SLT_TIER, MIDDLE_TIER, FRONTLINE_TIER, HYBRID_TIER };
