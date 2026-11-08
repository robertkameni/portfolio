import { Component, computed, inject } from '@angular/core';
import { LocaleService } from '../../../shared/services/locale.service';

@Component({
  selector: 'dev-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
})
export class Footer {
  private readonly localeService = inject(LocaleService);

  readonly year = new Date().getFullYear();
  protected readonly copy = this.localeService.copy;

  readonly copyright = computed(() => this.copy().footer.copyright.replace('{year}', String(this.year)));
}
