import {Component, computed, input} from "@angular/core";
import {IntroData} from "./interface/intro-data";
import { TrackBehaviorDirective } from "../../../ai-engine/directives/track-behavior.directive";

@Component({
  selector: 'intro',
  standalone: true,
  imports: [TrackBehaviorDirective],
  template:`
    <section trackBehavior="intro_viewed" class="pt-16 pb-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
      <div class="z-10 text-center max-w-3xl px-4 flex flex-col items-center">
        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 tracking-tight whitespace-pre">
          @for (letter of nameLetters(); track $index) {
            <span [class.text-[#22c55e]]="$index % 2 === 0" [class.text-white]="$index % 2 !== 0">{{ letter }}</span>
          }
        </h1>

        <h2 class="text-lg sm:text-xl md:text-2xl lg:text-3xl text-primary font-medium mb-8">
          {{ data().title }}
        </h2>

        <p class="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed mb-12 max-w-2xl text-center">
          {{ data().description }}
        </p>

        <div class="flex items-center justify-center gap-4 sm:gap-6 md:gap-8">
          @for (social of data().socials; track social.platform) {
            <a [href]="social.url" target="_blank" rel="noopener noreferrer" class="text-white hover:text-primary transition-colors">
              <svg class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
                <path [attr.d]="social.iconPath"></path>
              </svg>
            </a>
          }
        </div>
      </div>
    </section>
  `
})
export class IntroComponent {
  data = input.required<IntroData>();
  nameLetters = computed(() => this.data().name.split(''))
}
