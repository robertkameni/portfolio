import { Component, computed, inject, isDevMode, OnInit } from '@angular/core';
import { PortfolioStore } from '../store/portfolio.store';
import { AnalyticsService } from '../services/analytics.service';
import { AboutComponent } from './components/about/about.component';
import { SkillsBentoComponent } from './components/skills-bento/skills-bento';
import { HeroComponent } from './components/hero/hero';
import { IntroComponent } from './components/intro/intro';
import { ChatWidgetComponent } from '../ai-engine/chat/chat-widget';
import { ContactComponent } from './components/contact/contact';
import { ProjectsSectionComponent } from './components/projects/projects-section.component';
import { PageLoaderComponent } from '../shared/components/page-loader/page-loader.component';
import { FadeInDirective } from '../shared/directives/fade-in.directive';
import { DevProxyBarComponent } from '../shared/components/dev-proxy-bar/dev-proxy-bar.component';
import { VisitorStore } from '../store/visitor.store';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { getSiteCopy } from '../shared/i18n/site-copy';
import { FooterComponent } from './components/footer/footer';
import { ChatStore } from '../store/chat.store';

@Component({
  selector: 'home',
  standalone: true,
  imports: [
    SkillsBentoComponent,
    HeroComponent,
    AboutComponent,
    FooterComponent,
    IntroComponent,
    ChatWidgetComponent,
    ContactComponent,
    ProjectsSectionComponent,
    PageLoaderComponent,
    FadeInDirective,
    DevProxyBarComponent,
  ],
  templateUrl: './index.page.html',
})
export default class HomeComponent implements OnInit {
  store = inject(PortfolioStore);
  private visitorStore = inject(VisitorStore);
  auth = inject(AuthService);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);
  private chatStore = inject(ChatStore);

  devMode = isDevMode();
  protected readonly copy = computed(() => getSiteCopy(this.store.data()?.locale ?? 'en'));

  setMockProfile(type: any) {
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
