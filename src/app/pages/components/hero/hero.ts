import { Component, input, inject, computed } from "@angular/core";
import { SkillCard } from "./ interface/skillCard";
import { VisitorStore } from "../../../store/visitor.store";
import { TrackBehaviorDirective } from "../../../ai-engine/directives/track-behavior.directive";

@Component({
  selector: "hero",
  templateUrl: "./hero.html",
  imports: [TrackBehaviorDirective]
})
export class HeroComponent {
  private readonly visitorStore = inject(VisitorStore);

  name = input.required<string>();
  defaultTitle = input<string>("Technical Lead Frontend Specialist");
  cards = input.required<SkillCard[]>();

  adaptiveTitle = computed(() => {
    const profile = this.visitorStore.profile();

    if (!profile) {
      return this.defaultTitle();
    }

    switch (profile.visitorType) {
      case 'recruiter':
      case 'hiring_manager':
        return "Senior Engineer Ready to Drive Your Next Project";
      case 'founder':
        return "Architecting Scalable Solutions for Ambitious Startups";
      case 'developer':
        return "Deep Dives into Angular, Node, and AI Architecture";
      default:
        return this.defaultTitle();
    }
  });
}
