import type { AppLocale } from '../i18n/app-locale';
import { PERSON_NAME } from './person-identity';

const SPINE_DE = 'Technical Lead Frontend Engineer (Angular, TypeScript, RxJS/NgRx; Next.js/React)';
const SPINE_EN = 'Technical Lead Frontend Engineer — Angular, TypeScript, RxJS/NgRx; Next.js/React';

export function getPageSeoCopy(locale: AppLocale) {
  const isDe = locale === 'de';
  return {
    home: {
      title: isDe ? `${PERSON_NAME} – Technical Lead Frontend (Angular)` : `${PERSON_NAME} – Technical Lead Frontend Engineer (Angular)`,
      description: isDe
        ? `Portfolio von ${PERSON_NAME}: ${SPINE_DE}. Projekte, Erfahrung und Kontakt.`
        : `Portfolio of ${PERSON_NAME}: ${SPINE_EN}. Selected projects, experience, and contact.`,
    },
    projects: {
      title: isDe ? `Projekte – ${PERSON_NAME} (Angular & Full-Stack Cases)` : `Projects – ${PERSON_NAME} (Angular & full-stack cases)`,
      description: isDe
        ? `Fallstudien von ${PERSON_NAME}: Enterprise-Angular, TypeScript und ausgewählte Next.js/React-Projekte.`
        : `Case studies by ${PERSON_NAME}: enterprise Angular, TypeScript, and selected Next.js/React work.`,
    },
    // Lebenslauf is always German for ATS/print.
    cv: {
      title: `Lebenslauf ${PERSON_NAME} – Technical Lead Frontend Engineer`,
      description: `Lebenslauf von ${PERSON_NAME}: Technical Lead Frontend Engineer mit Schwerpunkt Angular, TypeScript, RxJS/NgRx sowie Next.js/React.`,
    },
    projectDetail: {
      title(projectTitle: string, technologies: string[]): string {
        const tech = technologies.filter(Boolean).slice(0, 4).join(', ');
        const suffix = tech ? ` (${tech})` : ' (Angular / TypeScript)';
        return isDe ? `${projectTitle}${suffix} – Fallstudie, ${PERSON_NAME}` : `${projectTitle}${suffix} – Case study, ${PERSON_NAME}`;
      },
      description(projectTitle: string, technologies: string[]): string {
        const tech = technologies.filter(Boolean).join(', ');
        const techClause = tech ? tech : 'Angular, TypeScript';
        return isDe
          ? `${projectTitle} von ${PERSON_NAME}: ${techClause}. Teil des Portfolios als Technical Lead Frontend Engineer.`
          : `${projectTitle} by ${PERSON_NAME}: ${techClause}. From the portfolio of a Technical Lead Frontend Engineer.`;
      },
    },
  };
}
