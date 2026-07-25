import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type AdminMessage, type MessageStatus } from '../types/admin-message';

type AdminMessagesResponse = { data: AdminMessage[]; };
type AdminMessageResponse = { data: AdminMessage; };

@Service()
export class AdminMessagesService {
  private readonly http = inject(HttpClient);

  getMessages() {
    return this.http.get<AdminMessagesResponse>('/api/admin/messages');
  }

  updateStatus(id: string, status: MessageStatus) {
    return this.http.put<AdminMessageResponse>(`/api/admin/messages/${id}`, { status });
  }
}
