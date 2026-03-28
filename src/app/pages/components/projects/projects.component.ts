import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TrackBehaviorDirective} from '../../../ai-engine/directives/track-behavior.directive';
import {DatePipe} from "@angular/common";

@Component({
  selector: 'projects-list',
  standalone: true,
  imports: [TrackBehaviorDirective, DatePipe, RouterLink],
  template: `
    <section class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (project of projects(); track project.id) {
          <article trackBehavior="project_viewed_{{ project.slug }}"
                   class="rounded-xl overflow-hidden border border-gray-800 bg-surface">
            @if (project.coverImageUrl) {
              <div class="h-40 w-full overflow-hidden">
                <img src="{{ project.coverImageUrl }}" alt="{{ project.title }}" class="object-cover w-full h-full"/>
              </div>
            }

            <div class="p-4">
              <h3 class="text-white font-bold text-lg mb-2">{{ project.title }}</h3>
              @if (project.description) {
                <p class="text-gray-300 text-sm mb-3">{{ project.description }}</p>
              }

              @if (project.tags && project.tags.length > 0) {
                <div class="flex flex-wrap gap-2 mb-3">
                  @for (t of project.tags; track t) {
                    <span class="text-xs px-2 py-1 bg-[#07200f] text-primary rounded">{{ t }}</span>
                  }
                </div>
              }
              <div class="flex items-center justify-between">
                <a class="text-sm text-primary font-medium hover:underline hover:font-bold"
                   [routerLink]="['/projects', project.slug]">
                  Open project →
                </a>
                <time class="text-xs text-gray-500">{{ project.createdAt | date }}</time>
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `
})
export class ProjectsComponent {
  projects = input.required<any[]>();
}

