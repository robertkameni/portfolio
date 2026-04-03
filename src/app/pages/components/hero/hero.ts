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
  template: `
    <section trackBehavior="hero_viewed" class="flex flex-col items-center justify-center text-white py-6 md:py-10">
      <div class="max-w-6xl w-full mx-auto px-4 pt-4">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-6xl font-bold text-primary mb-4 transition-all duration-1000">
            {{ adaptiveTitle() }}
          </h1>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          @for (card of adaptiveCards(); track card.title) {
            <div trackBehavior="hero_card_viewed_{{ card.title }}" class="bg-surface border border-[#143c1a] rounded-2xl xs:p-8 shadow-lg">
              <div class="flex flex-col items-center mb-6 pt-4 pl-5 pr-5">
                <div class="bg-[#0a2912] p-4 rounded-full mb-4">
                  <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="card.iconPath"></path>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">{{ card.title }}</h2>
                <p class="text-sm text-gray-400">{{ card.subtitle }}</p>
              </div>
              <p class="text-gray-300 text-sm leading-relaxed mb-6 pl-5 pr-5">{{ card.description }}</p>
              <ul class="space-y-4 text-sm text-gray-300 pl-5 pr-5 pb-4">
                @for (item of card.items; track item.title) {
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-primary mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <span>
                      <strong class="text-white">{{ item.title }}</strong>
                      {{ item.description }}
                    </span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class HeroComponent {
  private readonly visitorStore = inject(VisitorStore);

  name = input.required<string>();
  defaultTitle = input<string>('Technical Lead Frontend Specialist');
  cards = input.required<SkillCard[]>();
  locale = input<AppLocale>('en');
  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();

    if (!profile) {
      return this.defaultTitle();
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
        return this.defaultTitle();
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
