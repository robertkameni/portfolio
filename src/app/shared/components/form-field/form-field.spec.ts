import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldState } from '@angular/forms/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormField } from './form-field';

@Component({
  standalone: true,
  imports: [FormField],
  template: `
    <form-field [control]="control()" [errorId]="errorId()">
      <label for="probe">Probe</label>
      <input id="probe" />
    </form-field>
  `,
})
class HostComponent {
  invalid = signal(false);
  touched = signal(false);
  errorId = signal<string | null>('probe-error');

  control = () =>
    ({
      invalid: this.invalid,
      touched: this.touched,
      errors: () => [{ message: 'Required' }],
    }) as unknown as FieldState<string, string>;
}

describe('FormField', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
  }

  it('hides the message until the field is both invalid and touched', () => {
    const { fixture, host, root } = render();

    host.invalid.set(true);
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')).toBeNull();

    host.touched.set(true);
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Required');
  });

  it('exposes the message under a stable id for aria-describedby', () => {
    const { fixture, host, root } = render();
    host.invalid.set(true);
    host.touched.set(true);
    fixture.detectChanges();

    // The input points here; without the id the link would dangle.
    const alert = root.querySelector('#probe-error');

    expect(alert?.getAttribute('role')).toBe('alert');
  });

  it('renders no id when the caller does not supply one', () => {
    const { fixture, host, root } = render();
    host.errorId.set(null);
    host.invalid.set(true);
    host.touched.set(true);
    fixture.detectChanges();

    const alert = root.querySelector('[role="alert"]');

    expect(alert?.hasAttribute('id')).toBe(false);
  });
});
