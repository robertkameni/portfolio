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
      if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
        messages[messages.length - 1].content += token;
      } else {
        messages.push({ role: 'assistant', content: token });
      }
      patchState(store, { messages, isTyping: false });
    },
    setTyping(isTyping: boolean) {
      patchState(store, { isTyping });
    },
  }))
);
