import {Component, computed, inject, input, signal} from '@angular/core';
import {AboutData} from './interface/about-data';
import {VisitorStore} from '../../../store/visitor.store';
import {TrackBehaviorDirective} from '../../../ai-engine/directives/track-behavior.directive';
import type {AppLocale} from '../../../shared/i18n/app-locale';
import {getSiteCopy} from '../../../shared/i18n/site-copy';

@Component({
  selector: 'about',
  standalone: true,
  imports: [TrackBehaviorDirective],
  template: `
    <section trackBehavior="about_viewed" class="py-4 md:py-10 flex justify-center text-white">
      <div class="max-w-6xl w-full mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 w-full items-start">
          <div class="md:col-span-5 flex justify-center md:justify-start md:self-start">
            <div
              class="relative w-full max-w-sm aspect-3/4 rounded-lg overflow-hidden border border-gray-800 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
              <img src="/assets/lucas.jpg" alt="Robert Kameni"
                   class="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"/>
            </div>
          </div>

          <div class="md:col-span-7 flex flex-col justify-start md:self-start">
            <div class="mb-6 flex flex-col items-baseline">
              <h2 class="text-4xl md:text-5xl font-bold text-primary mb-2">{{ adaptiveTitle() }}</h2>
              <div class="h-1 w-16 bg-white"></div>
            </div>

            <div class="space-y-4 mb-8 text-gray-300 leading-relaxed text-sm md:text-base text-left">
              @for (paragraph of visibleParagraphs(); track $index) {
                <p>{{ paragraph }}</p>
              }

              @if (hasCollapsedPreview()) {
                <button type="button"
                        class="text-primary font-bold hover:underline cursor-pointer"
                        (click)="toggleAbout()">
                  {{ isExpanded() ? copy().about.showLess : copy().about.showMore }}
                </button>
              }
            </div>

            <div class="space-y-6 text-left">
              @for (item of data().highlights; track item.title) {
                <div class="flex items-start">
                  <div class="bg-[#0a2912] p-2 rounded-full mr-4 shrink-0 mt-1">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            [attr.d]="item.iconPath"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-base">{{ item.title }}</h4>
                    <p class="text-gray-400 text-sm mt-1">{{ item.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class AboutComponent {
  private readonly visitorStore = inject(VisitorStore);

  data = input.required<AboutData>();
  locale = input<AppLocale>('en');
  isExpanded = signal(false);
  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();

    if (profile?.visitorType === 'recruiter') return this.copy().about.adaptiveTitle.recruiter;
    if (profile?.visitorType === 'founder') return this.copy().about.adaptiveTitle.founder;
    if (profile?.visitorType === 'developer') return this.copy().about.adaptiveTitle.developer;
    if (profile?.visitorType === 'hiring_manager') return this.copy().about.adaptiveTitle.hiringManager;

    return this.data().title;
  });

  adaptiveParagraphs = computed(() => {
    const profile = this.visitorStore.profile();
    const baseParas = this.data().paragraphs;

    if (!profile) return baseParas;

    switch (profile.visitorType) {
      case 'founder':
        return [
          ...this.copy().about.founderParagraphs,
          ...baseParas.slice(1)
        ];

      case 'recruiter':
      case 'hiring_manager':
        return [
          ...this.copy().about.recruiterParagraphs,
          ...baseParas
        ];

      case 'developer':
        return [
          ...this.copy().about.developerParagraphs,
          ...baseParas.slice(2)
        ];

      default:
        return baseParas;
    }
  });

  hasCollapsedPreview = computed(() => this.adaptiveParagraphs().length > 3);

  visibleParagraphs = computed(() => {
    const paragraphs = this.adaptiveParagraphs();
    if (this.isExpanded() || paragraphs.length <= 3) {
      return paragraphs;
    }

    const previewParagraphs = paragraphs.slice(0, 3);
    const fourthParagraph = paragraphs[3] ?? '';
    const tokenIndex = fourthParagraph.indexOf(this.copy().about.previewSplitToken);

    if (tokenIndex > -1) {
      previewParagraphs.push(`${fourthParagraph.slice(0, tokenIndex).trim()}`);
      return previewParagraphs;
    }

    previewParagraphs.push(`${fourthParagraph.slice(0, 180).trim()}`);
    return previewParagraphs;
  });

  toggleAbout() {
    this.isExpanded.update((value) => !value);
  }
}
