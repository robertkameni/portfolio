import { Component, computed, inject, input } from '@angular/core';
import { VisitorStore } from '../../../store/visitor.store';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';
import { SkillCard } from './interface/skill-card';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

@Component({
  selector: 'hero',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './hero.html',
})
export class Hero {
  private readonly visitorStore = inject(VisitorStore);

  name = input.required<string>();
  defaultTitle = input<string>('Technical Lead Frontend Specialist');
  cards = input.required<SkillCard[]>();
  locale = input<AppLocale>('en');
  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();
    const defaultTitle = this.name() || this.copy().hero.defaultTitle;

    if (!profile) {
      return defaultTitle;
    }

    switch (profile.visitorType) {
      case 'recruiter':
      case 'hiring_manager':
        return this.copy().hero.adaptiveTitle.recruiter;
      case 'founder':
        return this.copy().hero.adaptiveTitle.founder;
      case 'developer':
        return this.copy().hero.adaptiveTitle.developer;
      default:
        return defaultTitle;
    }
  });

  adaptiveCards = computed(() => {
    const profile = this.visitorStore.profile();
    const type = profile?.visitorType;
    const heroCopy = this.copy().hero;

    return this.cards().map((baseCard) => {
      const isFrontend = baseCard.title.toLowerCase().includes('frontend');
      const isBackend = baseCard.title.toLowerCase().includes('backend') || baseCard.title.toLowerCase().includes('quality');

      const card = { ...baseCard };

      if (isFrontend) {
        card.description = heroCopy.frontend.default.description;
        card.items = [...heroCopy.frontend.default.items];

        if (type === 'founder') {
          card.description = heroCopy.frontend.founder.description;
          card.items = [...heroCopy.frontend.founder.items];
        } else if (type === 'recruiter' || type === 'hiring_manager') {
          card.description = heroCopy.frontend.recruiter.description;
          card.items = [...heroCopy.frontend.recruiter.items];
        } else if (type === 'developer') {
          card.description = heroCopy.frontend.developer.description;
          card.items = [...heroCopy.frontend.developer.items];
        }
      } else if (isBackend) {
        card.description = heroCopy.backend.default.description;
        card.items = [...heroCopy.backend.default.items];

        if (type === 'founder') {
          card.description = heroCopy.backend.founder.description;
          card.items = [...heroCopy.backend.founder.items];
        } else if (type === 'recruiter' || type === 'hiring_manager') {
          card.description = heroCopy.backend.recruiter.description;
          card.items = [...heroCopy.backend.recruiter.items];
        } else if (type === 'developer') {
          card.description = heroCopy.backend.developer.description;
          card.items = [...heroCopy.backend.developer.items];
        }
      }

      return card;
    });
  });
}
