import { Component, computed, DestroyRef, inject, input, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { ContactData } from './interface/contact-data';
import { FormField as FormFieldShell } from '../../../shared/components/form-field/form-field';
import { StatusAlert } from '../../../shared/components/status-alert/status-alert';
import { VisitorStore } from '../../../store/visitor.store';
import { AnalyticsService } from '../../../services/analytics.service';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { ContactService } from '../../../shared/services/contact.service';
import type { VisitorProfileAnalysis } from '../../../shared/types/visitor.types';

function contactAudienceBucket(visitorType: VisitorProfileAnalysis['visitorType'] | undefined): 'founder' | 'recruiter' | 'developer' | null {
  if (!visitorType) return null;
  if (visitorType === 'founder') return 'founder';
  if (visitorType === 'recruiter' || visitorType === 'hiring_manager') return 'recruiter';
  return 'developer';
}

@Component({
  selector: 'contact',
  standalone: true,
  imports: [FormFieldShell, StatusAlert, TrackBehaviorDirective, FormField],
  templateUrl: './contact.html',
})
export class Contact implements OnDestroy {
  private readonly contactService = inject(ContactService);
  private readonly visitorStore = inject(VisitorStore);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  data = input.required<ContactData>();
  locale = input<AppLocale>('en');

  isSubmitting = signal<boolean>(false);
  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  formModel = signal({
    name: '',
    email: '',
    message: '',
  });

  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  form = form(this.formModel, (schema) => {
    required(schema.email, {
      message: () => this.copy().contact.validation.emailRequired,
    });
    required(schema.message, {
      message: () => this.copy().contact.validation.messageRequired,
    });
  });

  /**
   * Three contact audiences (Founder, Recruiter, Entwickler). AI may emit finer types;
   * hiring managers use Recruiter copy; student/other use Entwickler copy.
   */
  private readonly adaptiveContact = computed(() => {
    const profile = this.visitorStore.profile();
    const c = this.copy().contact;
    const defaultTitle = this.data().title;
    const defaultDescription = this.data().description;

    const bucket = contactAudienceBucket(profile?.visitorType);

    switch (bucket) {
      case 'recruiter':
        return {
          title: c.adaptiveTitle.recruiter,
          description: c.adaptiveDescription.recruiter,
          placeholder: c.adaptivePlaceholder.recruiter,
          button: c.adaptiveButtonText.recruiter,
        };
      case 'founder':
        return {
          title: c.adaptiveTitle.founder,
          description: c.adaptiveDescription.founder,
          placeholder: c.adaptivePlaceholder.founder,
          button: c.adaptiveButtonText.founder,
        };
      case 'developer':
        return {
          title: c.adaptiveTitle.developer,
          description: c.adaptiveDescription.developer,
          placeholder: c.adaptivePlaceholder.developer,
          button: c.adaptiveButtonText.developer,
        };
      default:
        return {
          title: defaultTitle,
          description: defaultDescription,
          placeholder: c.adaptivePlaceholder.default,
          button: c.adaptiveButtonText.default,
        };
    }
  });

  adaptiveTitle = computed(() => this.adaptiveContact().title);

  adaptiveDescription = computed(() => this.adaptiveContact().description);

  adaptivePlaceholder = computed(() => this.adaptiveContact().placeholder);

  adaptiveButtonText = computed(() => this.adaptiveContact().button);

  submit(event: Event) {
    event?.preventDefault();

    if (!this.form().valid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.statusMessage.set(null);
    this.clearDismissTimer();

    const value = this.formModel();
    const sessionId = this.analytics.getClientSessionId();

    this.contactService
      .sendContactMessage({
        name: value.name || undefined,
        email: value.email,
        message: value.message,
        sessionId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.statusType.set('success');
          this.statusMessage.set(this.copy().contact.submitSuccess);

          this.form().reset({ name: '', email: '', message: '' });
          this.isSubmitting.set(false);

          // Auto-dismiss success message after 6 seconds
          this.dismissTimer = setTimeout(() => {
            this.statusMessage.set(null);
            this.dismissTimer = null;
          }, 6000);
        },
        error: (err) => {
          console.error('Failed to send message:', err);
          this.statusType.set('error');
          this.statusMessage.set(this.copy().contact.submitError);
          this.isSubmitting.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.clearDismissTimer();
  }

  private clearDismissTimer(): void {
    const timer = this.dismissTimer;
    if (!timer) return;

    clearTimeout(timer);
    this.dismissTimer = null;
  }
}
