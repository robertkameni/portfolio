import { Component, computed, input } from '@angular/core';
import { IntroData } from './interface/intro-data';
import { TrackBehaviorDirective } from '../../../ai-engine/directives/track-behavior.directive';

@Component({
  selector: 'intro',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './page/intro.html',
})
export class IntroComponent {
  data = input.required<IntroData>();
  nameLetters = computed(() => this.data().name.split(''));
}
