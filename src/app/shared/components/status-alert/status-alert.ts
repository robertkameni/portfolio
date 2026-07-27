import { Component, input } from '@angular/core';

@Component({
  selector: 'status-alert',
  standalone: true,
  templateUrl: './status-alert.html',
})
export class StatusAlert {
  type = input<'success' | 'error'>('success');
}
