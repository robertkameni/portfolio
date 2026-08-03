import { Component, computed, input } from '@angular/core';
import { IntroData } from './interface/intro-data';
import { TrackBehaviorDirective } from '../../../ai-engine';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

type IntroViewModel = {
  name: string;
  title: string;
  description: string;
  socials: Array<{
    platform: string;
    url: string;
    iconPath: string;
  }>;
};

@Component({
  selector: 'intro',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './intro.html',
})
export class Intro {
  data = input.required<IntroData>();
  locale = input<AppLocale>('en');

  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  safeData = computed(() => {
    const data = this.data();
    return {
      name: data?.name ?? '',
      title: data?.title ?? '',
      description: data?.description ?? '',
      socials: Array.isArray(data?.socials)
        ? data.socials.filter(
            (social): social is IntroViewModel['socials'][number] =>
              !!social && typeof social.platform === 'string' && typeof social.url === 'string' && typeof social.iconPath === 'string',
          )
        : [],
    };
  });

  nameLetters = computed(() => this.safeData().name.split(''));

  socialAriaLabel(platform: string): string {
    return this.copy().intro.socialLinkAriaLabel.replaceAll('{platform}', platform);
  }
}
