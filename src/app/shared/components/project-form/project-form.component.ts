import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import type { AppLocale } from '../../i18n/app-locale';
import { getSiteCopy } from '../../i18n/site-copy';
import { type ProjectFormModel, type ProjectPayload, toProjectPayload } from '../../types/project.types';

export type { ProjectFormModel, ProjectPayload } from '../../types/project.types';

@Component({
  selector: 'project-form',
  standalone: true,
  imports: [FormField],
  templateUrl: './project-form.component.html',
})
export class ProjectFormComponent {
  locale = input<AppLocale>('en');
  formTitle = input<string>('Project');
  submitLabel = input<string>('Save');
  submittingLabel = input<string>('Saving...');
  publishLabel = input<string>('');
  isSubmitting = input<boolean>(false);
  initialData = input<ProjectFormModel | null>(null);
  protected readonly copy = computed(() => getSiteCopy(this.locale()));
  protected readonly effectivePublishLabel = computed(() => this.publishLabel() || this.copy().projectForm.publishImmediately);

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
          contentMarkdown: '',
          coverImageUrl: '',
          projectUrl: '',
          tags: '',
          isPublished: false,
        }
      );
    },
  });

  readonly projectForm = form(this.formModel, (schema) => {
    required(schema.title, { message: this.copy().projectForm.titleRequired });
    required(schema.slug, { message: this.copy().projectForm.slugRequired });
  });

  readonly isFormValid = computed(() => this.projectForm.title().valid() && this.projectForm.slug().valid());

  submit(event?: Event) {
    event?.preventDefault();
    if (!this.isFormValid() || this.isSubmitting()) return;

    const data = this.formModel();
    this.formSubmit.emit(toProjectPayload(data));
  }
}
