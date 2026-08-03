import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatState = {
  messages: ChatMessage[];
  isTyping: boolean;
  isOpen: boolean;
};

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  isOpen: false,
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
