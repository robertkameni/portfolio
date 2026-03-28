import { Component, input } from '@angular/core';

@Component({
  selector: 'page-loader',
  standalone: true,
  template: `
    <div class="flex min-h-screen items-center justify-center text-white font-mono">
      {{ message() }}
    </div>
  `
})
export class PageLoaderComponent {
  message = input('Loading...');
}

