import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ProjectsListComponent } from '../components/projects/projects-list.component';
import type { Project } from '../../shared/types/project.types';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'projects-page',
  standalone: true,
  imports: [ProjectsListComponent, RouterLink],
  template: `
    <main class="bg-background min-h-screen text-white px-4 py-12 md:px-8 md:py-16">
      <div class="max-w-6xl mx-auto">
        <div class="flex mb-12 justify-between items-center">
          <div>
            <h1 class="text-4xl md:text-5xl font-bold text-primary mb-2">Projects</h1>
            <div class="h-1 w-16 bg-white"></div>
          </div>
          <a
            [routerLink]="['/']"
            fragment="projects-section"
            class="inline-flex items-center gap-2 mb-3 text-base text-primary font-bold decoration-transparent underline-offset-4 transition-all duration-700 ease-in-out hover:underline hover:decoration-current hover:text-primary hover:font-bold"
          >
            <span aria-hidden="true">←</span>
            Back to Portfolio
          </a>
        </div>

        @if (projectsResource.isLoading()) {
          <div class="flex items-center justify-center py-24 text-gray-400 font-mono">Loading projects...</div>
        } @else if (projectsResource.error()) {
          <div class="text-red-400 py-12">Could not load projects.</div>
        } @else if ((projectsResource.value() ?? []).length === 0) {
          <div class="text-gray-500 py-12">No projects published yet.</div>
        } @else {
          <projects-list [projects]="projectsResource.value()!" />
        }
      </div>
    </main>
  `,
})
export default class ProjectsPage {
  projectsResource = httpResource<Project[]>(() => '/api/projects');
}
