import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'project-slug-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export default class ProjectSlugLayout {}
