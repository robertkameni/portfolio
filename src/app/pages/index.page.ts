import { Component, computed, inject, isDevMode, OnInit } from '@angular/core';
import { PortfolioStore } from '../store/portfolio.store';
import { AnalyticsService } from '../services/analytics.service';
import { RealtimeService } from '../services/realtime.service';
import { AboutComponent } from './components/about/about.component';
import { SkillsBentoComponent } from './components/skills-bento/skills-bento';
import { HeroComponent } from './components/hero/hero';
import { IntroComponent } from './components/intro/intro';
import { ChatWidgetComponent } from '../ai-engine/chat/chat-widget';
import { ContactComponent } from './components/contact/contact';
import { ProjectsSectionComponent } from './components/projects/projects-section.component';
import { PageLoaderComponent } from '../shared/components/page-loader/page-loader.component';
import { FadeInDirective } from '../shared/directives/fade-in.directive';
import { DevProxyBarComponent } from '../shared/components/dev-proxy-bar.component';
import { VisitorStore } from '../store/visitor.store';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { getSiteCopy } from '../shared/i18n/site-copy';

@Component({
  selector: 'home',
  standalone: true,
  imports: [
    SkillsBentoComponent,
    HeroComponent,
    AboutComponent,
    IntroComponent,
    ChatWidgetComponent,
    ContactComponent,
    ProjectsSectionComponent,
    PageLoaderComponent,
    FadeInDirective,
    DevProxyBarComponent,
  ],
  template: `
    <dev-proxy-bar>
      @if (devMode) {
        <button
          (click)="setMockProfile('founder')"
          class="w-full sm:w-auto text-xs px-4 py-1.5 bg-green-950/30 hover:bg-green-900/50 text-green-400 border
          border-green-900/50 rounded-full transition-colors duration-700 whitespace-nowrap cursor-pointer"
        >
          {{ copy().home.founder }}
        </button>
        <button
          (click)="setMockProfile('recruiter')"
          class="w-full sm:w-auto text-xs px-4 py-1.5 bg-blue-950/30 hover:bg-blue-900/50 text-blue-400 border
        border-blue-900/50 rounded-full transition-colors duration-700 whitespace-nowrap cursor-pointer"
        >
          {{ copy().home.recruiter }}
        </button>
        <button
          (click)="setMockProfile('developer')"
          class="text-xs px-4 py-1.5 bg-purple-950/30 hover:bg-purple-900/50 text-purple-400 border border-purple-900/50
        rounded-full transition-colors duration-700 whitespace-nowrap cursor-pointer w-full sm:w-auto"
        >
          {{ copy().home.developer }}
        </button>

        <div class="hidden sm:block w-px h-4 bg-gray-800 mx-1 sm:mx-2"></div>

        <button
          (click)="setMockProfile(null)"
          class="w-full sm:w-auto text-xs px-4 py-1.5 bg-gray-900/50 hover:bg-gray-800 text-gray-400 border
        border-gray-800 rounded-full transition-colors duration-700 whitespace-nowrap cursor-pointer"
        >
          {{ copy().home.reset }}
        </button>
      }

      <div class="w-full sm:w-auto sm:ml-auto">
        @if (auth.authInitialized() && auth.isAuthenticated() && auth.isAdmin()) {
          <button
            (click)="navigateToAdminProjects()"
            title="Admin Projects"
            aria-label="Admin projects dashboard"
            class="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5
            bg-primary text-black rounded-md shadow hover:bg-[#16a34a] transition-colors duration-300 font-semibold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>{{ copy().home.adminPage }}</span>
          </button>
        } @else if (auth.authInitialized() && !auth.isAuthenticated()) {
          <button
            (click)="onAdminClick()"
            title="Admin"
            aria-label="Admin login"
            class="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5
            bg-green-600 text-white rounded-md shadow hover:bg-green-500 transition-colors duration-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>{{ copy().home.admin }}</span>
          </button>
        }
      </div>
    </dev-proxy-bar>

    <main class="bg-background min-h-screen font-sans selection:bg-blue-500 pt-4 xs:pt-0 selection:text-white" fadeIn>
      @if (store.isLoading()) {
        <page-loader [message]="copy().home.loadingProfile" />
      } @else if (store.error()) {
        <page-loader [message]="copy().home.failedProfile" />
      } @else if (store.data(); as profile) {
        <intro [data]="profile.intro" fadeIn />

        <hero [name]="profile.title" [cards]="profile.heroCards" [locale]="profile.locale" fadeIn />

        <skills-bento [skills]="profile.skills" [locale]="profile.locale" fadeIn />

        <about [data]="profile.about" [locale]="profile.locale" fadeIn />

        <projects-section [locale]="profile.locale" fadeIn />

        <contact [data]="profile.contact" [locale]="profile.locale" fadeIn />

        <chat-widget />
      }
    </main>
  `,
})
export default class HomeComponent implements OnInit {
  store = inject(PortfolioStore);
  private visitorStore = inject(VisitorStore);
  auth = inject(AuthService);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);
  private realtime = inject(RealtimeService);

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
    const sessionId = this.analytics.getClientSessionId();
    this.realtime.connect(sessionId);
  }

  onAdminClick() {
    try {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/admin/projects']);
      } else {
        this.router.navigate(['/admin/login']);
      }
    } catch (e) {
      this.router.navigate(['/admin/login']);
    }
  }

  navigateToAdminProjects() {
    this.router.navigate(['/admin/projects']);
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/admin/login'),
    });
  }
}
