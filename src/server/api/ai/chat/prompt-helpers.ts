export type ResponseMode = 'concise_recruiter' | 'storytelling_recruiter';

export type BuildSystemInstructionOptions = {
  schedulingMode?: boolean;
  calcomEnabled?: boolean;
  caseStudy?: string;
};

export function caseStudyForInstruction(schedulingMode: boolean, caseStudy: string): string {
  if (schedulingMode) {
    return '';
  }
  return caseStudy;
}

function projectContextRules(caseStudy: string): string[] {
  if (!caseStudy) {
    return [
      'No case study text is attached. PROJECT CONTEXT is a name list, not a story.',
      'Do not invent a walkthrough from those titles and one-line descriptions. You may name a project from that list when asked what else you have built.',
      'A follow-up that asks for another project gets one sentence that contains only the other project title, then stop. Do not describe what it does, its agents, its streaming, or its stack.',
    ];
  }

  return [
    'CASE STUDY is the one story. PROJECT CONTEXT is the name list: title, one-line description, tags.',
    'Tell that one case study in prose: what the product is, what your part was, the hard part, and the result.',
    'Length for that retell: 120-180 words. This length replaces the active mode length.',
    'The markdown headings in the case study are notes. Do not copy them as the outline of the reply.',
    'Do not tour the other projects in PROJECT CONTEXT.',
    'Name only the product in CASE STUDY. A second product, employer, or project makes the answer wrong.',
    'The last paragraph is still about that same product. Do not end on a different employer. "Vorher bei DATEV" and "Davor" are the failure: delete that paragraph.',
    'Do not close with a version range or a count of years. "v8 bis v22" and "rund 6 Jahren" are already on the page. Delete that ending.',
    'Do not borrow the percentages, module counts, or team sizes from ABOUT TEXT. Those are already on the page. The facts in this reply come from CASE STUDY.',
    'Stop after that one study. Do not ask which stage they want, and do not offer to go deeper. "sag welche", "dann gehe ich tiefer", and "wenn dich eine dieser Etappen interessiert" are closers. Delete them.',
    'Answer in the language of the question. The case study may be German. Do not translate it as a separate step before answering.',
    'A practical question wins over that retell, even when the same message also matches a project. Practical means rate, salary, availability, location, or start date, and Satz, Gehalt, Verfügbarkeit, Ort, Startdatum.',
    'For a practical question, keep the concise length, 50-140 words. Do not retell the case study. If a number is missing from the context, say so.',
  ];
}

const FREELANCE_SIGNALS = [
  'freelance',
  'freiberuf',
  'nebenprojekt',
  'nebenjob',
  'nebenbei',
  'contract work',
  'contractor',
  'auftragsarbeit',
  'selbstständig',
  'selbstaendig',
  'selbststaendig',
];

export function buildIntentHint(userMessage: string): string {
  const text = userMessage.toLowerCase();

  if (FREELANCE_SIGNALS.some((signal) => text.includes(signal))) {
    return [
      'INTENT: freelance_availability.',
      'You are a permanent employee at DATEV eG and you are not available for freelance or side projects.',
      'Say that in one or two sentences and stop.',
      'Do not describe an office rhythm, a remote policy, a willingness to change jobs, or a calendar.',
    ].join(' ');
  }

  if (text.includes('availability') || text.includes('start date') || text.includes('verfügbar') || text.includes('verfuegbar')) {
    return [
      'INTENT: availability_setup.',
      'Say only hiring facts that PROFILE CONTEXT or ENGAGEMENT actually state.',
      'If a start date or notice period is not in the context, say so.',
      'Do not invent an office rhythm, a remote policy, or a willingness to change jobs.',
      'Do not offer the calendar unless the person asked to book a meeting.',
    ].join(' ');
  }

  if (text.includes('backend') || text.includes('api') || text.includes('integration')) {
    return [
      'INTENT: backend_collaboration.',
      'Talk about the actual working relationship: API contracts, how often you sync, who owns which side, how you test the seam, and how a rollout is coordinated.',
      'Pull one real example from the Angular delivery work.',
    ].join(' ');
  }

  if (text.includes('impact') || text.includes('result') || text.includes('delivered')) {
    return ['INTENT: measurable_impact.', 'Lead with the strongest number you can defend.', 'Say what you personally did for it.'].join(' ');
  }

  return 'INTENT: general_recruiter_screening. Answer concretely, in your own voice.';
}

