// ---------------------------------------------------------------------------
// Structured Interview Topic Library
// Extracted from the prototype (structured-interview.html) with full fidelity.
// ---------------------------------------------------------------------------

export interface Criterion {
  id: string;
  name: string;
  hi: string;
  lo: string;
}

export interface Subtopic {
  id: string;
  name: string;
  defaultMins: number;
  purpose: string;
  examples: string[];
  crit: Criterion[];
}

export interface Topic {
  id: string;
  name: string;
  subtopics: Subtopic[];
}

export interface IntroSection {
  label: string;
  content: string;
  emphasis?: string;
}

// Helper types for easy consumption
export type TopicLibrary = Topic[];
export type TopicId = typeof TOPIC_LIBRARY[number]["id"];
export type SubtopicId = typeof TOPIC_LIBRARY[number]["subtopics"][number]["id"];
export type CriterionId = typeof TOPIC_LIBRARY[number]["subtopics"][number]["crit"][number]["id"];

// ---------------------------------------------------------------------------
// TOPIC_LIBRARY
// ---------------------------------------------------------------------------

export const TOPIC_LIBRARY = [
  {
    id: "t1",
    name: "Leadership & strategic direction",
    subtopics: [
      {
        id: "st1a",
        name: "Personal vision & ambition",
        defaultMins: 6,
        purpose:
          "Understand the interviewee\u2019s strategic ambition for their own area, their sense of personal ownership, and how well their vision aligns with broader priorities.",
        examples: [
          "When you think about your part of the business, what would you most like to see change or improve over the next few years?",
          "If you had a free hand to change one thing about how your area operates, what would it be and why?",
          "What does a successful outcome look like for your function in three years\u2019 time?",
        ],
        crit: [
          {
            id: "c_st1a_1",
            name: "Strategic ambition",
            hi: "Articulates a clear, forward-looking vision with specific goals",
            lo: "Vague, short-term, or limited to business-as-usual",
          },
          {
            id: "c_st1a_2",
            name: "Personal ownership",
            hi: "Takes personal responsibility for delivering outcomes",
            lo: "Defers to others or waits for direction",
          },
        ],
      },
      {
        id: "st1b",
        name: "Organisational vision & strategy",
        defaultMins: 5,
        purpose:
          "Understand how the interviewee frames the organisation\u2019s future \u2014 their strategic mindset, commercial awareness, and ability to think beyond their own area.",
        examples: [
          "Thinking about the organisation as a whole, what does success look like in three to five years?",
          "Where do you think the organisation needs to go, and is it currently heading in the right direction?",
          "What would need to be true for this organisation to be best in class in five years?",
        ],
        crit: [
          {
            id: "c_st1b_1",
            name: "Enterprise thinking",
            hi: "Considers the whole business \u2014 operations, functions, stakeholders",
            lo: "Narrowly focused on own area or function",
          },
          {
            id: "c_st1b_2",
            name: "Commitment to the enterprise",
            hi: "Genuine engagement with the organisation\u2019s future beyond own area",
            lo: "Limited interest or narrow focus",
          },
          {
            id: "c_st1b_3",
            name: "Strategic thinking",
            hi: "Thinks in terms of long-term priorities; connects actions to broader goals",
            lo: "Focused on immediate tasks or waits for direction",
          },
        ],
      },
      {
        id: "st1c",
        name: "Personal accountability & drive",
        defaultMins: 4,
        purpose:
          "Test whether the interviewee takes genuine personal accountability for outcomes, or tends to attribute responsibility to structures, others, or circumstances.",
        examples: [
          "What are you personally driving right now to move the organisation forward?",
          "Can you give me an example of a time you pushed hard for something that mattered \u2014 even when it was difficult?",
          "When things don\u2019t go to plan, how do you typically respond?",
        ],
        crit: [
          {
            id: "c_st1c_1",
            name: "Personal accountability",
            hi: "Clear ownership; does not deflect responsibility",
            lo: "Blames structures, people, or circumstances",
          },
          {
            id: "c_st1c_2",
            name: "Drive and initiative",
            hi: "Self-starting; identifies what needs to happen and acts",
            lo: "Reactive; waits to be directed",
          },
        ],
      },
      {
        id: "st1d",
        name: "Vision for their function",
        defaultMins: 4,
        purpose:
          "Understand how clearly the interviewee has thought through what their function needs to become \u2014 and whether they are actively leading that change.",
        examples: [
          "How does your function need to change over the next few years to support the organisation\u2019s direction?",
          "What would your team look like at its best \u2014 and how far away is that from today?",
          "If you were starting your function from scratch, what would you do differently?",
        ],
        crit: [
          {
            id: "c_st1d_1",
            name: "Functional clarity",
            hi: "Clear picture of where the function needs to go and why",
            lo: "Vague or reactive \u2014 focused on current state only",
          },
          {
            id: "c_st1d_2",
            name: "Change leadership within function",
            hi: "Actively leading transformation within own area",
            lo: "Maintains status quo; limited appetite for internal change",
          },
        ],
      },
      {
        id: "st1e",
        name: "Coalition breadth & alignment",
        defaultMins: 5,
        purpose:
          "Assess whether the guiding coalition driving transformation is genuinely cross-functional, credible, and aligned \u2014 or whether commitment is performative and leadership alignment superficial.",
        examples: [
          "Who are the key leaders or influencers driving this transformation \u2014 and how were they identified?",
          "How would you describe the level of genuine alignment among senior leaders on the direction of change? Where does agreement break down?",
          "Are there influential people who are not yet on board? What are their specific concerns, and how are those being addressed?",
        ],
        crit: [
          {
            id: "c_st1e_1",
            name: "Coalition breadth",
            hi: "Cross-functional coalition including informal influencers, not just formal hierarchy",
            lo: "Narrow coalition; limited to a small inner circle or a single function",
          },
          {
            id: "c_st1e_2",
            name: "Genuine alignment",
            hi: "Honest about where disagreement exists; actively working to resolve it",
            lo: "Alignment described as universal when it clearly is not; performative consensus",
          },
        ],
      },
      {
        id: "st1f",
        name: "Decisive & empowering leadership balance",
        defaultMins: 4,
        purpose:
          "Test whether leaders can flex between directing decisively and genuinely empowering others \u2014 a critical balance in transformation contexts where both speed and buy-in are required.",
        examples: [
          "When a critical decision needs to be made during this transformation, how quickly does it get made \u2014 and by whom?",
          "Where in the organisation do decisions get stuck, and what causes the bottleneck?",
          "How effectively do leaders empower those closest to the work to make their own decisions within the transformation?",
        ],
        crit: [
          {
            id: "c_st1f_1",
            name: "Decision speed and clarity",
            hi: "Decisions made quickly and clearly; no prolonged ambiguity about who decides what",
            lo: "Decisions stall; unclear ownership; committee paralysis",
          },
          {
            id: "c_st1f_2",
            name: "Empowerment in practice",
            hi: "Actively delegates decision-making; trusts people closest to the work",
            lo: "Centralises decisions; creates bottlenecks by retaining control",
          },
        ],
      },
      {
        id: "st1g",
        name: "Adaptive challenge diagnosis",
        defaultMins: 5,
        purpose:
          "Assess whether leaders can distinguish adaptive challenges from technical problems \u2014 and resist the common failure of applying technical fixes to adaptive challenges.",
        examples: [
          "Thinking about the biggest challenges in this transformation, which ones have clear known solutions \u2014 and which require people to fundamentally change how they think or work?",
          "Can you describe a situation where an initial fix did not work because the real issue was about mindset or behaviour rather than process or technology?",
          "How comfortable are leaders with sitting in ambiguity \u2014 maintaining productive tension without rushing to premature resolution?",
        ],
        crit: [
          {
            id: "c_st1g_1",
            name: "Technical vs. adaptive distinction",
            hi: "Clearly distinguishes between problems with known solutions and those requiring behavioural change",
            lo: "Treats all challenges as technical; applies process fixes to cultural or behavioural problems",
          },
          {
            id: "c_st1g_2",
            name: "Tolerance for productive ambiguity",
            hi: "Comfortable holding tension and ambiguity while the organisation works through adaptive change",
            lo: "Rushes to certainty; resolves ambiguity prematurely with quick fixes",
          },
        ],
      },
    ],
  },
  {
    id: "t2",
    name: "Competitive landscape & customer focus",
    subtopics: [
      {
        id: "st2a",
        name: "Competitive landscape & differentiation",
        defaultMins: 4,
        purpose:
          "Test whether the interviewee understands which priorities will drive competitive success and how deeply they have thought through the path to get there.",
        examples: [
          "What are the main areas the organisation needs to focus on to differentiate itself from competitors?",
          "Where does the organisation need to win, and how does that compare to where it focuses today?",
          "What are competitors doing that concerns you most?",
        ],
        crit: [
          {
            id: "c_st2a_1",
            name: "Understanding of key drivers",
            hi: "Identifies the right levers \u2014 operations, technology, culture, customer experience",
            lo: "Superficial or scattered thinking",
          },
          {
            id: "c_st2a_2",
            name: "Depth of thinking",
            hi: "Demonstrates detailed understanding of what change requires",
            lo: "High-level only; lacks practical detail",
          },
        ],
      },
      {
        id: "st2b",
        name: "Customer understanding",
        defaultMins: 4,
        purpose:
          "Understand how well the interviewee knows the organisation\u2019s customers, why they buy, and what differentiates the organisation from alternatives.",
        examples: [
          "Why do customers choose you? What differentiates you from the alternatives?",
          "How well do you feel the organisation really understands its customers right now?",
          "Where is the biggest gap between what customers want and what the organisation currently delivers?",
        ],
        crit: [
          {
            id: "c_st2b_1",
            name: "Competitive awareness",
            hi: "Clear grasp of who competitors are and how customers choose",
            lo: "Vague or limited awareness of competitive dynamics",
          },
          {
            id: "c_st2b_2",
            name: "Realism and concreteness",
            hi: "Grounded, specific view of customer behaviour and market position",
            lo: "Generic or abstract statements without evidence",
          },
          {
            id: "c_st2b_3",
            name: "Commercial awareness",
            hi: "Connects customer view to profitability, market position, or competitive advantage",
            lo: "Disconnected from business fundamentals",
          },
        ],
      },
      {
        id: "st2c",
        name: "Market trends & disruption",
        defaultMins: 4,
        purpose:
          "Gauge whether the interviewee is tracking external trends and disruptions that could affect the organisation \u2014 and thinking proactively about the implications.",
        examples: [
          "What external trends or disruptions concern you most over the next three to five years?",
          "How is your industry changing, and is the organisation keeping pace?",
          "Where do you think the biggest threats to your current business model are coming from?",
        ],
        crit: [
          {
            id: "c_st2c_1",
            name: "External awareness",
            hi: "Tracks and interprets external trends; connects them to organisational implications",
            lo: "Internally focused; limited awareness of external environment",
          },
          {
            id: "c_st2c_2",
            name: "Forward thinking",
            hi: "Anticipates disruption and positions the organisation in advance",
            lo: "Reactive; deals with change only once it arrives",
          },
        ],
      },
      {
        id: "st2d",
        name: "Commercial strategy & growth",
        defaultMins: 4,
        purpose:
          "Understand how the interviewee thinks about commercial opportunities \u2014 and whether they see growth as something they personally own.",
        examples: [
          "Where do you see the best opportunities for the organisation to grow or improve its commercial position?",
          "What would it take to meaningfully increase revenue or market share in the next two years?",
          "Are there areas where you think the organisation is leaving money on the table?",
        ],
        crit: [
          {
            id: "c_st2d_1",
            name: "Commercial instinct",
            hi: "Identifies credible, specific growth opportunities with a sense of how to capture them",
            lo: "Vague or limited commercial thinking",
          },
          {
            id: "c_st2d_2",
            name: "Ownership of growth",
            hi: "Sees commercial growth as part of their personal agenda",
            lo: "Defers commercial thinking to others",
          },
        ],
      },
      {
        id: "st2e",
        name: "External orientation & ecosystem engagement",
        defaultMins: 4,
        purpose:
          "Assess whether external intelligence flows systematically into strategic decision-making, and whether frontline insights are actively acted upon.",
        examples: [
          "How systematically does external insight \u2014 from customers, competitors, regulators, or partners \u2014 flow into strategic decision-making here?",
          "How often are ideas or observations from frontline employees closest to customers actually acted upon by senior leadership?",
          "Where is the organisation most at risk of being blindsided by external developments it is not currently tracking?",
        ],
        crit: [
          {
            id: "c_st2e_1",
            name: "External intelligence systems",
            hi: "Systematic mechanisms exist to capture and act on external intelligence; not ad hoc",
            lo: "Externally disconnected; relies on leadership intuition rather than structured sensing",
          },
          {
            id: "c_st2e_2",
            name: "Frontline insight activation",
            hi: "Frontline observations regularly reach and influence senior decision-making",
            lo: "Frontline insight ignored or filtered out before reaching leadership",
          },
        ],
      },
    ],
  },
  {
    id: "t3",
    name: "Performance culture",
    subtopics: [
      {
        id: "st3a",
        name: "Head office efficiency",
        defaultMins: 4,
        purpose:
          "Test whether the interviewee understands what is slowing down head office operations and is committed to improving it.",
        examples: [
          "What needs to happen to improve the day-to-day efficiency of the head office?",
          "Where are the biggest sources of waste or friction in how head office operates today?",
          "If you could remove one structural barrier to getting things done faster at head office, what would it be?",
        ],
        crit: [
          {
            id: "c_st3a_1",
            name: "Commitment to efficiency",
            hi: "Identifies specific improvements and shows ownership to drive them",
            lo: "Vague, passive, or sees it as someone else\u2019s problem",
          },
          {
            id: "c_st3a_2",
            name: "Clarity on what\u2019s not working",
            hi: "Pinpoints specific inefficiencies or bottlenecks",
            lo: "General complaints without concrete examples",
          },
        ],
      },
      {
        id: "st3b",
        name: "Front-line operational performance",
        defaultMins: 6,
        purpose:
          "Gauge the interviewee\u2019s commitment to operational performance and whether they understand the real challenges on the ground.",
        examples: [
          "What needs to happen to improve the day-to-day profitability and effectiveness of front-line operations?",
          "How well do you understand what\u2019s getting in the way of performance at the front line?",
          "What support do front-line managers need that they are not currently getting?",
        ],
        crit: [
          {
            id: "c_st3b_1",
            name: "Front-line commitment",
            hi: "Shows genuine focus on helping front-line teams perform better",
            lo: "Distant or indifferent to front-line challenges",
          },
          {
            id: "c_st3b_2",
            name: "End-to-end understanding",
            hi: "Understands what happens on the ground; knows which levers drive efficiency",
            lo: "Detached from front-line realities",
          },
        ],
      },
      {
        id: "st3c",
        name: "Cross-functional collaboration",
        defaultMins: 4,
        purpose:
          "Understand how well the interviewee collaborates across the organisation and whether they see collaboration as a lever for performance or a source of friction.",
        examples: [
          "How well do different parts of the organisation work together \u2014 and where are the biggest friction points?",
          "What gets in the way of teams collaborating effectively across functions?",
          "Can you give me an example of a time a cross-functional effort worked well \u2014 and one where it didn\u2019t?",
        ],
        crit: [
          {
            id: "c_st3c_1",
            name: "Collaborative mindset",
            hi: "Actively seeks to work across functions; sees collaboration as a performance driver",
            lo: "Territorial or transactional in cross-functional relationships",
          },
          {
            id: "c_st3c_2",
            name: "Systemic awareness",
            hi: "Understands how siloed working affects overall performance",
            lo: "Views collaboration issues as interpersonal rather than structural",
          },
        ],
      },
      {
        id: "st3d",
        name: "Performance measurement & accountability",
        defaultMins: 4,
        purpose:
          "Understand whether the interviewee has clarity on what good performance looks like and holds themselves and their team accountable to it.",
        examples: [
          "How do you know whether your team is performing well? What does good look like?",
          "Where do you feel the organisation\u2019s performance management approach is working, and where is it falling short?",
          "How transparent are people about performance gaps \u2014 and what happens when targets are missed?",
        ],
        crit: [
          {
            id: "c_st3d_1",
            name: "Clarity on performance standards",
            hi: "Can describe what good looks like with specificity",
            lo: "Vague about performance expectations or measures",
          },
          {
            id: "c_st3d_2",
            name: "Accountability culture",
            hi: "Holds self and team accountable; addresses underperformance directly",
            lo: "Avoids difficult conversations; tolerates underperformance",
          },
        ],
      },
      {
        id: "st3e",
        name: "Accountability & consequence management",
        defaultMins: 4,
        purpose:
          "Assess whether genuine accountability exists for transformation commitments \u2014 including both positive recognition of early adopters and constructive consequences for persistent non-adoption.",
        examples: [
          "What happens when commitments made as part of the transformation are not met?",
          "How are early adopters and change champions recognised and rewarded \u2014 and how are persistent blockers addressed?",
          "Do people take personal ownership for outcomes in the transformation, or is blame-shifting common?",
        ],
        crit: [
          {
            id: "c_st3e_1",
            name: "Consequence clarity",
            hi: "Clear and consistent consequences \u2014 positive and negative \u2014 for transformation behaviours",
            lo: "No real consequences; non-adoption tolerated indefinitely; accountability is rhetorical",
          },
          {
            id: "c_st3e_2",
            name: "Personal ownership",
            hi: "Individuals own outcomes; does not deflect or attribute responsibility to others",
            lo: "Blame-shifting; diffusion of responsibility; waits for others to act",
          },
        ],
      },
      {
        id: "st3f",
        name: "Innovation & learning cadence",
        defaultMins: 4,
        purpose:
          "Assess whether the organisation has the discipline to test, learn, and adapt during transformation \u2014 through structured experimentation, post-mortems, and knowledge sharing.",
        examples: [
          "How does the organisation approach experimentation \u2014 is there a structured process for testing new ideas before scaling?",
          "When something fails during the transformation, is there a systematic process for capturing and sharing lessons \u2014 or does the organisation tend to move on without reflection?",
          "Can you give an example of a time the organisation changed course based on what it learned during the transformation?",
        ],
        crit: [
          {
            id: "c_st3f_1",
            name: "Test-and-learn discipline",
            hi: "Structured approach to piloting; learns before scaling; comfortable with iteration",
            lo: "Big-bang execution only; no structured experimentation; failure is hidden not learned from",
          },
          {
            id: "c_st3f_2",
            name: "Reflective practice",
            hi: "Captures and shares lessons systematically; retrospectives are standard practice",
            lo: "Moves on without reflection; same mistakes repeated across initiatives",
          },
        ],
      },
    ],
  },
  {
    id: "t4",
    name: "Change readiness & transformation",
    subtopics: [
      {
        id: "st4a",
        name: "Leading change in underperforming areas",
        defaultMins: 4,
        purpose:
          "Understand how well the interviewee grasps the challenges facing underperforming areas and whether they will actively lead and role model the changes needed.",
        examples: [
          "What are the biggest challenges facing managers in underperforming areas, and what needs to be done to help them?",
          "How would you describe the quality of leadership in parts of the business that are struggling \u2014 and what needs to change?",
          "What does it take to turn around a team or unit that is not delivering?",
        ],
        crit: [
          {
            id: "c_st4a_1",
            name: "Active leadership of change",
            hi: "Takes ownership; willing to drive change personally",
            lo: "Passive; waits for others to act",
          },
          {
            id: "c_st4a_2",
            name: "Cultural role modelling",
            hi: "Will champion new ways of working and cross-functional teamwork",
            lo: "Unlikely to role model or promote change",
          },
        ],
      },
      {
        id: "st4b",
        name: "Organisational change readiness",
        defaultMins: 4,
        purpose:
          "Gauge the interviewee\u2019s personal openness to change and their understanding of what transformation requires from the organisation.",
        examples: [
          "In your view, how ready is the organisation to change? What would it take to get everyone fully committed?",
          "What is the single biggest barrier to the organisation moving faster on transformation?",
          "Have you been through a significant transformation before \u2014 what did you learn from it?",
        ],
        crit: [
          {
            id: "c_st4b_1",
            name: "Openness to change",
            hi: "Acknowledges the need for change and engages constructively with what\u2019s required",
            lo: "Defensive, dismissive, or resistant",
          },
          {
            id: "c_st4b_2",
            name: "Commitment to change",
            hi: "Committed in an informed manner; understands what\u2019s involved",
            lo: "Indifferent or actively resisting",
          },
        ],
      },
      {
        id: "st4c",
        name: "Technology & data readiness",
        defaultMins: 4,
        purpose:
          "Understand how well-positioned the interviewee believes the organisation is to use technology and data as drivers of performance.",
        examples: [
          "How well-positioned is the organisation to use technology and data to drive performance?",
          "Where do you think technology could make the biggest difference in your area \u2014 and what\u2019s stopping that from happening?",
          "How comfortable are you with data-driven decision making, and how does that show up in how your team operates?",
        ],
        crit: [
          {
            id: "c_st4c_1",
            name: "Digital awareness",
            hi: "Can identify specific technology opportunities relevant to their area",
            lo: "Limited engagement with technology or data as performance levers",
          },
          {
            id: "c_st4c_2",
            name: "Personal adoption",
            hi: "Actively uses data and technology in their own decision making",
            lo: "Delegates technology thinking; not personally engaged",
          },
        ],
      },
      {
        id: "st4d",
        name: "Cultural barriers to transformation",
        defaultMins: 4,
        purpose:
          "Surface the cultural or behavioural patterns most likely to obstruct transformation \u2014 and understand how much personal ownership the interviewee takes for shifting those patterns.",
        examples: [
          "What cultural or behavioural patterns are most likely to get in the way of transformation here?",
          "Where do you see the most resistance to change, and what drives it?",
          "What would need to change about how people behave day-to-day for this transformation to succeed?",
        ],
        crit: [
          {
            id: "c_st4d_1",
            name: "Cultural insight",
            hi: "Names specific behaviours or patterns with honesty and nuance",
            lo: "Generic or superficial cultural observations",
          },
          {
            id: "c_st4d_2",
            name: "Personal responsibility for culture",
            hi: "Sees themselves as a shaper of culture; takes ownership for modelling change",
            lo: "Views culture as someone else\u2019s responsibility",
          },
        ],
      },
      {
        id: "st4e",
        name: "ADKAR barrier-point assessment",
        defaultMins: 5,
        purpose:
          "Identify precisely where individual change readiness breaks down \u2014 whether at Awareness, Desire, Knowledge, Ability, or Reinforcement \u2014 enabling targeted interventions.",
        examples: [
          "How aware are the people affected by this change of why it is happening and what the business case is?",
          "To what extent do people genuinely want to participate in and support this change \u2014 what is driving motivation or resistance?",
          "Do people know how to work in the new way \u2014 and are they able to demonstrate those skills in practice?",
        ],
        crit: [
          {
            id: "c_st4e_1",
            name: "Awareness & desire",
            hi: "People understand why the change is happening and have genuine motivation to support it",
            lo: "People do not understand the case for change or actively do not want it",
          },
          {
            id: "c_st4e_2",
            name: "Knowledge, ability & reinforcement",
            hi: "People have been trained, can demonstrate new behaviours, and are reinforced for doing so",
            lo: "Knowledge gaps, inability to execute, or regression to old habits without reinforcement",
          },
        ],
      },
      {
        id: "st4f",
        name: "Psychological transition state",
        defaultMins: 5,
        purpose:
          "Surface the emotional and identity-level responses to change that most frequently derail transformation \u2014 particularly what people are being asked to let go of.",
        examples: [
          "What are people being asked to let go of with this change \u2014 what routines, relationships, status, or identity are at risk?",
          "Has leadership clearly communicated what is ending and what is continuing \u2014 or is there ambiguity about what is changing?",
          "How would you describe the emotional state of the people most affected \u2014 are they in denial, resistance, or genuine engagement?",
        ],
        crit: [
          {
            id: "c_st4f_1",
            name: "Loss acknowledgement",
            hi: "Leadership has explicitly named what people are giving up; losses are honoured not minimised",
            lo: "Communication focuses only on gains; losses ignored; resistance dismissed as irrational",
          },
          {
            id: "c_st4f_2",
            name: "Transition stage awareness",
            hi: "Clear sense of where people are in the transition; neutral zone is being managed with support",
            lo: "No awareness of psychological transition; people left to navigate the in-between alone",
          },
        ],
      },
      {
        id: "st4g",
        name: "Psychological safety for change",
        defaultMins: 4,
        purpose:
          "Assess whether the interpersonal climate enables the candour, error reporting, and experimentation essential for adaptive change.",
        examples: [
          "If someone on your team made a mistake during this transformation, would they feel safe admitting it \u2014 or would they try to cover it up?",
          "How safe do people feel to challenge a decision or raise a concern about the transformation with senior leadership?",
          "Is there a difference between what people say in formal meetings about the change and what they say privately?",
        ],
        crit: [
          {
            id: "c_st4g_1",
            name: "Candour and error safety",
            hi: "People voice concerns, admit mistakes, and raise dissenting views without fear of consequence",
            lo: "Self-censorship is widespread; people say what is safe rather than what is true",
          },
          {
            id: "c_st4g_2",
            name: "Challenge upward",
            hi: "Comfortable challenging senior leadership; dissent is welcomed not punished",
            lo: "Deference culture; no one challenges leadership; problems surface too late",
          },
        ],
      },
      {
        id: "st4h",
        name: "Short-term wins & momentum",
        defaultMins: 4,
        purpose:
          "Assess whether the transformation has produced visible, credible early successes that build momentum and counter cynicism.",
        examples: [
          "What quick wins or early successes has this transformation produced that people can actually point to?",
          "How are these successes being communicated and celebrated \u2014 and are they reaching people beyond the immediate project team?",
          "After initial successes, is the organisation pressing harder into more difficult changes \u2014 or is there a risk of declaring victory too early?",
        ],
        crit: [
          {
            id: "c_st4h_1",
            name: "Visible early wins",
            hi: "Concrete, credible wins exist and are widely visible; not cherry-picked or spun",
            lo: "No tangible early wins; or wins exist but are not communicated or celebrated",
          },
          {
            id: "c_st4h_2",
            name: "Momentum building",
            hi: "Early wins are being used to build credibility and accelerate bolder changes",
            lo: "Early wins treated as the destination; transformation loses momentum after initial progress",
          },
        ],
      },
    ],
  },
  {
    id: "t6",
    name: "Collaboration & stakeholder engagement",
    subtopics: [
      {
        id: "st6a",
        name: "Cross-functional & team collaboration",
        defaultMins: 4,
        purpose:
          "Understand the interviewee\u2019s willingness and ability to work across functions and levels \u2014 and whether they actively foster collaboration or operate in silos.",
        examples: [
          "How well do you think different teams and functions work together here \u2014 and where are the biggest friction points?",
          "Can you give me an example of a time you worked across functions to get something done? What made it work or not work?",
          "What would it take to significantly improve collaboration across the organisation?",
        ],
        crit: [
          {
            id: "c_st6a_1",
            name: "Collaborative mindset",
            hi: "Actively seeks cross-functional ways of working; sees it as a performance driver",
            lo: "Territorial, transactional, or indifferent to collaboration",
          },
          {
            id: "c_st6a_2",
            name: "Teamwork in practice",
            hi: "Can give concrete examples of effective cross-functional work",
            lo: "Vague or relies on structural processes rather than relationships",
          },
        ],
      },
      {
        id: "st6b",
        name: "External stakeholder relationships",
        defaultMins: 4,
        purpose:
          "Gauge how well the interviewee manages relationships with external partners, clients, or key stakeholders \u2014 and whether they see this as a strategic priority.",
        examples: [
          "How do you manage relationships with your key external partners or stakeholders \u2014 and where do you think that could improve?",
          "What does a strong external partnership look like to you, and how do you build one?",
          "Where do you think the organisation\u2019s relationships with its most important external stakeholders are strongest \u2014 and where are they weakest?",
        ],
        crit: [
          {
            id: "c_st6b_1",
            name: "Stakeholder awareness",
            hi: "Identifies key stakeholders and understands what they need; manages relationships proactively",
            lo: "Reactive or limited engagement with external stakeholders",
          },
          {
            id: "c_st6b_2",
            name: "Partnership orientation",
            hi: "Builds genuine partnerships; invests in long-term relationships",
            lo: "Transactional; focused on short-term outcomes only",
          },
        ],
      },
      {
        id: "st6c",
        name: "Cultural ambassadorship",
        defaultMins: 4,
        purpose:
          "Understand whether the interviewee is likely to act as a cultural ambassador \u2014 actively promoting new ways of working and modelling collaborative behaviour.",
        examples: [
          "How do you think about your role in shaping the culture of this organisation?",
          "What does it mean to you to be a role model for others \u2014 and how do you put that into practice day-to-day?",
          "If you could change one thing about how people work together here, what would it be?",
        ],
        crit: [
          {
            id: "c_st6c_1",
            name: "Cultural role modelling",
            hi: "Consciously models the behaviours they want to see; talks about culture with conviction",
            lo: "Does not see culture as part of their role; passive about behavioural change",
          },
          {
            id: "c_st6c_2",
            name: "Influence and advocacy",
            hi: "Actively promotes new ways of working; brings others along",
            lo: "Limited influence on others; focuses on own area only",
          },
        ],
      },
      {
        id: "st6d",
        name: "Franchisee & front-line engagement",
        defaultMins: 4,
        purpose:
          "Understand how well the interviewee engages with franchisees or front-line operators and whether they see that relationship as a priority.",
        examples: [
          "How do you engage with franchisees or front-line operators \u2014 and how well do you think that relationship is working?",
          "What do franchisees or store managers need from head office that they are not currently getting?",
          "How do you make sure that what happens at head office actually helps rather than hinders the people running operations on the ground?",
        ],
        crit: [
          {
            id: "c_st6d_1",
            name: "Front-line relationship quality",
            hi: "Maintains strong, trust-based relationships with front-line operators; understands their perspective",
            lo: "Distant or transactional relationship with front-line operators",
          },
          {
            id: "c_st6d_2",
            name: "Support orientation",
            hi: "Actively looks for ways to make head office more helpful to front-line teams",
            lo: "Head office-centric; limited concern for front-line impact",
          },
        ],
      },
      {
        id: "st6e",
        name: "Informal influence networks",
        defaultMins: 4,
        purpose:
          "Identify the real influencers in the organisation \u2014 those without formal authority who shape how colleagues feel and behave \u2014 and assess whether change champions have been drawn from those networks.",
        examples: [
          "If you needed honest advice about how this transformation is really going, who would you ask \u2014 and are those people formally involved in the change effort?",
          "Are there people without formal authority who have significant influence over how their colleagues feel about this change?",
          "How were change champions selected \u2014 based on role, or based on who people actually listen to and trust?",
        ],
        crit: [
          {
            id: "c_st6e_1",
            name: "Informal influencer awareness",
            hi: "Can name specific informal influencers; understands the difference between formal and informal authority",
            lo: "Thinks only in terms of org chart; unaware of informal influence dynamics",
          },
          {
            id: "c_st6e_2",
            name: "Network activation",
            hi: "Informal influencers are actively engaged in the change effort",
            lo: "Change champions selected by title only; informal networks not activated",
          },
        ],
      },
      {
        id: "st6f",
        name: "Emotional intelligence & empathetic engagement",
        defaultMins: 4,
        purpose:
          "Assess leaders\u2019 capacity for empathetic engagement during transformation \u2014 their ability to understand the emotional impact on others and build trust.",
        examples: [
          "How well do leaders understand the emotional impact this change is having on their teams \u2014 and how do they show that understanding?",
          "Do people feel comfortable sharing their genuine concerns and fears about the transformation with their direct leaders?",
          "Can you describe a time when a leader responded to resistance about the change in a way that either helped or harmed trust?",
        ],
        crit: [
          {
            id: "c_st6f_1",
            name: "Empathetic awareness",
            hi: "Leaders actively listen, acknowledge emotional responses, and demonstrate genuine understanding",
            lo: "Leaders dismiss or minimise emotional responses; focus only on rational case for change",
          },
          {
            id: "c_st6f_2",
            name: "Trust through disclosure",
            hi: "People willingly share sensitive concerns with leaders; trust is high",
            lo: "People guard what they share; distrust means real concerns never surface to leadership",
          },
        ],
      },
    ],
  },
  {
    id: "t5",
    name: "Concerns & fears",
    subtopics: [
      {
        id: "st5a",
        name: "Open concerns & hopes",
        defaultMins: 8,
        purpose:
          "Capture unstructured concerns, hopes, or messages that structured questions may have missed. Gauge emotional investment and identify any red flags.",
        examples: [
          "Before we finish, is there anything you think needs to be addressed to achieve the vision? Please take a moment to think. You\u2019re welcome to share anything in confidence if you wish.",
          "Is there anything important we haven\u2019t covered that you\u2019d like us to understand?",
          "If you could send one message to the leadership team \u2014 anonymously if you like \u2014 what would it be?",
        ],
        crit: [
          {
            id: "c_st5a_1",
            name: "Emotional investment & concern",
            hi: "Expresses strong, specific concerns or convictions",
            lo: "Limited concerns or indifferent",
          },
        ],
      },
      {
        id: "st5b",
        name: "Organisational risks",
        defaultMins: 5,
        purpose:
          "Surface the risks the interviewee believes are most likely to derail the organisation\u2019s ambitions \u2014 both external and internal.",
        examples: [
          "What do you see as the biggest risks to the organisation achieving its ambitions over the next few years?",
          "If this transformation were to fail, what would be the most likely reason?",
          "What keeps you up at night when you think about where the organisation is headed?",
        ],
        crit: [
          {
            id: "c_st5b_1",
            name: "Risk awareness",
            hi: "Identifies specific, credible risks with evidence or reasoning",
            lo: "Vague, generic, or unwilling to name risks",
          },
          {
            id: "c_st5b_2",
            name: "Candour",
            hi: "Willing to be honest about internal failings or uncomfortable truths",
            lo: "Guarded; avoids naming the real issues",
          },
        ],
      },
      {
        id: "st5c",
        name: "Loss & identity disruption",
        defaultMins: 5,
        purpose:
          "Surface the specific losses people fear most from this transformation, and assess whether leadership has explicitly acknowledged and honoured what is ending.",
        examples: [
          "What specific things are people afraid of losing as a result of this change \u2014 relationships, routines, status, expertise, identity?",
          "For the people most resistant to this change, what do you think they fear losing the most?",
          "Has leadership explicitly acknowledged what people are giving up \u2014 or is communication entirely focused on what they will gain?",
        ],
        crit: [
          {
            id: "c_st5c_1",
            name: "Loss specificity",
            hi: "Names specific losses with depth and nuance; not generalised concern but real stakes",
            lo: "Vague or abstract; unable or unwilling to name what is actually at risk for people",
          },
          {
            id: "c_st5c_2",
            name: "Leadership acknowledgement",
            hi: "Leadership has named and honoured losses; people feel their sacrifice is recognised",
            lo: "Leadership has not acknowledged losses; people feel what they valued is simply discarded",
          },
        ],
      },
      {
        id: "st5d",
        name: "Derailment risks & change fatigue",
        defaultMins: 5,
        purpose:
          "Surface systemic risks that could cause the transformation to fail \u2014 including overlapping initiatives, change fatigue, repeated failure patterns, and known pockets of structural resistance.",
        examples: [
          "How many significant change initiatives are currently running in parallel across the organisation \u2014 and is there genuine capacity to absorb another?",
          "Where have past transformation efforts stalled or failed here, and what patterns do you see repeating?",
          "If progress on this transformation stalls six months from now, what would you predict was the cause?",
        ],
        crit: [
          {
            id: "c_st5d_1",
            name: "Change capacity awareness",
            hi: "Honest about capacity constraints; aware of change fatigue and initiative overload",
            lo: "Blind to capacity limits; believes the organisation can absorb any volume of change",
          },
          {
            id: "c_st5d_2",
            name: "Failure pattern recognition",
            hi: "Identifies specific past failure patterns; can articulate what is different this time",
            lo: "No learning from previous failures; same risks overlooked; history likely to repeat",
          },
        ],
      },
    ],
  },
] as const satisfies readonly Topic[];

