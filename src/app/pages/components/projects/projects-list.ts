import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrackBehaviorDirective } from '../../../ai-engine';
import { DatePipe } from '@angular/common';
import type { ProjectListItem } from '../../../shared/types/project.types';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { toAngularLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

@Component({
  selector: 'projects-list',
  standalone: true,
  imports: [TrackBehaviorDirective, DatePipe, RouterLink],
  templateUrl: './projects-list.html',
})
export class ProjectsList {
  private static readonly descriptionCollapsedMaxChars = 160;

  /* A row is a summary, not a spec sheet. Eleven wrapped mono tags push the
     description below the fold on a phone, so the list shows a prefix and
     the remainder as a count. The detail page still lists every tag. */
  private static readonly collapsedTagCount = 4;

  private readonly descriptionExpandedIds = signal(new Set<string>());

  projects = input.required<ProjectListItem[]>();
  locale = input<AppLocale>('en');

  protected projectCopy() {
    return getSiteCopy(this.locale()).projects;
  }

  protected commonCopy() {
    return getSiteCopy(this.locale()).common;
  }

  protected openProjectAriaLabel(title: string): string {
    return this.projectCopy().openProjectAriaLabel.replaceAll('{title}', title);
  }

  protected viewLiveAriaLabel(title: string): string {
    return this.projectCopy().viewLiveAriaLabel.replaceAll('{title}', title);
  }

  protected coverAlt(title: string): string {
    return `${title}: Startseite der Anwendung`;
  }

  protected currentDateLocale() {
    return toAngularLocale(this.locale());
  }

  protected descriptionNeedsToggle(text: string): boolean {
    return text.length > ProjectsList.descriptionCollapsedMaxChars;
  }

  protected visibleTags(project: ProjectListItem): string[] {
    return (project.tags ?? []).slice(0, ProjectsList.collapsedTagCount);
  }

  protected hiddenTagCount(project: ProjectListItem): number {
    return Math.max(0, (project.tags?.length ?? 0) - ProjectsList.collapsedTagCount);
  }

  protected descriptionExpanded(projectId: string): boolean {
    return this.descriptionExpandedIds().has(projectId);
  }

  protected toggleDescription(projectId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.descriptionExpandedIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }
}
