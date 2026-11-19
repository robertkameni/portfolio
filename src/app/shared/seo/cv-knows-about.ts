import { CV_DATA } from '../../pages/cv/cv-data';

/** Extracts up to 12 skill tokens from CV_DATA for use in Person JSON-LD knowsAbout. */
export function cvKnowsAbout(): string[] {
  return CV_DATA.skills
    .flatMap((group) =>
      group.items
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .slice(0, 12);
}
