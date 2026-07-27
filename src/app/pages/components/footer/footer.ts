import { Component } from '@angular/core';

@Component({
  selector: 'dev-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
})
export class Footer {
  year = new Date().getFullYear();
}
