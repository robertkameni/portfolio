import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ContactData } from './interface/contact-data';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { StatusAlertComponent } from '../../../shared/components/status-alert/status-alert.component';
import { VisitorStore } from '../../../store/visitor.store';
import { AnalyticsService } from '../../../services/analytics.service';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { ContactService } from '../../../shared/services/contact.service';

@Component({
  selector: 'contact',
  standalone: true,
  imports: [FormFieldComponent, StatusAlertComponent, TrackBehaviorDirective, FormField],
  templateUrl: './page/contact.html',
})
export class ContactComponent {
  private readonly contactService = inject(ContactService);
  private readonly visitorStore = inject(VisitorStore);
  private readonly analytics = inject(AnalyticsService);

  data = input.required<ContactData>();
  locale = input<AppLocale>('en');
  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  formModel = signal({
    name: '',
    email: '',
    message: '',
  });

  form = form(this.formModel, (schema) => {
    required(schema.email, {
      message: () => this.copy().contact.validation.emailRequired,
    });
    required(schema.message, {
      message: () => this.copy().contact.validation.messageRequired,
    });
  });

  isSubmitting = signal(false);
  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return this.copy().contact.adaptiveTitle.recruiter;
    if (profile?.visitorType === 'founder') return this.copy().contact.adaptiveTitle.founder;
    return this.data().title;
  });

  adaptiveDescription = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return this.copy().contact.adaptiveDescription.recruiter;
    if (profile?.visitorType === 'founder') return this.copy().contact.adaptiveDescription.founder;
    return this.data().description;
  });

  adaptivePlaceholder = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return this.copy().contact.adaptivePlaceholder.recruiter;
    if (profile?.visitorType === 'founder') return this.copy().contact.adaptivePlaceholder.founder;
    return this.copy().contact.adaptivePlaceholder.default;
  });

  adaptiveButtonText = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return this.copy().contact.adaptiveButtonText.recruiter;
    if (profile?.visitorType === 'founder') return this.copy().contact.adaptiveButtonText.founder;
    return this.copy().contact.adaptiveButtonText.default;
  });

  submit(event: Event) {
    event?.preventDefault();

    if (!this.form().valid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.statusMessage.set(null);

    const value = this.formModel();
    const sessionId = this.analytics.getClientSessionId();

    this.contactService
      .sendContactMessage({
        name: value.name || undefined,
        email: value.email,
        message: value.message,
        sessionId,
      })
      .subscribe({
        next: () => {
          this.statusType.set('success');
          this.statusMessage.set('Message sent successfully! I will get back to you soon.');

          // Reset the form data AND the touched/dirty state so validation errors disappear
          this.form().reset({ name: '', email: '', message: '' });
          this.isSubmitting.set(false);

          // Auto-dismiss success message after 6 seconds
          setTimeout(() => {
            this.statusMessage.set(null);
          }, 6000);
        },
        error: (err) => {
          console.error('Failed to send message:', err);
          this.statusType.set('error');
          this.statusMessage.set('Failed to send message. Please try again or email me directly.');
          this.isSubmitting.set(false);
        },
      });
  }
}
