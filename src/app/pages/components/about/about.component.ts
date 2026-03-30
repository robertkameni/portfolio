import { Component, computed, inject, input } from '@angular/core';
import { AboutData } from './interface/about-data';
import { VisitorStore } from '../../../store/visitor.store';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';

@Component({
  selector: 'about',
  standalone: true,
  imports: [TrackBehaviorDirective],
  template: `
    <section trackBehavior="about_viewed" class="py-6 md:py-10 flex justify-center text-white">
      <div class="max-w-6xl w-full mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 w-full items-center">
          <div class="md:col-span-5 flex justify-center">
            <div class="relative w-full max-w-sm aspect-3/4 rounded-lg overflow-hidden border border-gray-800 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
              <img src="/assets/lucas.jpg" alt="Robert Kameni" class="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500" />
            </div>
          </div>

          <div class="md:col-span-7 flex flex-col justify-center">
            <div class="mb-6 flex flex-col items-baseline">
              <h2 class="text-4xl md:text-5xl font-bold text-primary mb-2">{{ adaptiveTitle() }}</h2>
              <div class="h-1 w-16 bg-white"></div>
            </div>

            <div class="space-y-4 mb-8 text-gray-300 leading-relaxed text-sm md:text-base text-left">
              @for (paragraph of adaptiveParagraphs(); track $index) {
                <p>{{ paragraph }}</p>
              }
            </div>

            <div class="space-y-6 text-left">
              @for (item of data().highlights; track item.title) {
                <div class="flex items-start">
                  <div class="bg-[#0a2912] p-2 rounded-full mr-4 shrink-0 mt-1">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.iconPath"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-base">{{ item.title }}</h4>
                    <p class="text-gray-400 text-sm mt-1">{{ item.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AboutComponent {
  private readonly visitorStore = inject(VisitorStore);

  data = input.required<AboutData>();

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();

    if (profile?.visitorType === 'recruiter') return 'A Reliable Engineering Partner';
    if (profile?.visitorType === 'founder') return 'Building Your Vision, End-to-End';
    if (profile?.visitorType === 'developer') return 'An Architect Who Loves the Code';
    if (profile?.visitorType === 'hiring_manager') return 'Ready to Lead & Deliver';

    return this.data().title;
  });

  adaptiveParagraphs = computed(() => {
    const profile = this.visitorStore.profile();
    const baseParas = this.data().paragraphs;

    if (!profile) return baseParas;

    switch (profile.visitorType) {
      case 'founder':
        return [
          'I specialize in bringing ambitious SaaS products from 0 to 1. My focus is on establishing a clean, scalable architecture early on, ensuring your application can handle rapid growth without accumulating technical debt.',
          'Founders need speed to market without sacrificing product stability. I architect end-to-end solutions using modern Angular and Nitro backends that allow your product to pivot quickly. Furthermore, I leverage Large Language Models (LLMs) and custom AI agents to build highly intelligent, scalable features that give your platform a competitive edge from day one.',
          ...baseParas.slice(1),
        ];

      case 'recruiter':
      case 'hiring_manager':
        return [
          'As a Technical Lead, I bring a proven track record of significantly increasing development team efficiency, establishing strict code quality standards, and successfully delivering highly complex enterprise-grade Angular applications.',
          'I excel in large-scale, multi-team Scrum environments. Beyond writing clean code, I focus heavily on mentoring junior and mid-level developers, streamlining CI/CD pipelines, and integrating AI-driven tooling to accelerate the software development lifecycle across the engineering department.',
          ...baseParas,
        ];

      case 'developer':
        return [
          'I am deeply passionate about the modern Angular ecosystem and pushing the framework to its limits. I love migrating legacy applications to zoneless architectures using Angular Signals and building robust, predictable state management systems with the NgRx Signal Store.',
          "I enjoy solving complex architectural challenges, setting up scalable Nx monorepo structures, and exploring how we can use AI logic and LLMs to power highly scalable, self-adapting application architectures. If you're interested in discussing reactive programming patterns or AI integration, let's connect.",
          ...baseParas.slice(2),
        ];

      default:
        return baseParas;
    }
  });
}
