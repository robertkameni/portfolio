import {Component, computed, inject, PLATFORM_ID, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {HttpClient, httpResource} from '@angular/common/http';
import {form, FormField, required} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {Project} from '../../../store/projects.store';

interface ProjectFormModel {
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  tags: string;
  isPublished: boolean;
}

@Component({
  selector: 'admin-projects',
  standalone: true,
  imports: [FormField, RouterLink],
  template: `
    <div class="p-8 text-white max-w-5xl mx-auto">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-primary">Projects</h1>
          <p class="text-gray-400 text-sm mt-1">Manage published and draft projects</p>
        </div>
        <button (click)="toggleForm()"
                class="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:opacity-90 transition">
          {{ showForm() ? 'Cancel' : '+ New Project' }}
        </button>
      </div>

      @if (submitSuccess()) {
        <div
          class="mb-6 flex items-center gap-3 bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Project created successfully.
        </div>
      }

      @if (submitError()) {
        <div
          class="mb-6 flex items-center gap-3 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ submitError() }}
        </div>
      }

      @if (showForm()) {
        <form (submit)="submit($event)" class="bg-surface border border-[#143c1a] rounded-xl p-6 mb-8 space-y-4">
          <h2 class="text-lg font-semibold text-white mb-4">Create Project</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Title *</label>
              <input [formField]="projectForm.title" type="text"
                     class="w-full bg-[#0a1a0f] border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition"
                     [class]="projectForm.title().touched() && !projectForm.title().valid()
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-[#143c1a] focus:border-primary'"/>
              @if (projectForm.title().touched() && projectForm.title().errors().length > 0) {
                <p class="text-red-400 text-xs mt-1">{{ projectForm.title().errors()[0].message }}</p>
              }
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Slug *</label>
              <input [formField]="projectForm.slug" type="text"
                     class="w-full bg-[#0a1a0f] border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition"
                     [class]="projectForm.slug().touched() && !projectForm.slug().valid()
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-[#143c1a] focus:border-primary'"/>
              @if (projectForm.slug().touched() && projectForm.slug().errors().length > 0) {
                <p class="text-red-400 text-xs mt-1">{{ projectForm.slug().errors()[0].message }}</p>
              }
            </div>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Description</label>
            <textarea [formField]="projectForm.description" rows="3"
                      class="w-full bg-[#0a1a0f] border border-[#143c1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary resize-none"></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Cover Image URL</label>
              <input [formField]="projectForm.coverImageUrl" type="text"
                     class="w-full bg-[#0a1a0f] border border-[#143c1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"/>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
              <input [formField]="projectForm.tags" type="text" placeholder="Angular, TypeScript, SSR"
                     class="w-full bg-[#0a1a0f] border border-[#143c1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"/>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <input [formField]="projectForm.isPublished" type="checkbox" id="isPublished"
                   class="w-4 h-4 accent-primary"/>
            <label for="isPublished" class="text-sm text-gray-300">Publish immediately</label>
          </div>

          <div class="flex justify-end">
            <button type="submit" [disabled]="!isFormValid() || isSubmitting()"
                    class="px-6 py-2 bg-primary text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50">
              {{ isSubmitting() ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      }

      @if (projectsResource.isLoading()) {
        <div class="text-gray-400 font-mono py-12 text-center">Loading projects...</div>
      } @else if (projectsResource.status() === 'idle') {
        <div class="text-gray-500 py-12 text-center text-sm">Loading...</div>
      } @else if (projectsResource.error()) {
        <div class="text-red-400 py-8 text-center text-sm">
          {{ getErrorMessage(projectsResource.error()) }}
        </div>
      } @else {
        <div class="space-y-3">
          @for (project of projectsResource.value(); track project.id) {
            <div class="bg-surface border border-[#143c1a] rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <span class="px-2 py-0.5 rounded text-xs font-medium"
                      [class]="project.isPublished ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'">
                  {{ project.isPublished ? 'Published' : 'Draft' }}
                </span>
                <div>
                  <p class="text-white font-medium">{{ project.title }}</p>
                  <p class="text-gray-500 text-xs">/projects/{{ project.slug }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                @if (project.tags.length > 0) {
                  <div class="hidden md:flex gap-1">
                    @for (tag of project.tags.slice(0, 3); track tag) {
                      <span class="text-xs px-2 py-0.5 bg-[#07200f] text-primary rounded">{{ tag }}</span>
                    }
                  </div>
                }
                <a [routerLink]="['/projects', project.slug]"
                   class="text-xs text-gray-400 hover:text-primary transition">View ↗</a>
              </div>
            </div>
          } @empty {
            <p class="text-gray-500 text-center py-12">No projects yet. Create your first one.</p>
          }
        </div>
      }
    </div>
  `
})
export default class AdminProjectsPage {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private readonly clientReady = isPlatformBrowser(this.platformId);

  projectsResource = httpResource<Project[] | undefined>(() =>
    this.clientReady
      ? '/api/admin/projects'
      : undefined
  );

  showForm = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  isSubmitting = signal(false);

  formModel = signal<ProjectFormModel>({
    title: '',
    slug: '',
    description: '',
    coverImageUrl: '',
    tags: '',
    isPublished: false
  });

  projectForm = form(this.formModel, (schema) => {
    required(schema.title, {message: 'Title is required'});
    required(schema.slug, {message: 'Slug is required'});
  });

  isFormValid = computed(() =>
    this.projectForm.title().valid() && this.projectForm.slug().valid()
  );

  toggleForm() {
    this.showForm.set(!this.showForm());
    this.submitError.set(null);
    this.submitSuccess.set(false);
    if (!this.showForm()) {
      this.formModel.set({title: '', slug: '', description: '', coverImageUrl: '', tags: '', isPublished: false});
    }
  }

  getErrorMessage(err: unknown): string {
    if (!err) return '';
    const e = err as any;
    return e?.error?.statusMessage || e?.message || 'Failed to load projects';
  }

  submit(event?: Event) {
    event?.preventDefault();
    if (!this.isFormValid() || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    const data = this.formModel();
    const payload = {
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      contentMarkdown: null,
      coverImageUrl: data.coverImageUrl || null,
      isPublished: data.isPublished,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    this.http.post<Project>('/api/admin/projects', payload).subscribe({
      next: (project) => {
        this.projectsResource.set([project, ...(this.projectsResource.value() ?? [])]);
        this.submitSuccess.set(true);
        this.isSubmitting.set(false);
        this.formModel.set({title: '', slug: '', description: '', coverImageUrl: '', tags: '', isPublished: false});
        this.showForm.set(false);
      },
      error: (err) => {
        const msg = err?.error?.statusMessage || err?.message || 'Failed to create project';
        console.error('[AdminProjects] create error:', err.status, msg);
        this.submitError.set(msg);
        this.isSubmitting.set(false);
      }
    });
  }
}
