import { Component, input } from '@angular/core';
import {SkillBentoData} from "./interface/skill-bento-data";
import {NgOptimizedImage} from "@angular/common";
import { TrackBehaviorDirective } from "../../../ai-engine/directives/track-behavior.directive";

@Component({
  selector: 'skills-bento',
  templateUrl: './skills-bento.html',
  imports: [TrackBehaviorDirective]
})
export class SkillsBentoComponent {
  skills = input.required<SkillBentoData[]>();
}
