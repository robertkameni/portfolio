import {Component, computed, inject} from '@angular/core';
import {httpResource} from '@angular/common/http';
import {ProjectsListComponent} from '../components/projects/projects-list.component';
import type {Project} from '../../shared/types/project.types';
import {RouterLink} from '@angular/router';
import type {ApiSuccess} from '../../shared/types/api.types';
import {getSiteCopy} from '../../shared/i18n/site-copy';
import {LocaleService} from '../../shared/services/locale.service';

@Component({
  selector: 'projects-page',
  standalone: true,
  imports: [ProjectsListComponent, RouterLink],
  template: `
    <main class="bg-background min-h-screen text-white px-4 py-12 md:px-8 md:py-16">
      <div class="max-w-6xl mx-auto">
        <div class="flex mb-12 justify-between items-center">
          <div>
            <h1 class="text-4xl md:text-5xl font-bold text-primary mb-2">{{ copy().projectsPage.title }}</h1>
            <div class="h-1 w-16 bg-white"></div>
          </div>
          <a
            [routerLink]="['/']"
            fragment="projects-section"
            class="inline-flex items-center gap-2 mb-3 text-base font-bold link-color-primary-hover decoration-transparent
            underline-offset-4 transition-all duration-700 ease-in-out hover:underline hover:decoration-current hover:font-bold"
          >
            <span aria-hidden="true">←</span>
            {{ copy().projectsPage.backToPortfolio }}
          </a>
        </div>

        @if (projectsResource.isLoading()) {
          <div class="flex items-center justify-center py-24 text-gray-400 font-mono">{{ copy().projectsPage.loading }}</div>
        } @else if (projectsResource.error()) {
          <div class="text-red-400 py-12">{{ copy().projectsPage.error }}</div>
        } @else if ((projectsResource.value()?.data ?? []).length === 0) {
          <div class="text-gray-500 py-12">{{ copy().projectsPage.empty }}</div>
        } @else {
          <projects-list [projects]="projectsResource.value()!.data" [locale]="locale()" />
        }
      </div>
    </main>
  `
})
export default class ProjectsPage {
  private readonly localeService = inject(LocaleService);
  protected locale = this.localeService.locale;
  protected copy = computed(() => getSiteCopy(this.locale()));
  projectsResource = httpResource<ApiSuccess<Project[]>>(() => '/api/projects');
}