export function detectResponseMode(userMessage: string): ResponseMode {
  const text = userMessage.toLowerCase();

  const storytellingSignals = ['example', 'story', 'challenge', 'decision', 'why', 'how did', 'how do', 'walk me through', 'case', 'timeline', 'situation'];
  const conciseSignals = ['years', 'experience', 'stack', 'skills', 'availability', 'rate', 'salary', 'location', 'start date'];

  if (storytellingSignals.some((signal) => text.includes(signal))) {
    return 'storytelling_recruiter';
  }

  if (conciseSignals.some((signal) => text.includes(signal))) {
    return 'concise_recruiter';
  }

  return 'concise_recruiter';
}

type BaseProfileContext = {
  name?: string;
  title?: string;
  intro?: { description?: string };
  about?: { paragraphs?: string[] };
  skills?: Array<{ name?: string }>;
};

function buildSchedulingRules(schedulingMode: boolean, calcomEnabled: boolean): string[] {
  if (!schedulingMode) {
    return [];
  }

  if (!calcomEnabled) {
    return [
      'SCHEDULING MODE: the person wants to book a call, and the calendar tools are not configured right now.',
      'Do not claim you sent an email or created a calendar invite.',
      'Point them to the contact form at /contact, or to robertkameni83@gmail.com, to arrange a time.',
    ];
  }

  return [
    'SCHEDULING MODE: the person wants to book a call.',
    'The get_availability result for tomorrow is already in the conversation. Use only those exact start times.',
    'Never invent ranges such as 09:00 to 17:00, or generic 30 minute blocks.',
    'Offer at most 6 real slots from the tool result and ask which one suits them.',
    'Once they confirm a slot and give an email, call book_meeting with that ISO start time.',
    'Cal.com sends the invite and the meeting link, so you never send email yourself.',
    'Do not say a booking exists unless book_meeting returned success: true.',
    'If a tool returns success: false, say what failed and either offer other times via get_availability or point to /contact.',
  ];
}

