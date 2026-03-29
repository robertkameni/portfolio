import type { ProfileData } from '../../app/store/portfolio.store';

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
        iconPath: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'
      },
      {
        platform: 'Xing',
        url: 'https://www.xing.com/profile/Robert_Kameni',
        iconPath: 'M18.188 0H5.812C2.602 0 0 2.602 0 5.812v12.376C0 21.398 2.602 24 5.812 24h12.376C21.398 24 24 21.398 24 18.188V5.812C24 2.602 21.398 0 18.188 0zM7.6 7.2h3.2l2.4 4.2-3.8 6.6H6.2l3.8-6.6L7.6 7.2zm6.6-3.2h3.2l-5.8 10 3.6 6h-3.2l-3.6-6 5.8-10z'
      }
    ]
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
        { title: 'Responsive Design:', description: 'Desktop and mobile development using HTML5, CSS3, and Angular Material.' }
      ]
    },
    {
      title: 'Backend & Quality',
      subtitle: 'Java 17 | Springboot 3 | Testing',
      iconPath: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
      description: 'Skilled in enterprise backend environments and ensuring code stability.',
      items: [
        { title: 'API Integration:', description: 'Connecting modern Angular frontends with Java 17 and Springboot 3 services.' },
        { title: 'Testing:', description: 'Extensive automated testing using Jest and Cypress for unit and E2E coverage.' },
        { title: 'Stability:', description: 'Bugfixing in production, root-cause analysis, and long-term prevention.' }
      ]
    }
  ],
  skills: [
    { name: 'Angular (v8-v21)', iconPath: 'M12 2.5l-9.5 3.5 1.5 11.5L12 22l8-4.5 1.5-11.5L12 2.5z' },
    { name: 'TypeScript', iconPath: 'M10 20l4-16m4 16l-4-16M1 9h22M2 15h20' },
    { name: 'RxJS', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'State Management', iconPath: 'M15 15l-6 6m0-6l6 6M9 9V3m0 6h6m-6 0H3' },
    { name: 'Testing & Quality', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Java 17', iconPath: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2' },
    { name: 'Springboot 3', iconPath: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a6 6 0 100 12 6 6 0 000-12z' },
    { name: 'CI/CD', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
  ],
  about: {
    title: 'About Me',
    paragraphs: [
      "I'm Robert Kameni, a Technical Lead Frontend Developer with over 4 years of experience building modern enterprise web applications, specializing in Angular within multi-team Scrum setups.",
      'At DATEV, I am responsible for the frontend architecture and the implementation of complex Angular features. By introducing modern frontend technologies and methods, I successfully increased development efficiency by 30%.',
      'I combine deep technical expertise in TypeScript, RxJS, NgRx Signal Store, and automated testing (Jest, Cypress) with technical leadership.'
    ],
    highlights: [
      { title: '4+ Years Angular Experience', description: 'Started in version 8 and always kept up with the latest features up to Angular 21.', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { title: 'Fast & Efficient', description: 'Optimized performance, established clear architecture standards, and boosted efficiency by 30%.', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { title: 'Technical Leader', description: 'Driving code reviews, mentoring, and pair programming in multi-team setups.', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }
    ]
  },
  contact: {
    title: "Let's Connect",
    description: "Ready to bring your ideas to life? Let's discuss how we work together to create something amazing.",
    features: [
      { title: '4+ Years Experience', description: 'Building scalable web applications', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { title: 'Full Stack Expertise', description: 'Senior Angular Developer with diverse backend experience', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { title: 'Diverse Project Portfolio', description: 'From startups to enterprise solutions', iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16' }
    ],
    formCard: {
      title: 'Ready to Start Your Project?',
      description: 'Send a message to discuss your project requirements.'
    }
  }
};

