import {Component, input, signal} from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import {ContactData} from "./interface/contact-data";

@Component({
  selector: 'contact',
  templateUrl: './contact.html',
  imports: [FormField],
})
export class ContactComponent {
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

  submit(event: Event) {
    event?.preventDefault();

    const value = this.form();
    console.log('Dispatching message:', value);
  }
}
