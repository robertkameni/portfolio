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
    const aiDrivenHighlightIcon =
      'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z';
    const contactFeature0 = at(baseProfile.contact.features, 0, 'contact.features');
    const contactFeature1 = at(baseProfile.contact.features, 1, 'contact.features');
    const contactFeature2 = at(baseProfile.contact.features, 2, 'contact.features');

    return {
      ...baseProfile,
      locale,
      title: 'Technischer Lead Frontend Spezialist',
      intro: {
        ...baseProfile.intro,
        title: 'Technischer Lead Frontend Spezialist',
        description: 'Spezialisiert auf moderne Webtechnologien, hochwertige skalierbare Angular-Anwendungen und elegante Lösungen für komplexe Herausforderungen.',
      },
      heroCards: [
        {
          ...heroCard0,
          title: 'Frontend',
          subtitle: 'Angular | RxJS | TypeScript',
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
          subtitle: 'Java 17 | Spring Boot 3 | Testing',
          description: 'Erfahren in Enterprise-Backends und in der Sicherstellung langfristiger Code-Stabilität.',
          items: [
            { ...heroCard1Item0, title: 'API-Integration:', description: 'Anbindung moderner Angular-Frontends an Services mit Java 17 und Spring Boot 3.' },
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
          'Ich bin Robert Kameni, Technical Lead Frontend mit mehr als 4 Jahren Erfahrung in skalierbaren Enterprise-Angular-Apps. Ich verantworte Frontend end-to-end: Architektur, Umsetzung, Qualität und Go-live.',
          'Bei DATEV gestalte ich Frontend-Architekturen über Initiativen hinweg, setze klare Engineering-Standards und habe die Team-Effizienz um 50 % gesteigert.',
          'Ich übersetze Produktziele in technische Strategie, arbeite mit TypeScript, RxJS, Signals und NgRx Signal Store und sichere Qualität mit Jest und Cypress.',
          'Als Technical Lead führe ich Teams aus technischer Sicht und leite Reviews. Mich treiben performante, AI-fähige Frontends und Teams, die ohne Qualitätsverlust skalieren.',
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
          { ...contactFeature0, title: '4+ Jahre Erfahrung', description: 'Skalierbare Webanwendungen bauen' },
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
