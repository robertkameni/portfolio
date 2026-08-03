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
          'Ich bin Robert Kameni, Technical Lead Frontend Developer mit mehr als 4 Jahren Erfahrung in der Entwicklung skalierbarer Enterprise-Webanwendungen und der Leitung von Angular-Initiativen in komplexen, teamübergreifenden Scrum-Umgebungen. Ich verantworte die Frontend-Lieferfähigkeit end-to-end, von Architektur und technischer Planung bis hin zu Implementierung, Qualitätssicherung und Go-live.',
          'Bei DATEV gestalte ich Frontend-Architekturen über mehrere Initiativen hinweg, liefere komplexe Angular-Lösungen aus und etabliere klare Engineering-Standards, die Konsistenz und langfristige Wartbarkeit verbessern. Durch moderne Frontend-Patterns, optimierte Workflows und standardisierte Entwicklungspraktiken habe ich die Team-Effizienz um 50 % gesteigert und Reibungsverluste in der Umsetzung deutlich reduziert.',
          'Ich arbeite an der Schnittstelle zwischen Business und Technologie, übersetze Produktanforderungen in klare technische Strategien und ausführbare Roadmaps. Ich zerlege komplexe Initiativen in strukturierte Lieferpakete, richte technische Entscheidungen an Produktzielen aus und sorge dafür, dass Teams unter Enterprise-Rahmenbedingungen vorhersehbare und hochwertige Ergebnisse liefern.',
          'Meine technische Expertise umfasst TypeScript, RxJS und moderne Angular-Patterns wie Signals und NgRx Signal Store. Ich entwerfe skalierbare Frontend-Architekturen, optimiere die Performance von Anwendungen und implementiere belastbare Teststrategien mit Jest und Cypress, um Zuverlässigkeit zu erhöhen, Regressionen zu reduzieren und die Stabilität eines Produkts langfristig zu sichern.',
          'Über die eigentliche Implementierung hinaus agiere ich als technischer Multiplikator in Teams. Ich coache Engineers, leite Code-Reviews und fördere die Zusammenarbeit über Teams hinweg, damit Wissen geteilt und Qualitätsstandards konsistent eingehalten werden. Mein Fokus liegt auf pragmatischen Entscheidungen, sauberer Architektur und kontinuierlicher Verbesserung, damit Teams wirkungsvolle und wartbare Produkte liefern können.',
          'Besonders interessieren mich performante, AI-gestützte Anwendungen und die Weiterentwicklung von Frontend-Systemen hin zu skalierbaren Plattformen. Mein Ziel ist nicht nur die Umsetzung einzelner Features, sondern der Aufbau von Systemen und Teams, die effizient skalieren, sich schnell anpassen und über die Zeit messbaren Business-Mehrwert schaffen.',
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
            description: 'Code-Reviews geleitet, Entwickler gecoacht und Engineering-Standards etabliert, um Lieferqualität und Team-Wirksamkeit zu skalieren.',
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
