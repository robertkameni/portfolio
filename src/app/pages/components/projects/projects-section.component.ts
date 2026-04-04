import { Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectsListComponent } from './projects-list.component';
import { RestoreScrollPositionDirective } from '../../../shared/directives/restore-scroll-position.directive';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { ProjectsStore } from '../../../store/projects.store';

@Component({
  selector: 'projects-section',
  standalone: true,
  imports: [RouterLink, ProjectsListComponent, RestoreScrollPositionDirective],
  template: `
    <section id="projects-section" class="py-4 px-4 md:py-10" restoreScrollPosition>
      <div class="max-w-6xl w-full mx-auto">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p class="text-sm uppercase tracking-[0.3em] text-gray-500 mb-3">{{ copy().projects.eyebrow }}</p>
            <h2 class="text-3xl md:text-4xl font-bold text-primary">{{ copy().projects.title }}</h2>
            <p class="text-gray-400 mt-3 max-w-2xl">{{ copy().projects.description }}</p>
          </div>
          <a
            routerLink="/projects"
            class="inline-flex items-center gap-2 text-base font-bold link-color-primary-hover
            decoration-transparent underline-offset-4 transition-all duration-700 ease-in-out
            hover:underline hover:decoration-current hover:font-bold"
          >
            {{ copy().projects.viewAll }}
            <span aria-hidden="true" class="text-current">→</span>
          </a>
        </div>

        @if (store.isLoading()) {
          <div class="py-12 text-gray-400 font-mono text-center">{{ copy().projects.loading }}</div>
        } @else if (store.error()) {
          <div class="py-12 text-red-400 text-center text-sm">{{ copy().projects.error }}</div>
        } @else if ((store.data() ?? []).length === 0) {
          <div class="py-12 text-gray-500 text-center text-sm">{{ copy().projects.empty }}</div>
        } @else {
          <projects-list [projects]="(store.data() ?? []).slice(0, 3)" [locale]="locale()" />
        }
      </div>
    </section>
  `,
})
export class ProjectsSectionComponent implements OnInit {
  locale = input<AppLocale>('en');
  protected readonly store = inject(ProjectsStore);
  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  ngOnInit() {
    this.store.load();
  }
}
