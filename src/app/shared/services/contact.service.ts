import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type ContactPayload = {
  name?: string;
  email: string;
  message: string;
  sessionId: string;
};

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  sendContactMessage(payload: ContactPayload) {
    return this.http.post('/api/contact', payload);
  }
}
