import { Component } from '@angular/core';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  template: `
    <div class="p-8 text-white">
      <h1 class="text-3xl font-bold mb-6 text-primary">Intelligence Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  `
})
export default class AdminDashboardComponent {}
