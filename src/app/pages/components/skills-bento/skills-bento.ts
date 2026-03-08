import { Component, input } from '@angular/core';
import {SkillBentoData} from "./interface/skill-bento-data";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'skills-bento',
  templateUrl: './skills-bento.html',
  imports: [
    NgOptimizedImage
  ]
})
export class SkillsBentoComponent {
  skills = input.required<SkillBentoData[]>();
}
