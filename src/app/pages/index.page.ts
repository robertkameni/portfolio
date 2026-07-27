import { Component, computed, inject, isDevMode, OnInit } from '@angular/core';
import { PortfolioStore } from '../store/portfolio.store';
import { AnalyticsService } from '../services/analytics.service';
import { About } from './components/about/about';
import { SkillsBento } from './components/skills-bento/skills-bento';
import { Hero } from './components/hero/hero';
import { Intro } from './components/intro/intro';
import { ChatWidget } from '../ai-engine/chat/chat-widget';
import { Contact } from './components/contact/contact';
import { ProjectsSection } from './components/projects/projects-section';
import { PageLoader } from '../shared/components/page-loader/page-loader';
import { FadeInDirective } from '../shared/directives/fade-in.directive';
import { DevProxyBar } from '../shared/components/dev-proxy-bar/dev-proxy-bar';
import { VisitorStore } from '../store/visitor.store';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { getSiteCopy } from '../shared/i18n/site-copy';
import { Footer } from './components/footer/footer';
import { ChatStore } from '../store/chat.store';

@Component({
  selector: 'home',
  standalone: true,
  imports: [
    SkillsBento,
    Hero,
    About,
    Footer,
    Intro,
    ChatWidget,
    Contact,
    ProjectsSection,
    PageLoader,
    FadeInDirective,
    DevProxyBar,
  ],
  templateUrl: './index.page.html',
})
export default class Home implements OnInit {
  store = inject(PortfolioStore);
  private visitorStore = inject(VisitorStore);
  auth = inject(AuthService);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);
  private chatStore = inject(ChatStore);

  devMode = isDevMode();
  protected readonly copy = computed(() => getSiteCopy(this.store.data()?.locale ?? 'en'));

  setMockProfile(type: import('../shared/types/visitor.types').VisitorProfileAnalysis['visitorType'] | null) {
    if (!type) {
      this.visitorStore.setProfile(null);
      return;
    }
    this.visitorStore.setProfile({
      visitorType: type,
      confidenceScore: 1,
      interests: ['Mock Data'],
      summary: 'Mocked profile for development',
      reasoning: 'Dev Mode activated',
    });
  }

  ngOnInit() {
    this.store.loadProfile();
  }

  onAdminClick() {
    try {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/admin/login']);
      }
    } catch (e) {
      this.router.navigate(['/admin/login']);
    }
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/admin/login'),
    });
  }

  openChatFromLauncher() {
    this.chatStore.openChat();
  }
}
