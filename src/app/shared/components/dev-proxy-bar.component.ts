import { Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { FadeInDirective } from '../directives/fade-in.directive';

@Component({
  selector: 'dev-proxy-bar',
  standalone: true,
  imports: [FadeInDirective],
  template: `
    <div
      class="sticky mr-auto top-0 z-9999 w-full bg-[#051109]/95 backdrop-blur-md border-b border-primary/20 px-4 py-3 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 hover:bg-[#051109] transition-colors shadow-lg"
      fadeIn
    >
      <div class="flex items-center justify-center w-full sm:w-auto sm:mr-4">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span class="text-[10px] md:text-xs uppercase tracking-widest text-primary font-mono font-bold">AI Dev Proxy</span>
        </div>
      </div>

      <div class="hidden md:block w-px h-4 bg-gray-800 mx-1 md:mx-2"></div>

      <ng-content></ng-content>

      @if (showBackUrl() || showHomeUrl()) {
        <div class="ml-auto w-full sm:w-auto">
          <div class="flex gap-2 sm:gap-6 justify-end w-full">
            @if (showBackUrl()) {
              <button
                (click)="navigateBack()"
                class="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition w-full sm:w-auto"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            }

            @if (showHomeUrl()) {
              <button
                (click)="navigateHome()"
                class="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition w-full sm:w-auto"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
                  />
                </svg>
                Home
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DevProxyBarComponent {
  backUrl = input<string | null>(null);
  homeUrl = input<string | null>(null);

  constructor(private router: Router) {}

  showBackUrl() {
    return !!this.backUrl();
  }

  showHomeUrl() {
    return !!this.homeUrl();
  }

  navigateBack() {
    const url = this.backUrl();
    if (url) {
      this.router.navigate([url]);
    }
  }

  navigateHome() {
    const url = this.homeUrl();
    if (url) {
      this.router.navigate([url]);
    }
  }
}
