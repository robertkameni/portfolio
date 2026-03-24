import {Component, input, signal, inject, computed} from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import {ContactData} from "./interface/contact-data";
import {FormFieldComponent} from "../../../shared/components/form-field.component";
import { VisitorStore } from "../../../store/visitor.store";
import { TrackBehaviorDirective } from "../../../ai-engine/directives/track-behavior.directive";

@Component({
  selector: 'contact',
  templateUrl: './contact.html',
  imports: [FormField, FormFieldComponent, TrackBehaviorDirective],
})
export class ContactComponent {
  private readonly visitorStore = inject(VisitorStore);

  data = input.required<ContactData>()

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
    if (profile?.visitorType === 'founder') return "Hi Robert, I have an idea for a SaaS...";
    return "Message";
  });

  adaptiveButtonText = computed(() => {
    const profile = this.visitorStore.profile();
    if (profile?.visitorType === 'recruiter') return "Schedule an Interview";
    if (profile?.visitorType === 'founder') return "Discuss My Project";
    return "Send Message";
  });

  submit(event: Event) {
    event?.preventDefault();

    // Check if the form is valid before dispatching
    if(!this.form().valid) {
      return;
    }

    const value = this.formModel();
    console.log('Dispatching message:', value);
  }
}
