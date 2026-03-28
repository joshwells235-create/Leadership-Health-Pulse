// Manager Skills Assessment™ — Scenario-Based Question Definitions
// Source: Steve's MSA instrument (March 2026)
// 20 scenarios across 5 ELITE5 dimensions, 4 response options each.
// Each option maps to a quadrant and carries binary A/C scores.

export type QuadrantTag = "IL" | "CC" | "OS" | "DA";

export interface ScenarioOption {
  text: string;
  quadrant: QuadrantTag;
  a_score: 1 | 2;
  c_score: 1 | 2;
}

export interface Scenario {
  id: number; // 1-20
  situation: string;
  options: ScenarioOption[];
}

export interface MSADimension {
  key: string;
  name: string;
  scenarios: Scenario[];
}

export const MSA_DIMENSIONS: MSADimension[] = [
  {
    key: "aligned_goals",
    name: "Aligned Goals",
    scenarios: [
      {
        id: 1,
        situation:
          "One of your direct reports has been in their role for three months and is working hard but consistently missing their targets. You have not yet addressed the performance gap with them directly.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Sit down with them, clearly outline the specific targets they need to hit, walk through the timeline you expect them to meet, and make sure they leave the conversation with no ambiguity about what is required.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Schedule a dedicated meeting to sit down together, define what success looks like in their role, and make sure you both leave the conversation clear on the path forward.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Check in to ask how they are feeling about the role, explore what they find most challenging, and encourage them to identify what they most want to focus on — you want them to have a say in where they focus rather than receiving a list of targets.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Give it a bit more time and keep an eye on how things develop — most people figure out what is expected once they get more comfortable and confident in the role and find their footing.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
        ],
      },
      {
        id: 2,
        situation:
          "Your team has been informed of a significant shift in company priorities that will affect everyone's goals for the quarter. You have not yet informed your people about what this means for their specific targets.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Meet individually with each team member to reset their goals, clarify new expectations, and make sure they understand how the change affects their specific role and priorities.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Trust that the team has absorbed the new direction from the company communication and will recalibrate their focus accordingly — they are experienced enough to recalibrate without needing each change walked through individually.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Send a clear and direct communication to the team that outlines the new priorities, updates the performance expectations, and gives everyone what they need to move forward quickly and efficiently.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Check in with the team as a group to acknowledge that the change is significant, create space for them to share their reactions, invite their input on how to move forward, and give them room to adjust before the next check in.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
        ],
      },
      {
        id: 3,
        situation:
          "During a routine check in you notice that one of your stronger performers has slipped behind on a goal they were previously tracking well against. They have not raised it with you and appear to be business as usual.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Wait for them to raise it — they are one of your strongest people and you want to give them the chance to address it before you step in.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Make a mental note to keep an eye on it over the next few weeks and track whether the pattern continues before deciding whether it warrants a direct conversation.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Bring it up directly in your next one on one, take time to understand what has changed, and agree on a clear path forward.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Address it immediately, let them know directly that you have noticed the gap, and establish a specific timeline for getting back on track before it affects the team's overall performance.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
        ],
      },
      {
        id: 4,
        situation:
          "You set goals with each of your team members at the start of the quarter. The quarter is now half over and the goals have not come up since.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Trust that your team members are tracking their own progress and will come to you if they run into anything significant that requires your attention or intervention.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Prioritize reconnecting with each team member individually to review progress, understand any obstacles they are facing, and get clear on the path forward for the rest of the quarter.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Schedule individual meetings to review where each person stands, identify anyone who is behind, and have direct conversations about what needs to change to protect the quarter.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Reach out to check in on how everyone is feeling about the quarter, ask whether there is anything you can do to help them finish strong, and keep the conversation feeling like a check in rather than a review.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
        ],
      },
    ],
  },
  {
    key: "structured_feedback",
    name: "Structured Feedback",
    scenarios: [
      {
        id: 5,
        situation:
          "A team member you manage has been asking for more guidance and support lately. You have not had a dedicated one on one conversation with them in over three weeks.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Keep managing the situation day to day, respond when they reach out, and trust that your accessibility in the moment is enough to keep them on track without needing to carve out dedicated time.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Schedule dedicated time with them as soon as possible, protect that time from competing demands, and use the conversation to understand what they need and address it directly.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Schedule time to sit down with them, review where they stand on their current work, clarify expectations, and give them the specific direction and guidance they have been asking for.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Reach out to let them know you are available, check in on how they are doing, and make sure they know you are there even when your schedule has not allowed for dedicated time together.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
        ],
      },
      {
        id: 6,
        situation:
          "You have a one on one scheduled with a team member later today. You have a few minutes to think about how you want to approach it.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Use the time to think about how they have been doing personally, consider whether anything might be affecting them outside of work, and make sure you have a sense of how they are doing beyond just the work.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Pull up their recent performance information, identify the specific areas where you have observations to share, and prepare the feedback you want to deliver so the meeting stays focused and productive.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Review your notes from the last conversation, identify any open items you want to follow up on, and think about both the work topics and how they have been doing more broadly.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Head into the meeting and let the conversation develop on its own — you find that over-preparing can make one on ones feel more like a formal review than a casual exchange.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
        ],
      },
      {
        id: 7,
        situation:
          "You are midway through a check in with a team member and realize the conversation has been almost entirely status updates — what they are working on, where things stand, what is coming up next. There has been no discussion of their development, their challenges, or how they are feeling about their role.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Use the remaining time to share your observations on their work, give them specific direction on what you need from them, and make sure they leave clear on priorities and expectations.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Wrap up the conversation — status updates are a productive use of the time and those conversations come up naturally when the time is right.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Shift the conversation toward how they are feeling about their role, ask what they are finding challenging, and make sure they have room to share what is on their mind.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Steer the conversation toward their goals and development, ask about what is going well and where they need support, and make sure you get to both how they are doing in their role and where they need your input before you close.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
        ],
      },
      {
        id: 8,
        situation:
          "You had a conversation with a team member two weeks ago in which you both agreed on two specific actions they would take. When you next connect with them neither action has been completed.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Bring it up directly, take time to understand what got in the way, get clear on what needs to happen next, and close the conversation with a specific plan.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Acknowledge that things get busy, ask whether there is anything getting in their way that you can help with, and find a way to revisit the items without making the conversation feel like a performance issue.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Note it mentally, move on with the current conversation, and see whether it comes up organically — pressing them directly on missed commitments risks damaging a working relationship you do not want to put at risk over two action items.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Address it directly at the start of the conversation, restate clearly that commitments made together are taken seriously, establish a new deadline for each item, and make sure they understand the expectation before moving on.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
        ],
      },
    ],
  },
  {
    key: "active_management",
    name: "Active Management",
    scenarios: [
      {
        id: 9,
        situation:
          "One of your team members has seemed less engaged than usual over the past two weeks — quieter in meetings, slower to respond, and producing work that is below their normal standard. They have not said anything to you about it.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Address the performance change directly, let them know specifically what you have observed, outline the standard you expect them to return to, and make clear that you are tracking the situation going forward.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Find a moment to check in with them personally, ask how they are doing, listen carefully before raising anything about their work, and let them know you are available if they need support or want to talk anything through.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Give them some space and time — everyone goes through periods where they are not at their best, and most people work through these periods on their own without needing much from you.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Find a time to sit down with them, check in on how they are doing, and once you have a better sense of what is going on address the performance shift directly.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
        ],
      },
      {
        id: 10,
        situation:
          "It has been an unusually demanding week and you realize on Thursday afternoon that you have had almost no individual interaction with your team members since Monday.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Trust that your team is moving forward on their work — they know what they need to do and one demanding week does not change that.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Make a point of connecting with each team member before the end of the week — even briefly — to check in on where they are and see if anything needs your attention.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Send the team a message acknowledging it has been a hectic week and letting them know you will be more available next week and are available if anyone needs anything before the weekend.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Use the remaining time in the week to check in on where the team stands against their current priorities and follow up directly with anyone who appears to be behind.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
        ],
      },
      {
        id: 11,
        situation:
          "A team member comes to you with a problem they are stuck on and asks for your help. You can see a clear solution but they have not yet worked through all the options themselves.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Start by asking questions to understand how they are feeling about the situation, acknowledge that it is a tricky one, and make sure they feel the situation is understood before moving toward what to do about it.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Ask questions to help them think through the options themselves, offer your perspective once they have worked through their thinking, and decide on a path forward together.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Share the solution you can see — you have the experience and perspective to resolve it quickly, and getting them moving forward efficiently is more valuable than making them work through it themselves.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Point them toward the people or resources that can help them work it through — stepping in every time removes the chance for them to build their own problem solving skills.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
        ],
      },
      {
        id: 12,
        situation:
          "You have given a team member clear direction on a project but when you check in you find they have taken a different approach than the one you outlined. The work is solid but it is not what you asked for.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Have a direct conversation to understand their thinking behind the approach, acknowledge what is working in what they produced, and clarify what you need from them going forward.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Let it go this time — the work is solid, the outcome is acceptable, and reopening the conversation about how they got there feels like a poor use of time and energy for both of you.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Let them know clearly that the work needs to be brought in line with the original direction, explain why following the outlined approach matters, and restate your expectation for how direction should be handled going forward.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Start by acknowledging the effort they put in and the quality of what they produced, make sure they feel recognized for the work before you raise the direction issue, and keep the conversation focused on what you need going forward rather than what went wrong.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
        ],
      },
    ],
  },
  {
    key: "recognition",
    name: "Recognition",
    scenarios: [
      {
        id: 13,
        situation:
          "A team member has gone significantly above and beyond over the past few weeks — putting in extra effort and delivering work that has clearly exceeded the standard you expect. You have not yet acknowledged it directly.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Document the contribution in their performance record, make sure your own leadership is aware of it, and plan to reference it specifically at their next formal review so the effort is on record when it counts.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Plan to bring it up when you next have a natural opportunity — things have been busy and you have not found the right moment yet but you intend to acknowledge it at some point.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Acknowledge it promptly and specifically — call out what they did, connect it to the impact it had on the team, and make sure they know it did not go unnoticed.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Take time to sit down with them personally, tell them how much you appreciate the effort they put in, and check in on how they are doing after what was clearly a demanding stretch of work.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
        ],
      },
      {
        id: 14,
        situation:
          "You have a team member who consistently performs well but rarely receives recognition because their work happens quietly in the background without the visibility of higher profile projects.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Make a point of checking in with them regularly, letting them know you see and value what they contribute, and making sure they know their work is being noticed at the team level.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Look for opportunities to recognize their contributions specifically and publicly — making their work visible to the people around them is part of your job as their manager.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Trust that people who are consistently strong do not need frequent external recognition to stay engaged and productive — they are motivated by the quality of the work itself.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Make sure their contributions are consistently documented in their performance record and brought to the attention of the right people so their track record is clearly visible when it matters most.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
        ],
      },
      {
        id: 15,
        situation:
          "You have just learned that a team member prefers not to be recognized publicly and finds group acknowledgment uncomfortable. In the past you have typically recognized people in team meetings.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Continue with your standard recognition approach — consistency in how you acknowledge the team is important and making individual exceptions creates complexity.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Adjust your approach for this person and find a way to acknowledge their contributions privately — what matters is that they know their work is valued, not how that message is delivered.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Pull back on recognizing them altogether — if they have signaled they are not comfortable with acknowledgment the simplest approach is to respect that and move on.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Have a conversation with them to understand what kind of recognition would feel right and let them guide you on what approach works best for them.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
        ],
      },
      {
        id: 16,
        situation:
          "Your team has had a strong month and collectively hit a significant milestone. You want to acknowledge the achievement but have not planned anything specific.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Mention it at the next team meeting and move on — the results are visible, the team knows they performed well, and turning it into a bigger moment than that feels like more than is needed.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Organize something for the team to come together and mark the moment — getting people together to celebrate matters more to you than having something formal planned.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Make sure the achievement is reported up to leadership with the appropriate detail and visibility so the team gets the organizational recognition their results deserve at the right level.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Take time to acknowledge the milestone specifically — call out individual contributions, connect the result back to the goals the team set, and make the moment count for the people who drove it.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
        ],
      },
    ],
  },
  {
    key: "tough_conversations",
    name: "Tough Conversations",
    scenarios: [
      {
        id: 17,
        situation:
          "A team member's performance has been below standard for several weeks. You have noticed it, others on the team have noticed it, but you have not yet said anything directly to the person.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Find a low key moment to check in and ask how they are doing — you want to understand what might be going on for them before raising it as a work issue.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Address it directly and promptly — schedule time with them, come prepared with specific examples of what you have observed, and make sure the conversation includes both the issue and their perspective.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Continue monitoring the situation carefully — you want to be certain the pattern is consistent and well documented before having a conversation that could feel premature or unfair to the employee.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Schedule a meeting, lay out the performance data clearly and specifically, outline what needs to change and by when, and make sure they leave the conversation with no uncertainty about where they stand and what is expected.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
        ],
      },
      {
        id: 18,
        situation:
          "You need to deliver feedback to a team member about a behavior that is affecting the rest of the team. The person is well liked, has been with the company a long time, and is likely to be surprised by the feedback.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Continue observing the situation carefully and build a stronger picture before acting — feedback this sensitive needs to be handled with precision and you want to be fully prepared before having a conversation that could significantly affect the relationship.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Prepare the specific examples, schedule the meeting, and deliver the feedback directly and clearly — their tenure and relationships are context but they do not change what needs to be said or how clearly it needs to be communicated.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Prepare thoroughly, think carefully about how you want to open the conversation, lead with what you value about them, deliver the feedback with specific examples, and give them room to respond before discussing next steps.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Find an approach that preserves their dignity and keeps the relationship on solid ground — you focus on making the conversation feel constructive and you want them to leave feeling respected even after receiving difficult feedback.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
        ],
      },
      {
        id: 19,
        situation:
          "You have had a tough conversation with a team member about their performance. The conversation went reasonably well but you have not followed up since. It has now been two weeks.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Schedule a follow up meeting to review whether performance has improved, share what you have observed since the conversation, and make clear that you are actively tracking their progress against the expectations you set.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Reach out to check in — acknowledge the conversation, ask how they are doing, review progress against what you discussed, and make clear you are paying attention to how things are going.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
          {
            text: "Reach out to check in on how they are feeling since the conversation, let them know where things stand between you, and make yourself available if they want to talk through anything that came up for them afterward.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Trust that they took the conversation seriously and are working on it — following up too quickly can come across as though you do not trust them to follow through.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
        ],
      },
      {
        id: 20,
        situation:
          "A team member has pushed back strongly on feedback you delivered, disagreeing with your assessment and becoming visibly frustrated during the conversation.\n\nIn this situation, you most typically...",
        options: [
          {
            text: "Give the conversation some room — emotions are running high and returning to it once things have settled is likely to go better for everyone.",
            quadrant: "DA",
            a_score: 1,
            c_score: 1,
          },
          {
            text: "Shift your focus to making sure they feel heard, work on settling the conversation, and return to the substance of the feedback once things are calmer.",
            quadrant: "OS",
            a_score: 1,
            c_score: 2,
          },
          {
            text: "Hold your position clearly and calmly — you delivered the feedback because it was warranted and accurate, and adjusting your position because someone reacted emotionally is not something you are willing to do.",
            quadrant: "CC",
            a_score: 2,
            c_score: 1,
          },
          {
            text: "Acknowledge their reaction, give them room to share their perspective, and then bring the conversation back to the feedback — you are open to their view but the substance of what you raised still needs to be addressed.",
            quadrant: "IL",
            a_score: 2,
            c_score: 2,
          },
        ],
      },
    ],
  },
];

