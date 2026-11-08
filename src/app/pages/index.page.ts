import { Component, computed, inject, isDevMode, OnInit } from '@angular/core';
import { withRenderMode } from '../shared/routing/render-mode.types';
import { PortfolioStore } from '../store/portfolio.store';
import { VisitorStore } from '../store/visitor.store';
import { ChatStore } from '../store/chat.store';
import { getSiteCopy } from '../shared/i18n/site-copy';
import { FadeInDirective } from '../shared/directives/fade-in.directive';
import { SiteToolbarComponent } from '../shared/components/site-toolbar/site-toolbar';
import { PageLoader } from '../shared/components/page-loader/page-loader';
import { Masthead } from './components/masthead/masthead';
import { FocusAreas } from './components/focus-areas/focus-areas';
import { SkillsBento } from './components/skills-bento/skills-bento';
import { About } from './components/about/about';
import { ProjectsSection } from './components/projects/projects-section';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';
import { ChatWidget } from '../ai-engine';

export const routeMeta = withRenderMode('server');

@Component({
  selector: 'home',
  standalone: true,
  imports: [Masthead, FocusAreas, SkillsBento, About, ProjectsSection, Contact, Footer, ChatWidget, PageLoader, FadeInDirective, SiteToolbarComponent],
  templateUrl: './index.page.html',
})
export default class Home implements OnInit {
  store = inject(PortfolioStore);
  private readonly visitorStore = inject(VisitorStore);
  private readonly chatStore = inject(ChatStore);

  devMode = isDevMode();
  protected readonly copy = computed(() => getSiteCopy(this.store.data()?.locale ?? 'en'));

  readonly activeProfile = computed(() => this.visitorStore.profile()?.visitorType ?? null);

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

  openChatFromLauncher() {
    this.chatStore.openChat();
  }
}
