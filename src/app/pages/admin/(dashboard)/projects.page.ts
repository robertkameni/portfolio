import {Component, computed, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {extractApiErrorMessage} from '../../../shared/utils/api-error.util';
import {AdminProjectsService} from '../../../services/admin-projects.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ProjectFormComponent, ProjectPayload} from '../../../shared/components/project-form/project-form.component';
import {FadeInDirective} from '../../../shared/directives/fade-in.directive';
import {DevProxyBarComponent} from '../../../shared/components/dev-proxy-bar/dev-proxy-bar.component';
import {StatusAlertComponent} from '../../../shared/components/status-alert/status-alert.component';
import {getSiteCopy} from '../../../shared/i18n/site-copy';
import {LocaleService} from '../../../shared/services/locale.service';
import {AdminProjectsStore} from '../../../store/projects.store';

@Component({
  selector: 'admin-projects',
  standalone: true,
  imports: [RouterLink, ProjectFormComponent, FadeInDirective, DevProxyBarComponent, StatusAlertComponent],
  templateUrl: './projects/page/projects.page.html',
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

  navigateToAdmin() {
    this.router.navigate(['/admin']);
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

  protected firstTags(tags: string[]): string[] {
    return tags.slice(0, 3);
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
      .createProject({...payload})
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
        }
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
        }
      });
  }
}
