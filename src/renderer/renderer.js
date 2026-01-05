let notes = [];
let activeNoteId = null;
const noteListEl = document.getElementById('note-list');
const titleEl = document.getElementById('title');
const bodyEl = document.getElementById('body');
const statusEl = document.getElementById('status');
const chatLogEl = document.getElementById('chat-log');
const chatInputEl = document.getElementById('chat-input');

function formatDate(date) {
  return new Date(date).toLocaleString();
}

function renderNotes() {
  noteListEl.innerHTML = '';

  if (notes.length === 0) {
    noteListEl.innerHTML = '<div class="empty-state">No notes yet.</div>';
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement('div');
    item.className = `note-item${note.id === activeNoteId ? ' active' : ''}`;
    item.innerHTML = `
      <h3>${note.title}</h3>
      <div class="meta">Updated ${formatDate(note.updatedAt)}</div>
    `;
    item.addEventListener('click', () => selectNote(note.id));
    noteListEl.appendChild(item);
  });
}

async function loadNotes() {
  notes = await window.notesAPI.load();
  renderNotes();
  if (notes.length) {
    selectNote(notes[0].id);
  }
}

function selectNote(id) {
  activeNoteId = id;
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  titleEl.value = note.title;
  bodyEl.value = note.content;
  renderNotes();
}

async function saveNote() {
  const payload = {
    id: activeNoteId,
    title: titleEl.value.trim() || 'Untitled',
    content: bodyEl.value,
  };
  const saved = await window.notesAPI.save(payload);
  const existingIndex = notes.findIndex((n) => n.id === saved.id);
  if (existingIndex >= 0) {
    notes[existingIndex] = saved;
  } else {
    notes.unshift(saved);
  }
  activeNoteId = saved.id;
  statusEl.textContent = 'Saved';
  setTimeout(() => (statusEl.textContent = ''), 1500);
  renderNotes();
}

function newNote() {
  activeNoteId = null;
  titleEl.value = '';
  bodyEl.value = '';
  titleEl.focus();
  renderNotes();
}

function addMessage(role, content) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = content;
  chatLogEl.appendChild(message);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
}

async function askAssistant(prompt) {
  addMessage('user', prompt);
  addMessage('assistant', 'Thinking...');
  try {
    const noteContext = titleEl.value || bodyEl.value ? `\n\nNote content:\nTitle: ${titleEl.value}\n${bodyEl.value}` : '';
    const response = await window.chatAPI.ask([
      { role: 'system', content: 'You are a concise writing assistant for a note-taking app.' },
      { role: 'user', content: `${prompt}${noteContext}` },
    ]);
    chatLogEl.lastChild.textContent = response;
  } catch (err) {
    chatLogEl.lastChild.textContent = `Error: ${err.message}`;
  }
}

document.getElementById('save-note').addEventListener('click', saveNote);
document.getElementById('new-note').addEventListener('click', newNote);

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = chatInputEl.value.trim();
  if (!value) return;
  chatInputEl.value = '';
  await askAssistant(value);
});

loadNotes();
