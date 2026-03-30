import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';
import { DatePipe } from '@angular/common';
import type { Project } from '../../../shared/types/project.types';

@Component({
  selector: 'projects-list',
  standalone: true,
  imports: [TrackBehaviorDirective, DatePipe, RouterLink],
  template: `
    <section class="max-w-6xl mx-auto">
      <div class="grid gap-6" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
        @for (project of projects(); track project.id) {
          <article trackBehavior="project_viewed_{{ project.slug }}" class="rounded-xl overflow-hidden border border-gray-800 bg-surface h-full grid grid-rows-[auto_1fr]">
            @if (project.coverImageUrl) {
              <div class="h-40 w-full overflow-hidden">
                <img [src]="project.coverImageUrl" [alt]="project.title" class="object-cover w-full h-full" />
              </div>
            }

            <div class="grid grid-rows-[auto_1fr_auto] p-4 gap-3 h-full">
              <h3 class="text-white font-bold text-lg">
                {{ project.title }}
              </h3>

              <div class="text-gray-300 text-sm overflow-hidden">
                @if (project.description) {
                  <p class="leading-relaxed">{{ project.description }}</p>
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
                  class="text-sm text-white font-bold decoration-transparent underline-offset-4 transition-colors duration-1000 ease-in-out hover:text-primary hover:underline hover:decoration-current"
                  [routerLink]="['/projects', project.slug]"
                >
                  Open project →
                </a>
                <time class="text-xs text-gray-500">{{ project.createdAt | date }}</time>
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class ProjectsListComponent {
  projects = input.required<Project[]>();
}
