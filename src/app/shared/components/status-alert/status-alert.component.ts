import { Component, input } from '@angular/core';

@Component({
  selector: 'status-alert',
  standalone: true,
  templateUrl: './status-alert.component.html',
})
export class StatusAlertComponent {
  type = input<'success' | 'error'>('success');
}
