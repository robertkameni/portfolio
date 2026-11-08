import { Component, computed, inject, input } from '@angular/core';
import { TrackBehaviorDirective } from '../../../ai-engine';
import { VisitorStore } from '../../../store/visitor.store';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import type { IntroData } from './interface/intro-data';

@Component({
  selector: 'masthead',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './masthead.html',
})
export class Masthead {
  private readonly visitorStore = inject(VisitorStore);

  data = input.required<IntroData>();
  locale = input<AppLocale>('en');

  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  readonly name = computed(() => this.data()?.name ?? '');
  readonly description = computed(() => this.data()?.description ?? '');

  readonly socials = computed(() => {
    const list = this.data()?.socials;
    if (!Array.isArray(list)) return [];
    return list.filter((social) => !!social?.platform && !!social?.url);
  });

  readonly role = computed(() => {
    const profile = this.visitorStore.profile();
    const fallback = this.data()?.title || this.copy().hero.defaultTitle;

    if (!profile) return fallback;

    switch (profile.visitorType) {
      case 'recruiter':
      case 'hiring_manager':
        return this.copy().hero.adaptiveTitle.recruiter;
      case 'founder':
        return this.copy().hero.adaptiveTitle.founder;
      case 'developer':
        return this.copy().hero.adaptiveTitle.developer;
      default:
        return fallback;
    }
  });

  socialAriaLabel(platform: string): string {
    return this.copy().intro.socialLinkAriaLabel.replaceAll('{platform}', platform);
  }
}
