import { Component, input, inject, computed } from "@angular/core";
import { AboutData } from "./interface/about-data";
import { VisitorStore } from "../../../store/visitor.store";
import { TrackBehaviorDirective } from "../../../ai-engine/directives/track-behavior.directive";

@Component({
  selector: "about",
  templateUrl: "./about.html",
  imports: [TrackBehaviorDirective]
})
export class About {
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
