import { Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectsListComponent } from './projects-list.component';
import { RestoreScrollPositionDirective } from '../../../shared/directives/restore-scroll-position.directive';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { ProjectsStore } from '../../../store/projects.store';

@Component({
  selector: 'projects-section',
  standalone: true,
  imports: [RouterLink, ProjectsListComponent, RestoreScrollPositionDirective],
  templateUrl: './page/projects-section.component.html',
})
export class ProjectsSectionComponent implements OnInit {
  locale = input<AppLocale>('en');
  protected readonly store = inject(ProjectsStore);
  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  ngOnInit() {
    this.store.load();
  }
}
