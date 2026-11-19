import type { SiteCopy } from './site-copy.types';

export const EN_COPY: SiteCopy = {
  footer: { copyright: '© {year} Robert Kameni Namou' },
  common: {
    showMore: 'show more',
    showLess: 'show less',
  },
  home: {
    founder: 'Founder',
    recruiter: 'Recruiter',
    developer: 'Developer',
    reset: 'Reset',
    adminPage: 'Admin Page',
    admin: 'Admin',
    loadingProfile: 'Loading system architecture...',
    failedProfile: 'Failed to load profile. Please refresh.',
  },
  intro: {
    socialLinkAriaLabel: "Visit Robert's {platform} profile (opens in a new tab)",
  },
  nav: {
    label: 'On this page',
    about: 'About',
    contact: 'Contact',
    cv: 'CV (German)',
  },
  focus: { title: 'What I do' },
  stack: { eyebrow: 'Toolset' },
  skills: {
    title: 'Technical Arsenal',
  },
  projects: {
    eyebrow: 'Selected work',
    title: 'Projects',
    description: 'A few published projects shown here. Open the full list to see everything.',
    viewAll: 'View all projects',
    loading: 'Loading projects...',
    error: 'Could not load projects.',
    empty: 'No projects published yet.',
    unavailable: 'Case write-ups are in progress.',
    viewLive: 'View live',
    viewLiveAriaLabel: 'View live: {title} (opens in a new tab)',
    openProjectCta: 'Open →',
    openProjectAriaLabel: 'Open project: {title}',
  },
  projectsPage: {
    title: 'Projects',
    backToPortfolio: 'Back to Portfolio',
    loading: 'Loading projects...',
    error: 'Could not load projects.',
    empty: 'No projects published yet.',
    filterLabel: 'Filter by stack',
    filterAll: 'All',
    filterAngular: 'Angular',
    filterReact: 'React & Next.js',
    filterCountAriaLabel: '{count} projects',
    filterEmpty: 'No project in this stack.',
  },
  notFoundPage: {
    statusLabel: '404',
    title: 'This page does not exist',
    description: 'The link is outdated or the address contains a typo.',
    linksLabel: 'Continue to',
    home: 'Back to the home page',
    projects: 'View projects',
  },
  projectDetail: {
    backToProjects: 'Back to projects',
    loading: 'Loading project...',
    published: 'Published',
    draft: 'Draft',
    overview: 'Overview',
    emptyDescription: 'This project does not have a long-form description yet. The summary above is the current overview.',
    liveSiteHeading: 'Live site',
    liveSiteLinkLabel: 'Visit live site',
    liveSiteAriaLabel: 'Visit live site (opens in a new tab)',
    zoomTriggerAriaLabel: 'Open screenshot at full size: {title}',
    zoomDialogLabel: 'Screenshot at full size',
    zoomClose: 'Close',
    notFoundTitle: 'Project not found',
    loadErrorTitle: 'Could not load project',
    notFoundMessage: 'The project slug does not exist or the project is not published yet.',
    loadErrorMessage: 'Failed to load project details.',
    factsHeading: 'At a glance',
    stackHeading: 'Stack',
    nextProjectHeading: 'Next project',
  },
  devProxy: {
    label: 'Live',
    back: 'Back',
    home: 'Home',
    admin: 'Admin',
  },
  chat: {
    title: 'Digital Twin',
    subtitle: 'Ask me anything about Robert',
    introLine1: "Hi. I'm Robert's digital twin.",
    introLine2: 'I can answer questions about his projects, stack, and experience.',
    promptAngular: 'Tell me about your Angular experience',
    promptFreelance: 'Are you available for freelance work?',
    typingSrOnly: 'AI is typing...',
    placeholder: 'Type your message...',
    toggleOpenAriaLabel: 'Ask the twin: open the chat',
    toggleCloseAriaLabel: 'Close chat',
    sendAriaLabel: 'Send message',
    launcherLabel: 'Ask the twin',
    inputAriaLabel: 'Your message to the twin',
  },
  twinInvite: {
    title: 'Ask the twin',
    description: 'An AI stand-in with my case studies loaded. Ask what the page does not cover.',
    prompts: ['Tell me about your Angular experience', 'Are you available for freelance work?', 'What have you built with Next.js?'],
  },
  adminLogin: {
    title: 'Admin Login',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    invalidCredentials: 'Invalid credentials.',
    accessDenied: 'Access denied: admins only.',
    accessDeniedToast: 'Only administrators can log into the portfolio. Please contact the site owner if needed.',
  },
  adminProjects: {
    newProject: 'New Project',
    cancel: 'Cancel',
    title: 'Projects',
    subtitle: 'Manage published and draft projects',
    createSuccess: 'Project created successfully.',
    createFormTitle: 'Create Project',
    createSubmitLabel: 'Create Project',
    createSubmittingLabel: 'Creating...',
    loading: 'Loading projects...',
    loadingIdle: 'Loading...',
    published: 'Published',
    draft: 'Draft',
    view: 'View👁️',
    edit: 'Edit ✏️',
    delete: 'Delete🗑️',
    empty: 'No projects yet. Create your first one.',
    failedLoad: 'Failed to load projects',
    failedCreate: 'Failed to create project',
    failedDelete: 'Failed to delete project',
    confirmDelete: 'Are you sure you want to delete the project "{title}"?',
  },
  projectForm: {
    titleLabel: 'Title *',
    slugLabel: 'Slug *',
    descriptionLabel: 'Description',
    contentMarkdownLabel: 'Overview (Markdown)',
    coverImageUrlLabel: 'Cover Image URL',
    tagsLabel: 'Tags (comma-separated)',
    tagsPlaceholder: 'Angular, TypeScript, SSR',
    projectUrlLabel: 'Live site URL',
    projectUrlPlaceholder: 'https://example.com',
    cancel: 'Cancel',
    publishImmediately: 'Publish immediately',
    titleRequired: 'Title is required',
    slugRequired: 'Slug is required',
  },
  about: {
    adaptiveTitle: {
      recruiter: 'Technical lead for enterprise Angular',
      founder: 'SaaS from zero to one',
      developer: 'Modern Angular in production',
      hiringManager: 'Lead frontend delivery',
    },
    founderParagraphs: [
      'I take SaaS products from 0 to 1 and sort out architecture early so later growth does not pile up avoidable technical debt.',
      'I work with modern Angular, Nitro backends, and LLM features where they earn their place. Releases stay fast without turning unstable.',
    ],
    recruiterParagraphs: [
      'As a technical lead I help the team move faster, keep quality visible, and ship complex enterprise Angular applications on schedule.',
      'In large Scrum teams I handle technical direction, CI/CD, and AI-assisted tooling so delivery dates stay realistic.',
    ],
    developerParagraphs: [
      'Most of my work sits in modern Angular. I move legacy apps toward zoneless setups with Signals and use the NgRx Signal Store for state.',
      'Nx monorepos, awkward architecture, and AI/LLM hooks show up often. If you want to talk reactive patterns, get in touch.',
    ],
    previewSplitToken: 'Signals and NgRx Signal Store.',
    metric: { value: '70%', caption: 'faster team delivery at DATEV' },
  },
  contact: {
    validation: {
      emailRequired: 'Email is required',
      messageRequired: 'Message is required',
    },
    adaptiveTitle: {
      recruiter: 'Talk about your open role',
      founder: 'Talk through your product idea',
      developer: 'Angular, SSR, and tooling',
    },
    adaptiveDescription: {
      recruiter: 'Hiring for Angular with lead-level experience? Send a message and we can line up a call.',
      founder: 'Want to start building? Describe the idea and we can talk through architecture and roadmap.',
      developer: 'Working on Signals, SSR, Nitro, or AI integration? Send a technical question or what you are building and we can compare notes.',
    },
    adaptivePlaceholder: {
      recruiter: "Hi Robert, we're looking for an Angular expert...",
      founder: 'Hi Robert, I have an idea for a SaaS...',
      developer: 'Hi Robert, curious how you handled …',
      default: 'Message',
    },
    adaptiveButtonText: {
      recruiter: 'Schedule an Interview',
      founder: 'Discuss My Project',
      developer: 'Send Message',
      default: 'Send Message',
    },
    placeholderName: 'Name',
    placeholderEmail: 'Email',
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message',
    sendLabel: 'Send message',
    sendingLabel: 'Sending',
    submitSuccess: 'Message sent successfully! I will get back to you soon.',
    submitError: 'Failed to send message. Please try again or email me directly.',
  },
  hero: {
    defaultTitle: 'Technical Lead Frontend Engineer',
    adaptiveTitle: {
      recruiter: 'Senior engineer for frontend projects',
      founder: 'Frontend and APIs for early-stage products',
      developer: 'Angular, Node, and AI architecture',
    },
    frontend: {
      default: {
        description: 'Modern Angular web apps using the current reactive primitives: Signals, zoneless options, and the rest of the stack as it ships.',
        items: [
          {
            title: 'Reactive UI',
            description: 'Zoneless Angular, Signals, and NgRx Signal Store for state you can follow in code review.',
          },
          {
            title: 'Testing',
            description: 'End-to-end coverage with Playwright and unit tests with Jest.',
          },
          {
            title: 'Performance',
            description: 'Core Web Vitals, SSR hydration, and Nx monorepos when the codebase outgrows a single app.',
          },
          {
            title: 'Next.js and React',
            description: 'App Router with React 19, Server Components, and streamed responses, including AI-facing UI.',
          },
        ],
      },
      founder: {
        description: 'Fast interfaces that still work when requirements change every sprint.',
        items: [
          {
            title: 'MVP delivery',
            description: 'Current toolchains for MVPs without piling on debt you pay for later.',
          },
          {
            title: 'Speed and SEO',
            description: 'Quick loads and SSR that help retention and search visibility.',
          },
          {
            title: 'Release checks',
            description: 'Playwright and Jest in CI so UI regressions surface before users see them.',
          },
          {
            title: 'Full stack, one deploy',
            description: 'Next.js as the product shell: pages, API routes, and database access in one deploy, without a separate backend service.',
          },
        ],
      },
      recruiter: {
        description: 'Enterprise Angular frontends with maintainable code, room for more developers on the team, and consistent UI patterns.',
        items: [
          {
            title: 'Team standards',
            description: 'Modern Angular patterns and clear architecture rules the whole squad can follow.',
          },
          {
            title: 'Testing culture',
            description: 'Jest and Playwright automation so releases do not depend on manual click-throughs.',
          },
          {
            title: 'Nx and CI/CD',
            description: 'Nx workspaces and pipelines sized for large, multi-team setups.',
          },
          {
            title: 'Second framework stack',
            description: 'Production Next.js and React 19 beside Angular, with App Router and Server Components.',
          },
        ],
      },
      developer: {
        description: 'Angular work with strong reactivity, strict typing, and patterns that survive refactors.',
        items: [
          {
            title: 'Signals and RxJS',
            description: 'Signals next to RxJS streams and zoneless setup where the app needs it.',
          },
          {
            title: 'Typed templates',
            description: 'Strict template typing and Playwright tests for behavior that matters.',
          },
          {
            title: 'Runtime performance',
            description: 'Hydration choices, lazy routes, and change detection that does not waste cycles.',
          },
          {
            title: 'React ecosystem',
            description: 'Next.js App Router, Server Components, React 19, streaming responses, and React hydration.',
          },
        ],
      },
    },
    backend: {
      default: {
        description: 'APIs and services with tests and types kept honest across the stack.',
        items: [
          {
            title: 'APIs and services',
            description: 'Typed REST and realtime APIs on Node.js (Nitro) and Java Spring Boot.',
          },
          {
            title: 'Backend tests',
            description: 'Unit and integration tests with JUnit 5, Mockito, and Testcontainers.',
          },
          {
            title: 'Cloud and data',
            description: 'PostgreSQL with Prisma and deployments aimed at zero downtime at the edge.',
          },
          {
            title: 'Security and sessions',
            description: 'Short-lived access tokens with refresh rotation, httpOnly cookies and SameSite=strict, plus CSP reports on public endpoints.',
          },
        ],
      },
      founder: {
        description: 'Infrastructure that stays up without oversized bills, plus AI features when the product needs them.',
        items: [
          {
            title: 'AI in the API',
            description: 'Agents and LLM calls wired into the API layer your product already uses.',
          },
          {
            title: 'Edge scaling',
            description: 'Cloud edge runtimes that scale when traffic spikes and shrink when it drops.',
          },
          {
            title: 'Continuous delivery',
            description: 'Deployment pipelines that ship often and catch breakages in test before production.',
          },
          {
            title: 'Security from day one',
            description: 'Auth, sessions, and input validation ship with the product instead of a late hardening pass.',
          },
        ],
      },
      recruiter: {
        description: 'Backend services with clear QA expectations and architecture that survives enterprise load.',
        items: [
          {
            title: 'APIs and services',
            description: 'Typed REST and realtime APIs on Node.js (Nitro) and Java Spring Boot.',
          },
          {
            title: 'Testing culture',
            description: 'TDD where it helps and API integration tests that catch regressions before release.',
          },
          {
            title: 'CI/CD',
            description: 'Build and deploy pipelines the team can run without heroics every Friday.',
          },
          {
            title: 'Enterprise security',
            description: 'Separate access and refresh tokens, httpOnly cookies, and CSP reporting to your standards.',
          },
        ],
      },
      developer: {
        description: 'Backends with end-to-end types, tests you trust, and architecture you can change without a rewrite.',
        items: [
          {
            title: 'Types across the stack',
            description: 'Prisma, Nitro, and generics so API contracts match what the client compiles against.',
          },
          {
            title: 'Backend tests',
            description: 'JUnit 5, Mockito, and Testcontainers suites that hit a real database in CI.',
          },
          {
            title: 'Cloud and data',
            description: 'PostgreSQL with Prisma and edge deployments planned for zero downtime.',
          },
          {
            title: 'Auth architecture',
            description: 'JWT verification in middleware, refresh rotation, and strict cookie flags behind the session layer.',
          },
        ],
      },
    },
  },
};
