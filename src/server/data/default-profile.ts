import type { ProfileData } from '../../app/shared/types/profile-data';

export const defaultProfile: ProfileData = {
  name: 'Robert Kameni',
  title: 'Technical Lead Frontend Specialist',
  phone: '+4917630131077',
  email: 'robertkameni83@gmail.com',
  intro: {
    name: 'Robert Kameni',
    title: 'Technical Lead Frontend Specialist',
    description: 'Specializing in modern web technologies, high-quality scalable Angular applications, and creating elegant solutions to complex problems.',
    socials: [
      {
        platform: 'LinkedIn',
        url: 'https://www.linkedin.com/in/robertkameni/',
        iconPath:
          'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z',
      },
      {
        platform: 'Xing',
        url: 'https://www.xing.com/profile/Robert_Kameni',
        iconPath:
          'M18.188 0H5.812C2.602 0 0 2.602 0 5.812v12.376C0 21.398 2.602 24 5.812 24h12.376C21.398 24 24 21.398 24 18.188V5.812C24 2.602 21.398 0 18.188 0zM7.6 7.2h3.2l2.4 4.2-3.8 6.6H6.2l3.8-6.6L7.6 7.2zm6.6-3.2h3.2l-5.8 10 3.6 6h-3.2l-3.6-6 5.8-10z',
      },
    ],
  },
  heroCards: [
    {
      title: 'Frontend',
      subtitle: 'Angular | RxJS | TypeScript',
      iconPath: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      description: 'I specialize in Angular development, creating scalable and high-performance web applications.',
      items: [
        { title: 'Performance Optimization:', description: 'Runtime and architectural measures, Signal Store, NgRx.' },
        { title: 'Project Architecture:', description: 'Scalable Angular platform, monorepo modernization.' },
        {
          title: 'Responsive Design:',
          description: 'Desktop and mobile development using HTML5, CSS3, and Angular Material.',
        },
      ],
    },
    {
      title: 'Backend & Quality',
      subtitle: 'Java 17 | Springboot 3 | Testing',
      iconPath: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
      description: 'Skilled in enterprise backend environments and ensuring code stability.',
      items: [
        {
          title: 'API Integration:',
          description: 'Connecting modern Angular frontends with Java 17 and Springboot 3 services.',
        },
        {
          title: 'Testing:',
          description: 'Extensive automated testing using Jest and Cypress for unit and E2E coverage.',
        },
        { title: 'Stability:', description: 'Bugfixing in production, root-cause analysis, and long-term prevention.' },
      ],
    },
  ],
  skills: [
    { name: 'Angular v21', iconPath: 'M12 2.5l-9.5 3.5 1.5 11.5L12 22l8-4.5 1.5-11.5L12 2.5z' },
    { name: 'TypeScript', iconPath: 'M10 20l4-16m4 16l-4-16M1 9h22M2 15h20' },
    { name: 'RxJS', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z' },
    {
      name: 'State Management(NgRx, Signal Store)',
      iconPath:
        'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
    },
    {
      name: 'NextJS v16',
      iconPath:
        'M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z',
      iconFilled: true,
    },
    { name: 'Testing & Quality', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Java 17', iconPath: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2' },
    {
      name: 'Springboot 3',
      iconPath: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a6 6 0 100 12 6 6 0 000-12z',
    },
    { name: 'CI/CD', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ],
  about: {
    title: 'About Me',
    paragraphs: [
      'I am Robert Kameni, a Technical Lead Frontend Developer with 4+ years of experience delivering scalable enterprise web applications and leading Angular initiatives in complex, cross-functional Scrum environments. I take ownership of frontend delivery end-to-end, from architecture and technical planning to implementation, quality assurance, and production rollout.',
      'At DATEV, I drive frontend architecture across multiple initiatives, delivering complex Angular solutions while establishing clear engineering standards that improve consistency and long-term maintainability. By introducing modern frontend patterns, optimizing workflows, and standardizing development practices, I increased overall team efficiency by 50% and significantly reduced delivery friction.',
      'I operate at the intersection of business and technology, translating product requirements into clear technical strategies and executable roadmaps. I break down complex initiatives into structured deliverables, align engineering decisions with product goals, and ensure teams can deliver predictable, high-quality outcomes under enterprise constraints.',
      'My technical expertise includes TypeScript, RxJS, and modern Angular patterns such as Signals and NgRx Signal Store. I design scalable frontend architectures, optimize application performance, and implement robust testing strategies using Jest and Cypress to ensure reliability, reduce regressions, and support long-term product stability.',
      'Beyond implementation, I act as a technical leader and multiplier within teams. I mentor engineers, lead code reviews, and foster collaboration across teams, ensuring knowledge sharing and consistent quality. I focus on pragmatic decision-making, clean architecture, and continuous improvement to enable teams to deliver impactful and maintainable products.',
      'I am particularly interested in building high-performance, AI-driven applications and evolving frontend systems into scalable platforms. My goal is not only to deliver features, but to create systems and teams that can scale efficiently, adapt quickly, and generate measurable business value over time.',
    ],

    highlights: [
      {
        title: 'Angular Expertise Across Versions',
        description: 'Delivered and maintained production systems from Angular 8 to Angular 21, consistently adopting modern framework capabilities and best practices.',
        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Execution and Performance Impact',
        description: 'Improved runtime performance, introduced scalable architecture patterns, and increased development efficiency by 50% across teams.',
        iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
      },
      {
        title: 'Technical Leadership and Team Scaling',
        description: 'Led code reviews, mentored developers, and established engineering standards to scale delivery quality and team effectiveness.',
        iconPath:
          'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
    ],
  },
  contact: {
    title: "Let's Connect",
    description: "Ready to bring your ideas to life? Let's discuss how we work together to create something amazing.",
    features: [
      {
        title: '4+ Years Experience',
        description: 'Building scalable web applications',
        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Full Stack Expertise',
        description: 'Senior Angular Developer with diverse backend experience',
        iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
      },
      {
        title: 'Diverse Project Portfolio',
        description: 'From startups to enterprise solutions',
        iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16',
      },
    ],
    formCard: {
      title: 'Ready to Start Your Project?',
      description: 'Send a message to discuss your project requirements.',
    },
  },
};
