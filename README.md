# Double K Notes

A minimal Electron desktop app inspired by Notion. It supports local-first notes and an optional ChatGPT helper (requires `OPENAI_API_KEY`).

## Features
- Local notes stored on your machine (in Electron's user data folder).
- Create, select, and edit notes with instant save.
- ChatGPT helper that can read your current note context (if you provide an API key).
- Lightweight vanilla JS renderer; easy to extend with React or Tiptap later.

## Prerequisites
- Node.js 18+ (for built-in `fetch`).
- npm.
- An OpenAI API key if you want chat completions (`OPENAI_API_KEY`).

## Setup
```bash
npm install
OPENAI_API_KEY=sk-... npm start
```

On macOS, you can also set your key once in your shell profile:
```bash
export OPENAI_API_KEY=sk-...
```

Then launch the app with:
```bash
npm start
```

Notes are saved to a JSON file located in `~/Library/Application Support/double-k-notes/notes.json` (macOS). On Windows and Linux the path follows Electron's `app.getPath('userData')` convention.

## Using the app
- **Create a note:** Click **New Note**, enter a title and content, then click **Save**.
- **Switch notes:** Click any item in the left sidebar.
- **ChatGPT helper:** Type a question in the chat box; the app sends your question plus the current note content (if present) to the ChatGPT API. Errors will display inline.

## Extending
- Replace the textarea editor with a richer editor (e.g., Tiptap) inside `src/renderer/index.html` and `renderer.js`.
- Add persistence or backup logic by editing `src/main.js` (where notes are read/written).
- Wire new IPC channels in `src/preload.js` to keep the renderer sandboxed.

## Packaging
This starter focuses on development. To distribute a macOS app bundle, add `electron-builder` or a similar packager. A simple approach is to install `electron-builder` and configure a `mac` target in `package.json`.
