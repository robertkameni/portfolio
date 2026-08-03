import { Component, input } from '@angular/core';

@Component({
  selector: 'page-loader',
  standalone: true,
  templateUrl: './page-loader.html',
})
export class PageLoader {
  message = input('Loading...');
}