// About This Assessment intro text (shown on welcome screen)
export const MSA_INTRO_TEXT =
  "The Manager Skills Assessment\u2122 is designed to give you an honest picture of how you are currently leading your team \u2014 where your strengths are, where your gaps are, and what specific behaviors would make the biggest difference to the people you lead and the results you drive together.\n\nThis is not a test. There are no right or wrong answers and there is no passing or failing. What it does measure is the degree to which you are consistently executing the management behaviors that research and practical experience show are most directly connected to team performance.\n\nYou will receive a full report based on your responses. That report will identify your strengths as a manager, the areas where your current approach may be limiting your team\u2019s performance, and the specific behaviors that represent your greatest opportunity for growth.\n\nTo get the most from this assessment and your report, answer each question based on what you actually do \u2014 not what you would like to do or what you think the right answer is. The more honestly you respond, the more useful your results will be.\n\nThe assessment contains 20 scenarios and takes approximately 15 minutes to complete.";

// Flat list of all scenarios (used by survey UI)
export function getAllScenarios() {
  return MSA_DIMENSIONS.flatMap((dim) =>
    dim.scenarios.map((s) => ({
      ...s,
      dimension: dim.key,
      dimensionName: dim.name,
    }))
  );
}

// Total scenario count
export function getTotalScenarios() {
  return MSA_DIMENSIONS.reduce((sum, dim) => sum + dim.scenarios.length, 0);
}
