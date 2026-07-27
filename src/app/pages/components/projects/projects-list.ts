import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrackBehaviorDirective } from '../../../ai-engine';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import type { ProjectListItem } from '../../../shared/types/project.types';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { toAngularLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

@Component({
  selector: 'projects-list',
  standalone: true,
  imports: [TrackBehaviorDirective, DatePipe, RouterLink, NgOptimizedImage],
  templateUrl: './projects-list.html',
})
export class ProjectsList {
  private static readonly descriptionCollapsedMaxChars = 160;

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

  protected currentDateLocale() {
    return toAngularLocale(this.locale());
  }

  protected descriptionNeedsToggle(text: string): boolean {
    return text.length > ProjectsList.descriptionCollapsedMaxChars;
  }

  protected visibleDescription(project: ProjectListItem): string {
    const text = project.description ?? '';
    if (!this.descriptionNeedsToggle(text) || this.descriptionExpandedIds().has(project.id)) {
      return text;
    }
    return truncateDescriptionPreview(text, ProjectsList.descriptionCollapsedMaxChars);
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

function truncateDescriptionPreview(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const end = lastSpace > max * 0.55 ? lastSpace : max;
  return `${slice.slice(0, end).trimEnd()}…`;
}
