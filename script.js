
const API_URL = "http://localhost:5000/notes";

const editor = new EasyMDE({
  element: document.getElementById("markdown-editor"),
  spellChecker: false,
  placeholder: "Write your Markdown notes here...",
  status: ["lines", "words", "cursor"],
  minHeight: "400px",
  toolbar: [
    "bold",
    "italic",
    "heading",
    "|",
    "quote",
    "unordered-list",
    "ordered-list",
    "|",
    "link",
    "preview",
    "fullscreen",
  ],
});

let currentNoteId = null;

const titleInput = document.getElementById("note-title");
const authorInput = document.getElementById("note-author");
const notesList = document.getElementById("notes-list");
const searchInput = document.getElementById("search-notes");
const statusMessage = document.getElementById("status-message");

const newNoteBtn = document.getElementById("new-note-btn");
const saveNoteBtn = document.getElementById("save-note-btn");
const deleteNoteBtn = document.getElementById("delete-note-btn");

function showStatus(message) {
  statusMessage.textContent = message;
}

function createNewNote() {
  currentNoteId = null;
  titleInput.value = "";
  authorInput.value = "Anonymous";
  editor.value("");
  showStatus("New note ready.");
  displayActiveNote();
}

async function loadNotes() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to load notes");
    }

    const notes = await response.json();

    notes.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    const searchText = searchInput.value.toLowerCase().trim();

    const filteredNotes = notes.filter((note) =>
      (note.title || "").toLowerCase().includes(searchText)
    );

    notesList.innerHTML = "";

    if (filteredNotes.length === 0) {
      notesList.textContent =
        notes.length === 0 ? "No notes yet." : "No matching notes.";
      return;
    }

    filteredNotes.forEach((note) => {
      const noteElement = document.createElement("div");
      noteElement.className = "note-item";
      noteElement.dataset.id = note._id;

      const titleElement = document.createElement("div");
      titleElement.textContent = note.title;
      titleElement.className = "note-title";
      noteElement.appendChild(titleElement);

      const dateElement = document.createElement("small");
      dateElement.className = "note-date";

      const createdDate = note.createdAt
        ? new Date(note.createdAt).toLocaleDateString()
        : "Unknown";

      const updatedDate = note.updatedAt
        ? new Date(note.updatedAt).toLocaleDateString()
        : createdDate;

      dateElement.textContent =
        createdDate === updatedDate
          ? `Created: ${createdDate}`
          : `Updated: ${updatedDate}`;

      noteElement.appendChild(dateElement);

      if (note._id === currentNoteId) {
        noteElement.classList.add("active");
      }

      noteElement.addEventListener("click", () => {
        openNote(note);
      });

      notesList.appendChild(noteElement);
    });
  } catch (error) {
    console.error("Load notes error:", error);
    showStatus("Could not load notes. Check whether the server is running.");
  }
}

function openNote(note) {
  currentNoteId = note._id;
  titleInput.value = note.title;
  authorInput.value = note.author || "Anonymous";
  editor.value(note.content || "");
  showStatus("Note opened.");
  displayActiveNote();
}

function displayActiveNote() {
  document.querySelectorAll(".note-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.id === currentNoteId);
  });
}

async function saveNote() {
  const title = titleInput.value.trim();
  const content = editor.value();
  const author = authorInput.value.trim() || "Anonymous";

  if (!title) {
    showStatus("Please enter a note title.");
    titleInput.focus();
    return;
  }

  const noteData = { title, content, author };
  const isEditing = Boolean(currentNoteId);
  const url = isEditing ? `${API_URL}/${currentNoteId}` : API_URL;
  const method = isEditing ? "PUT" : "POST";

  try {
    saveNoteBtn.disabled = true;
    showStatus("Saving note...");

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(noteData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save note");
    }

    currentNoteId = result._id || result.note?._id || currentNoteId;

    showStatus("Note saved successfully!");
    await loadNotes();
  } catch (error) {
    console.error("Save note error:", error);
    showStatus("Could not save note. Check the server and MongoDB connection.");
  } finally {
    saveNoteBtn.disabled = false;
  }
}

async function deleteNote() {
  if (!currentNoteId) {
    showStatus("Please select a saved note to delete.");
    return;
  }

  const confirmed = confirm("Are you sure you want to delete this note?");

  if (!confirmed) {
    return;
  }

  try {
    deleteNoteBtn.disabled = true;

    const response = await fetch(`${API_URL}/${currentNoteId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete note");
    }

    createNewNote();
    showStatus("Note deleted successfully!");
    await loadNotes();
  } catch (error) {
    console.error("Delete note error:", error);
    showStatus("Could not delete note.");
  } finally {
    deleteNoteBtn.disabled = false;
  }
}

newNoteBtn.addEventListener("click", createNewNote);
searchInput.addEventListener("input", loadNotes);
saveNoteBtn.addEventListener("click", saveNote);
deleteNoteBtn.addEventListener("click", deleteNote);

loadNotes();

setInterval(loadNotes, 5000);
