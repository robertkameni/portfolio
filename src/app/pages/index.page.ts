import {Component, inject, OnInit} from '@angular/core';
import {PortfolioStore} from '../store/portfolio.store';
import {AnalyticsService} from '../services/analytics.service';
import {RealtimeService} from '../services/realtime.service';
import {AboutComponent} from "./components/about/about.component";
import {SkillsBentoComponent} from "./components/skills-bento/skills-bento";
import {HeroComponent} from "./components/hero/hero";
import {IntroComponent} from "./components/intro/intro";
import {ChatWidgetComponent} from "../ai-engine/chat/chat-widget";
import {ContactComponent} from "./components/contact/contact";
import {ProjectsSectionComponent} from "./components/projects/projects-section.component";
import {PageLoaderComponent} from "../shared/components/page-loader/page-loader.component";

@Component({
  selector: 'home',
  standalone: true,
  imports: [SkillsBentoComponent, HeroComponent, AboutComponent, IntroComponent, ChatWidgetComponent, ContactComponent, ProjectsSectionComponent, PageLoaderComponent],
  template: `
    <main class="bg-background min-h-screen font-sans selection:bg-blue-500 selection:text-white">
      @if (store.isLoading()) {
        <page-loader message="Loading system architecture..."/>
      } @else if (store.data(); as profile) {

        <intro [data]="profile.intro"/>

        <hero [name]="profile.title" [cards]="profile.heroCards"/>

        <skills-bento [skills]="profile.skills"/>

        <about [data]="profile.about"/>

        <projects-section/>

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

  ngOnInit() {
    this.store.loadProfile();
    const sessionId = this.analytics.getClientSessionId();
    this.analytics.trackPageView('/');
    this.realtime.connect(sessionId);
  }
}
