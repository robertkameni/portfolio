import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'form-field',
  standalone: true,
  template: `
    <div>
      <ng-content select="label"></ng-content>
      <ng-content select="input, textarea, select"></ng-content>

      @if (control().invalid() && control().touched()) {
        <div class="text-red-400 text-sm mt-1">
          @for (error of control().errors(); track error) {
            <p>{{ error.message }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class FormFieldComponent {
  control = input.required<FieldState<string, string>>();
}
