import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScreenshotZoom } from './screenshot-zoom';

@Component({
  standalone: true,
  imports: [ScreenshotZoom],
  template: `
    <screenshot-zoom src="/assets/projects/team-sim.png" alt="Team Sim" triggerLabel="Open screenshot" dialogLabel="Screenshot at full size" closeLabel="Close" />
  `,
})
class HostComponent {}

/* jsdom does not implement the top layer, so showModal/close are stubbed. The
   assertions below cover our own behaviour: when we call the platform, and
   what we clean up afterwards. */
function stubDialogTopLayer(): { opened: string[] } {
  const calls: string[] = [];
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
    calls.push('showModal');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    calls.push('close');
  };
  return { opened: calls };
}

describe('ScreenshotZoom', () => {
  beforeEach(() => {
    stubDialogTopLayer();
    document.documentElement.style.overflow = '';
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      trigger: root.querySelector('screenshot-zoom > button') as HTMLButtonElement,
      dialog: root.querySelector('dialog') as HTMLDialogElement,
    };
  }

  it('exposes the zoom as a labelled control, not a bare image', () => {
    const { trigger } = render();

    expect(trigger.getAttribute('aria-label')).toBe('Open screenshot');
  });

  it('locks page scroll while the screenshot is open', () => {
    const { trigger } = render();

    trigger.click();

    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('restores scroll and focus when closed from the close button', () => {
    const { trigger, dialog } = render();
    trigger.click();

    (dialog.querySelector('button') as HTMLButtonElement).click();

    expect(dialog.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    // Focus must not be orphaned on a button that no longer exists on screen.
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when the backing area is clicked', () => {
    const { trigger, dialog } = render();
    trigger.click();

    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog.open).toBe(false);
  });

  it('stays open when the screenshot itself is clicked', () => {
    const { trigger, dialog } = render();
    trigger.click();

    (dialog.querySelector('img') as HTMLImageElement).click();

    expect(dialog.open).toBe(true);
  });
});
