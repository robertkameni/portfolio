import 'dotenv/config';
import {PrismaClient} from './generated/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {Pool} from 'pg';
import bcrypt from 'bcrypt';
import {defaultProfile} from '../src/server/data/default-profile';
import {getDefaultProjectCoverImageBySlug} from '../src/server/data/project-cover-images';

const pool = new Pool({connectionString: process.env['DATABASE_URL']});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({adapter});

const toJson = (value: unknown) => JSON.parse(JSON.stringify(value));

const profileData = {
  name: defaultProfile.name,
  title: defaultProfile.title,
  phone: defaultProfile.phone,
  email: defaultProfile.email,
  intro: toJson(defaultProfile.intro),
  heroCards: toJson(defaultProfile.heroCards),
  skills: toJson(defaultProfile.skills),
  about: toJson(defaultProfile.about),
  contact: toJson(defaultProfile.contact)
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
  const updatedProfiles = await prisma.profile.updateMany({data: profileData});
  if (updatedProfiles.count === 0) {
    await prisma.profile.create({data: profileData});
    console.log('✅ Profile seeded.');
  } else {
    console.log(`✅ ${updatedProfiles.count} profile record(s) updated from default profile data.`);
  }

  for (const project of projectsData) {
    const seededCoverImageUrl = project.coverImageUrl ?? getDefaultProjectCoverImageBySlug(project.slug);

    await prisma.project.upsert({
      where: {slug: project.slug},
      update: {
        title: project.title,
        description: project.description,
        contentMarkdown: project.contentMarkdown,
        tags: project.tags,
        // Keep existing image URLs when seed data intentionally uses null.
        ...(project.coverImageUrl !== null ? {coverImageUrl: project.coverImageUrl} : {}),
        isPublished: project.isPublished
      },
      create: {
        ...project,
        coverImageUrl: seededCoverImageUrl
      }
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
