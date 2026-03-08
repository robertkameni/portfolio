import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
  return {
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
        }
      ]
    },
    heroCards: [
      {
        title: 'Frontend',
        subtitle: 'Angular | RxJS | TypeScript',
        iconPath: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        description: 'I specialize in Angular development, creating scalable and high-performance web applications. Engaging with product owners for the best result, suggesting technical improvements, unit testing, and ensuring the best quality.',
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
        description: 'Skilled in enterprise backend environments and ensuring code stability. I focus on automated testing and resolving production issues sustainably to maintain high system reliability.',
        items: [
          { title: 'API Integration:', description: 'Connecting modern Angular frontends with Java 17 and Springboot 3 services.' },
          { title: 'Testing:', description: 'Extensive automated testing using Jest and Cypress for unit and E2E coverage.' },
          { title: 'Stability:', description: 'Bugfixing in production, root-cause analysis, and long-term prevention.' }
        ]
      }
    ],
    experiences: [
      {
        company: 'DATEV eG',
        role: 'Technical Lead Frontend Specialist',
        period: 'Aug. 2024-Present',
        description: 'Responsible for the frontend architectural design and implementation of a scalable Angular platform. Increased development efficiency by 30%.'
      },
      {
        company: 'SIFAMO GmbH',
        role: 'Senior Frontend Developer / IT Consultant',
        period: 'Dec 2022-Jul.2024',
        description: 'Developed central frontend features for a new factoring software to replace a legacy solution.'
      },
      {
        company: 'evosoft GmbH',
        role: 'Frontend Software Developer',
        period: 'Oct.2020-Jun.2022',
        description: 'Analyzed requirements and co-designed the software architecture for an e-commerce platform.'
      }
    ],
    skills: [
      { name: 'Angular (v8-v21)', iconPath: 'M12 2.5l-9.5 3.5 1.5 11.5L12 22l8-4.5 1.5-11.5L12 2.5z M12 6l-4.5 10 M12 6l4.5 10 M8.5 13.5h7' },
      { name: 'TypeScript', iconPath: 'M10 20l4-16m4 16l-4-16M1 9h22M2 15h20' },
      { name: 'JavaScript (ES6+)', iconPath: 'M20 4h-16v16h16v-16zm-8 12h-4v-8h4v8zm6 0h-4v-8h4v8z' },
      { name: 'HTML5', iconPath: 'M4 3h16l-1.5 16.5-6.5 2.5-6.5-2.5-1.5-16.5z' },
      { name: 'CSS3', iconPath: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
      { name: 'State Management', iconPath: 'M15 15l-6 6m0-6l6 6M9 9V3m0 6h6m-6 0H3m6 0v6m0-6H9m0 6H3m0 0v6m6-6v6m6-6v6m0-6h6m-6 0V3' },
      { name: 'RXJS', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { name: 'Angular Material', iconPath: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
      { name: 'Testing & Quality', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { name: 'Performance', iconPath: 'M12 6V3m0 18v-3m6.36-11.64l-2.12 2.12M7.76 16.24l-2.12 2.12M21 12h-3m-15 0H3m11.64-6.36l2.12-2.12M7.76 7.76l2.12-2.12' },
      { name: 'CI/CD', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { name: 'Accessibility (a11y)', iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm-4-8a4 4 0 118 0 4 4 0 01-8 0z' },
      { name: 'Monorepo', iconPath: 'M10 4H4v6h6V4zm6 0h-4v6h4V4zm-6 8H4v6h6v-6zm6 0h-4v6h4v-6z' },
      { name: 'Java 17', iconPath: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2' },
      { name: 'Springboot 3', iconPath: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a6 6 0 100 12 6 6 0 000-12z' }
    ],
    about: {
      title: 'About Me',
      paragraphs: [
        "I'm Robert Kameni, a Technical Lead Frontend Developer with over 4 years of experience building modern enterprise web applications, specializing in Angular within multi-team Scrum setups.",
        "At DATEV, I am responsible for the frontend architecture and the implementation of complex Angular features. By introducing modern frontend technologies and methods, I successfully increased development efficiency by 30%.",
        "I combine deep technical expertise in TypeScript, RxJS, NgRx Signal Store, and automated testing (Jest, Cypress) with technical leadership. As a team-oriented colleague, I foster positive collaboration even in demanding, production-critical environments."
      ],
      highlights: [
        {
          title: '4+ Years Angular Experience',
          description: 'Started in version 8 and always kept up with the latest features up to Angular 21.',
          iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' // Check circle
        },
        {
          title: 'Fast & Efficient',
          description: 'Optimized performance, established clear architecture standards, and boosted efficiency by 30%.',
          iconPath: 'M13 10V3L4 14h7v7l9-11h-7z' // Lightning bolt
        },
        {
          title: 'Technical Leader',
          description: 'Driving code reviews, mentoring, and pair programming in multi-team setups.',
          iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' // Team/Users
        }
      ]
    },
    contact: {
      title: "Let's Connect",
      description: "Ready to bring your ideas to life? Let's discuss how we work together to create something amazing.",
      features: [
        {
          title: "5+ Years Experience",
          description: "Building scalable web applications",
          iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        },
        {
          title: "Full Stack Expertise",
          description: "Senior Angular Developer with diverse backend experience",
          iconPath: "M13 10V3L4 14h7v7l9-11h-7z"
        },
        {
          title: "Diverse Project Portfolio",
          description: "From startups to enterprise solutions, from failed projects to successful ones",
          iconPath: "M4 6h16M4 10h16M4 14h16M4 18h16"
        }
      ],
      formCard: {
        title: "Ready to Start Your Project?",
        description: "Send a message to discuss your project requirements."
      }
    }
  };
});
