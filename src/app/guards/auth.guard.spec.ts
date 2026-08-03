import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/admin/projects' } as RouterStateSnapshot;

  it('allows authenticated admin users immediately', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => true,
            isAdmin: () => true,
            checkInitialAuthStatus: vi.fn(),
          },
        },
        { provide: Router, useValue: { createUrlTree: vi.fn() } },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to admin login with returnUrl', async () => {
    const urlTree = {} as UrlTree;
    const createUrlTree = vi.fn().mockReturnValue(urlTree);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            isAdmin: () => false,
            checkInitialAuthStatus: () => of(null),
          },
        },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });

    const result = await firstValueFrom(TestBed.runInInjectionContext(() => authGuard(route, state)));
    expect(createUrlTree).toHaveBeenCalledWith(['/admin/login'], {
      queryParams: { returnUrl: '/admin/projects' },
    });
    expect(result).toBe(urlTree);
  });
});
