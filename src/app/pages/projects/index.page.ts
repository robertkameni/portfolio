import {Component} from '@angular/core';
import {httpResource} from '@angular/common/http';
import {ProjectsComponent} from '../components/projects/projects.component';
import {Project} from '../../store/projects.store';

@Component({
  selector: 'projects-page',
  standalone: true,
  imports: [ProjectsComponent],
  template: `
    <main class="bg-background min-h-screen text-white p-8 md:p-16">
      <div class="max-w-6xl mx-auto">
        <div class="mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-primary mb-2">Projects</h1>
          <div class="h-1 w-16 bg-white"></div>
        </div>

        @if (projectsResource.isLoading()) {
          <div class="flex items-center justify-center py-24 text-gray-400 font-mono">
            Loading projects...
          </div>
        } @else if (projectsResource.error()) {
          <div class="text-red-400 py-12">Could not load projects.</div>
        } @else if ((projectsResource.value() ?? []).length === 0) {
          <div class="text-gray-500 py-12">No projects published yet.</div>
        } @else {
          <projects-list [projects]="projectsResource.value()!"/>
        }
      </div>
    </main>
  `
})
export default class ProjectsPage {
  projectsResource = httpResource<Project[]>(() => '/api/projects');
}
