import { defineEventHandler, getQuery } from 'h3';
import { GenerativeModel } from '@google/generative-ai';
import { getGeminiClient } from '../../../../ai/gemini.client';
import { prisma } from '../../../../db/client';
import { profileRepository } from '../../../../db/repositories/profile.repository';
import { defaultProfile } from '../../../../data/default-profile';

type ResponseMode = 'concise_recruiter' | 'storytelling_recruiter';

function buildIntentHint(userMessage: string): string {
  const text = userMessage.toLowerCase();

  if (text.includes('availability') || text.includes('start date') || text.includes('available')) {
    return [
      'INTENT: availability_setup.',
      'Do not say you are only a digital twin or that you cannot have availability.',
      'Answer in first person with practical hiring context: preferred setup, collaboration style, and willingness to align on start date.',
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

function detectResponseMode(userMessage: string): ResponseMode {
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

function buildSystemInstruction(baseProfile: any, projectSummary: string, visitorContextString: string, mode: ResponseMode, intentHint: string): string {
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

  return [
    'You are Robert Kameni speaking in first person.',
    'Primary audience is recruiters and hiring managers unless user intent says otherwise.',
    'Goal of each reply: help the user evaluate role fit, impact, stack depth, and collaboration style.',
    'Tone: human, warm, direct, specific, and concise.',
    'Do not invent facts. If data is missing, say it clearly and propose a concrete follow-up.',
    'Never break character. Do not mention being an AI model or digital twin.',
    'Avoid markdown emphasis with asterisks. Do not use * or **.',
    'Keep answers focused on outcomes: responsibilities, architecture decisions, measurable impact, and delivery timelines.',
    'Avoid generic claims. Every answer must include at least one concrete fact from profile or project context.',
    'Use plain markdown bullets with - when listing points.',
    ...modeSpecificRules,
    intentHint,
    '',
    `PROFILE CONTEXT: name=${baseProfile?.name ?? 'Robert Kameni'}; title=${baseProfile?.title ?? 'Senior Angular Developer'}; intro=${baseProfile?.intro?.description ?? ''}; about=${about}; coreSkills=${skills}`,
    `PROJECT CONTEXT: ${projectSummary}`,
    visitorContextString,
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeProjectSummary(projects: Array<{ title: string; description: string | null; tags: string[] }>): string {
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

export default defineEventHandler(async (event) => {
  event.node.res.setHeader('Content-Type', 'text/event-stream');
  event.node.res.setHeader('Cache-Control', 'no-cache');
  event.node.res.setHeader('Connection', 'keep-alive');
  event.node.res.setHeader('X-Accel-Buffering', 'no');

  const { sessionId, message, history } = getQuery(event);

  if (!message || typeof message !== 'string') {
    event.node.res.write(`data: ${JSON.stringify({ error: 'No message provided.' })}\n\n`);
    event.node.res.end();
    return;
  }

  const baseProfile = (await profileRepository.find()) ?? defaultProfile;
  const publishedProjects = await prisma.project.findMany({
    where: { isPublished: true },
    select: { title: true, description: true, tags: true },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  });
  const projectSummary = normalizeProjectSummary(publishedProjects);
  const responseMode = detectResponseMode(message);
  const intentHint = buildIntentHint(message);

  let model: GenerativeModel;
  let visitorContextString = '';
  try {
    const genAI = getGeminiClient();
    model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemInstruction(baseProfile, projectSummary, visitorContextString, responseMode, intentHint),
    });
  } catch (error) {
    event.node.res.write(`data: ${JSON.stringify({ error: 'AI service unavailable.' })}\n\n`);
    event.node.res.end();
    return;
  }

  // 1. Parse the history passed from the frontend
  let parsedHistory: any[] = [];
  if (typeof history === 'string') {
    try {
      parsedHistory = JSON.parse(history);
    } catch (e) {
      console.error('[SSE] Failed to parse chat history:', e);
    }
  }

  // 2. Fetch visitor classification to adapt the style and focus.
  if (sessionId && typeof sessionId === 'string') {
    try {
      const session = await prisma.visitorSession.findUnique({
        where: { clientSessionId: sessionId },
        include: { visitor: { include: { profile: true } } },
      });

      if (session?.visitor?.profile?.profileData) {
        const profile = session.visitor.profile.profileData as any;
        const interests = Array.isArray(profile.interests) && profile.interests.length ? profile.interests.join(', ') : 'none detected';
        visitorContextString = `VISITOR CONTEXT: visitorType=${profile.visitorType ?? 'unknown'}; interests=${interests}. Adapt examples and priorities to this audience.`;

        // Inject this context into the system instruction for this specific run
        model = getGeminiClient().getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: buildSystemInstruction(baseProfile, projectSummary, visitorContextString, responseMode, intentHint),
        });
      }
    } catch (e) {
      console.error('[SSE] Failed to fetch visitor profile for context:', e);
    }
  }

  const chat = model.startChat({
    history: parsedHistory,
    generationConfig: {
      maxOutputTokens: 800,
    },
  });

  try {
    const stream = await chat.sendMessageStream(message);

    for await (const chunk of stream.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        event.node.res.write(`data: ${JSON.stringify({ token: chunkText })}\n\n`);

        if (typeof (event.node.res as any).flush === 'function') {
          (event.node.res as any).flush();
        }
      }
    }

    event.node.res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    event.node.res.end();
  } catch (error) {
    event.node.res.write(`data: ${JSON.stringify({ error: 'Error processing AI response.' })}\n\n`);
    event.node.res.end();
  }

  event.node.req.on('close', () => {
    // Client disconnected
  });

  return new Promise(() => {});
});
