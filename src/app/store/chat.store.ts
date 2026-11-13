import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatState = {
  messages: ChatMessage[];
  isTyping: boolean;
  isOpen: boolean;
  /**
   * A question handed over by the page, waiting for the widget to send it.
   * Kept in the store rather than passed as an input because the panel is a
   * deferred block: it may not exist yet when the visitor taps a question.
   */
  pendingPrompt: string | null;
};

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  isOpen: false,
  pendingPrompt: null,
};

export const ChatStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    openChat() {
      patchState(store, { isOpen: true });
    },
    toggleChat() {
      patchState(store, { isOpen: !store.isOpen() });
    },
    /** Opens the panel with a question already in flight. */
    ask(prompt: string) {
      patchState(store, { pendingPrompt: prompt, isOpen: true });
    },
    /** Reads the parked question and clears it, so a re-render cannot resend. */
    consumePendingPrompt(): string | null {
      const prompt = store.pendingPrompt();
      if (prompt !== null) {
        patchState(store, { pendingPrompt: null });
      }
      return prompt;
    },
    addUserMessage(content: string) {
      patchState(store, {
        messages: [...store.messages(), { role: 'user', content }],
        isTyping: true,
      });
    },
    appendAssistantToken(token: string) {
      const messages = [...store.messages()];
      const last = messages.at(-1);
      if (last && last.role === 'assistant') {
        last.content += token;
      } else {
        messages.push({ role: 'assistant', content: token });
      }
      patchState(store, { messages });
    },
    setTyping(isTyping: boolean) {
      patchState(store, { isTyping });
    },
  })),
);
