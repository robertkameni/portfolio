import {Component, inject, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {httpResource} from '@angular/common/http';
import {PortfolioStore} from '../store/portfolio.store';
import {AnalyticsService} from '../services/analytics.service';
import {RealtimeService} from '../services/realtime.service';
import type {Project} from '../store/projects.store';

import {AboutComponent} from "./components/about/about.component";
import {SkillsBentoComponent} from "./components/skills-bento/skills-bento";
import {HeroComponent} from "./components/hero/hero";
import {IntroComponent} from "./components/intro/intro";
import {ChatWidgetComponent} from "../ai-engine/chat/chat-widget";
import {ContactComponent} from "./components/contact/contact";
import {ProjectsComponent} from "./components/projects/projects.component";

@Component({
  selector: 'home',
  standalone: true,
  imports: [SkillsBentoComponent, HeroComponent, AboutComponent, IntroComponent, ChatWidgetComponent, ContactComponent, ProjectsComponent, RouterLink],
  template: `
    <main class="bg-background min-h-screen font-sans selection:bg-blue-500 selection:text-white">
      @if (store.isLoading()) {
        <div class="flex min-h-screen items-center justify-center text-white font-mono">
          Loading system architecture...
        </div>
      } @else if (store.data(); as profile) {

        <intro [data]="profile.intro"/>

        <hero [name]="profile.title" [cards]="profile.heroCards"/>

        <skills-bento [skills]="profile.skills"/>

        <about [data]="profile.about"/>

        <section class="max-w-6xl mx-auto px-6 md:px-0 py-16 md:py-20">
          <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p class="text-sm uppercase tracking-[0.3em] text-gray-500 mb-3">Selected work</p>
              <h2 class="text-3xl md:text-4xl font-bold text-primary">Projects</h2>
              <p class="text-gray-400 mt-3 max-w-2xl">
                A small preview of published work. Open the full overview to browse every project.
              </p>
            </div>
            <a routerLink="/projects"
               class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              View all projects
              <span aria-hidden="true">→</span>
            </a>
          </div>

          @if (projectsResource.isLoading()) {
            <div class="py-12 text-gray-400 font-mono text-center">Loading projects...</div>
          } @else if (projectsResource.error()) {
            <div class="py-12 text-red-400 text-center text-sm">Could not load projects.</div>
          } @else if ((projectsResource.value() ?? []).length === 0) {
            <div class="py-12 text-gray-500 text-center text-sm">No projects published yet.</div>
          } @else {
            <projects-list [projects]="(projectsResource.value() ?? []).slice(0, 3)"/>
          }
        </section>

        <contact [data]="profile.contact"/>

        <chat-widget/>
      }
    </main>
  `
})
export default class HomeComponent implements OnInit {
  store = inject(PortfolioStore);
  private analytics = inject(AnalyticsService);
  private realtime = inject(RealtimeService);

  projectsResource = httpResource<Project[]>(() => '/api/projects');

  ngOnInit() {
    this.store.loadProfile();
    const sessionId = this.analytics.getClientSessionId();
    this.analytics.trackPageView('/');
    this.realtime.connect(sessionId);
  }
}
