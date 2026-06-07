import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminMessagesService } from '../../../shared/services/admin-messages.service';

@Component({
  selector: 'admin-intelligence',
  standalone: true,
  templateUrl: './intelligence/intelligence.page.html',
})
export default class AdminIntelligenceComponent implements OnInit {
  private readonly adminMessagesService = inject(AdminMessagesService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly insightCount = signal(0);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.loadInsights();
  }

  protected loadInsights() {
    this.loading.set(true);
    this.error.set(null);

    this.adminMessagesService
      .getMessages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const messages = Array.isArray(response?.data) ? response.data : [];
          const count = messages.filter((message) => message.intelligence !== null).length;
          this.insightCount.set(count);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load intelligence insights:', err);
          this.error.set('Failed to load AI insights.');
          this.loading.set(false);
        },
      });
  }
}
