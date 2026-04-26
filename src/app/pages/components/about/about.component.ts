import { Component, computed, inject, input, signal } from '@angular/core';
import { AboutData } from './interface/about-data';
import { VisitorStore } from '../../../store/visitor.store';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

@Component({
  selector: 'about',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './page/about.component.html',
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
    const token = this.copy().about.previewSplitToken;
    const fourthParagraph =
      paragraphs.slice(3).find((p) => p.includes(token)) ?? paragraphs[3] ?? '';
    const tokenIndex = fourthParagraph.indexOf(token);

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
