import 'dotenv/config';
import {PrismaClient} from './generated/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {Pool} from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({connectionString: process.env['DATABASE_URL']});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({adapter});

const profileData = {
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
      title: 'Frontend', subtitle: 'Angular | RxJS | TypeScript',
      iconPath: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      description: 'I specialize in Angular development, creating scalable and high-performance web applications.',
      items: [
        {title: 'Performance Optimization:', description: 'Runtime and architectural measures, Signal Store, NgRx.'},
        {title: 'Project Architecture:', description: 'Scalable Angular platform, monorepo modernization.'},
        {
          title: 'Responsive Design:',
          description: 'Desktop and mobile development using HTML5, CSS3, and Angular Material.'
        }
      ]
    },
    {
      title: 'Backend & Quality', subtitle: 'Java 17 | Springboot 3 | Testing',
      iconPath: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
      description: 'Skilled in enterprise backend environments and ensuring code stability.',
      items: [
        {
          title: 'API Integration:',
          description: 'Connecting modern Angular frontends with Java 17 and Springboot 3 services.'
        },
        {
          title: 'Testing:',
          description: 'Extensive automated testing using Jest and Cypress for unit and E2E coverage.'
        },
        {title: 'Stability:', description: 'Bugfixing in production, root-cause analysis, and long-term prevention.'}
      ]
    }
  ],
  skills: [
    {name: 'Angular (v8-v21)', iconPath: 'M12 2.5l-9.5 3.5 1.5 11.5L12 22l8-4.5 1.5-11.5L12 2.5z'},
    {name: 'TypeScript', iconPath: 'M10 20l4-16m4 16l-4-16M1 9h22M2 15h20'},
    {name: 'RxJS', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z'},
    {name: 'State Management', iconPath: 'M15 15l-6 6m0-6l6 6M9 9V3m0 6h6m-6 0H3'},
    {name: 'Testing & Quality', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'},
    {name: 'Java 17', iconPath: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2'},
    {
      name: 'Springboot 3',
      iconPath: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a6 6 0 100 12 6 6 0 000-12z'
    },
    {name: 'CI/CD', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'}
  ],
  about: {
    title: 'About Me',
    paragraphs: [
      "I'm Robert Kameni, a Technical Lead Frontend Developer with over 4 years of experience building modern enterprise web applications, specializing in Angular within multi-team Scrum setups.",
      "At DATEV, I am responsible for the frontend architecture and the implementation of complex Angular features. By introducing modern frontend technologies and methods, I successfully increased development efficiency by 30%.",
      "I combine deep technical expertise in TypeScript, RxJS, NgRx Signal Store, and automated testing (Jest, Cypress) with technical leadership."
    ],
    highlights: [
      {
        title: '4+ Years Angular Experience',
        description: 'Started in version 8 and always kept up with the latest features up to Angular 21.',
        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        title: 'Fast & Efficient',
        description: 'Optimized performance, established clear architecture standards, and boosted efficiency by 30%.',
        iconPath: 'M13 10V3L4 14h7v7l9-11h-7z'
      },
      {
        title: 'Technical Leader',
        description: 'Driving code reviews, mentoring, and pair programming in multi-team setups.',
        iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
      }
    ]
  },
  contact: {
    title: "Let's Connect",
    description: "Ready to bring your ideas to life? Let's discuss how we work together to create something amazing.",
    features: [
      {
        title: '4+ Years Experience',
        description: 'Building scalable web applications',
        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        title: 'Full Stack Expertise',
        description: 'Senior Angular Developer with diverse backend experience',
        iconPath: 'M13 10V3L4 14h7v7l9-11h-7z'
      },
      {
        title: 'Diverse Project Portfolio',
        description: 'From startups to enterprise solutions',
        iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16'
      }
    ],
    formCard: {
      title: 'Ready to Start Your Project?',
      description: 'Send a message to discuss your project requirements.'
    }
  }
};

const projectsData = [
  {
    slug: 'datev-kanzlei-management-platform-angular20',
    title: 'DATEV Kanzlei Management Platform',
    description:
      'Technical Lead fuer eine neue Plattform zur Kanzleiverwaltung. Verantwortung fuer Frontend-Architektur, Angular-20-Migration, Signal-First Patterns und Skalierung ueber mehrere Scrum-Teams. Ergebnis: rund 30% hoehere Entwicklungseffizienz.',
    contentMarkdown: `## Projektkontext
    Neu-Entwicklung einer Enterprise-Plattform zur Verwaltung von Kanzleien in einem Multi-Team-Scrum-Setup bei DATEV.

    ## Meine Rolle
    Ich war als Technical Lead Frontend Spezialist verantwortlich fuer Architekturentscheidungen, technische Standards und die Umsetzung komplexer Features.

    ## Architektur und Umsetzung
    - Angular 20 mit Standalone Components und Signals
    - State Management mit NgRx Signal Store
    - UI-Architektur mit Angular Material
    - Klare Feature-Schnittstellen fuer mehrere parallele Teams
    - Teststrategie mit Jest und Cypress

    ## Konkreter Beitrag
    - Frontend-Zielarchitektur definiert und teamuebergreifend eingefuehrt
    - Moderne Patterns fuer Performance und Wartbarkeit etabliert
    - Architektur-Code-Reviews, Mentoring und Pair Programming geleitet
    - Entwicklungseffizienz durch technische Standardisierung um ca. 30% gesteigert

    ## Impact
    Die Plattform wurde deutlich robuster skalierbar, Features konnten schneller und konsistenter geliefert werden, und neue Teammitglieder konnten schneller produktiv werden.

    ## Tech Stack
    Angular 21, Signals, Angular Material, NgRx Signal Store, TypeScript, Jest, Cypress, Git Flow, Confluence`,
    tags: ['Angular 21', 'Signals', 'Technical Lead', 'NgRx Signal Store', 'Enterprise', 'Cypress', 'Jest'],
    coverImageUrl: null,
    isPublished: true
  },
  {
    slug: 'factoring-modernization-angular15-omnia-optica',
    title: 'Factoring Software Modernisierung',
    description:
      'Neu-Entwicklung einer Factoring-Software als Nachfolger fuer ein Bestandssystem. Fokus auf stabile Feature-Delivery, Performance-Optimierung und produktionsnahe Fehlerbehebung in einem grossen Scrum-Umfeld.',
    contentMarkdown: `## Projektkontext
    Ablösung einer bestehenden Abrechnungsloesung durch eine moderne Factoring-Software in einem grossen, mehrteamigen Projekt bei Omnia Optica.

    ## Meine Rolle
    Ich war als senior Frontend Entwickler fuer zentrale Features, Stabilisierung und technische Weiterentwicklung verantwortlich.

    ## Architektur und Umsetzung
    - Angular 15 mit RxJS und NgRx
    - Komplexe Datenansichten mit AG-Grid
    - REST/JSON-Integration mit klaren API-Vertraegen
    - Kontinuierliche Framework- und Dependency-Updates
    - Qualitaetssicherung mit Jasmine/Karma und Cypress

    ## Konkreter Beitrag
    - Business-kritische Frontend-Features von Analyse bis Deployment umgesetzt
    - Produktionsprobleme strukturiert analysiert und nachhaltig behoben
    - Performance-Engpaesse reduziert und Rendering-Verhalten verbessert
    - Wartbarkeit durch konsistente Patterns und saubere Komponentenstruktur gesteigert

    ## Impact
    Schnellere Feature-Lieferung, hoehere Stabilitaet im Betrieb und bessere Nutzererfahrung in einem fachlich anspruchsvollen Abrechnungsumfeld.

    ## Tech Stack
    Angular 15, RxJS, NgRx, TypeScript, Angular Material, AG-Grid, REST/JSON, Cypress, Jasmine/Karma, Docker, Git Flow`,
    tags: ['Angular 15', 'RxJS', 'NgRx', 'AG-Grid', 'Performance', 'Production Support', 'FinTech'],
    coverImageUrl: null,
    isPublished: true
  },
  {
    slug: 'deployment-control-platform-angular-monorepo-upgrade',
    title: 'Deployment Control Platform',
    description:
      'Weiterentwicklung einer Plattform zur Steuerung von Deployment-Prozessen. Umsetzung neuer Web-Komponenten, Performance-Verbesserungen und technisches Monorepo-Upgrade auf Angular 16.',
    contentMarkdown: `## Projektkontext
    Enterprise-Plattform zur Steuerung und Transparenz von Deployment-Prozessen bei W&W Informatik, betrieben in mehreren Scrum-Teams.

    ## Meine Rolle
    Ich war als Frontend Entwickler fuer neue Komponenten, Performance und technische Plattformpflege verantwortlich.

    ## Architektur und Umsetzung
    - Angular 15 als Basis, Upgrade-Pfad auf Angular 16 begleitet
    - Monorepo-orientierte Entwicklung mit strukturierten Feature-Bereichen
    - State Management mit NgRx und reaktiven RxJS-Mustern
    - API-Integration ueber REST/JSON
    - Testabdeckung mit Cypress und Jasmine/Karma

    ## Konkreter Beitrag
    - Neue UI-Komponenten mit Fokus auf Nutzbarkeit und Klarheit umgesetzt
    - Performance-Probleme analysiert und zielgerichtet optimiert
    - Produktive Fehler systematisch behoben
    - Technische Migrationen vorbereitet und risikoarm umgesetzt

    ## Impact
    Verbesserte Nutzerfuehrung in deployment-kritischen Workflows, stabilere Releases und eine modernisierte technische Basis fuer weitere Skalierung.

    ## Tech Stack
    Angular 15/16, TypeScript, RxJS, NgRx, Angular Material, REST/JSON, Cypress, Jasmine/Karma, Docker, Git Flow`,
    tags: ['Angular 16', 'Monorepo', 'NgRx', 'RxJS', 'Platform Engineering', 'Performance', 'Enterprise'],
    coverImageUrl: null,
    isPublished: true
  },
  {
    slug: 'employee-management-system-angular-springboot',
    title: 'Mitarbeiterverwaltungssystem',
    description:
      'End-to-End Entwicklung eines Mitarbeiterverwaltungssystems im kleinen Scrum-Team. Von Analyse und Design bis zur Frontend-Umsetzung, Teststrategie und Performance-Feinschliff.',
    contentMarkdown: `## Projektkontext
    Entwicklung eines Mitarbeiterverwaltungssystems in einem fokussierten Team mit kurzer Time-to-Market.

    ## Meine Rolle
    Ich habe den Frontend-Teil von Analyse ueber Design bis Implementierung und Testen verantwortet.

    ## Architektur und Umsetzung
    - Angular 14 mit Angular Material
    - Strukturierter State-Ansatz mit NgRx
    - Nx Monorepo fuer klare Modultrennung
    - REST/JSON-Anbindung an Spring-Boot-Backend
    - Teststrategie mit Jest und Cypress

    ## Konkreter Beitrag
    - Fachliche Anforderungen in eine klare UI- und Komponentenarchitektur ueberfuehrt
    - Wesentliche Verwaltungs-Workflows performant umgesetzt
    - Testing von Beginn an integriert, nicht nachgelagert
    - Performance-Optimierungen fuer schnelle Interaktionen umgesetzt

    ## Impact
    Schnelle Bereitstellung eines wartbaren Systems mit guter UX, klarer Code-Struktur und solider Testbasis fuer den weiteren Ausbau.

    ## Tech Stack
    Angular 14, TypeScript, RxJS, NgRx, Angular Material, Nx, Spring Boot, REST/JSON, Jest, Cypress, Docker, Git Flow`,
    tags: ['Angular 14', 'Nx', 'Spring Boot', 'NgRx', 'Jest', 'Cypress', 'HR Tech'],
    coverImageUrl: null,
    isPublished: true
  }
];

async function main() {
  // Seed admin user
  const email = 'admin@portfolio.dev';
  const password = 'Admin1234!';

  const existing = await prisma.user.findUnique({where: {email}});
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {email, passwordHash, role: 'ADMIN'}
    });
    console.log(`✅ Admin user created: ${user.email}`);
  } else {
    console.log(`User "${email}" already exists — skipping.`);
  }

  // Seed profile
  const existingProfile = await prisma.profile.findFirst();
  if (!existingProfile) {
    await prisma.profile.create({data: profileData});
    console.log('✅ Profile seeded.');
  } else {
    console.log('Profile already exists — skipping.');
  }

  for (const project of projectsData) {
    await prisma.project.upsert({
      where: {slug: project.slug},
      update: {
        title: project.title,
        description: project.description,
        contentMarkdown: project.contentMarkdown,
        tags: project.tags,
        coverImageUrl: project.coverImageUrl,
        isPublished: project.isPublished
      },
      create: project
    });
  }
  console.log(`✅ ${projectsData.length} projects upserted.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
