import { Component, input } from '@angular/core';

@Component({
  selector: 'page-loader',
  standalone: true,
  templateUrl: './page-loader.component.html',
})
export class PageLoaderComponent {
  message = input('Loading...');
}
