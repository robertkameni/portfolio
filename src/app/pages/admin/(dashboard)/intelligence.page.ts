import { Component } from '@angular/core';

@Component({
  selector: 'admin-intelligence',
  standalone: true,
  template: `
    <div class="p-8 text-white">
      <h1 class="text-3xl font-bold mb-6 text-primary">Visitor Intelligence</h1>
      <div class="bg-surface border border-[#143c1a] rounded-xl p-6 shadow-lg">
        <p class="text-gray-400">Loading AI Insights...</p>
      </div>
    </div>
  `,
})
export default class AdminIntelligenceComponent {}
