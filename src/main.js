import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuid } from 'uuid';

const NOTES_FILE = path.join(app.getPath('userData'), 'notes.json');

function ensureNotesFile() {
  if (!fs.existsSync(NOTES_FILE)) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify([]));
  }
}

function loadNotes() {
  ensureNotesFile();
  const raw = fs.readFileSync(NOTES_FILE, 'utf8');
  return JSON.parse(raw);
}

function saveNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

ipcMain.handle('notes:all', () => {
  return loadNotes();
});

ipcMain.handle('notes:save', (_event, note) => {
  const notes = loadNotes();
  const now = new Date().toISOString();
  const existingIndex = notes.findIndex((n) => n.id === note.id);

  const normalized = {
    id: note.id || uuid(),
    title: note.title || 'Untitled',
    content: note.content || '',
    updatedAt: now,
    createdAt: note.createdAt || now,
  };

  if (existingIndex >= 0) {
    notes[existingIndex] = normalized;
  } else {
    notes.unshift(normalized);
  }

  saveNotes(notes);
  return normalized;
});

ipcMain.handle('chat:completion', async (_event, { messages }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Set OPENAI_API_KEY in your environment to use ChatGPT.');
  }

  const body = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.6,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content || 'No response received.';
  return text;
});

app.whenReady().then(() => {
  ensureNotesFile();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
