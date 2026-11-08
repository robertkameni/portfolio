import { Component, computed, input } from '@angular/core';
import { SkillBentoData } from './interface/skill-bento-data';
import { TrackBehaviorDirective } from '../../../ai-engine';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

/** A skill split into its name and the qualifier that used to sit inside it. */
export type SkillEntry = {
  name: string;
  detail: string | null;
};

/**
 * "State Management(NgRx, Signal Store)" is one thought and two levels of
 * detail. Kept as a single string it wraps to three lines in a 186px cell and
 * dictates the height of its whole row; split, the name stays scannable and the
 * qualifier becomes a second line that is allowed to wrap.
 */
export function splitSkillName(raw: string): SkillEntry {
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(raw);
  if (!match) {
    return { name: raw.trim(), detail: null };
  }
  return { name: (match[1] ?? '').trim(), detail: (match[2] ?? '').trim() || null };
}

@Component({
  selector: 'skills-bento',
  standalone: true,
  templateUrl: './skills-bento.html',
  imports: [TrackBehaviorDirective],
})
export class SkillsBento {
  skills = input.required<SkillBentoData[]>();
  locale = input<AppLocale>('en');
  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  protected readonly entries = computed(() => this.skills().map((skill) => splitSkillName(skill.name)));
}
