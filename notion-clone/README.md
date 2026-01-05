# Notion Clone (Electron + Vite + React)

This project was bootstrapped manually with Vite (React + TypeScript) and an Electron main process. It includes IPC channels for note CRUD, searching, and placeholder OpenAI chat responses, plus `electron-builder` configuration targeting macOS.

## Development

```bash
# install dependencies
npm install

# start renderer (Vite), TypeScript watchers for main/preload, and Electron
npm run dev
```

## Production build & packaging

```bash
# build renderer + main + preload bundles
npm run build

# create packaged binaries (macOS target configured, includes DMG and ZIP)
npm run package

# create only a macOS ZIP artifact (double-clickable app bundle inside)
npm run package:zip
```

Notes are persisted to a JSON file in the Electron `userData` directory. The OpenAI chat endpoint currently returns a placeholder response so credentials are not required for development.
