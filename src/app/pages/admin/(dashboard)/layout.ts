import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { authGuard } from '../../../guards/auth.guard';

@Component({
  selector: 'admin-layout',
  imports: [RouterOutlet],
  standalone: true,
  template: `
    <div>
      <h1>Admin Dashboard</h1>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
  host: {
    class: 'block p-4',
  },
})
export default class AdminLayoutComponent {}

export const routeMeta = {
  canActivate: [authGuard],
};
