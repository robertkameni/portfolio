import type { SiteCopy } from "./site-copy.types";

export const EN_COPY: SiteCopy = {
    common: {
      showMore: 'show more...',
      showLess: 'show less...',
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
    skills: {
      title: 'Technical Arsenal',
    },
    projects: {
      eyebrow: 'Selected work',
      title: 'Projects',
      description: 'A small preview of published work. Open the full overview to browse every project.',
      viewAll: 'View all projects',
      loading: 'Loading projects...',
      error: 'Could not load projects.',
      empty: 'No projects published yet.',
      openProjectCta: 'Open →',
      openProjectAriaLabel: 'Open project: {title}',
    },
    projectsPage: {
      title: 'Projects',
      backToPortfolio: 'Back to Portfolio',
      loading: 'Loading projects...',
      error: 'Could not load projects.',
      empty: 'No projects published yet.',
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
      liveSiteAriaLabel: 'Open live project site in a new tab',
      notFoundTitle: 'Project not found',
      loadErrorTitle: 'Could not load project',
      notFoundMessage: 'The project slug does not exist or the project is not published yet.',
      loadErrorMessage: 'Failed to load project details.',
    },
    devProxy: {
      label: 'Dev Preview',
      back: 'Back',
      home: 'Home',
      admin: 'Admin',
    },
    chat: {
      title: 'Digital Twin',
      subtitle: 'Ask me anything about Robert',
      introLine1: "Hi! I'm Robert's AI Digital Twin.",
      introLine2: 'I know his projects, stack, and experience.',
      promptAngular: 'Tell me about your Angular experience',
      promptFreelance: 'Are you available for freelance work?',
      typingSrOnly: 'AI is typing...',
      placeholder: 'Type your message...',
      toggleOpenAriaLabel: 'Open chat with the digital twin',
      toggleCloseAriaLabel: 'Close chat',
      sendAriaLabel: 'Send message',
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
        recruiter: 'A Reliable Engineering Partner',
        founder: 'Building Your Vision, End-to-End',
        developer: 'An Architect Who Loves the Code',
        hiringManager: 'Ready to Lead & Deliver',
      },
      founderParagraphs: [
        'I specialize in bringing ambitious SaaS products from 0 to 1. My focus is on establishing a clean, scalable architecture early on, ensuring your application can handle rapid growth without accumulating technical debt.',
        'Founders need speed to market without sacrificing product stability. I architect end-to-end solutions using modern Angular and Nitro backends that allow your product to pivot quickly. Furthermore, I leverage Large Language Models (LLMs) and custom AI agents to build highly intelligent, scalable features that give your platform a competitive edge from day one.',
      ],
      recruiterParagraphs: [
        'As a Technical Lead, I bring a proven track record of significantly increasing development team efficiency, establishing strict code quality standards, and successfully delivering highly complex enterprise-grade Angular applications.',
        'I excel in large-scale, multi-team Scrum environments. Beyond writing clean code, I focus heavily on mentoring junior and mid-level developers, streamlining CI/CD pipelines, and integrating AI-driven tooling to accelerate the software development lifecycle across the engineering department.',
      ],
      developerParagraphs: [
        'I am deeply passionate about the modern Angular ecosystem and pushing the framework to its limits. I love migrating legacy applications to zoneless architectures using Angular Signals and building robust, predictable state management systems with the NgRx Signal Store.',
        "I enjoy solving complex architectural challenges, setting up scalable Nx monorepo structures, and exploring how we can use AI logic and LLMs to power highly scalable, self-adapting application architectures. If you're interested in discussing reactive programming patterns or AI integration, let's connect.",
      ],
      previewSplitToken: 'Signals and NgRx Signal Store.',
    },
    contact: {
      validation: {
        emailRequired: 'Email is required',
        messageRequired: 'Message is required',
      },
      adaptiveTitle: {
        recruiter: "Let's Talk About Your Next Big Hire",
        founder: "Let's Bring Your Idea to Life",
        developer: 'Trade Notes on Angular, SSR & Tooling',
      },
      adaptiveDescription: {
        recruiter: "Looking for a seasoned Angular engineer? Drop me a message and let's schedule an interview.",
        founder: "Ready to start building? Contact me and let's discuss your product's architecture and roadmap.",
        developer: "Into Signals, SSR, Nitro, or pragmatic AI integration? Leave a technical question or something you're working on, and we can compare approaches.",
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
      submitSuccess: 'Message sent successfully! I will get back to you soon.',
      submitError: 'Failed to send message. Please try again or email me directly.',
    },
    hero: {
      defaultTitle: 'Technical Lead Frontend Specialist',
      adaptiveTitle: {
        recruiter: 'Senior Engineer Ready to Drive Your Next Project',
        founder: 'Architecting Scalable Solutions for Ambitious Startups',
        developer: 'Deep Dives into Angular, Node, and AI Architecture',
      },
      frontend: {
        default: {
          description: "Engineering modern, high-performance web applications using Angular's latest reactive primitives.",
          items: [
            {
              title: 'Reactive UI Architecture:',
              description: 'Zoneless Angular, Signals, and NgRx SignalStore for highly predictable state management.',
            },
            {
              title: 'Frontend Quality Assurance:',
              description: 'Implementing strict end-to-end testing with Playwright and rapid unit coverage via Jest.',
            },
            {
              title: 'Performance & Scaling:',
              description: 'Deep optimization of Core Web Vitals, SSR hydration, and structuring scalable Nx monorepos.',
            },
          ],
        },
        founder: {
          description: 'Building highly responsive, conversion-optimized interfaces that adapt instantly to your changing business needs.',
          items: [
            {
              title: 'Rapid Execution:',
              description: 'Leveraging modern toolchains for fast MVP delivery without accumulating technical debt.',
            },
            {
              title: 'Conversion-First:',
              description: 'Lightning-fast load times and seamless SSR to maximize user retention and SEO.',
            },
            {
              title: 'Reliable Releases:',
              description: 'Automated frontend testing with Playwright and Jest to ensure UI features never break.',
            },
          ],
        },
        recruiter: {
          description: 'Delivering enterprise-grade frontend applications with a focus on code maintainability, team scalability, and UI consistency.',
          items: [
            {
              title: 'Technical Leadership:',
              description: 'Mentoring teams on modern Angular paradigms and enforcing clean architectural standards.',
            },
            {
              title: 'Testing Culture:',
              description: 'Spearheading UI test automation with Jest and Playwright to guarantee stability across releases.',
            },
            {
              title: 'Scalable Workflows:',
              description: 'Structuring Nx workspaces and CI/CD pipelines for large, multi-team enterprise environments.',
            },
          ],
        },
        developer: {
          description: 'Pushing the boundaries of the Angular ecosystem with advanced reactivity, strict typing, and elegant design patterns.',
          items: [
            {
              title: 'Signal Architecture:',
              description: 'Deep integration of Signals, complex RxJS streams, and strictly zoneless state engines.',
            },
            {
              title: 'Type-Safe Tooling:',
              description: 'Leveraging strictly typed templates and enforcing deterministic behavioral testing via Playwright.',
            },
            {
              title: 'Performance Primitives:',
              description: 'Optimizing hydration strategies, lazy-loaded routes, and efficient change detection cycles.',
            },
          ],
        },
      },
      backend: {
        default: {
          description: 'Architecting resilient APIs and maintaining uncompromising software quality across the entire stack.',
          items: [
            {
              title: 'API & Microservices:',
              description: 'Architecting type-safe, scalable REST and realtime APIs with Node.js (Nitro) and Java Spring Boot.',
            },
            {
              title: 'Quality Assurance:',
              description: 'Implementing comprehensive unit and integration tests using JUnit 5, Mockito, and Testcontainers.',
            },
            {
              title: 'Cloud & Data:',
              description: 'Designing seamless PostgreSQL/Prisma integrations and zero-downtime, edge-ready deployments.',
            },
          ],
        },
        founder: {
          description: 'Deploying highly reliable, cost-effective infrastructure enhanced with custom AI capabilities.',
          items: [
            {
              title: 'AI-Powered Features:',
              description: "Embedding intelligent agents and LLM logic natively into your product's API layer.",
            },
            {
              title: 'Serverless Scaling:',
              description: 'Leveraging cloud-edge environments that scale perfectly alongside user demand drops and spikes.',
            },
            {
              title: 'Continuous Delivery:',
              description: 'Automated deployment pipelines to continuously ship business value without breaking things.',
            },
          ],
        },
        recruiter: {
          description: 'Driving engineering excellence through strict QA cultures and highly reliable, scalable service architectures.',
          items: [
            {
              title: 'API & Microservices:',
              description: 'Architecting type-safe, scalable REST and realtime APIs with Node.js (Nitro) and Java Spring Boot.',
            },
            {
              title: 'Testing Culture:',
              description: 'Enforcing TDD methodologies and rigorous API integration testing to guarantee enterprise platform stability.',
            },
            {
              title: 'CI/CD & Delivery:',
              description: 'Automating reliable build pipelines to guarantee frictionless software delivery processes.',
            },
          ],
        },
        developer: {
          description: 'Building strictly typed, highly optimized backends obsessed with clean architecture and execution speed.',
          items: [
            {
              title: 'Type-Safe Ecosystem:',
              description: 'Unifying the full stack with end-to-end type safety via Prisma, Nitro, and deep generics.',
            },
            {
              title: 'Robust Testing:',
              description: 'Writing deterministic backend test suites using JUnit 5, Mockito, and Testcontainers for real DB integration.',
            },
            {
              title: 'Cloud & Data:',
              description: 'Designing seamless PostgreSQL/Prisma integrations and zero-downtime, edge-ready deployments.',
            },
          ],
        },
      },
    },
};
