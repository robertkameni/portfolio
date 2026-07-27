import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, Subject, switchMap, tap } from 'rxjs';
import { type AdminMessage, type MessageStatus } from '../../../shared/types/admin-message';
import { AdminMessagesService } from '../../../shared/services/admin-messages.service';
import { Router } from '@angular/router';
import { LocaleService } from '../../../shared/services/locale.service';

@Component({
  selector: 'admin-messages',
  standalone: true,
  imports: [DatePipe],
  styleUrl: './messages/messages.page.css',
  templateUrl: './messages/messages.page.html',
})
export default class AdminMessages implements OnInit {
  private readonly adminMessagesService = inject(AdminMessagesService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadTrigger = new Subject<void>();

  protected readonly messages = signal<AdminMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly counts = signal({ all: 0, unread: 0 });

  protected filter: 'ALL' | 'UNREAD' | 'ARCHIVED' = 'ALL';

  protected readonly locale = this.localeService.locale;
  protected readonly copy = this.localeService.copy;

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }

    this.loadTrigger
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.adminMessagesService.getMessages().pipe(
            tap((res) => {
              const all = res.data;
              if (!Array.isArray(all)) {
                throw new Error('Invalid response');
              }

              this.counts.set({
                all: all.length,
                unread: all.filter((m) => m.status === 'UNREAD').length,
              });

              let list = all;

              if (this.filter === 'UNREAD') {
                list = all.filter((m) => m.status === 'UNREAD');
              } else if (this.filter === 'ARCHIVED') {
                list = all.filter((m) => m.status === 'ARCHIVED');
              }

              this.messages.set(list);
            }),
            catchError((err) => {
              console.error('Failed to load messages:', err);
              this.error.set(err instanceof Error && err.message === 'Invalid response' ? 'Invalid response from server.' : 'Failed to load messages.');
              return EMPTY;
            }),
            finalize(() => {
              this.loading.set(false);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.loadMessages();
  }

  loadMessages() {
    this.loadTrigger.next();
  }

  updateStatus(id: string, status: MessageStatus) {
    this.adminMessagesService.updateStatus(id, status).subscribe({
      next: () => this.loadMessages(),
      error: (err) => console.error('Failed to update message:', err),
    });
  }

  protected navigateHome() {
    this.router.navigate(['/']);
  }
}
