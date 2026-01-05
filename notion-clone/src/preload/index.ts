import { contextBridge, ipcRenderer } from 'electron';
import type { ChatExchange, Note } from '../renderer/src/types';

contextBridge.exposeInMainWorld('api', {
  getNotes: (): Promise<Note[]> => ipcRenderer.invoke('notes:fetch'),
  saveNote: (note: Note): Promise<Note[]> => ipcRenderer.invoke('notes:save', note),
  runSearch: (query: string): Promise<Note[]> => ipcRenderer.invoke('search:run', query),
  chatWithAI: (prompt: string): Promise<ChatExchange> => ipcRenderer.invoke('openai:chat', prompt)
});
