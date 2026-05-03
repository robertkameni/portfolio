import type { ProfileData, LocalizedProfileData } from '../../app/store/portfolio.store';
import type { AppLocale } from '../../app/shared/i18n/app-locale';

export function localizeProfile(baseProfile: ProfileData, locale: AppLocale): LocalizedProfileData {
  if (locale === 'de') {
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
          ...baseProfile.heroCards[0],
          title: 'Frontend',
          subtitle: 'Angular | RxJS | TypeScript',
          description: 'Ich spezialisiere mich auf Angular-Entwicklung und entwickle skalierbare, performante Webanwendungen.',
          items: [
            { ...baseProfile.heroCards[0].items[0], title: 'Performance-Optimierung:', description: 'Runtime- und Architekturmaßnahmen, Signal Store und NgRx.' },
            { ...baseProfile.heroCards[0].items[1], title: 'Projektarchitektur:', description: 'Skalierbare Angular-Plattformen und Monorepo-Modernisierung.' },
            { ...baseProfile.heroCards[0].items[2], title: 'Responsive Design:', description: 'Desktop- und Mobile-Entwicklung mit HTML5, CSS3 und Angular Material.' },
          ],
        },
        {
          ...baseProfile.heroCards[1],
          title: 'Backend & Qualität',
          subtitle: 'Java 17 | Spring Boot 3 | Testing',
          description: 'Erfahren in Enterprise-Backends und in der Sicherstellung langfristiger Code-Stabilität.',
          items: [
            { ...baseProfile.heroCards[1].items[0], title: 'API-Integration:', description: 'Anbindung moderner Angular-Frontends an Services mit Java 17 und Spring Boot 3.' },
            { ...baseProfile.heroCards[1].items[1], title: 'Testing:', description: 'Umfassende automatisierte Tests mit Jest und Cypress für Unit- und E2E-Abdeckung.' },
            { ...baseProfile.heroCards[1].items[2], title: 'Stabilität:', description: 'Fehlerbehebung in Produktion, Root-Cause-Analyse und langfristige Prävention.' },
          ],
        },
      ],
      skills: [
        baseProfile.skills[0],
        baseProfile.skills[1],
        baseProfile.skills[2],
        { ...baseProfile.skills[3], name: 'State Management' },
        { ...baseProfile.skills[4], name: 'Testing & Qualität' },
        baseProfile.skills[5],
        { ...baseProfile.skills[6], name: 'Spring Boot 3' },
        baseProfile.skills[7],
      ],
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
            ...baseProfile.about.highlights[0],
            title: 'Angular-Kompetenz über viele Versionen',
            description: 'Produktive Systeme von Angular 8 bis Angular 21 ausgeliefert und moderne Framework-Fähigkeiten konsequent eingeführt.',
          },
          {
            ...baseProfile.about.highlights[1],
            title: 'Execution und Performance-Impact',
            description: 'Runtime-Performance verbessert, skalierbare Architekturpatterns eingeführt und die Entwicklungseffizienz teamübergreifend um 50 % gesteigert.',
          },
          {
            ...baseProfile.about.highlights[2],
            title: 'Technische Führung und Team-Skalierung',
            description: 'Code-Reviews geleitet, Entwickler gecoacht und Engineering-Standards etabliert, um Lieferqualität und Team-Wirksamkeit zu skalieren.',
          },
        ],
      },
      contact: {
        title: 'Lass uns vernetzen',
        description: 'Bereit, Ideen in echte Produkte zu verwandeln? Lass uns besprechen, wie wir gemeinsam etwas Starkes aufbauen können.',
        features: [
          { ...baseProfile.contact.features[0], title: '4+ Jahre Erfahrung', description: 'Skalierbare Webanwendungen bauen' },
          { ...baseProfile.contact.features[1], title: 'Full-Stack-Expertise', description: 'Senior Angular Entwickler mit vielseitiger Backend-Erfahrung' },
          { ...baseProfile.contact.features[2], title: 'Vielfältiges Projektportfolio', description: 'Von Startups bis zu Enterprise-Lösungen' },
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
