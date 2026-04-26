import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'project-slug-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './[slug]/layout/project-slug-layout.html',
})
export default class ProjectSlugLayout {}
