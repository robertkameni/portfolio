import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

export interface ProjectFormModel {
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  tags: string;
  isPublished: boolean;
}

export interface ProjectPayload {
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  tags: string[];
}

@Component({
  selector: 'project-form',
  standalone: true,
  imports: [FormField],
  template: `
    <form (submit)="submit($event)" class="bg-surface border border-[#143c1a] rounded-xl p-6 space-y-4">
      <h2 class="text-lg font-semibold text-white mb-4">{{ formTitle() }}</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Title *</label>
          <input
            [formField]="projectForm.title"
            type="text"
            class="w-full bg-[#0a1a0f] border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition"
            [class]="projectForm.title().touched() && !projectForm.title().valid() ? 'border-red-500 focus:border-red-400' : 'border-[#143c1a] focus:border-primary'"
          />
          @if (projectForm.title().touched() && projectForm.title().errors().length > 0) {
            <p class="text-red-400 text-xs mt-1">
              {{ projectForm.title().errors()[0].message }}
            </p>
          }
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Slug *</label>
          <input
            [formField]="projectForm.slug"
            type="text"
            class="w-full bg-[#0a1a0f] border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition"
            [class]="projectForm.slug().touched() && !projectForm.slug().valid() ? 'border-red-500 focus:border-red-400' : 'border-[#143c1a] focus:border-primary'"
          />
          @if (projectForm.slug().touched() && projectForm.slug().errors().length > 0) {
            <p class="text-red-400 text-xs mt-1">
              {{ projectForm.slug().errors()[0].message }}
            </p>
          }
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-400 mb-1">Description</label>
        <textarea
          [formField]="projectForm.description"
          rows="3"
          class="w-full bg-[#0a1a0f] border border-[#143c1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary resize-none"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Cover Image URL</label>
          <input
            [formField]="projectForm.coverImageUrl"
            type="text"
            class="w-full bg-[#0a1a0f] border border-[#143c1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
          <input
            [formField]="projectForm.tags"
            type="text"
            placeholder="Angular, TypeScript, SSR"
            class="w-full bg-[#0a1a0f] border border-[#143c1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <input [formField]="projectForm.isPublished" type="checkbox" id="isPublished" class="w-4 h-4 accent-primary" />
        <label for="isPublished" class="text-sm text-gray-300">{{ publishLabel() }}</label>
      </div>

      <div class="flex justify-end gap-3">
        <button type="button" (click)="cancel.emit()" class="px-6 py-2 border border-[#143c1a] text-gray-300 font-semibold rounded-lg hover:border-primary transition text-sm">
          Cancel
        </button>
        <button
          type="submit"
          [disabled]="!isFormValid() || isSubmitting()"
          class="px-6 py-2 bg-primary text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {{ isSubmitting() ? submittingLabel() : submitLabel() }}
        </button>
      </div>
    </form>
  `,
})
export class ProjectFormComponent {
  formTitle = input<string>('Project');
  submitLabel = input<string>('Save');
  submittingLabel = input<string>('Saving...');
  publishLabel = input<string>('Publish immediately');
  isSubmitting = input<boolean>(false);
  initialData = input<ProjectFormModel | null>(null);

  formSubmit = output<ProjectPayload>();
  cancel = output<void>();

  private readonly formModel = linkedSignal<ProjectFormModel | null, ProjectFormModel>({
    source: () => this.initialData(),
    computation: (data): ProjectFormModel => {
      return (
        data ?? {
          title: '',
          slug: '',
          description: '',
          coverImageUrl: '',
          tags: '',
          isPublished: false,
        }
      );
    },
  });

  readonly projectForm = form(this.formModel, (schema) => {
    required(schema.title, { message: 'Title is required' });
    required(schema.slug, { message: 'Slug is required' });
  });

  readonly isFormValid = computed(() => this.projectForm.title().valid() && this.projectForm.slug().valid());

  submit(event?: Event) {
    event?.preventDefault();
    if (!this.isFormValid() || this.isSubmitting()) return;

    const data = this.formModel();
    this.formSubmit.emit({
      title: data?.title,
      slug: data?.slug,
      description: data?.description || null,
      coverImageUrl: data?.coverImageUrl || null,
      isPublished: data?.isPublished,
      tags: data?.tags
        ? data.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
    });
  }
}
