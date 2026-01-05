import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('notesAPI', {
  load: () => ipcRenderer.invoke('notes:all'),
  save: (note) => ipcRenderer.invoke('notes:save', note),
});

contextBridge.exposeInMainWorld('chatAPI', {
  ask: (messages) => ipcRenderer.invoke('chat:completion', { messages }),
});
