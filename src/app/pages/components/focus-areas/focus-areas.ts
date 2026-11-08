import { Component, computed, inject, input } from '@angular/core';
import { TrackBehaviorDirective } from '../../../ai-engine';
import { VisitorStore } from '../../../store/visitor.store';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import type { SkillCard } from './interface/skill-card';

@Component({
  selector: 'focus-areas',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './focus-areas.html',
})
export class FocusAreas {
  private readonly visitorStore = inject(VisitorStore);

  cards = input.required<SkillCard[]>();
  locale = input<AppLocale>('en');

  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  readonly adaptiveCards = computed(() => {
    const profile = this.visitorStore.profile();
    const type = profile?.visitorType;
    const heroCopy = this.copy().hero;

    return this.cards().map((baseCard) => {
      const card = { ...baseCard };
      const lower = baseCard.title.toLowerCase();

      const pick = <T>(variants: { default: T; founder: T; recruiter: T; developer: T }): T => {
        if (type === 'founder') return variants.founder;
        if (type === 'recruiter' || type === 'hiring_manager') return variants.recruiter;
        if (type === 'developer') return variants.developer;
        return variants.default;
      };

      if (lower.includes('frontend')) {
        const chosen = pick(heroCopy.frontend);
        card.description = chosen.description;
        card.items = [...chosen.items];
      } else if (lower.includes('backend') || lower.includes('quality')) {
        const chosen = pick(heroCopy.backend);
        card.description = chosen.description;
        card.items = [...chosen.items];
      }

      card.items = card.items.map((item) => ({ ...item, title: item.title.replace(/:\s*$/, '') }));

      return card;
    });
  });
}
