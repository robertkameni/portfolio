import { Component, computed, input } from '@angular/core';
import { SkillBentoData } from './interface/skill-bento-data';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

@Component({
  selector: 'skills-bento',
  standalone: true,
  templateUrl: './page/skills-bento.html',
  imports: [TrackBehaviorDirective],
})
export class SkillsBentoComponent {
  skills = input.required<SkillBentoData[]>();
  locale = input<AppLocale>('en');
  protected readonly copy = computed(() => getSiteCopy(this.locale()));
}
