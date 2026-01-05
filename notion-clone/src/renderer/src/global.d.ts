import type { ChatExchange, Note } from './types';

declare global {
  interface Window {
    api: {
      getNotes: () => Promise<Note[]>;
      saveNote: (note: Note) => Promise<Note[]>;
      runSearch: (query: string) => Promise<Note[]>;
      chatWithAI: (prompt: string) => Promise<ChatExchange>;
    };
  }
}

export {};
