import { Component, DestroyRef, computed, effect, inject, isDevMode, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { withRenderMode } from '../shared/routing/render-mode.types';
import { PortfolioStore } from '../store/portfolio.store';
import { VisitorStore } from '../store/visitor.store';
import { ChatStore } from '../store/chat.store';
import { getSiteCopy } from '../shared/i18n/site-copy';
import { ActiveSectionDirective } from '../shared/directives/active-section.directive';
import { FadeInDirective } from '../shared/directives/fade-in.directive';
import { SiteToolbarComponent } from '../shared/components/site-toolbar/site-toolbar';
import { PageLoader } from '../shared/components/page-loader/page-loader';
import { Masthead } from './components/masthead/masthead';
import { FocusAreas } from './components/focus-areas/focus-areas';
import { SkillsBento } from './components/skills-bento/skills-bento';
import { About } from './components/about/about';
import { ProjectsSection } from './components/projects/projects-section';
import { TwinInvite } from './components/twin-invite/twin-invite';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';
import { ChatWidget } from '../ai-engine';
import { PageMetaService } from '../shared/services/page-meta.service';
import { LocaleService } from '../shared/services/locale.service';
import { getPageSeoCopy } from '../shared/seo/page-seo-copy';
import { buildPersonJsonLd, buildPersonWebsiteGraph, buildWebsiteJsonLd } from '../shared/seo/json-ld';
import { siteAbsoluteUrl } from '../shared/seo/site-absolute-url';
import { buildHreflangLinks } from '../shared/seo/hreflang';
import { cvKnowsAbout } from '../shared/seo/cv-knows-about';
import { PERSON_NAME } from '../shared/seo/person-identity';
import { CV_DATA } from './cv/cv-data';

export const routeMeta = withRenderMode('server');

@Component({
  selector: 'home',
  standalone: true,
  imports: [
    Masthead,
    FocusAreas,
    SkillsBento,
    About,
    ProjectsSection,
    TwinInvite,
    Contact,
    Footer,
    ChatWidget,
    PageLoader,
    FadeInDirective,
    ActiveSectionDirective,
    SiteToolbarComponent,
    RouterLink,
  ],
  templateUrl: './index.page.html',
})
export default class Home implements OnInit {
  store = inject(PortfolioStore);
  private readonly visitorStore = inject(VisitorStore);
  private readonly chatStore = inject(ChatStore);
  private readonly pageMeta = inject(PageMetaService);
  private readonly localeService = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  devMode = isDevMode();
  protected readonly copy = computed(() => getSiteCopy(this.store.data()?.locale ?? 'en'));

  constructor() {
    effect(() => {
      const locale = this.localeService.locale();
      const seo = getPageSeoCopy(locale);
      const url = siteAbsoluteUrl('/');
      this.pageMeta.apply({
        title: seo.home.title,
        description: seo.home.description,
        canonical: url,
        hreflang: buildHreflangLinks('/'),
        jsonLd: buildPersonWebsiteGraph(
          buildPersonJsonLd({
            jobTitle: CV_DATA.headline,
            knowsAbout: cvKnowsAbout(),
            url,
          }),
          buildWebsiteJsonLd({ url, name: PERSON_NAME }),
        ),
      });
    });
    this.destroyRef.onDestroy(() => this.pageMeta.restore());
  }

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
