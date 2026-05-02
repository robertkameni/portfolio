import { Component, computed, input } from '@angular/core';
import { IntroData } from './interface/intro-data';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';

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
  templateUrl: './page/intro.html',
})
export class IntroComponent {
  data = input.required<IntroData>();
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
}
