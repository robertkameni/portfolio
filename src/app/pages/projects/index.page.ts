import { Component, computed, inject, OnInit } from '@angular/core';
import { withRenderMode } from '../../shared/routing/render-mode.types';
import { ProjectsList } from '../components/projects/projects-list';
import { RouterLink } from '@angular/router';
import { getSiteCopy } from '../../shared/i18n/site-copy';
import { LocaleService } from '../../shared/services/locale.service';
import { ProjectsStore } from '../../store/projects.store';

export const routeMeta = withRenderMode('server');

@Component({
  selector: 'projects-page',
  standalone: true,
  imports: [ProjectsList, RouterLink],
  templateUrl: './index.page.html',
})
export default class ProjectsPage implements OnInit {
  private readonly localeService = inject(LocaleService);
  protected readonly store = inject(ProjectsStore);
  protected locale = this.localeService.locale;
  protected copy = computed(() => getSiteCopy(this.locale()));

  ngOnInit() {
    this.store.load();
  }
}
