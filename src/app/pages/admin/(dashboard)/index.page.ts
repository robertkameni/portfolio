import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-8 text-white">
      <h1 class="text-3xl font-bold mb-6 text-primary">Intelligence Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-surface border border-[#143c1a] rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold mb-2">Live Visitors</h2>
          <p class="text-3xl text-primary font-mono">0</p>
        </div>
        <div class="bg-surface border border-[#143c1a] rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold mb-2">New Messages</h2>
          <p class="text-3xl text-primary font-mono">0</p>
        </div>
        <div class="bg-surface border border-[#143c1a] rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold mb-2">AI Insights</h2>
          <p class="text-3xl text-primary font-mono">0</p>
        </div>
      </div>

      <h2 class="text-xl font-semibold text-gray-300 mb-4">Quick Navigation</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a routerLink="/admin/projects"
          class="bg-surface border border-[#143c1a] rounded-xl p-5 hover:border-primary transition group">
          <p class="text-primary font-bold text-lg group-hover:underline">Projects →</p>
          <p class="text-gray-400 text-sm mt-1">Create and manage portfolio projects</p>
        </a>
        <a routerLink="/admin/messages"
          class="bg-surface border border-[#143c1a] rounded-xl p-5 hover:border-primary transition group">
          <p class="text-primary font-bold text-lg group-hover:underline">Messages →</p>
          <p class="text-gray-400 text-sm mt-1">View contact form submissions</p>
        </a>
        <a routerLink="/admin/intelligence"
          class="bg-surface border border-[#143c1a] rounded-xl p-5 hover:border-primary transition group">
          <p class="text-primary font-bold text-lg group-hover:underline">Intelligence →</p>
          <p class="text-gray-400 text-sm mt-1">AI visitor analysis and insights</p>
        </a>
      </div>
    </div>
  `
})
export default class AdminDashboardComponent {}
