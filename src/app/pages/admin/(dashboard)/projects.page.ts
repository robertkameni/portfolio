import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../shared/utils/api-error.util';
import { AdminProjectsService } from '../../../services/admin-projects.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectFormComponent, ProjectPayload } from '../../../shared/components/project-form.component';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { DevProxyBarComponent } from '../../../shared/components/dev-proxy-bar.component';
import { StatusAlertComponent } from '../../../shared/components/status-alert.component';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { LocaleService } from '../../../shared/services/locale.service';
import { AdminProjectsStore } from '../../../store/projects.store';

@Component({
  selector: 'admin-projects',
  standalone: true,
  imports: [RouterLink, ProjectFormComponent, FadeInDirective, DevProxyBarComponent, StatusAlertComponent],
  template: `
    <dev-proxy-bar homeUrl="/">
      <div class="hidden sm:block flex-1"></div>
      <div class="w-full sm:w-auto flex justify-end">
        <button
          (click)="toggleForm()"
          class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg
          hover:bg-[#16a34a] transition w-full sm:w-auto mt-2 sm:mt-0 justify-center"
        >
          <span>+</span>
          {{ showForm() ? copy().adminProjects.cancel : copy().adminProjects.newProject }}
        </button>
      </div>
    </dev-proxy-bar>

    <div class="px-4 py-8 md:p-8 text-white max-w-5xl mx-auto" fadeIn>
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-primary">{{ copy().adminProjects.title }}</h1>
          <p class="text-gray-400 text-sm mt-1">{{ copy().adminProjects.subtitle }}</p>
        </div>
      </div>

      @if (submitSuccess()) {
        <status-alert type="success">{{ copy().adminProjects.createSuccess }}</status-alert>
      }

      @if (submitError()) {
        <status-alert type="error">{{ submitError() }}</status-alert>
      }

      @if (deleteError()) {
        <status-alert type="error">{{ deleteError() }}</status-alert>
      }

      @if (showForm()) {
        <div class="mb-8">
          <project-form
            [locale]="locale()"
            [formTitle]="copy().adminProjects.createFormTitle"
            [submitLabel]="copy().adminProjects.createSubmitLabel"
            [submittingLabel]="copy().adminProjects.createSubmittingLabel"
            [isSubmitting]="isSubmitting()"
            (formSubmit)="createProject($event)"
            (cancel)="toggleForm()"
          />
        </div>
      }

      @if (store.isLoading()) {
        <div class="text-gray-400 font-mono py-12 text-center">{{ copy().adminProjects.loading }}</div>
      } @else if (store.data() === null) {
        <div class="text-gray-500 py-12 text-center text-sm">{{ copy().adminProjects.loadingIdle }}</div>
      } @else if (store.error()) {
        <div class="text-red-400 py-8 text-center text-sm">
          {{ store.error() }}
        </div>
      } @else {
        <div class="space-y-3" fadeIn>
          @for (project of store.data() ?? []; track project.id) {
            <div class="bg-surface border border-[#143c1a] rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div class="flex items-center gap-4 min-w-0 flex-wrap flex-1">
                <span class="px-2 py-0.5 rounded text-xs font-medium" [class]="project.isPublished ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'">
                  {{ project.isPublished ? copy().adminProjects.published : copy().adminProjects.draft }}
                </span>

                <div class="min-w-0">
                  <p class="text-white font-medium truncate">{{ project.title }}</p>
                  <p class="text-gray-500 text-xs truncate">/projects/{{ project.slug }}</p>
                </div>
              </div>

              <div class="flex flex-col md:flex-row md:items-center md:justify-end gap-3 md:gap-4 min-w-0">
                <div class="hidden md:flex items-center justify-start gap-2 flex-wrap w-60">
                  @if (project.tags.length > 0) {
                    @for (tag of project.tags.slice(0, 3); track tag) {
                      <span class="text-xs px-2 py-0.5 bg-[#07200f] text-primary rounded whitespace-nowrap shrink-0">
                        {{ tag }}
                      </span>
                    }
                  }
                </div>
              </div>
              <div class="flex gap-4 justify-start">
                <a [routerLink]="['/projects', project.slug]" [queryParams]="{ preview: 'admin' }" class="text-sm text-gray-400 transition cursor-pointer hover:text-primary">
                  {{ copy().adminProjects.view }}
                </a>

                <a
                  [routerLink]="['/projects', project.slug, 'edit']"
                  [queryParams]="{ preview: 'admin' }"
                  class="text-sm text-gray-400 transition cursor-pointer hover:text-primary"
                >
                  {{ copy().adminProjects.edit }}
                </a>

                <a class="text-sm text-gray-400 transition cursor-pointer hover:text-primary" (click)="deleteProject(project.id, project.title)">
                  {{ copy().adminProjects.delete }}
                </a>
              </div>
            </div>
          } @empty {
            <p class="text-gray-500 text-center py-12">{{ copy().adminProjects.empty }}</p>
          }
        </div>
      }
    </div>
  `,
})
export default class AdminProjectsPage implements OnInit {
  private router = inject(Router);
  private readonly adminProjectsService = inject(AdminProjectsService);
  private readonly localeService = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(AdminProjectsStore);

  protected locale = this.localeService.locale;
  protected copy = computed(() => getSiteCopy(this.locale()));

  showForm = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  isSubmitting = signal(false);
  deleteError = signal<string | null>(null);

  ngOnInit() {
    this.store.load();
  }

  navigateHome() {
    this.router.navigate(['/']);
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    this.submitError.set(null);
    this.submitSuccess.set(false);
    this.deleteError.set(null);
  }

  getErrorMessage(err: unknown): string {
    return extractApiErrorMessage(err, this.copy().adminProjects.failedLoad);
  }

  private handleError(error: unknown, context: string, defaultMessage: string): string {
    const contextualDefaultMessage = `${defaultMessage} while trying to ${context}`;
    const message = extractApiErrorMessage(error, contextualDefaultMessage);
    console.error(`[AdminProjects] ${context}:`, error instanceof Error ? error.message : error);
    return message;
  }

  createProject(payload: ProjectPayload) {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    this.adminProjectsService
      .createProject({ ...payload })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project) => {
          this.store.addProject(project);
          this.submitSuccess.set(true);
          this.isSubmitting.set(false);
          this.showForm.set(false);
        },
        error: (err) => {
          const msg = this.handleError(err, 'create project', this.copy().adminProjects.failedCreate);
          this.submitError.set(msg);
          this.isSubmitting.set(false);
        },
      });
  }

  deleteProject(id: string, title: string) {
    if (!confirm(this.copy().adminProjects.confirmDelete.replace('{title}', title))) return;

    this.adminProjectsService
      .deleteProject(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.store.removeProject(id);
          this.deleteError.set(null);
        },
        error: (err) => {
          const msg = this.handleError(err, 'delete project', this.copy().adminProjects.failedDelete);
          this.deleteError.set(msg);
        },
      });
  }
}
