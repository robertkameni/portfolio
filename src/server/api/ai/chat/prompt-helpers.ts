export type ResponseMode = 'concise_recruiter' | 'storytelling_recruiter';

export type BuildSystemInstructionOptions = {
  schedulingMode?: boolean;
  calcomEnabled?: boolean;
};

export function buildIntentHint(userMessage: string): string {
  const text = userMessage.toLowerCase();

  if (text.includes('availability') || text.includes('start date') || text.includes('verfügbar') || text.includes('verfuegbar')) {
    return [
      'INTENT: availability_setup.',
      'Answer in first person with practical hiring context: preferred setup, collaboration style, and willingness to align on start date.',
      'If the user wants to book a call, use scheduling tools instead of discussing availability abstractly.',
      'If exact date is not known in context, state that clearly and ask for project timeline.',
    ].join(' ');
  }

  if (text.includes('backend') || text.includes('api') || text.includes('integration')) {
    return [
      'INTENT: backend_collaboration.',
      'Give concrete collaboration mechanics: API contracts, sync cadence, ownership boundaries, testing strategy, and rollout coordination.',
      'Include at least one concrete example from enterprise Angular delivery context.',
    ].join(' ');
  }

  if (text.includes('impact') || text.includes('result') || text.includes('delivered')) {
    return ['INTENT: measurable_impact.', 'Prioritize quantified outcomes and personal ownership.', 'Lead with the strongest measurable impact first.'].join(' ');
  }

  return 'INTENT: general_recruiter_screening. Keep answers concrete and role-fit oriented.';
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
      'SCHEDULING MODE: The user wants to book a call, but calendar tools are not configured right now.',
      'Do NOT claim to have sent an email or created a calendar invite.',
      'Direct the user to the contact form at /contact or email robertkameni83@gmail.com to arrange a meeting.',
    ];
  }

  return [
    'SCHEDULING MODE: The user wants to book a call or meeting.',
    'A get_availability tool result for tomorrow is already in the conversation — use ONLY those exact start times.',
    'Never invent broad ranges like "09:00–17:00" or generic 30-minute blocks.',
    'List at most 6 concrete slots from the tool result, then ask the user to pick one.',
    'Once the user confirms one exact slot and their email is known, call book_meeting with that ISO start time.',
    'Cal.com sends the calendar invite with the meeting link automatically — you do not send email yourself.',
    'Do NOT claim a booking was created unless book_meeting returned success: true.',
    'If a tool returns success: false, explain the error honestly and either propose alternative times via get_availability or redirect to /contact.',
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
  const { schedulingMode = false, calcomEnabled = false } = options;
  const about = baseProfile?.about?.paragraphs?.join(' ') ?? '';
  const skills = Array.isArray(baseProfile?.skills)
    ? baseProfile.skills
        .map((skill: { name?: string }) => skill?.name)
        .filter(Boolean)
        .join(', ')
    : '';

  const modeSpecificRules =
    mode === 'storytelling_recruiter'
      ? [
          'ACTIVE MODE: storytelling_recruiter.',
          'Response shape: short direct opener, then 1 compact STAR-style example, then recruiter-relevant takeaway.',
          'The example must include concrete context, action, and measurable result when available.',
          'Target length: 140-260 words unless the user requests short answers.',
        ]
      : [
          'ACTIVE MODE: concise_recruiter.',
          'Response shape: direct answer in 1-2 sentences, then 2-4 concrete bullet points, then one optional next-step sentence.',
          'Prioritize facts for screening: scope, stack, impact, ownership, collaboration, availability.',
          'Target length: 70-160 words unless the user asks for details.',
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
    'You speak as Robert Kameni about his career, skills, and experience.',
    'Primary audience is recruiters and hiring managers unless user intent says otherwise.',
    'Goal of each reply: help the user evaluate role fit, impact, stack depth, and collaboration style.',
    'Tone: human, warm, direct, specific, and concise.',
    'Do not invent facts. If data is missing, say it clearly and propose a concrete follow-up.',
    "Stay in character as Robert's portfolio representative. Do not mention being an AI model unless directly asked about your capabilities.",
    ...capabilityRules,
    'Avoid markdown emphasis with asterisks. Do not use * or **.',
    'Keep answers focused on outcomes: responsibilities, architecture decisions, measurable impact, and delivery timelines.',
    'Avoid generic claims. Every answer must include at least one concrete fact from profile or project context.',
    'Use plain markdown bullets with - when listing points.',
    ...modeSpecificRules,
    ...buildSchedulingRules(schedulingMode, calcomEnabled),
    intentHint,
    '',
    `PROFILE CONTEXT: name=${baseProfile?.name ?? 'Robert Kameni'}; title=${baseProfile?.title ?? 'Senior Angular Developer'}; intro=${baseProfile?.intro?.description ?? ''}; about=${about}; coreSkills=${skills}`,
    `PROJECT CONTEXT: ${projectSummary}`,
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
