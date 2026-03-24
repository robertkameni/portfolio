import { Component, inject, OnInit } from '@angular/core';
import { PortfolioStore } from '../store/portfolio.store';
import { AnalyticsService } from '../services/analytics.service';
import { RealtimeService } from '../services/realtime.service';

import { SkillsBentoComponent } from './components/skills-bento/skills-bento';
import { HeroComponent } from "./components/hero/hero";
import { ContactComponent } from "./components/contact/contact";
import { About } from "./components/about/about";
import { IntroComponent } from "./components/intro/intro";
import { ChatWidgetComponent } from '../ai-engine/chat/chat-widget';

@Component({
  selector: 'home',
  imports: [SkillsBentoComponent, HeroComponent, ContactComponent, About, IntroComponent, ChatWidgetComponent],
  templateUrl: './index.page.html',
})
export default class Home implements OnInit {
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
