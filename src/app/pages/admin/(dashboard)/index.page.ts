import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AdminMessagesService } from '../../../shared/services/admin-messages.service';
import { LocaleService } from '../../../shared/services/locale.service';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './index.page.html',
})
export default class AdminDashboard implements OnInit {
  private readonly adminMessagesService = inject(AdminMessagesService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly newMessagesCount = signal(0);

  protected locale = this.localeService.locale;
  protected copy = this.localeService.copy;

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadNewMessagesCount();
  }

  private loadNewMessagesCount() {
    this.adminMessagesService
      .getMessages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const messages = Array.isArray(response?.data) ? response.data : [];
          const unreadCount = messages.filter((message) => message.status === 'UNREAD').length;
          this.newMessagesCount.set(unreadCount);
        },
        error: (err) => {
          console.error('Failed to load new messages count:', err);
        },
      });
  }

  protected navigateHome() {
    this.router.navigate(['/']);
  }
}
