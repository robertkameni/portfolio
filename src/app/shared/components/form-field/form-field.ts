import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'form-field',
  standalone: true,
  templateUrl: './form-field.html',
})
export class FormField {
  control = input.required<FieldState<string, string>>();
}
