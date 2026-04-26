import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { authGuard } from '../../../guards/auth.guard';
import { AuthService } from '../../../services/auth.service';
import {FadeInDirective} from '../../../shared/directives/fade-in.directive';

@Component({
  selector: 'admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FadeInDirective],
  standalone: true,
  templateUrl: './layout/layout.html',
})
export default class AdminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  navigateHome() {
    this.router.navigate(['/']);
  }

  logout() {
    this.auth.logout().subscribe({
      error: () => {
        this.router.navigateByUrl('/admin/login');
      },
    });
  }
}

export const routeMeta = {
  canActivate: [authGuard],
};
