import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { withRenderMode } from '../../shared/routing/render-mode.types';
import { ProjectsList } from '../components/projects/projects-list';
import { RouterLink } from '@angular/router';
import { getSiteCopy } from '../../shared/i18n/site-copy';
import { LocaleService } from '../../shared/services/locale.service';
import { ProjectsStore } from '../../store/projects.store';
import { stackFamilies, type StackFamily } from '../../shared/utils/project-stack';

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

  protected readonly activeFamily = signal<StackFamily | null>(null);

  protected readonly projects = computed(() => this.store.data() ?? []);

  /* Only offer a family the data actually contains, so a filter button can
     never produce an empty list. Ordered by how much work sits behind each
     one, so the first button is the strongest claim. */
  protected readonly availableFamilies = computed(() => {
    const present = new Set<StackFamily>();
    for (const project of this.projects()) {
      for (const family of stackFamilies(project.tags)) present.add(family);
    }
    return [...present].sort((a, b) => (this.countFor().get(b) ?? 0) - (this.countFor().get(a) ?? 0));
  });

  protected readonly countFor = computed(() => {
    const counts = new Map<StackFamily, number>();
    for (const project of this.projects()) {
      for (const family of stackFamilies(project.tags)) {
        counts.set(family, (counts.get(family) ?? 0) + 1);
      }
    }
    return counts;
  });

  protected readonly visibleProjects = computed(() => {
    const family = this.activeFamily();
    if (!family) return this.projects();
    return this.projects().filter((project) => stackFamilies(project.tags).includes(family));
  });

  ngOnInit() {
    this.store.load();
  }

  protected selectFamily(family: StackFamily | null): void {
    this.activeFamily.set(family);
  }

  protected familyLabel(family: StackFamily): string {
    return family === 'angular' ? this.copy().projectsPage.filterAngular : this.copy().projectsPage.filterReact;
  }

  protected familyAriaLabel(family: StackFamily): string {
    const count = this.countFor().get(family) ?? 0;
    return `${this.familyLabel(family)}: ${this.copy().projectsPage.filterCountAriaLabel.replace('{count}', String(count))}`;
  }
}
