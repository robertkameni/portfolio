import type { SiteCopy } from './site-copy.types';

export const DE_COPY: SiteCopy = {
  footer: { copyright: '© {year} Robert Kameni Namou' },
  common: {
    showMore: 'mehr anzeigen',
    showLess: 'weniger anzeigen',
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
  nav: {
    label: 'Auf dieser Seite',
    about: 'Über mich',
    contact: 'Kontakt',
    cv: 'Lebenslauf',
  },
  focus: { title: 'Schwerpunkt' },
  stack: { eyebrow: 'Werkzeuge' },
  skills: {
    title: 'Technisches Arsenal',
  },
  projects: {
    eyebrow: 'Ausgewählte Arbeiten',
    title: 'Projekte',
    description: 'Hier ein Ausschnitt der veröffentlichten Arbeiten. In der vollständigen Übersicht siehst du alle Projekte.',
    viewAll: 'Alle Projekte ansehen',
    loading: 'Projekte werden geladen...',
    error: 'Projekte konnten nicht geladen werden.',
    empty: 'Noch keine Projekte veröffentlicht.',
    unavailable: 'Projektbeschreibungen folgen in Kürze.',
    viewLive: 'Live ansehen',
    viewLiveAriaLabel: 'Live ansehen: {title} (öffnet in neuem Tab)',
    openProjectCta: 'Öffnen →',
    openProjectAriaLabel: 'Projekt öffnen: {title}',
  },
  projectsPage: {
    title: 'Projekte',
    backToPortfolio: 'Zurück zum Portfolio',
    loading: 'Projekte werden geladen...',
    error: 'Projekte konnten nicht geladen werden.',
    empty: 'Noch keine Projekte veröffentlicht.',
    filterLabel: 'Nach Stack filtern',
    filterAll: 'Alle',
    filterAngular: 'Angular',
    filterReact: 'React & Next.js',
    filterCountAriaLabel: '{count} Projekte',
    filterEmpty: 'Kein Projekt in diesem Stack.',
  },
  notFoundPage: {
    statusLabel: '404',
    title: 'Diese Seite existiert nicht',
    description: 'Der Link ist veraltet oder die Adresse enthält einen Tippfehler.',
    linksLabel: 'Weiter zu',
    home: 'Zur Startseite',
    projects: 'Projekte ansehen',
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
    liveSiteAriaLabel: 'Live-Website besuchen (öffnet in neuem Tab)',
    zoomTriggerAriaLabel: 'Screenshot in voller Größe öffnen: {title}',
    zoomDialogLabel: 'Screenshot in voller Größe',
    zoomClose: 'Schließen',
    notFoundTitle: 'Projekt nicht gefunden',
    loadErrorTitle: 'Projekt konnte nicht geladen werden',
    notFoundMessage: 'Der Projekt-Slug existiert nicht oder das Projekt ist noch nicht veröffentlicht.',
    loadErrorMessage: 'Projektdetails konnten nicht geladen werden.',
    factsHeading: 'Auf einen Blick',
    stackHeading: 'Stack',
    nextProjectHeading: 'Nächstes Projekt',
  },
  devProxy: {
    label: 'Live',
    back: 'Zurück',
    home: 'Startseite',
    admin: 'Admin',
  },
  chat: {
    title: 'Digital Twin',
    subtitle: 'Frag mich alles über Robert',
    introLine1: 'Hi! Ich bin Roberts digitaler Zwilling.',
    introLine2: 'Zu seinen Projekten, seinem Stack und seiner Erfahrung kann ich Auskunft geben.',
    promptAngular: 'Erzähl mir von deiner Angular-Erfahrung',
    promptFreelance: 'Bist du für Freelance-Projekte verfügbar?',
    typingSrOnly: 'AI schreibt gerade...',
    placeholder: 'Schreibe deine Nachricht...',
    toggleOpenAriaLabel: 'Frag den Twin: Chat öffnen',
    toggleCloseAriaLabel: 'Chat schließen',
    sendAriaLabel: 'Nachricht senden',
    launcherLabel: 'Frag den Twin',
    inputAriaLabel: 'Deine Nachricht an den Twin',
  },
  twinInvite: {
    title: 'Frag den Twin',
    description: 'Eine KI-Version von mir, mit den Fallstudien dabei. Stell die Frage, die auf der Seite keine Antwort hat.',
    prompts: ['Erzähl mir von deiner Angular-Erfahrung', 'Bist du für Freelance-Projekte verfügbar?', 'Was hast du mit Next.js gebaut?'],
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
      recruiter: 'Verlässlicher Partner im Engineering',
      founder: 'Deine Vision von der Idee bis zum Produkt',
      developer: 'Architekt, der gern im Code sitzt',
      hiringManager: 'Kann führen und ausliefern',
    },
    founderParagraphs: [
      'Ich bringe SaaS-Produkte von 0 auf 1. Saubere Architektur von Anfang an, damit Wachstum nicht in vermeidbare technische Schulden läuft.',
      'Mit modernem Angular, Nitro-Backends und gezieltem LLM-Einsatz baue ich Systeme, die schnell liefern und stabil bleiben.',
    ],
    recruiterParagraphs: [
      'Als Technical Lead verbessere ich Team-Effizienz, setze Qualitätsstandards und liefere komplexe Angular-Enterprise-Apps zuverlässig aus.',
      'In großen Scrum-Teams kümmere ich mich um technische Führung, CI/CD und AI-Tooling, damit die Auslieferung planbar bleibt.',
    ],
    developerParagraphs: [
      'Im modernen Angular-Ökosystem bin ich zu Hause. Legacy-Apps modernisiere ich Richtung zoneless mit Signals, State baue ich mit dem NgRx Signal Store.',
      'Komplexe Architektur, Nx-Monorepos und AI-/LLM-Anbindung gehören zu meinem Alltag. Wenn du über reaktive Patterns reden willst, meld dich.',
    ],
    previewSplitToken: 'Signals und NgRx Signal Store.',
    metric: { value: '70%', caption: 'schnellere Team-Lieferung bei der DATEV' },
  },
  contact: {
    validation: {
      emailRequired: 'E-Mail ist erforderlich',
      messageRequired: 'Nachricht ist erforderlich',
    },
    adaptiveTitle: {
      recruiter: 'Reden wir über deinen nächsten Hire',
      founder: 'Deine Idee umsetzen',
      developer: 'Angular, SSR und Tooling',
    },
    adaptiveDescription: {
      recruiter: 'Du suchst einen erfahrenen Angular Engineer? Schreib mir, dann vereinbaren wir ein Gespräch.',
      founder: 'Willst du loslegen? Schreib mir, dann sprechen wir über Architektur und Roadmap.',
      developer: 'Signals, SSR, Nitro oder pragmatische KI-Anbindung? Schick eine konkrete Frage oder etwas Kontext zum Projekt.',
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
    nameLabel: 'Name',
    emailLabel: 'E-Mail',
    messageLabel: 'Nachricht',
    sendLabel: 'Nachricht senden',
    sendingLabel: 'Wird gesendet',
    submitSuccess: 'Nachricht gesendet! Ich melde mich so bald ich kann.',
    submitError: 'Senden ist fehlgeschlagen. Bitte versuche es erneut oder schreib mir direkt eine E-Mail.',
  },
  hero: {
    defaultTitle: 'Technischer Lead Frontend Engineer',
    adaptiveTitle: {
      recruiter: 'Senior Engineer für dein nächstes Projekt',
      founder: 'Skalierbare Software für anspruchsvolle Startups',
      developer: 'Angular, Node und AI-Architektur im Detail',
    },
    frontend: {
      default: {
        description: 'Moderne, schnelle Web-Apps mit den aktuellen reaktiven Bausteinen in Angular.',
        items: [
          {
            title: 'Reaktive UI-Architektur:',
            description: 'Zoneless Angular, Signals und NgRx Signal Store für State, der vorhersehbar bleibt.',
          },
          {
            title: 'Frontend-Qualitätssicherung:',
            description: 'End-to-End-Tests mit Playwright, Unit-Tests mit Jest.',
          },
          {
            title: 'Performance & Skalierung:',
            description: 'Core Web Vitals, SSR-Hydration und Nx-Monorepos, die mit dem Team mitwachsen.',
          },
          {
            title: 'Next.js & React:',
            description: 'App Router mit React 19, Server Components und Streaming, auch für AI-Produkte.',
          },
        ],
      },
      founder: {
        description: 'Oberflächen, die mit den Geschäftsanforderungen mitgehen, ohne bei jedem Release neu gebaut zu werden.',
        items: [
          {
            title: 'Schnelle Umsetzung:',
            description: 'Moderne Toolchains für MVP-Lieferung, ohne technische Schulden einzusammeln.',
          },
          {
            title: 'Conversion-First:',
            description: 'Kurze Ladezeiten und sauberes SSR für Retention und SEO.',
          },
          {
            title: 'Verlässliche Releases:',
            description: 'Automatisierte Frontend-Tests mit Playwright und Jest, damit UI-Features nicht beim Release brechen.',
          },
          {
            title: 'Full-Stack in einem Deploy:',
            description: 'Next.js als Produkt-Framework: Seiten, API-Routen und Datenbank in einem Deploy, ohne zweites Backend.',
          },
        ],
      },
      recruiter: {
        description: 'Enterprise-Frontends mit Fokus auf Wartbarkeit, Team-Skalierung und einheitliche UI.',
        items: [
          {
            title: 'Technische Führung:',
            description: 'Teams in modernem Angular führen und Architekturstandards durchziehen, die im Alltag halten.',
          },
          {
            title: 'Testing-Kultur:',
            description: 'UI-Tests mit Jest und Playwright automatisieren, damit Releases planbar bleiben.',
          },
          {
            title: 'Skalierbare Workflows:',
            description: 'Nx-Workspaces und CI/CD für große Teams mit mehreren Streams.',
          },
          {
            title: 'Zweiter Framework-Stack:',
            description: 'Neben Angular produktive Next.js- und React-19-Apps mit App Router und Server Components.',
          },
        ],
      },
      developer: {
        description: 'Angular mit Reaktivität, strikter Typisierung und Mustern, die im Produktionsbetrieb halten.',
        items: [
          {
            title: 'Signal-Architektur:',
            description: 'Signals, RxJS-Streams und zoneless State, wenn es zur App passt.',
          },
          {
            title: 'Typsichere Tooling-Strategien:',
            description: 'Typisierte Templates und Verhaltenstests mit Playwright, die reproduzierbar bleiben.',
          },
          {
            title: 'Performance-Primitiven:',
            description: 'Hydration, lazy geladene Routes und Change Detection da anpacken, wo es messbar zählt.',
          },
          {
            title: 'React-Ökosystem:',
            description: 'Next.js App Router, Server Components und React 19, inklusive Streaming und Hydration.',
          },
        ],
      },
    },
    backend: {
      default: {
        description: 'APIs, die halten, und Qualität über den ganzen Stack hinweg.',
        items: [
          {
            title: 'APIs & Microservices:',
            description: 'Typsichere REST- und Realtime-APIs mit Node.js (Nitro) und Java Spring Boot.',
          },
          {
            title: 'Qualitätssicherung:',
            description: 'Unit- und Integrationstests mit JUnit 5, Mockito und Testcontainers.',
          },
          {
            title: 'Cloud & Daten:',
            description: 'PostgreSQL mit Prisma und Deployments ans Edge, ohne geplante Ausfallzeit.',
          },
          {
            title: 'Security & Sessions:',
            description: 'Kurzlebige Access-Tokens mit Refresh-Rotation, httpOnly-Cookies und SameSite=strict; CSP-Reports für die öffentlichen Endpunkte.',
          },
        ],
      },
      founder: {
        description: 'Infrastruktur, die die Rechnung im Blick behält, plus AI-Funktionen, die zum Produkt passen.',
        items: [
          {
            title: 'AI-gestützte Features:',
            description: 'Agents und LLM-Logik in der API-Schicht, wenn das Produkt es braucht.',
          },
          {
            title: 'Serverless-Skalierung:',
            description: 'Edge-Deployments, die bei Last hoch- und bei Ruhe wieder runterfahren.',
          },
          {
            title: 'Continuous Delivery:',
            description: 'Automatisierte Deployments, damit Features regelmäßig live gehen, ohne jedes Mal Handarbeit.',
          },
          {
            title: 'Sicherheit von Anfang an:',
            description: 'Auth, Sessions und Eingabeprüfung bauen wir mit, nicht erst beim Security-Audit.',
          },
        ],
      },
      recruiter: {
        description: 'Klare QA-Kultur und Service-Architekturen, die in Enterprise-Umgebungen stabil laufen.',
        items: [
          {
            title: 'APIs & Microservices:',
            description: 'Typsichere REST- und Realtime-APIs mit Node.js (Nitro) und Java Spring Boot.',
          },
          {
            title: 'Testing-Kultur:',
            description: 'TDD und API-Integrationstests, damit Releases auf der Plattform nicht wackeln.',
          },
          {
            title: 'CI/CD & Delivery:',
            description: 'Build- und Delivery-Pipelines automatisieren, damit Auslieferung nicht vom Heroismus einzelner abhängt.',
          },
          {
            title: 'Enterprise Security:',
            description: 'Getrennte Access- und Refresh-Tokens, httpOnly-Cookies und CSP-Reporting nach üblichem Enterprise-Standard.',
          },
        ],
      },
      developer: {
        description: 'Streng typisierte Backends mit Clean Architecture und Fokus auf Laufzeit, nicht auf Schlagworte.',
        items: [
          {
            title: 'Typsicheres Ökosystem:',
            description: 'Typsicherheit von Prisma über Nitro bis in die Generics, wo es sich lohnt.',
          },
          {
            title: 'Robuste Tests:',
            description: 'Backend-Tests mit JUnit 5, Mockito und Testcontainers gegen echte Datenbanken.',
          },
          {
            title: 'Cloud & Daten:',
            description: 'PostgreSQL mit Prisma und Deployments ans Edge, ohne geplante Ausfallzeit.',
          },
          {
            title: 'Auth-Architektur:',
            description: 'JWT-Verifikation in der Middleware, Refresh-Rotation und strikte Cookie-Flags als zweite Absicherung.',
          },
        ],
      },
    },
  },
};
