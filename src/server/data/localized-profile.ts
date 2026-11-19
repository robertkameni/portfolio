import type { AppLocale } from '../../app/shared/i18n/app-locale';
import type { ProfileData, LocalizedProfileData } from '../../app/shared/types/profile-data';

function at<T>(items: readonly T[], index: number, label: string): T {
  const value = items[index];
  if (value === undefined) {
    throw new Error(`Missing ${label} entry at index ${index}.`);
  }
  return value;
}

export function localizeProfile(baseProfile: ProfileData, locale: AppLocale): LocalizedProfileData {
  if (locale === 'de') {
    const heroCard0 = at(baseProfile.heroCards, 0, 'heroCards');
    const heroCard1 = at(baseProfile.heroCards, 1, 'heroCards');
    const heroCard0Item0 = at(heroCard0.items, 0, 'heroCards[0].items');
    const heroCard0Item1 = at(heroCard0.items, 1, 'heroCards[0].items');
    const heroCard0Item2 = at(heroCard0.items, 2, 'heroCards[0].items');
    const heroCard1Item0 = at(heroCard1.items, 0, 'heroCards[1].items');
    const heroCard1Item1 = at(heroCard1.items, 1, 'heroCards[1].items');
    const heroCard1Item2 = at(heroCard1.items, 2, 'heroCards[1].items');
    const aboutHighlight0 = at(baseProfile.about.highlights, 0, 'about.highlights');
    const aboutHighlight1 = at(baseProfile.about.highlights, 1, 'about.highlights');
    const aboutHighlight2 = at(baseProfile.about.highlights, 2, 'about.highlights');
    const aboutHighlight3 = baseProfile.about.highlights[3];
    const aiDrivenHighlightIcon = 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z';
    const contactFeature0 = at(baseProfile.contact.features, 0, 'contact.features');
    const contactFeature1 = at(baseProfile.contact.features, 1, 'contact.features');
    const contactFeature2 = at(baseProfile.contact.features, 2, 'contact.features');

    return {
      ...baseProfile,
      locale,
      title: 'Technischer Lead Frontend Engineer',
      intro: {
        ...baseProfile.intro,
        title: 'Technischer Lead Frontend Engineer',
        description: 'Technischer Lead Frontend Engineer mit Angular (v8 bis v22) und Next.js/React. Baut Enterprise-Webanwendungen und führt Teams bis zum Go-live.',
      },
      heroCards: [
        {
          ...heroCard0,
          title: 'Frontend',
          subtitle: 'Angular | Next.js | React | TypeScript',
          description: 'Schwerpunkt Angular: Anwendungen, die mit wachsendem Funktionsumfang schnell und wartbar bleiben.',
          items: [
            { ...heroCard0Item0, title: 'Performance-Optimierung:', description: 'Runtime-Tuning, Architekturentscheidungen, Signal Store und NgRx.' },
            { ...heroCard0Item1, title: 'Projektarchitektur:', description: 'Angular-Plattformen, die mit dem Produkt mitwachsen; Monorepo-Upgrades, wenn sie anstehen.' },
            { ...heroCard0Item2, title: 'Responsive Design:', description: 'Desktop und Mobile mit HTML5, CSS3 und Angular Material.' },
          ],
        },
        {
          ...heroCard1,
          title: 'Backend & Qualität',
          subtitle: 'Java 21 | Spring Boot 3 | Testing',
          description: 'Zuhause in Enterprise-Java/Spring-Backends; Fokus auf stabile Produktion.',
          items: [
            { ...heroCard1Item0, title: 'API-Integration:', description: 'Angular-Frontends an Java-21- und Spring-Boot-3-Services angebunden.' },
            { ...heroCard1Item1, title: 'Testing:', description: 'Jest und Cypress für Unit-Tests und E2E-Abdeckung.' },
            { ...heroCard1Item2, title: 'Stabilität:', description: 'Produktions-Fixes, Root-Cause-Arbeit und Änderungen, die bleiben.' },
          ],
        },
      ],
      skills: baseProfile.skills.map((skill) => {
        switch (skill.name) {
          case 'Testing & Quality':
            return { ...skill, name: 'Testing & Qualität' };
          case 'Springboot 3':
            return { ...skill, name: 'Spring Boot 3' };
          default:
            return skill;
        }
      }),
      about: {
        title: 'Über mich',
        paragraphs: [
          'Ich bin Robert Kameni Namou, Technical Lead Frontend Engineer. Etwa 6 Jahre, vor allem komplexe Enterprise-Webanwendungen mit Angular (v8 bis v22) sowie Next.js und React. Ich verantworte Frontend end-to-end: Architektur, Umsetzung, Qualität und Go-live.',
          'Bei der DATEV eG (seit 08/2024) verantworte ich Frontend-Architektur und technische Ausrichtung für zwei Scrum-Teams mit acht Entwickler:innen, inklusive Mentoring von zwei Junior- und Mid-Level-Entwickler:innen. Ich lenke den Angular-Stack in Richtung Skalierbarkeit, Performance und Wartbarkeit und habe AI-gestützte Abläufe (GitHub Copilot, spec-driven Development) im Team etabliert.',
          'Bei DATEV haben sich die Kennzahlen bewegt: 30 % weniger Entwicklungszeit nach einem Design System mit 70+ wiederverwendbaren Angular-Komponenten; 25 % kleinere Bundles und 40 % kürzere Ladezeiten; Angular 22 mit Signals und NgRx Signal Store in 5+ Anwendungsmodulen, state-bezogene Produktionsfehler im ersten Quartal um 50 % weniger. Zudem habe ich ein neues Produkt AI-first auf Next.js 15/16 (App Router) und React 19 konzipiert und geleitet.',
          'Davor war ich 2,5 Jahre als IT-Consultant im Frontend bei der Sifamo GmbH (02/2022 bis 07/2024). Zwei langfristige Großprojekte: Neuentwicklung des Frontends einer Factoring-Software mit Angular 15, RxJS und NgRx (30 % kürzere Ladezeiten) sowie Web-Komponenten für eine Deployment-Control-Plattform und Migration eines Nx-Monorepos von Angular 15 auf 16 über fünf Anwendungen (60 % weniger Fehler).',
          'Im Alltag heißt das TypeScript, RxJS, Signals, NgRx Signal Store, Jest, Cypress und genug Java 21 / Spring Boot 3, um API-Verträge mit Backend-Teams direkt zu klären statt nur zu übergeben.',
          'Als Technical Lead führe ich Teams aus technischer Sicht, leite Reviews und setze Engineering-Standards. Mir sind schnelle Frontends, sinnvoller Einsatz von AI-Tooling und Teams wichtig, die wachsen können, ohne dass die Qualität leidet.',
        ],
        highlights: [
          {
            ...aboutHighlight0,
            title: 'Angular-Kompetenz über viele Versionen',
            description: 'Angular in Produktion von Version 8 bis 22 ausgeliefert und gepflegt; neue Framework-Features eingesetzt, wo sie geholfen haben.',
          },
          {
            ...aboutHighlight1,
            title: 'Execution und Performance-Impact',
            description: 'Bessere Runtime-Performance, klarere Architekturmuster und rund 50 % mehr Entwicklungseffizienz in den beteiligten Teams.',
          },
          {
            ...aboutHighlight2,
            title: 'Technische Führung und Team-Skalierung',
            description: 'Code-Reviews geleitet, Entwickler bei schwierigen Entscheidungen begleitet und Engineering-Standards etabliert, damit die Lieferung mitwachsen kann.',
          },
          {
            iconPath: aboutHighlight3?.iconPath ?? aiDrivenHighlightIcon,
            title: 'AI-gestützte Entwicklung',
            description: 'LLMs und AI-Tooling in Architektur und Delivery dort, wo sie Zeit sparen, ohne Qualität oder Wartbarkeit zu opfern.',
          },
        ],
      },
      contact: {
        title: 'Lass uns vernetzen',
        description: 'Wenn du eine Frontend- oder Lead-Rolle im Kopf hast, melde dich. Gern klären wir Umfang, Stack und Zeitplan.',
        features: [
          { ...contactFeature0, title: '6+ Jahre Erfahrung', description: 'Enterprise-Webanwendungen, vor allem Angular und Next.js' },
          { ...contactFeature1, title: 'Full-Stack-Expertise', description: 'Lead-Niveau in Angular, Java/Spring auf der API-Seite' },
          { ...contactFeature2, title: 'Vielfältiges Projektportfolio', description: 'Consulting-Einsätze und Produktteams in Unternehmen' },
        ],
        formCard: {
          title: 'Bereit, dein Projekt zu starten?',
          description: 'Schreib, was du baust und was du vom Lead brauchst.',
        },
      },
    };
  }

  return { ...baseProfile, locale };
}
