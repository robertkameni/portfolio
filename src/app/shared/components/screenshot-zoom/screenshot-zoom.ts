import { Component, ElementRef, input, viewChild } from '@angular/core';

/**
 * A screenshot wide enough to read at 16:10 is too small to read the UI inside
 * it. This shows the frame as a control and opens the full-resolution image in
 * a modal, so the evidence can actually be inspected.
 *
 * Built on the native <dialog> element: focus trapping, Escape, and the top
 * layer come from the platform instead of from hand-rolled listeners, which is
 * also why no keydown subscription is needed here.
 */
@Component({
  selector: 'screenshot-zoom',
  standalone: true,
  templateUrl: './screenshot-zoom.html',
})
export class ScreenshotZoom {
  src = input.required<string>();
  srcset = input<string>('');
  sizes = input<string>('');
  alt = input.required<string>();
  triggerLabel = input.required<string>();
  dialogLabel = input.required<string>();
  closeLabel = input.required<string>();

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  protected open(): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  }

  protected close(): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog?.open) return;
    dialog.close();
    /* A programmatic close does not reliably emit `close` across engines, so the
       cleanup runs here too. restore() is idempotent; the listener covers the
       native paths (Escape, form method="dialog"). */
    this.restore();
  }

  /* Fires for the paths the platform closes the dialog itself. */
  protected onClosed(): void {
    this.restore();
  }

  private restore(): void {
    document.documentElement.style.overflow = '';
    this.trigger()?.nativeElement.focus();
  }

  /* The dialog fills the viewport, so a backdrop click lands on the dialog
     element itself rather than on ::backdrop. Clicks on the close button or
     the image keep a child as their target. */
  protected onBackdropClick(event: MouseEvent): void {
    const dialog = this.dialog()?.nativeElement;
    if (dialog && event.target === dialog) this.close();
  }
}
