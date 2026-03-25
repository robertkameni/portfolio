import { Component } from '@angular/core';

@Component({
  selector: 'admin-messages',
  standalone: true,
  template: `
    <div class="p-8 text-white">
      <h1 class="text-3xl font-bold mb-6 text-primary">AI Classified Messages</h1>
      <div class="bg-surface border border-[#143c1a] rounded-xl p-6 shadow-lg">
        <p class="text-gray-400">Loading Messages...</p>
      </div>
    </div>
  `
})
export default class AdminMessagesComponent {}
