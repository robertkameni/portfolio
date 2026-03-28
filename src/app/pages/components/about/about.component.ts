import {Component, computed, inject, input} from "@angular/core";
import {AboutData} from "./interface/about-data";
import {VisitorStore} from "../../../store/visitor.store";
import {TrackBehaviorDirective} from "../../../ai-engine/directives/track-behavior.directive";

@Component({
  selector: "about",
  standalone: true,
  imports: [TrackBehaviorDirective],
  template: `
    <section trackBehavior="about_viewed" class="text-white p-8 pb-0 md:p-16 md:pb-0 md:pt-0 flex justify-center">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-12 max-w-6xl w-full items-center">

        <div class="md:col-span-5 flex justify-center">
          <div
            class="relative w-full max-w-sm aspect-3/4 rounded-lg overflow-hidden border border-gray-800 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
            <img
              src="/assets/robert-kameni-bw.jpg"
              alt="Robert Kameni"
              class="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>

        <div class="md:col-span-7 flex flex-col justify-center">

          <div class="mb-6 flex flex-col items-baseline">
            <h2 class="text-4xl md:text-5xl font-bold text-[#22c55e] mb-2">{{ adaptiveTitle() }}</h2>
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          [attr.d]="item.iconPath"></path>
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
    </section>
  `
})
export class AboutComponent {
  private readonly visitorStore = inject(VisitorStore);

  data = input.required<AboutData>();

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();

    if (profile?.visitorType === 'recruiter') return "A Reliable Engineering Partner";
    if (profile?.visitorType === 'founder') return "Building Your Vision, End-to-End";
    if (profile?.visitorType === 'developer') return "An Architect Who Loves the Code";
    if (profile?.visitorType === 'hiring_manager') return "Ready to Lead & Deliver";

    return this.data().title;
  });

  adaptiveParagraphs = computed(() => {
    const profile = this.visitorStore.profile();
    const baseParas = this.data().paragraphs;

    if (!profile) return baseParas;

    // Fully adaptive content based on VisitorProfileAnalysis type
    switch (profile.visitorType) {
      case 'founder':
        return [
          "I specialize in bringing SaaS products from 0 to 1, focusing on scalability, clean architecture, and exceptional user experience.",
          "Founders need speed without sacrificing quality. I architect solutions that allow your product to pivot and grow rapidly, integrating AI natively to give you a competitive edge.",
          ...baseParas.slice(1)
        ];

      case 'recruiter':
      case 'hiring_manager':
        return [
          "I'm a Technical Lead with a proven track record of increasing team efficiency, establishing code quality standards, and delivering enterprise-grade Angular applications.",
          "I excel in multi-team Scrum setups, mentoring junior developers, and bridging the gap between business requirements and technical execution.",
          ...baseParas
        ];

      case 'developer':
        return [
          "I am deeply passionate about the Angular ecosystem. From migrating to zoneless apps with Signals to building robust State Management with NgRx Signal Store, I love exploring modern frontend paradigms.",
          "Check out my GitHub for open-source contributions. I always enjoy discussing monorepo structures, automated testing (Cypress/Jest), and CI/CD pipelines.",
          ...baseParas.slice(2)
        ];

      default:
        return baseParas;
    }
  });
}
