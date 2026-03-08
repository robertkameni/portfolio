import {Component, computed, input} from "@angular/core";
import {IntroData} from "./interface/intro-data";

@Component({
  selector: 'intro',
  templateUrl:'./intro.html'
})
export class IntroComponent {
  data = input.required<IntroData>();

  nameLetters = computed(() => this.data().name.split(''))
}
