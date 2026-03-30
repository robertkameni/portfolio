import { Component, computed, inject, input } from '@angular/core';
import { VisitorStore } from '../../../store/visitor.store';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';
import { SkillCard } from './interface/skill-card';

@Component({
  selector: 'hero',
  standalone: true,
  imports: [TrackBehaviorDirective],
  template: `
    <section trackBehavior="hero_viewed" class="flex flex-col items-center justify-center text-white p-8 md:p-16">
      <div class="max-w-6xl w-full mx-auto px-4">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-6xl font-bold text-primary mb-4 transition-all duration-1000">
            {{ adaptiveTitle() }}
          </h1>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          @for (card of adaptiveCards(); track card.title) {
            <div trackBehavior="hero_card_viewed_{{ card.title }}" class="bg-surface border border-[#143c1a] rounded-2xl p-8 shadow-lg">
              <div class="flex flex-col items-center mb-6">
                <div class="bg-[#0a2912] p-4 rounded-full mb-4">
                  <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="card.iconPath"></path>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">{{ card.title }}</h2>
                <p class="text-sm text-gray-400">{{ card.subtitle }}</p>
              </div>
              <p class="text-gray-300 text-sm leading-relaxed mb-6">{{ card.description }}</p>
              <ul class="space-y-4 text-sm text-gray-300">
                @for (item of card.items; track item.title) {
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-primary mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <span>
                      <strong class="text-white">{{ item.title }}</strong>
                      {{ item.description }}
                    </span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class HeroComponent {
  private readonly visitorStore = inject(VisitorStore);

  name = input.required<string>();
  defaultTitle = input<string>('Technical Lead Frontend Specialist');
  cards = input.required<SkillCard[]>();

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();

    if (!profile) {
      return this.defaultTitle();
    }

    switch (profile.visitorType) {
      case 'recruiter':
      case 'hiring_manager':
        return 'Senior Engineer Ready to Drive Your Next Project';
      case 'founder':
        return 'Architecting Scalable Solutions for Ambitious Startups';
      case 'developer':
        return 'Deep Dives into Angular, Node, and AI Architecture';
      default:
        return this.defaultTitle();
    }
  });

  adaptiveCards = computed(() => {
    const profile = this.visitorStore.profile();
    const type = profile?.visitorType;

    return this.cards().map((baseCard) => {
      const isFrontend = baseCard.title.toLowerCase().includes('frontend');
      const isBackend = baseCard.title.toLowerCase().includes('backend') || baseCard.title.toLowerCase().includes('quality');

      const card = { ...baseCard };

      if (isFrontend) {
        // Base Overrides (The "Perfect" defaults)
        card.description = "Engineering modern, high-performance web applications using Angular's latest reactive primitives.";
        card.items = [
          { title: 'Reactive UI Architecture:', description: 'Zoneless Angular, Signals, and NgRx SignalStore for highly predictable state management.' },
          { title: 'Frontend Quality Assurance:', description: 'Implementing strict end-to-end testing with Playwright and rapid unit coverage via Jest.' },
          { title: 'Performance & Scaling:', description: 'Deep optimization of Core Web Vitals, SSR hydration, and structuring scalable Nx monorepos.' },
        ];

        // Dynamic Role-based Adjustments
        if (type === 'founder') {
          card.description = 'Building highly responsive, conversion-optimized interfaces that adapt instantly to your changing business needs.';
          card.items[0] = { title: 'Rapid Execution:', description: 'Leveraging modern toolchains for fast MVP delivery without accumulating technical debt.' };
          card.items[1] = { title: 'Conversion-First:', description: 'Lightning-fast load times and seamless SSR to maximize user retention and SEO.' };
          card.items[2] = { title: 'Reliable Releases:', description: 'Automated frontend testing with Playwright and Jest to ensure UI features never break.' };
        } else if (type === 'recruiter' || type === 'hiring_manager') {
          card.description = 'Delivering enterprise-grade frontend applications with a focus on code maintainability, team scalability, and UI consistency.';
          card.items[0] = { title: 'Technical Leadership:', description: 'Mentoring teams on modern Angular paradigms and enforcing clean architectural standards.' };
          card.items[1] = { title: 'Testing Culture:', description: 'Spearheading UI test automation with Jest and Playwright to guarantee stability across releases.' };
          card.items[2] = { title: 'Scalable Workflows:', description: 'Structuring Nx workspaces and CI/CD pipelines for large, multi-team enterprise environments.' };
        } else if (type === 'developer') {
          card.description = 'Pushing the boundaries of the Angular ecosystem with advanced reactivity, strict typing, and elegant design patterns.';
          card.items[0] = { title: 'Signal Architecture:', description: 'Deep integration of Signals, complex RxJS streams, and strictly zoneless state engines.' };
          card.items[1] = { title: 'Type-Safe Tooling:', description: 'Leveraging strictly typed templates and enforcing deterministic behavioral testing via Playwright.' };
          card.items[2] = { title: 'Performance Primitives:', description: 'Optimizing hydration strategies, lazy-loaded routes, and efficient change detection cycles.' };
        }
      } else if (isBackend) {
        // Base Overrides (The "Perfect" defaults)
        card.description = 'Architecting resilient APIs and maintaining uncompromising software quality across the entire stack.';
        card.items = [
          { title: 'API & Microservices:', description: 'Architecting type-safe, scalable REST and realtime APIs with Node.js (Nitro) and Java Spring Boot.' },
          { title: 'Quality Assurance:', description: 'Implementing comprehensive unit and integration tests using JUnit 5, Mockito, and Testcontainers.' },
          { title: 'Cloud & Data:', description: 'Designing seamless PostgreSQL/Prisma integrations and zero-downtime, edge-ready deployments.' },
        ];

        // Dynamic Role-based Adjustments
        if (type === 'founder') {
          card.description = 'Deploying highly reliant, cost-effective infrastructure enhanced with custom AI capabilities.';
          card.items[0] = { title: 'AI-Powered Features:', description: "Embedding intelligent agents and LLM logic natively into your product's API layer." };
          card.items[1] = { title: 'Serverless Scaling:', description: 'Leveraging cloud-edge environments that scale perfectly alongside user demand drops and spikes.' };
          card.items[2] = { title: 'Continuous Delivery:', description: 'Automated deployment pipelines to continuously ship business value without breaking things.' };
        } else if (type === 'recruiter' || type === 'hiring_manager') {
          card.description = 'Driving engineering excellence through strict QA cultures and highly reliable, scalable service architectures.';
          card.items[1] = {
            title: 'Testing Culture:',
            description: 'Enforcing TDD methodologies and rigorous API integration testing to guarantee enterprise platform stability.',
          };
          card.items[2] = { title: 'CI/CD & Delivery:', description: 'Automating reliable build pipelines to guarantee frictionless software delivery processes.' };
        } else if (type === 'developer') {
          card.description = 'Building strictly typed, highly optimized backends obsessed with clean architecture and execution speed.';
          card.items[0] = { title: 'Type-Safe Ecosystem:', description: 'Unifying the full stack with end-to-end type safety via Prisma, Nitro, and deep generics.' };
          card.items[1] = {
            title: 'Robust Testing:',
            description: 'Writing deterministic backend test suites using JUnit 5, Mockito, and Testcontainers for real DB integration.',
          };
        }
      }

      return card;
    });
  });
}
