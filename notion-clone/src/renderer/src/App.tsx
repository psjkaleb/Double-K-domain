import { useEffect, useMemo, useState } from 'react';
import type { ChatExchange, Note } from './types';

const newNoteTemplate = (): Note => ({
  id: crypto.randomUUID(),
  title: 'Untitled',
  content: '',
  updatedAt: new Date().toISOString()
});

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatExchange[]>([]);

  const activeNote = useMemo(() => {
    if (notes.length === 0) return null;
    const found = notes.find((note) => note.id === selectedId);
    return found ?? notes[0];
  }, [notes, selectedId]);

  useEffect(() => {
    window.api
      .getNotes()
      .then((initial) => {
        if (initial.length === 0) {
          const fallback = newNoteTemplate();
          setNotes([fallback]);
          setSelectedId(fallback.id);
          void window.api.saveNote(fallback);
        } else {
          setNotes(initial);
          setSelectedId(initial[0].id);
        }
      })
      .catch((error) => console.error('Failed to load notes', error));
  }, []);

  const saveNote = async (updated: Note) => {
    const refreshed = await window.api.saveNote(updated);
    setNotes(refreshed);
    setSelectedId(updated.id);
  };

  const handleNewNote = async () => {
    const created = newNoteTemplate();
    await saveNote(created);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await window.api.runSearch(query);
    setSearchResults(results);
  };

  const handleSave = async () => {
    if (!activeNote) return;
    await saveNote({ ...activeNote, updatedAt: new Date().toISOString() });
  };

  const handleChat = async () => {
    if (!chatPrompt.trim()) return;
    const response = await window.api.chatWithAI(chatPrompt);
    setChatHistory((history) => [...history, response]);
    setChatPrompt('');
  };

  const updateActiveNote = (fields: Partial<Note>) => {
    if (!activeNote) return;
    const updated = { ...activeNote, ...fields };
    setNotes((prev) => prev.map((note) => (note.id === updated.id ? updated : note)));
  };

  return (
    <div className="app-shell">
      <header>
        <div className="branding">
          <span>🗒️</span>
          <span>Notion Clone</span>
        </div>
        <input
          type="search"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(event) => handleSearch(event.target.value)}
        />
      </header>

      <aside className="sidebar">
        <h2>
          Notes <button onClick={handleNewNote}>+ New</button>
        </h2>
        <div className="note-list">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`note-card ${note.id === activeNote?.id ? 'active' : ''}`}
              onClick={() => setSelectedId(note.id)}
            >
              <h3>{note.title || 'Untitled'}</h3>
              <p>{note.content.slice(0, 80) || 'Start typing to add content...'}</p>
              <div className="meta">Updated {new Date(note.updatedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </aside>

      <main>
        <section className="editor">
          <input
            type="text"
            value={activeNote?.title || ''}
            onChange={(event) => updateActiveNote({ title: event.target.value })}
            placeholder="Note title"
          />
          <textarea
            value={activeNote?.content || ''}
            onChange={(event) => updateActiveNote({ content: event.target.value })}
            placeholder="Start writing your note..."
          />
          <button onClick={handleSave}>Save note</button>
        </section>

        <section className="panel">
          <div>
            <h3>Search results</h3>
            <div className="search-results">
              {searchResults.length === 0 && <div className="meta">Try searching for a keyword.</div>}
              {searchResults.map((note) => (
                <div key={note.id} className="result-card">
                  <h4>{note.title || 'Untitled'}</h4>
                  <div className="meta">Updated {new Date(note.updatedAt).toLocaleString()}</div>
                  <p>{note.content.slice(0, 120)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3>Ask OpenAI</h3>
            <textarea
              placeholder="Ask something about your notes or anything else..."
              value={chatPrompt}
              onChange={(event) => setChatPrompt(event.target.value)}
            />
            <button onClick={handleChat}>Send</button>
            <div className="chat-history">
              {chatHistory.length === 0 && <div className="meta">Start a conversation to see AI responses.</div>}
              {chatHistory.map((entry, index) => (
                <div key={index} className="chat-entry">
                  <div><strong>You:</strong> {entry.prompt}</div>
                  <div><strong>AI:</strong> {entry.response}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
