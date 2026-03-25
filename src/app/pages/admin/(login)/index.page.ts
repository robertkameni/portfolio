import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'admin-index',
  standalone: true,
  template: '',
})
export default class AdminIndexComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/projects'], { replaceUrl: true });
    } else {
      this.router.navigate(['/admin/login'], { replaceUrl: true });
    }
  }
}
