import { Component, computed, inject, OnInit } from '@angular/core';
import { ProjectsListComponent } from '../components/projects/projects-list.component';
import { RouterLink } from '@angular/router';
import { getSiteCopy } from '../../shared/i18n/site-copy';
import { LocaleService } from '../../shared/services/locale.service';
import { ProjectsStore } from '../../store/projects.store';

@Component({
  selector: 'projects-page',
  standalone: true,
  imports: [ProjectsListComponent, RouterLink],
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
