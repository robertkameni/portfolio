import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import type { ProjectListItem } from '../../../shared/types/project.types';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { toAngularLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

@Component({
  selector: 'projects-list',
  standalone: true,
  imports: [TrackBehaviorDirective, DatePipe, RouterLink, NgOptimizedImage],
  template: `
    <section class="max-w-6xl mx-auto">
      <div class="grid gap-6" style="grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));">
        @for (project of projects(); track project.id) {
          <article
            trackBehavior="project_viewed_{{ project.slug }}"
            tabindex="0"
            class="group rounded-xl overflow-hidden border border-gray-800 bg-surface h-full grid grid-rows-[auto_1fr] transition duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:border-primary focus:scale-105 focus:-translate-y-1 focus:shadow-2xl focus:border-primary outline-none"
          >
            @if (project.coverImageUrl) {
              <div class="relative h-40 w-full overflow-hidden">
                <img [ngSrc]="project.coverImageUrl" [alt]="project.title" fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" class="object-cover" />
              </div>
            }

            <div class="grid grid-rows-[auto_1fr_auto] p-4 gap-3 h-full">
              <h3 class="text-white font-bold text-lg">
                {{ project.title }}
              </h3>

              <div class="text-gray-300 text-sm min-h-0">
                @if (project.description) {
                  <p class="leading-relaxed whitespace-pre-wrap">{{ visibleDescription(project) }}</p>
                  @if (descriptionNeedsToggle(project.description)) {
                    <button
                      type="button"
                      class="text-primary font-bold hover:underline cursor-pointer mt-1"
                      (click)="toggleDescription(project.id, $event)"
                    >
                      {{ descriptionExpanded(project.id) ? commonCopy().showLess : commonCopy().showMore }}
                    </button>
                  }
                }
              </div>

              @if (project.tags && project.tags.length > 0) {
                <div class="flex flex-wrap gap-2">
                  @for (t of project.tags; track t) {
                    <span class="text-xs px-2 py-1 bg-[#07200f] text-primary rounded">{{ t }}</span>
                  }
                </div>
              }
              <div class="flex items-center justify-between">
                <a
                  class="link-color-primary-hover text-sm font-bold decoration-transparent underline-offset-4 transition-colors duration-800 ease-in-out group-hover:text-primary! hover:underline hover:decoration-current"
                  [routerLink]="['/projects', project.slug]"
                >
                  {{ projectCopy().openProject }}
                </a>
                <time class="text-xs text-gray-500">{{ project.createdAt | date: undefined : undefined : currentDateLocale() }}</time>
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class ProjectsListComponent {
  private static readonly descriptionCollapsedMaxChars = 160;

  private readonly descriptionExpandedIds = signal(new Set<string>());

  projects = input.required<ProjectListItem[]>();
  locale = input<AppLocale>('en');

  protected projectCopy() {
    return getSiteCopy(this.locale()).projects;
  }

  protected commonCopy() {
    return getSiteCopy(this.locale()).common;
  }

  protected currentDateLocale() {
    return toAngularLocale(this.locale());
  }

  protected descriptionNeedsToggle(text: string): boolean {
    return text.length > ProjectsListComponent.descriptionCollapsedMaxChars;
  }

  protected visibleDescription(project: ProjectListItem): string {
    const text = project.description ?? '';
    if (!this.descriptionNeedsToggle(text) || this.descriptionExpandedIds().has(project.id)) {
      return text;
    }
    return truncateDescriptionPreview(text, ProjectsListComponent.descriptionCollapsedMaxChars);
  }

  protected descriptionExpanded(projectId: string): boolean {
    return this.descriptionExpandedIds().has(projectId);
  }

  protected toggleDescription(projectId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.descriptionExpandedIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }
}

function truncateDescriptionPreview(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const end = lastSpace > max * 0.55 ? lastSpace : max;
  return `${slice.slice(0, end).trimEnd()}…`;
}
