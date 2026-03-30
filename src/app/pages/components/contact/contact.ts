import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ContactData } from './interface/contact-data';
import { FormFieldComponent } from '../../../shared/components/form-field.component';
import { VisitorStore } from '../../../store/visitor.store';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';

@Component({
  selector: 'contact',
  standalone: true,
  imports: [FormFieldComponent, TrackBehaviorDirective, FormField],
  template: `
    <section trackBehavior="contact_viewed" class="flex pl-3 pr-3 pb-4 xs:pb-12 xs:p-8 justify-center text-white">
      <div class="w-full max-w-6xl border bg-[#020a04] border-[#0f2e15] rounded-2xl pl-5 pr-5 xs:p-8 md:p-12 shadow-2xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-12">
          <div class="flex flex-col justify-center text-left">
            <h2 class="text-primary text-4xl font-bold mb-4">{{ adaptiveTitle() }}</h2>
            <p class="text-gray-300 mb-10 text-lg">{{ adaptiveDescription() }}</p>

            <div class="space-y-8 text-left">
              @for (feature of data().features; track feature.title) {
                <div class="flex items-start">
                  <div class="bg-[#0a2912] p-2 rounded-full mr-4 shrink-0 mt-1">
                    <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="feature.iconPath"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-lg">{{ feature.title }}</h4>
                    <p class="text-gray-400 text-sm mt-1">{{ feature.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="bg-surface border border-[#143c1a] rounded-xl pt-4 pb-4 pr-3 pl-3 mb-4 xs:p-6 flex flex-col justify-center items-center text-center shadow-lg">
            <form (submit)="submit($event)" class="flex flex-col gap-4 w-full text-left">
              <!-- Wrapped each input in the custom app-form-field component -->
              <form-field [control]="form.name()">
                <input
                  type="text"
                  [formField]="form.name"
                  placeholder="Name"
                  class="w-full p-4 bg-[#0a2912] border border-[#143c1a] rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                />
              </form-field>

              <form-field [control]="form.email()">
                <input
                  type="email"
                  [formField]="form.email"
                  placeholder="E-Mail"
                  class="w-full p-4 bg-[#0a2912] border border-[#143c1a] rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                />
              </form-field>

              <form-field [control]="form.message()">
                <textarea
                  [formField]="form.message"
                  [placeholder]="adaptivePlaceholder()"
                  rows="4"
                  class="w-full p-4 bg-[#0a2912] border border-[#143c1a] rounded-lg text-white focus:outline-none focus:border-primary transition-colors resize-none"
                ></textarea>
              </form-field>

              <button
                type="submit"
                [disabled]="!form().valid()"
                class="cursor-pointer bg-primary hover:bg-[#16a34a] text-black font-bold py-4 px-6 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ adaptiveButtonText() }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ContactComponent {
  private readonly visitorStore = inject(VisitorStore);

  data = input.required<ContactData>();

  formModel = signal({
    name: '',
    email: '',
    message: '',
  });

  form = form(this.formModel, (schema) => {
    required(schema.email, { message: 'Email is required' });
    required(schema.message, { message: 'Message is required' });
  });

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return "Let's Talk About Your Next Big Hire";
    if (profile?.visitorType === 'founder') return "Let's Bring Your Idea to Life";
    return this.data().title;
  });

  adaptiveDescription = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return "Looking for a seasoned Angular engineer? Drop me a message and let's schedule an interview.";
    if (profile?.visitorType === 'founder') return "Ready to start building? Contact me and let's discuss your product's architecture and roadmap.";
    return this.data().description;
  });

  adaptivePlaceholder = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return "Hi Robert, we're looking for an Angular expert...";
    if (profile?.visitorType === 'founder') return 'Hi Robert, I have an idea for a SaaS...';
    return 'Message';
  });

  adaptiveButtonText = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return 'Schedule an Interview';
    if (profile?.visitorType === 'founder') return 'Discuss My Project';
    return 'Send Message';
  });

  submit(event: Event) {
    event?.preventDefault();

    // Check if the form is valid before dispatching
    if (!this.form().valid()) {
      return;
    }

    const value = this.formModel();

    console.log('Dispatching message:', value);
  }
}
