import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Note } from '../renderer/src/types';
const NOTES_FILE = () => path.join(app.getPath('userData'), 'notes.json');

async function ensureStoreFile() {
  const filePath = NOTES_FILE();
  if (!existsSync(filePath)) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf-8');
  }
}

async function readNotes(): Promise<Note[]> {
  await ensureStoreFile();
  const content = await fs.readFile(NOTES_FILE(), 'utf-8');
  try {
    return JSON.parse(content) as Note[];
  } catch (error) {
    console.error('Failed to parse notes, resetting file', error);
    await fs.writeFile(NOTES_FILE(), JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
}

async function persistNotes(notes: Note[]) {
  await fs.writeFile(NOTES_FILE(), JSON.stringify(notes, null, 2), 'utf-8');
}

let ipcRegistered = false;

async function registerIpcHandlers() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('notes:fetch', async () => readNotes());

  ipcMain.handle('notes:save', async (_event, note: Note) => {
    const notes = await readNotes();
    const updatedNote: Note = { ...note, updatedAt: new Date().toISOString() };
    const existingIndex = notes.findIndex((entry) => entry.id === updatedNote.id);

    if (existingIndex >= 0) {
      notes[existingIndex] = updatedNote;
    } else {
      notes.push(updatedNote);
    }

    await persistNotes(notes);
    return notes;
  });

  ipcMain.handle('search:run', async (_event, query: string) => {
    const notes = await readNotes();
    const normalized = query.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(normalized) ||
        note.content.toLowerCase().includes(normalized)
    );
  });

  ipcMain.handle('openai:chat', async (_event, prompt: string) => {
    const notes = await readNotes();
    const matched = notes.filter((note) => note.content.toLowerCase().includes(prompt.toLowerCase()));
    const contextSummary = matched
      .map((note) => `• ${note.title}: ${note.content.slice(0, 120)}${note.content.length > 120 ? '...' : ''}`)
      .join('\n');

    return {
      prompt,
      response:
        contextSummary.length > 0
          ? `This is a placeholder AI reply based on your notes:\n${contextSummary}`
          : 'This is a placeholder AI reply. Connect your OpenAI credentials to get live answers.'
    };
  });
}

async function createWindow() {
  await registerIpcHandlers();

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const rendererIndex = path.join(__dirname, '../renderer/index.html');

  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(rendererIndex);
  }
}

app.whenReady().then(() => {
  createWindow().catch((error) => console.error('Failed to start app', error));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
