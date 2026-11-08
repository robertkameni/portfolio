import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'form-field',
  standalone: true,
  templateUrl: './form-field.html',
})
export class FormField {
  control = input.required<FieldState<string, string>>();

  /**
   * Id for the error text, so the input can point at it with aria-describedby.
   * Without it a screen reader announces the field as valid while a red message
   * sits below it.
   */
  errorId = input<string | null>(null);
}
