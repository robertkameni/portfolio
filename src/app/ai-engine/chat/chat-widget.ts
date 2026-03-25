import {afterRenderEffect, Component, ElementRef, inject, signal, viewChild} from '@angular/core';
import { ChatStore } from '../../store/chat.store';
import { RealtimeService } from '../../services/realtime.service';

@Component({
  selector: 'chat-widget',
  standalone: true,
  imports: [],
  template: `
    <!-- Floating Action Button -->
    <div class="fixed bottom-6 right-6 z-50">
      <button
        (click)="toggleChat()"
        class="bg-primary hover:bg-[#16a34a] text-black w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      >
        @if (chatStore.isOpen()) {
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        } @else {
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        }
      </button>

      <!-- Chat Window -->
      @if (chatStore.isOpen()) {
        <div
          class="absolute bottom-16 right-0 w-80 md:w-96 bg-[#020a04] border border-[#0f2e15] rounded-2xl shadow-2xl flex flex-col h-[500px] max-h-[80vh] overflow-hidden">

          <!-- Header -->
          <div class="bg-[#0a2912] border-b border-[#143c1a] p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <div class="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-primary">
                  <span class="text-primary font-bold">RK</span>
                </div>
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a2912] rounded-full"></div>
              </div>
              <div>
                <h3 class="text-white font-bold text-sm">Digital Twin</h3>
                <p class="text-xs text-gray-400">Ask me anything about Robert</p>
              </div>
            </div>
          </div>

          <!-- Messages Area -->
          <div #messagesContainer class="flex-1 overflow-y-contains p-4 space-y-4 bg-background scroll-smooth">
            @if (chatStore.messages().length === 0) {
              <div class="text-center text-gray-500 mt-10">
                <p class="text-sm">Hi! I'm Robert's AI Digital Twin.</p>
                <p class="text-sm mt-2">I know his projects, stack, and experience.</p>
                <div class="mt-4 space-y-2">
                  <button (click)="newMessage.set('Tell me about your Angular experience'); sendMessage()"
                          class="text-xs bg-[#0a2912] hover:bg-[#143c1a] text-primary py-2 px-3 rounded-full transition-colors w-full text-left">
                    "Tell me about your Angular experience"
                  </button>
                  <button (click)="newMessage.set('Are you available for freelance work?'); sendMessage()"
                          class="text-xs bg-[#0a2912] hover:bg-[#143c1a] text-primary py-2 px-3 rounded-full transition-colors w-full text-left">
                    "Are you available for freelance?"
                  </button>
                </div>
              </div>
            }

            @for (msg of chatStore.messages(); track $index) {
              <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
                <div
                  [class]="msg.role === 'user' ? 'bg-primary text-black max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2 text-sm' : 'bg-surface border border-[#143c1a] text-white max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2 text-sm'">
                  {{ msg.content }}
                </div>
              </div>
            }

            @if (chatStore.isTyping()) {
              <div class="flex justify-start">
                <div
                  class="bg-surface border border-[#143c1a] text-white rounded-2xl rounded-tl-sm px-4 py-3 flex space-x-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
                <span class="sr-only"> AI is typing...</span>
              </div>
            }
          </div>

          <!-- Input Area -->
          <div class="p-3 bg-[#0a2912] border-t border-[#143c1a]">
            <form (submit)="sendMessage($event)" class="flex items-center space-x-2">
              <input
                type="text"
                [value]="newMessage()"
                (input)="onInputChange($event)"
                (keyup.enter)="sendMessage()"
                placeholder="Type your message..."
                class="flex-1 bg-background border border-[#143c1a] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                autocomplete="off"
              />
              <button
                type="submit"
                [disabled]="!newMessage().trim() || chatStore.isTyping()"
                class="bg-primary hover:bg-[#16a34a] disabled:bg-gray-600 disabled:cursor-not-allowed text-black w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              >
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </form>
          </div>

        </div>
      }
    </div>
  `
})
export class ChatWidgetComponent {
  public chatStore = inject(ChatStore);
  public realtimeService = inject(RealtimeService);

  // Restore the viewChild for the scrolling container
  messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  newMessage = signal('');

  constructor() {
    // Restore the automatic scroll logic
    afterRenderEffect({
      write: () => {
        const messages = this.chatStore.messages();
        const container = this.messagesContainer();

        if (container && messages.length > 0) {
          const el = container.nativeElement;
          el.scrollTop = el.scrollHeight;
        }
      }
    });
  }

  toggleChat() {
    this.chatStore.toggleChat();
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.newMessage.set(target.value);
  }

  sendMessage(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (!this.newMessage().trim()) return;

    const message = this.newMessage();
    this.newMessage.set(''); // Clear input


    console.log('Sending message:', message)

    this.chatStore.addUserMessage(message);
    this.realtimeService.sendChatMessage(message);
  }
}
