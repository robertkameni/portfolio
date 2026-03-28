import {AfterViewInit, Directive, ElementRef, inject} from "@angular/core";
import {Router} from "@angular/router";
import {ViewportScroller} from "@angular/common";

@Directive({
  selector: '[restoreScrollPosition]',
  standalone: true
})
export class RestoreScrollPositionDirective implements AfterViewInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);

  ngAfterViewInit() {
    // previousNavigation is null on hard refresh / first page load → skip
    if (!this.router.lastSuccessfulNavigation()?.previousNavigation) return;

    // getBoundingClientRect gives position relative to viewport.
    // Adding window.scrollY converts it to absolute document position.
    const rect = this.el.nativeElement.getBoundingClientRect();
    const absoluteTop = rect.top + (window.scrollY ?? 0);

    this.viewportScroller.scrollToPosition([0, absoluteTop]);
  }
}
