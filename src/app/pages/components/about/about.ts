import {Component, input} from "@angular/core";
import {AboutData} from "./interface/about-data";

@Component({
  selector: "about",
  templateUrl: "./about.html",
})
export class About {
  data = input.required<AboutData>();
}
