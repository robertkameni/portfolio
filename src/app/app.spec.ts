import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { AnalyticsService } from './services/analytics.service';
import { RealtimeService } from './services/realtime.service';

describe('App', () => {
  it('renders the root router outlet', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: AnalyticsService,
          useValue: {
            trackPageView: vi.fn(),
            getClientSessionId: () => 'test-session',
          },
        },
        {
          provide: RealtimeService,
          useValue: {
            isRealtimeActive: () => false,
            connectionStatus: () => 'idle',
            connect: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
