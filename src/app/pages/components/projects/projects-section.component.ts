import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {httpResource} from '@angular/common/http';
import type {Project} from '../../../shared/types/project.types';
import {ProjectsComponent} from './projects.component';
import {RestoreScrollPositionDirective} from '../../../shared/directives/restore-scroll-position.directive';

@Component({
  selector: 'projects-section',
  standalone: true,
  imports: [RouterLink, ProjectsComponent, RestoreScrollPositionDirective],
  template: `
    <section class="max-w-6xl p-8" restoreScrollPosition>
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-gray-500 mb-3">Selected work</p>
          <h2 class="text-3xl md:text-4xl font-bold text-primary">Projects</h2>
          <p class="text-gray-400 mt-3 max-w-2xl">
            A small preview of published work. Open the full overview to browse every project.
          </p>
        </div>
        <a routerLink="/projects"
           class="inline-flex items-center gap-2 text-base font-medium text-primary hover:underline hover:font-bold">
          View all projects
          <span aria-hidden="true">→</span>
        </a>
      </div>

      @if (projectsResource.isLoading()) {
        <div class="py-12 text-gray-400 font-mono text-center">Loading projects...</div>
      } @else if (projectsResource.error()) {
        <div class="py-12 text-red-400 text-center text-sm">Could not load projects.</div>
      } @else if ((projectsResource.value() ?? []).length === 0) {
        <div class="py-12 text-gray-500 text-center text-sm">No projects published yet.</div>
      } @else {
        <projects-list [projects]="(projectsResource.value() ?? []).slice(0, 3)"/>
      }
    </section>
  `
})
export class ProjectsSectionComponent {
  protected readonly projectsResource = httpResource<Project[]>(() => '/api/projects');
}

