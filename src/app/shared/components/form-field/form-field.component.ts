import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'form-field',
  standalone: true,
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent {
  control = input.required<FieldState<string, string>>();
}
