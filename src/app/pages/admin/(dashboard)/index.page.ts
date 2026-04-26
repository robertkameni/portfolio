import {Component, inject, OnInit, PLATFORM_ID, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {isPlatformBrowser} from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './index.page.html',
})
export default class AdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly newMessagesCount = signal(0);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadNewMessagesCount();
  }

  private loadNewMessagesCount() {
    this.http.get<{data: Array<{status: 'UNREAD' | 'READ' | 'ARCHIVED'}>}>('/api/admin/messages').subscribe({
      next: (response) => {
        const messages = Array.isArray(response?.data) ? response.data : [];
        const unreadCount = messages.filter((message) => message.status === 'UNREAD').length;
        this.newMessagesCount.set(unreadCount);
      },
      error: (err) => {
        console.error('Failed to load new messages count:', err);
      }
    });
  }
}
