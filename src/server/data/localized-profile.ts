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
        description:
          'Technischer Lead Frontend Engineer mit Schwerpunkt Angular (v8 bis v22) und Next.js/React: skalierbare Enterprise-Webanwendungen und Teams, die sie zuverlässig liefern.',
      },
      heroCards: [
        {
          ...heroCard0,
          title: 'Frontend',
          subtitle: 'Angular | Next.js | React | TypeScript',
          description: 'Ich spezialisiere mich auf Angular-Entwicklung und entwickle skalierbare, performante Webanwendungen.',
          items: [
            { ...heroCard0Item0, title: 'Performance-Optimierung:', description: 'Runtime- und Architekturmaßnahmen, Signal Store und NgRx.' },
            { ...heroCard0Item1, title: 'Projektarchitektur:', description: 'Skalierbare Angular-Plattformen und Monorepo-Modernisierung.' },
            { ...heroCard0Item2, title: 'Responsive Design:', description: 'Desktop- und Mobile-Entwicklung mit HTML5, CSS3 und Angular Material.' },
          ],
        },
        {
          ...heroCard1,
          title: 'Backend & Qualität',
          subtitle: 'Java 21 | Spring Boot 3 | Testing',
          description: 'Erfahren in Enterprise-Backends und in der Sicherstellung langfristiger Code-Stabilität.',
          items: [
            { ...heroCard1Item0, title: 'API-Integration:', description: 'Anbindung moderner Angular-Frontends an Services mit Java 21 und Spring Boot 3.' },
            { ...heroCard1Item1, title: 'Testing:', description: 'Umfassende automatisierte Tests mit Jest und Cypress für Unit- und E2E-Abdeckung.' },
            { ...heroCard1Item2, title: 'Stabilität:', description: 'Fehlerbehebung in Produktion, Root-Cause-Analyse und langfristige Prävention.' },
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
          'Ich bin Robert Kameni, Technical Lead Frontend Engineer mit rund 6 Jahren Erfahrung in komplexen Enterprise-Webanwendungen, überwiegend mit Angular (v8 bis v22) sowie Next.js und React. Ich verantworte Frontend end-to-end: Architektur, Umsetzung, Qualität und Go-live.',
          'Bei der DATEV eG (seit 08/2024) verantworte ich Frontend-Architektur und technische Ausrichtung für zwei Scrum-Teams mit acht Entwickler:innen, inklusive Mentoring von zwei Junior- und Mid-Level-Entwickler:innen. Ich führe die Angular-Architektur mit Fokus auf Skalierbarkeit, Performance und Wartbarkeit und habe AI-gestützte Entwicklungsprozesse (GitHub Copilot, spec-driven Development) im Team etabliert.',
          'Messbare Ergebnisse bei DATEV: 30 % weniger Entwicklungszeit durch ein Design System mit 70+ wiederverwendbaren Angular-Komponenten, 25 % kleinere Bundles und 40 % kürzere Ladezeiten, dazu Angular 22 mit Signals und NgRx Signal Store in 5+ Anwendungsmodulen, wodurch state-bezogene Produktionsfehler im ersten Quartal um 50 % sanken. Zusätzlich habe ich ein neues Produkt AI-first auf Next.js 15/16 (App Router) und React 19 konzipiert und geleitet.',
          'Davor war ich 2,5 Jahre als IT-Consultant im Frontend bei der Sifamo GmbH (02/2022 bis 07/2024) in zwei langfristigen Grossprojekten: Neuentwicklung des Frontends einer Factoring-Software mit Angular 15, RxJS und NgRx (30 % kürzere Ladezeiten) sowie Web-Komponenten für eine Deployment-Control-Plattform und Migration eines Nx-Monorepos von Angular 15 auf 16 über fünf Anwendungen (60 % weniger Fehler).',
          'Technisch reicht mein Spektrum von TypeScript, RxJS, Signals, NgRx Signal Store, Jest und Cypress bis zur Backend-Seite mit Java 21 und Spring Boot 3, sodass ich API-Verträge mit Backend-Teams direkt mittrage statt nur zu übergeben.',
          'Als Technical Lead führe ich Teams aus technischer Sicht, leite Reviews und setze Engineering-Standards. Mich treiben performante, AI-fähige Frontends und Teams, die ohne Qualitätsverlust skalieren.',
        ],
        highlights: [
          {
            ...aboutHighlight0,
            title: 'Angular-Kompetenz über viele Versionen',
            description: 'Produktive Systeme von Angular 8 bis Angular 22 ausgeliefert und moderne Framework-Fähigkeiten konsequent eingeführt.',
          },
          {
            ...aboutHighlight1,
            title: 'Execution und Performance-Impact',
            description: 'Runtime-Performance verbessert, skalierbare Architekturpatterns eingeführt und die Entwicklungseffizienz teamübergreifend um 50 % gesteigert.',
          },
          {
            ...aboutHighlight2,
            title: 'Technische Führung und Team-Skalierung',
            description: 'Code-Reviews geleitet, Teams technisch geführt und Engineering-Standards etabliert, um Lieferqualität und Team-Wirksamkeit zu skalieren.',
          },
          {
            iconPath: aboutHighlight3?.iconPath ?? aiDrivenHighlightIcon,
            title: 'AI-gestützte Entwicklung',
            description: 'LLMs und AI-Tooling pragmatisch in Architektur und Delivery integriert, um schneller zu liefern und Qualität sowie Wartbarkeit hochzuhalten.',
          },
        ],
      },
      contact: {
        title: 'Lass uns vernetzen',
        description: 'Bereit, Ideen in echte Produkte zu verwandeln? Lass uns besprechen, wie wir gemeinsam etwas Starkes aufbauen können.',
        features: [
          { ...contactFeature0, title: '6+ Jahre Erfahrung', description: 'Skalierbare Webanwendungen bauen' },
          { ...contactFeature1, title: 'Full-Stack-Expertise', description: 'Senior Angular Entwickler mit vielseitiger Backend-Erfahrung' },
          { ...contactFeature2, title: 'Vielfältiges Projektportfolio', description: 'Von Startups bis zu Enterprise-Lösungen' },
        ],
        formCard: {
          title: 'Bereit, dein Projekt zu starten?',
          description: 'Schreib mir, um über Anforderungen und Umsetzung zu sprechen.',
        },
      },
    };
  }

  return { ...baseProfile, locale };
}