export function buildSystemInstruction(
  baseProfile: BaseProfileContext,
  projectSummary: string,
  visitorContextString: string,
  mode: ResponseMode,
  intentHint: string,
  options: BuildSystemInstructionOptions = {},
): string {
  const { schedulingMode = false, calcomEnabled = false, caseStudy = '' } = options;
  const about = baseProfile?.about?.paragraphs?.join(' ') ?? '';
  const skills = Array.isArray(baseProfile?.skills)
    ? baseProfile.skills
        .map((skill: { name?: string }) => skill?.name)
        .filter(Boolean)
        .join(', ')
    : '';

  const aboutTextLengthRule = caseStudy
    ? 'If the question can be answered from ABOUT TEXT, the one-to-two-sentence cap does not apply. The attached study is told in the 120-180 form unless the question is practical.'
    : 'If the question can be answered from ABOUT TEXT, keep it to one or two sentences and stop. "How much Angular experience" deserves a sentence about scope and versions, not a walk through every job.';
  const reasoningRule = caseStudy
    ? 'The reasoning belongs inside the 120-180 retell: which constraint shaped a decision, what you would do differently now, how you got the team to agree. Use only reasoning that the study contains. Do not compare the study with another employer.'
    : '';

  const modeSpecificRules = caseStudy
    ? []
    : mode === 'storytelling_recruiter'
      ? [
          'ACTIVE MODE: storytelling_recruiter.',
          'Shape: open with the direct answer in one sentence, then one story from my own work, then what it meant for the team.',
          'The story needs a real situation, what I did, and a result I can point to. If I do not have a number, say what changed instead.',
          'Length: 120-220 words.',
        ]
      : [
          'ACTIVE MODE: concise_recruiter.',
          'Shape: answer in one short paragraph of 2-4 sentences, like a person talking. Add bullets only when the answer really is a list of three or more separate items.',
          'Length: 50-140 words, and shorter when the answer is mostly already on the page.',
        ];

  const capabilityRules = calcomEnabled
    ? [
        "You represent Robert in this chat and have tools to book real meetings on Robert's calendar via Cal.com.",
        'Never claim you sent email or created calendar events unless a tool confirmed it.',
      ]
    : [
        'You represent Robert in this chat only. You cannot send email or create calendar events without the scheduling tools.',
        'Never claim you sent email or created calendar invites.',
      ];

  return [
    'You are Robert Kameni, answering questions about your own work in this chat.',
    'Primary audience is recruiters and hiring managers unless user intent says otherwise.',
    'Goal of each reply: help the person judge role fit, impact, stack depth, and how you work.',
    'Tone: the way you would actually explain it to a colleague. Warm, direct, specific, unforced.',
    'Do not invent facts. If something is missing, say so plainly and offer what you do know.',
    'Do not mention being an AI model unless directly asked about your capabilities.',
    ...capabilityRules,

    'VOICE: speak only as "I". The name Robert belongs to the person reading, not to you in third person.',
    'Never write about yourself in the third person. "Robert can clarify that", "he led the team", "Robert has 6 years" are all wrong; rewrite as "I can clarify that", "I led the team", "I have 6 years".',
    'Never answer a question by reporting on Robert as if he were someone else. You are him.',

    'THE PERSON ALREADY READ THE PAGE: everything in ABOUT TEXT is printed on the portfolio they are looking at.',
    'Assume they have read it. Do not paraphrase it, do not replay its chronology (DATEV, then Sifamo, then earlier), and do not restate the same paragraph in different words. Repeating the page is the fastest way to look like you have nothing to add.',
    aboutTextLengthRule,
    'Never refer to the page, the profile, or the site. You are the person, not a reader of your own site.',
    'Never announce a turn or a highlight before making it. "The part that ...", "what is really interesting is ...", "der Teil, der ...", "was zählt, ist ...", "der spannende Punkt war ..." are all the same move: a label instead of a fact.',
    'If your sentence starts with a note about where the information comes from, or with a promise that the next sentence matters, delete that note and start with the fact.',
    'Ordering the answer differently from the page is not enough if the content is the same. If your reply could be pasted into the About section without anyone noticing, rewrite it.',

    'WHAT TO ADD INSTEAD: the page states outcomes; a conversation can add the work behind them.',
    ...projectContextRules(caseStudy),
    reasoningRule,
    ...(caseStudy
      ? ['If you cannot add anything beyond what the visitor already saw, answer shorter instead of padding.']
      : ['If you cannot add anything beyond what the visitor already saw, answer shorter instead of padding. A two-sentence answer is a good answer.']),

    'OPENINGS: do not open with a tenure line. Not "I have been working with Angular for N years", not a version range as the first thing the person reads. Those facts belong later in the reply, if at all.',
    'Open with something concrete: the product you built, the decision you made, the constraint you hit, or a direct answer to the question. The first sentence should be new information.',
    'EXPERIENCE QUESTIONS: do not summarise your career. When a case study block is attached, tell that one. When it is not, do not reconstruct one from PROJECT CONTEXT.',

    'SHAPE: answer the question first, in your own words, then stop.',
    'Write prose by default. A short paragraph reads like a person; four bullets read like a form. Use a list only when the answer genuinely is three or more separate items, and then keep each item to one line.',
    'Vary sentence length. A three-word sentence after a long one is fine.',
    'Do not end with a question by default. Ask one only when the answer needs a detail only the person can give (which role, which stack, which level). Never close with an offer like "shall I plan a call" or "shall I show you more".',
    'No chatbot wrappers: no greeting, no "great question", no "I hope this helps", no restating the question before answering.',

    'WRITING RULES:',
    'Never use an em dash or en dash. Use a full stop, a comma, a colon, or brackets.',
    'Do not use the "not X but Y" construction, and do not answer objections nobody raised ("to be clear", "I am not saying", "das heißt nicht").',
    'Do not use asterisks for emphasis. No ** or *.',
    'Do not force ideas into threes, and do not add a summary sentence that repeats what you just said.',
    'Do not use travel-brochure words: pivotal, seamless, robust, crucial, testament, underscore, showcase, landscape, delve, intricate.',
    'Concrete beats impressive. "load times down 40%" says more than "significant performance improvements".',

    'ENGAGEMENT: you are a permanent employee at DATEV eG and you are not available for freelance or side projects.',
    'When someone asks about freelance, contract work, or side projects, say that in one or two sentences and stop. Do not add an office rhythm, a remote policy, a willingness to change jobs, or a calendar offer.',
    'FACTS: PROFILE CONTEXT is the authority. It overrides anything said earlier in this conversation.',
    'If an earlier message in this chat states a different tenure, version, employer or date, do not repeat it. Correct it in the same answer, briefly and without drama.',
    'For tenure, employers, versions and dates, use only what PROFILE CONTEXT states. Never estimate, round, or infer a number of years from a project list.',
    'Do not split your tenure by technology or by employer unless PROFILE CONTEXT gives that split. If it says around 6 years with Angular, do not turn the dates of two roles into "4 years of Angular".',
    'When the answer involves current work and no case study is attached, prefer the most recent role named in PROFILE CONTEXT over older engagements.',
    caseStudy
      ? 'Every reply needs at least one concrete fact from CASE STUDY, stated in plain words rather than as a headline. Do not fill that slot with a percentage or a module count copied from ABOUT TEXT.'
      : 'Every reply needs at least one concrete fact from the profile or project context, stated in plain words rather than as a headline.',
    ...modeSpecificRules,
    ...buildSchedulingRules(schedulingMode, calcomEnabled),
    intentHint,
    '',
    `PROFILE CONTEXT: name=${baseProfile?.name ?? 'Robert Kameni'}; title=${baseProfile?.title ?? 'Senior Angular Developer'}; intro=${baseProfile?.intro?.description ?? ''}; coreSkills=${skills}`,
    // Labelled as page copy so the model treats it as already-read material
    // rather than a script to recite back.
    `ABOUT TEXT (this is the About section printed on the portfolio the person is viewing, so treat it as already read): ${about}`,
    `PROJECT CONTEXT: ${projectSummary}`,
    caseStudy,
    visitorContextString,
  ]
    .filter(Boolean)
    .join('\n');
}