// ---------------------------------------------------------------------------
// INTRO_SECTIONS
// ---------------------------------------------------------------------------

export const INTRO_SECTIONS = [
  {
    label: "Introduction",
    content:
      "Hi, and thanks for taking the time to speak with us.\n\nWe\u2019re working with the leadership team to help shape the vision for the organisation. This conversation is your chance to input directly into that process.\n\nWe want to understand your perspective on where the organisation should be going, what is working, and what needs to change.\n\nIn this conversation, we\u2019ll talk a bit about:\n\u2022 Your role and how your part of the business operates today and needs to change\n\u2022 Your views on the organisation\u2019s competitive position and what needs to improve\n\u2022 What\u2019s getting in the way of performance\n\nWhat you share today will become part of the work we do together to build alignment across the leadership team.",
  },
  {
    label: "Answering the questions",
    content:
      "This will be a one-on-one conversation, lasting around 60 to 90 minutes.\n\nSome of the questions we ask might feel like they need a long answer \u2014 but don\u2019t worry about covering everything at once. A short, simple response is a great place to start. Try to give us headlines. If we need details, we\u2019ll ask follow-up questions.",
    emphasis: "A short, simple response is a great place to start.",
  },
  {
    label: "Confidentiality",
    content:
      "If there\u2019s anything you\u2019d like to share in confidence, just let us know. We\u2019re very happy to keep parts of the conversation private, and we\u2019ll always respect that.\n\nYou have our full assurance on that.\n\nIf you have any questions about confidentiality, please feel free to ask.",
    emphasis: "You have our full assurance on that.",
  },
] as const satisfies readonly IntroSection[];
