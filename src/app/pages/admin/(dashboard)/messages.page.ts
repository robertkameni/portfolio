import {Component, inject, OnInit, PLATFORM_ID, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DatePipe, isPlatformBrowser} from '@angular/common';
import {catchError, EMPTY, finalize, tap} from 'rxjs';

type MessageStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

type MessageIntelligence = {
  classification: string | null;
  sentiment: string | null;
  urgencyScore: number | null;
  priorityScore: number | null;
  suggestedReply: string | null;
};

type Message = {
  id: string;
  senderName: string | null;
  senderEmail: string;
  body: string;
  status: MessageStatus;
  createdAt: string;
  intelligence: MessageIntelligence | null;
  session: { id: string; visitorId: string; startedAt: string } | null;
};

@Component({
  selector: 'admin-messages',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './messages/messages.page.html',
})
export default class AdminMessagesComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  messages = signal<Message[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  filter: 'ALL' | 'UNREAD' | 'ARCHIVED' = 'ALL';
  counts = signal({all: 0, unread: 0});

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.loadMessages();
  }

  loadMessages() {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<{ data: Message[] }>('/api/admin/messages')
      .pipe(
        tap((res) => {
          const all = res.data;
          if (!Array.isArray(all)) {
            throw new Error('Invalid response');
          }
          this.counts.set({
            all: all.length,
            unread: all.filter((m) => m.status === 'UNREAD').length
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
          this.error.set(
            err instanceof Error && err.message === 'Invalid response'
              ? 'Invalid response from server.'
              : 'Failed to load messages.'
          );
          return EMPTY;
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe();
  }

  updateStatus(id: string, status: MessageStatus) {
    this.http.put<{ data: Message }>(`/api/admin/messages/${id}`, {status}).subscribe({
      next: () => this.loadMessages(),
      error: (err) => console.error('Failed to update message:', err)
    });
  }
}
