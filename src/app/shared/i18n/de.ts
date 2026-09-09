import type { SiteCopy } from './site-copy.types';

export const DE_COPY: SiteCopy = {
  common: {
    showMore: 'mehr anzeigen...',
    showLess: 'weniger anzeigen...',
  },
  home: {
    founder: 'Founder',
    recruiter: 'Recruiter',
    developer: 'Entwickler',
    reset: 'Zurücksetzen',
    adminPage: 'Admin-Bereich',
    admin: 'Admin',
    loadingProfile: 'Profil wird geladen...',
    failedProfile: 'Profil konnte nicht geladen werden. Bitte aktualisieren.',
  },
  intro: {
    socialLinkAriaLabel: 'Profil von Robert auf {platform} besuchen (öffnet in neuem Tab)',
  },
  skills: {
    title: 'Technisches Arsenal',
  },
  projects: {
    eyebrow: 'Ausgewählte Arbeiten',
    title: 'Projekte',
    description: 'Ein kurzer Einblick in veröffentlichte Arbeiten. Öffne die vollständige Übersicht, um alle Projekte zu sehen.',
    viewAll: 'Alle Projekte ansehen',
    loading: 'Projekte werden geladen...',
    error: 'Projekte konnten nicht geladen werden.',
    empty: 'Noch keine Projekte veröffentlicht.',
    openProjectCta: 'Öffnen →',
    openProjectAriaLabel: 'Projekt öffnen: {title}',
  },
  projectsPage: {
    title: 'Projekte',
    backToPortfolio: 'Zurück zum Portfolio',
    loading: 'Projekte werden geladen...',
    error: 'Projekte konnten nicht geladen werden.',
    empty: 'Noch keine Projekte veröffentlicht.',
  },
  projectDetail: {
    backToProjects: 'Zurück zu den Projekten',
    loading: 'Projekt wird geladen...',
    published: 'Veröffentlicht',
    draft: 'Entwurf',
    overview: 'Überblick',
    emptyDescription: 'Dieses Projekt hat aktuell noch keine ausführliche Beschreibung. Die Zusammenfassung oben ist derzeit die Übersicht.',
    liveSiteHeading: 'Live-Website',
    liveSiteLinkLabel: 'Live-Website besuchen',
    liveSiteAriaLabel: 'Live-Projektwebsite in neuem Tab öffnen',
    notFoundTitle: 'Projekt nicht gefunden',
    loadErrorTitle: 'Projekt konnte nicht geladen werden',
    notFoundMessage: 'Der Projekt-Slug existiert nicht oder das Projekt ist noch nicht veröffentlicht.',
    loadErrorMessage: 'Projektdetails konnten nicht geladen werden.',
  },
  devProxy: {
    label: 'Vorschau',
    back: 'Zurück',
    home: 'Startseite',
    admin: 'Admin',
  },
  chat: {
    title: 'Digital Twin',
    subtitle: 'Frag mich alles über Robert',
    introLine1: 'Hi! Ich bin Roberts AI Digital Twin.',
    introLine2: 'Ich kenne seine Projekte, seinen Stack und seine Erfahrung.',
    promptAngular: 'Erzähl mir von deiner Angular-Erfahrung',
    promptFreelance: 'Bist du für Freelance-Projekte verfügbar?',
    typingSrOnly: 'AI schreibt gerade...',
    placeholder: 'Schreibe deine Nachricht...',
    toggleOpenAriaLabel: 'Chat mit dem Digital Twin öffnen',
    toggleCloseAriaLabel: 'Chat schließen',
    sendAriaLabel: 'Nachricht senden',
  },
  adminLogin: {
    title: 'Admin-Anmeldung',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    loggingIn: 'Anmeldung läuft...',
    invalidCredentials: 'Ungültige Zugangsdaten.',
    accessDenied: 'Zugriff verweigert: Nur Admins.',
    accessDeniedToast: 'Nur Administratoren können sich im Portfolio anmelden. Bitte kontaktiere bei Bedarf den Seiteninhaber.',
  },
  adminProjects: {
    newProject: 'Neues Projekt',
    cancel: 'Abbrechen',
    title: 'Projekte',
    subtitle: 'Veröffentlichte Projekte und Entwürfe verwalten',
    createSuccess: 'Projekt erfolgreich erstellt.',
    createFormTitle: 'Projekt erstellen',
    createSubmitLabel: 'Projekt erstellen',
    createSubmittingLabel: 'Wird erstellt...',
    loading: 'Projekte werden geladen...',
    loadingIdle: 'Lade...',
    published: 'Veröffentlicht',
    draft: 'Entwurf',
    view: 'Ansehen👁️',
    edit: 'Bearbeiten ✏️',
    delete: 'Löschen🗑️',
    empty: 'Noch keine Projekte. Erstelle dein erstes Projekt.',
    failedLoad: 'Projekte konnten nicht geladen werden',
    failedCreate: 'Projekt konnte nicht erstellt werden',
    failedDelete: 'Projekt konnte nicht gelöscht werden',
    confirmDelete: 'Möchtest du das Projekt "{title}" wirklich löschen?',
  },
  projectForm: {
    titleLabel: 'Titel *',
    slugLabel: 'Slug *',
    descriptionLabel: 'Beschreibung',
    contentMarkdownLabel: 'Überblick (Markdown)',
    coverImageUrlLabel: 'Cover-Bild-URL',
    tagsLabel: 'Tags (kommagetrennt)',
    tagsPlaceholder: 'Angular, TypeScript, SSR',
    projectUrlLabel: 'Live-Website-URL',
    projectUrlPlaceholder: 'https://example.com',
    cancel: 'Abbrechen',
    publishImmediately: 'Sofort veröffentlichen',
    titleRequired: 'Titel ist erforderlich',
    slugRequired: 'Slug ist erforderlich',
  },
  about: {
    adaptiveTitle: {
      recruiter: 'Ein verlässlicher Engineering-Partner',
      founder: 'Deine Vision ganzheitlich umsetzen',
      developer: 'Ein Architekt, der Code liebt',
      hiringManager: 'Bereit zu führen und zu liefern',
    },
    founderParagraphs: [
      'Ich bringe SaaS-Produkte von 0 auf 1: früh saubere Architektur, damit Wachstum ohne unnötige technische Schulden möglich ist.',
      'Mit modernem Angular, Nitro-Backends und gezieltem Einsatz von LLMs baue ich stabile Systeme, die schnell liefern und sich anpassen lassen.',
    ],
    recruiterParagraphs: [
      'Als Technical Lead steigere ich Team-Effizienz, setze Qualitätsstandards und liefere komplexe Angular-Enterprise-Anwendungen zuverlässig aus.',
      'In großen Scrum-Setups fokussiere ich technische Führung, CI/CD und AI-gestützte Tooling, damit Delivery vorhersehbar bleibt.',
    ],
    developerParagraphs: [
      'Im modernen Angular-Ökosystem fühle ich mich zu Hause. Legacy-Apps modernisiere ich hin zu zoneless Architektur mit Signals und baue State mit dem NgRx Signal Store.',
      'Komplexe Architektur, Nx-Monorepos und AI/LLM-Integration gehören zu meinem Alltag. Wenn du über reaktive Patterns sprechen willst, lass uns austauschen.',
    ],
  },
  contact: {
    validation: {
      emailRequired: 'E-Mail ist erforderlich',
      messageRequired: 'Nachricht ist erforderlich',
    },
    adaptiveTitle: {
      recruiter: 'Lass uns über deinen nächsten Top-Hire sprechen',
      founder: 'Lass uns deine Idee zum Leben erwecken',
      developer: 'Austausch zu Angular, SSR & Tooling',
    },
    adaptiveDescription: {
      recruiter: 'Du suchst einen erfahrenen Angular Engineer? Schreib mir und wir vereinbaren ein Gespräch.',
      founder: 'Bereit loszulegen? Schreib mir und wir sprechen über Produktarchitektur und Roadmap.',
      developer: 'Interesse an Signals, SSR, Nitro oder pragmatischer KI-Anbindung? Schick eine konkrete Frage oder Kontext zum Projekt, dann tauschen wir uns gern aus.',
    },
    adaptivePlaceholder: {
      recruiter: 'Hallo Robert, wir suchen einen Angular-Experten...',
      founder: 'Hallo Robert, ich habe eine Idee für ein SaaS...',
      developer: 'Hallo Robert, wie hast du … gelöst?',
      default: 'Nachricht',
    },
    adaptiveButtonText: {
      recruiter: 'Interview vereinbaren',
      founder: 'Mein Projekt besprechen',
      developer: 'Nachricht senden',
      default: 'Nachricht senden',
    },
    placeholderName: 'Name',
    placeholderEmail: 'E-Mail',
    submitSuccess: 'Nachricht gesendet! Ich melde mich so bald ich kann.',
    submitError: 'Senden ist fehlgeschlagen. Bitte versuche es erneut oder schreib mir direkt eine E-Mail.',
  },
  hero: {
    defaultTitle: 'Technischer Lead Frontend Spezialist',
    adaptiveTitle: {
      recruiter: 'Senior Engineer, bereit dein nächstes Projekt voranzutreiben',
      founder: 'Skalierbare Lösungen für ambitionierte Startups',
      developer: 'Tiefe Einblicke in Angular-, Node- und AI-Architektur',
    },
    frontend: {
      default: {
        description: 'Entwicklung moderner, performanter Webanwendungen mit den neuesten reaktiven Angular-Primitiven.',
        items: [
          {
            title: 'Reaktive UI-Architektur:',
            description: 'Zoneless Angular, Signals und NgRx Signal Store für klar vorhersehbares State Management.',
          },
          {
            title: 'Frontend-Qualitätssicherung:',
            description: 'Strikte End-to-End-Tests mit Playwright und schnelle Unit-Abdeckung mit Jest.',
          },
          {
            title: 'Performance & Skalierung:',
            description: 'Optimierung von Core Web Vitals, SSR-Hydration und Aufbau skalierbarer Nx-Monorepos.',
          },
        ],
      },
      founder: {
        description: 'Aufbau hochreaktiver, conversion-optimierter Oberflächen, die sich schnell an veränderte Geschäftsanforderungen anpassen.',
        items: [
          {
            title: 'Schnelle Umsetzung:',
            description: 'Moderne Toolchains für schnelle MVP-Lieferung ohne technische Schulden.',
          },
          {
            title: 'Conversion-First:',
            description: 'Extrem kurze Ladezeiten und sauberes SSR für bessere Retention und SEO.',
          },
          {
            title: 'Verlässliche Releases:',
            description: 'Automatisierte Frontend-Tests mit Playwright und Jest, damit UI-Features stabil bleiben.',
          },
        ],
      },
      recruiter: {
        description: 'Lieferung von Enterprise-Frontend-Anwendungen mit Fokus auf Wartbarkeit, Team-Skalierung und UI-Konsistenz.',
        items: [
          {
            title: 'Technische Führung:',
            description: 'Mentoring für Teams in modernen Angular-Paradigmen und Durchsetzung sauberer Architekturstandards.',
          },
          {
            title: 'Testing-Kultur:',
            description: 'Aufbau automatisierter UI-Tests mit Jest und Playwright für stabile Releases.',
          },
          {
            title: 'Skalierbare Workflows:',
            description: 'Strukturierung von Nx-Workspaces und CI/CD-Pipelines für große Multi-Team-Umgebungen.',
          },
        ],
      },
      developer: {
        description: 'Ausreizen des Angular-Ökosystems mit fortgeschrittener Reaktivität, strikter Typisierung und eleganten Designmustern.',
        items: [
          {
            title: 'Signal-Architektur:',
            description: 'Tiefe Integration von Signals, komplexen RxJS-Streams und konsequent zoneless State Engines.',
          },
          {
            title: 'Typsichere Tooling-Strategien:',
            description: 'Strikt typisierte Templates und deterministische Verhaltenstests mit Playwright.',
          },
          {
            title: 'Performance-Primitiven:',
            description: 'Optimierung von Hydration-Strategien, Lazy-Loaded-Routes und effizienter Change Detection.',
          },
        ],
      },
    },
    backend: {
      default: {
        description: 'Architektur robuster APIs und kompromisslose Softwarequalität über den gesamten Stack hinweg.',
        items: [
          {
            title: 'APIs & Microservices:',
            description: 'Typsichere, skalierbare REST- und Realtime-APIs mit Node.js (Nitro) und Java Spring Boot.',
          },
          {
            title: 'Qualitätssicherung:',
            description: 'Umfassende Unit- und Integrationstests mit JUnit 5, Mockito und Testcontainers.',
          },
          {
            title: 'Cloud & Daten:',
            description: 'Nahtlose PostgreSQL-/Prisma-Integration und edge-fähige Deployments ohne Downtime.',
          },
        ],
      },
      founder: {
        description: 'Aufbau zuverlässiger, kosteneffizienter Infrastruktur mit individuell integrierten AI-Funktionen.',
        items: [
          {
            title: 'AI-gestützte Features:',
            description: 'Einbettung intelligenter Agents und LLM-Logik direkt in die API-Schicht deines Produkts.',
          },
          {
            title: 'Serverless-Skalierung:',
            description: 'Cloud-Edge-Umgebungen, die bei Lastspitzen und Ruhephasen sauber mitwachsen.',
          },
          {
            title: 'Continuous Delivery:',
            description: 'Automatisierte Deployments, um fortlaufend Business Value auszuliefern.',
          },
        ],
      },
      recruiter: {
        description: 'Engineering Excellence durch klare QA-Kultur und hochzuverlässige, skalierbare Service-Architekturen.',
        items: [
          {
            title: 'APIs & Microservices:',
            description: 'Typsichere, skalierbare REST- und Realtime-APIs mit Node.js (Nitro) und Java Spring Boot.',
          },
          {
            title: 'Testing-Kultur:',
            description: 'Durchsetzung von TDD und rigorosen API-Integrationstests für Enterprise-Stabilität.',
          },
          {
            title: 'CI/CD & Delivery:',
            description: 'Automatisierung verlässlicher Build- und Delivery-Prozesse für reibungslose Auslieferung.',
          },
        ],
      },
      developer: {
        description: 'Aufbau streng typisierter, hochoptimierter Backends mit Fokus auf Clean Architecture und Ausführungsgeschwindigkeit.',
        items: [
          {
            title: 'Typsicheres Ökosystem:',
            description: 'End-to-End-Typsicherheit über Prisma, Nitro und tiefgehende Generics im gesamten Stack.',
          },
          {
            title: 'Robuste Tests:',
            description: 'Deterministische Backend-Test-Suiten mit JUnit 5, Mockito und Testcontainers gegen reale Datenbanken.',
          },
          {
            title: 'Cloud & Daten:',
            description: 'Nahtlose PostgreSQL-/Prisma-Integration und edge-fähige Deployments ohne Downtime.',
          },
        ],
      },
    },
  },
};
