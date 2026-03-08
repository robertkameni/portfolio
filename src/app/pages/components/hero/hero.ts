import { Component, input } from "@angular/core";
import {SkillCard} from "./ interface/skillCard";

@Component({
  selector: "hero",
  templateUrl: "./hero.html",
})
export class HeroComponent {
  name = input.required<string>();
  title = input<string>("Technical Lead Frontend Specialist");
  cards = input.required<SkillCard[]>();
}
