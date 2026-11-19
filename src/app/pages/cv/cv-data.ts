/**
 * The CV as printed data.
 *
 * Source: `docs/cv/lebenslauf-robert-kameni-namou.docx`. Every string here is
 * copied from that document, not from the portfolio prose, so the printed page
 * and the file say the same thing. When the CV changes, this is the file that
 * changes with it.
 */
export type CvEngagement = {
  name: string;
  period: string;
  bullets: string[];
};

export type CvRole = {
  title: string;
  company: string;
  location: string;
  period: string;
  summary: string;
  bulletsHeading?: string;
  bullets?: string[];
  engagements?: CvEngagement[];
  technologies?: string;
};

export type CvSkillGroup = {
  label: string;
  items: string;
};

export type CvProject = {
  name: string;
  url: string;
  period: string;
  summary: string;
  technologies: string;
};

export type CvData = {
  name: string;
  headline: string;
  location: string;
  phone: string;
  email: string;
  links: Array<{ label: string; href: string }>;
  facts: string;
  profile: string;
  skills: CvSkillGroup[];
  roles: CvRole[];
  projects: CvProject[];
  education: { title: string; institution: string; period: string };
  languages: Array<{ name: string; level: string }>;
};

export const CV_DATA: CvData = {
  name: 'Robert Kameni Namou',
  headline: 'Technical Lead Frontend Engineer · Frontend-Architekt (Angular)',
  location: 'Nürnberg, Deutschland',
  phone: '+49 176 30137077',
  email: 'robertkameni83@gmail.com',
  links: [
    { label: 'linkedin.com/in/robertkameni', href: 'https://www.linkedin.com/in/robertkameni/' },
    { label: 'github.com/robertkameni', href: 'https://github.com/robertkameni' },
    { label: 'cv.lucastar.de', href: 'https://cv.lucastar.de/' },
  ],
  facts: 'EU/EFTA-Staatsangehörigkeit (keine Bewilligung nötig) · 3 Monate Kündigungsfrist',
  profile:
    'Senior Frontend Engineer mit rund 6 Jahren Erfahrung in Konzeption, Architektur und Entwicklung komplexer Enterprise-Webanwendungen, Schwerpunkt Angular (v8–v22) und Next.js/React. Durchgehend fest angestellt, heute Technical Lead Frontend Engineer bei DATEV eG: Führung von 2 Scrum-Teams (8 Entwickler:innen), Performance-Optimierung (Ladezeiten −40 %), State Management mit NgRx Signal Store und RxJS sowie Einführung AI-gestützter Entwicklungsmethoden (GitHub Copilot, spec-driven Development).',
  skills: [
    {
      label: 'Frontend',
      items:
        'Angular (v8–v22), TypeScript, JavaScript (ES6+), RxJS, Signals, Standalone Components, Angular Material, AG-Grid, Next.js 15/16 (App Router), React 19, HTML5, CSS3, Sass/SCSS, Tailwind CSS, Responsive Web Design',
    },
    {
      label: 'Architektur',
      items: 'Design Systems (50+ wiederverwendbare UI-Komponenten), Microfrontends, Monorepo (Nx), Clean Code, SOLID, Design Patterns',
    },
    {
      label: 'Testing & Performance',
      items: 'Cypress (E2E), Jest, Jasmine/Karma, SSR, PWA, Lazy Loading, Change Detection, Bundle-Analyse, Core Web Vitals',
    },
    {
      label: 'Backend, DevOps & Tools',
      items: 'Java 21, Spring Boot 3.x, Node.js, REST, OpenAPI, JSON/XML, Docker, CI/CD (Jenkins), Git/Git Flow, Vite/Webpack, npm, Jira, Confluence, Postman',
    },
    {
      label: 'AI-First & Qualität',
      items:
        'GitHub Copilot, spec-driven Development (Speckit/Openspecs), AI-Agent-Workflows, State Management (NgRx, NgRx Signal Store), WCAG 2.1, Enterprise Security, Code Reviews, Scrum, Mentoring',
    },
  ],
  roles: [
    {
      title: 'Technical Lead Frontend Engineer',
      company: 'DATEV eG',
      location: 'Nürnberg',
      period: '08/2024 – heute',
      summary:
        'Plattform zur Verwaltung von Steuerkanzleien. Technische Verantwortung für Architektur und strategische Weiterentwicklung geschäftskritischer Enterprise-Webanwendungen; Angular-Architektur mit Schwerpunkt Skalierbarkeit, Performance und Wartbarkeit.',
      bulletsHeading: 'Erfolgsbeispiele',
      bullets: [
        'Technische Leitung von 2 Scrum-Teams mit insgesamt 8 Entwickler:innen an geschäftskritischen Enterprise-Anwendungen; Mentoring von 2 Junior- und Mid-Level-Entwickler:innen',
        'Senkte die Entwicklungszeit neuer Features um 30 % mit einem skalierbaren Design System aus 50+ wiederverwendbaren UI-Komponenten (Angular)',
        'Bundle-Größe um 25 % und Ladezeiten um 40 % weniger durch Lazy Loading, optimierte Change Detection und Bundle-Analyse',
        'Angular 22, Signals und NgRx Signal Store in 5+ Anwendungsmodulen eingeführt und die Frontend-Architektur vereinheitlicht; state-bezogene Produktionsfehler sanken im ersten Quartal um 50 %',
        'Neues Produkt nach dem AI-First-Prinzip konzipiert und geleitet: Next.js 15/16 (App Router), React 19, GitHub Copilot als AI Agent, spec-driven Development; AI-gestützte Entwicklungsprozesse im Team etabliert',
      ],
      technologies: 'Angular 22, Next.js 15/16, React 19, TypeScript, RxJS, NgRx Signal Store, Jest, Cypress, GitHub Copilot, Git Flow, CI/CD',
    },
    {
      title: 'IT Consultant – Frontend Developer',
      company: 'Sifamo GmbH',
      location: 'Berlin',
      period: '02/2022 – 07/2024',
      summary:
        'Über 2,5 Jahre zwei langfristige Kundeneinsätze in Großprojekten (jeweils mehrere Scrum-Teams): Entwicklung, Optimierung und Wartung moderner Webanwendungen mit Angular und TypeScript.',
      engagements: [
        {
          name: 'Projekt Omnia/Optica, Stuttgart',
          period: '09/2023 – 07/2024',
          bullets: [
            'Frontend einer Factoring-Software zur Ablösung einer Legacy-Lösung neu gebaut (Angular 15, RxJS, NgRx); Großprojekt mit 3 Scrum-Teams',
            'Ladezeiten um 30 % gesenkt nach Analyse und Behebung von Produktionsproblemen und gezielter Performance-Optimierung',
            'Neue Frontend-Features in agilen Sprints mit UX/UI- und Backend-Teams umgesetzt',
          ],
        },
        {
          name: 'Projekt W&W Informatik, Stuttgart',
          period: '02/2022 – 08/2023',
          bullets: [
            '10 neue Webkomponenten (Angular 15/16) für eine Plattform zur Steuerung von Deployment-Prozessen; spürbar bessere Benutzererfahrung',
            'Monorepo von Angular 15 auf Angular 16 mit Nx migriert; 5 Anwendungen und Libraries modernisiert',
            'Fehlerquote um 60 % gesenkt durch Behebung kritischer Produktions-Bugs und Optimierung der State-Management-Architektur (NgRx)',
          ],
        },
      ],
      technologies: 'Angular 15/16, NgRx, TypeScript, RxJS, Nx Monorepo, Jest, Jasmine/Karma, Cypress, Docker, CI/CD (Jenkins)',
    },
    {
      title: 'Frontend Software Developer',
      company: 'Evosoft GmbH',
      location: 'Nürnberg',
      period: '10/2020 – 01/2022',
      summary:
        'Entwicklung und Weiterentwicklung von Webanwendungen mit Angular und TypeScript. Koordination des Entwicklungsteams, Ressourcenplanung, Analyse und Konzeption der Software-Architektur mit dem Backend-Team.',
      bulletsHeading: 'Erfolgsbeispiele',
      bullets: [
        'Entwicklungsteam von 8 Entwickler:innen koordiniert und technische Aufgaben im Scrum-Umfeld priorisiert',
        'Entwicklungs- und Wartungsaufwand neuer Features um 60 % reduziert durch Analyse und Optimierung der Frontend-Architektur',
        'Standardisierte Code-Reviews und Entwicklungsrichtlinien eingeführt; Codequalität und Teamproduktivität stiegen spürbar',
        'Skalierbare End-to-End-Lösungen mit Backend-Teams (C#, .NET, Azure) umgesetzt',
      ],
    },
  ],
  projects: [
    {
      name: 'AI Engineering Team Simulator',
      url: 'aisim.lucastar.de',
      period: '05/2026 – heute',
      summary:
        'Multi-Agenten-Debatten-Simulator mit 6 Agenten (PM bis Reviewer): Produktideen per Streaming, Tool-Aufrufen und persistierten Läufen; erkennt Software-, Bau- und Hybridprojekte und weist passende Rollen zu.',
      technologies: 'Next.js 16, React 19, Vercel AI SDK + DeepSeek, Prisma 7 + Neon, Upstash Redis, JWT-Auth',
    },
    {
      name: 'The Engineering Forge',
      url: 'forge.lucastar.de',
      period: '06/2026 – heute',
      summary: 'GitHub-Spec-Kit-Pipeline: Markdown-Briefs per Bearer-Auth, daraus implementierungsfertige Spec-Bundles für AI-Agenten.',
      technologies: 'Next.js 16, BullMQ + Redis, OpenAPI, Self-Heal-Zyklen, Railway',
    },
    {
      name: 'ATLAS-BIO',
      url: 'atlas.lucastar.de',
      period: '10/2026 – heute',
      summary: 'Spec-getriebene Offline-PWA (Französisch) für dokumentierte Mikronährstoff-Bildung ohne Konto; 60+ Tasks aus FR/NFR-Spezifikation, CI- und Lighthouse-Gates.',
      technologies: 'Next.js 16, TypeScript, Zod, node --test',
    },
  ],
  education: {
    title: 'B.Eng. Elektrotechnik und Informationstechnik',
    institution: 'Technische Hochschule Nürnberg Georg Simon Ohm',
    period: '10/2017 – 08/2020',
  },
  languages: [
    { name: 'Deutsch', level: 'C1 verhandlungssicher' },
    { name: 'Englisch', level: 'C1 verhandlungssicher' },
    { name: 'Französisch', level: 'Muttersprache' },
  ],
};