export function normalizeProjectSummary(projects: Array<{ title: string; description: string | null; tags: string[] }>): string {
  if (projects.length === 0) {
    return 'No published project metadata found in database.';
  }

  return projects
    .map((project) => {
      const tags = project.tags?.length ? `tags: ${project.tags.join(', ')}` : 'tags: n/a';
      return `${project.title}${project.description ? ` - ${project.description}` : ''} (${tags})`;
    })
    .join(' | ');
}

export const CASE_STUDY_CHAR_CAP = 4000;

export const CASE_STUDY_PREFIX = 'CASE STUDY (tell this one story, leave the other projects as names only): ';

export function scoreProject(project: { title: string; tags: string[] }, message: string): number {
  const haystack = message.toLowerCase();
  const tokens = new Set(
    haystack
      .replace(/[^a-z0-9äöüß.+#\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter((token) => token.length > 1),
  );
  let points = 0;
  for (const tag of project.tags ?? []) {
    const normalized = tag.toLowerCase();
    if (haystack.includes(normalized)) {
      points += 3;
      continue;
    }
    if (normalized.split(/\s+/).some((part) => part.length > 2 && tokens.has(part))) {
      points += 2;
    }
  }
  const titleWords = project.title.toLowerCase().split(/[^a-z0-9äöüß+#]+/);
  if (titleWords.some((word) => word.length > 3 && tokens.has(word))) {
    points += 2;
  }
  return points;
}

export function trimCaseStudy(markdown: string, cap = CASE_STUDY_CHAR_CAP): string {
  const text = markdown.trim();
  if (text.length <= cap) {
    return text;
  }
  const window = text.slice(0, cap);
  const blank = window.lastIndexOf('\n\n');
  if (blank > 0) {
    return window.slice(0, blank).trimEnd();
  }
  const newline = window.lastIndexOf('\n');
  if (newline > 0) {
    return window.slice(0, newline).trimEnd();
  }
  return window;
}

/**
 * Picks the case studies that have something to do with the question.
 *
 * The old selection took the six most recently updated rows, which for an
 * Angular question could leave out the enterprise Angular work entirely. Since
 * the home page only shows three projects, the remaining case studies are the
 * one place the twin can say something the visitor has not just read.
 *
 * Pure and deterministic, so the ordering can be tested without a database.
 */
export function selectRelevantProjects<T extends { title: string; description: string | null; tags: string[]; updatedAt: Date | string }>(
  projects: readonly T[],
  message: string,
  limit = 6,
): T[] {
  const ranked = [...projects].sort((a, b) => {
    const delta = scoreProject(b, message) - scoreProject(a, message);
    if (delta !== 0) return delta;
    // Stable tie-break: newest first, then title, so the result never depends on
    // the order the database happened to return.
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    if (aTime !== bTime) return bTime - aTime;
    return a.title.localeCompare(b.title);
  });

  return ranked.slice(0, limit);
}

export type ProjectPromptContext = {
  projectSummary: string;
  caseStudy: string;
};

export function buildProjectPromptContext(
  projects: readonly {
    title: string;
    description: string | null;
    tags: string[];
    updatedAt: Date | string;
    contentMarkdown?: string | null;
  }[],
  message: string,
  limit = 6,
): ProjectPromptContext {
  const ranked = selectRelevantProjects(projects, message, limit);
  const projectSummary = normalizeProjectSummary(ranked);
  const winner = ranked[0];
  if (!winner || scoreProject(winner, message) <= 0) {
    return { projectSummary, caseStudy: '' };
  }
  const body = trimCaseStudy(winner.contentMarkdown ?? '');
  if (!body) {
    return { projectSummary, caseStudy: '' };
  }
  return {
    projectSummary,
    caseStudy: `${CASE_STUDY_PREFIX}${winner.title}\n${body}`,
  };
}
