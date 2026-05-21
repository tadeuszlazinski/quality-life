import { Copy, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useToast } from "../context/ToastContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyText } from "../lib/clipboard";
import { upsertHistoryEntry } from "../lib/history";

interface FloatingNote {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export function FloatingNotes({ toolId }: { toolId: string }) {
  const [notes, setNotes] = useLocalStorage<FloatingNote[]>(`${toolId}:notes`, [
    {
      id: "welcome",
      title: "Scratch",
      body: "",
      updatedAt: Date.now()
    }
  ]);
  const [activeId, setActiveId] = useState(notes[0]?.id ?? "welcome");
  const { toast } = useToast();

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeId) ?? notes[0],
    [activeId, notes]
  );

  const updateNote = (patch: Partial<FloatingNote>) => {
    if (!activeNote) {
      return;
    }

    const updated = { ...activeNote, ...patch, updatedAt: Date.now() };
    setNotes((current) =>
      current.map((note) => (note.id === activeNote.id ? updated : note))
    );
    if ((updated.title + updated.body).trim()) {
      upsertHistoryEntry(
        {
          kind: "notes",
          source: "Quality life notes",
          title: updated.title || "Untitled note",
          preview: updated.body || updated.title,
          text: updated.body,
          toolId
        },
        `note:${updated.id}`
      );
    }
  };

  const addNote = () => {
    const note: FloatingNote = {
      id: crypto.randomUUID(),
      title: "New note",
      body: "",
      updatedAt: Date.now()
    };
    setNotes((current) => [note, ...current].slice(0, 24));
    setActiveId(note.id);
  };

  const deleteNote = () => {
    if (!activeNote) {
      return;
    }
    setNotes((current) => {
      const next = current.filter((note) => note.id !== activeNote.id);
      setActiveId(next[0]?.id ?? "");
      return next;
    });
  };

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span>Auto-saved locally</span>
          <span className="pill">{notes.length} notes</span>
        </div>
      }
    >
      <div className="notes-layout">
        <div className="note-tabs">
          <button className="secondary-action fit-action" type="button" onClick={addNote}>
            <Plus size={16} aria-hidden="true" />
            New note
          </button>
          {notes.map((note) => (
            <button
              className={note.id === activeNote?.id ? "note-tab active" : "note-tab"}
              key={note.id}
              type="button"
              onClick={() => setActiveId(note.id)}
            >
              <strong>{note.title || "Untitled"}</strong>
              <span>{new Date(note.updatedAt).toLocaleTimeString()}</span>
            </button>
          ))}
        </div>

        {activeNote ? (
          <div className="note-editor">
            <input
              value={activeNote.title}
              onChange={(event) => updateNote({ title: event.target.value })}
              placeholder="Note title"
            />
            <textarea
              value={activeNote.body}
              onChange={(event) => updateNote({ body: event.target.value })}
              placeholder="Type the thing before it escapes..."
            />
            <div className="action-strip">
              <button
                className="secondary-action"
                type="button"
                onClick={async () => {
                  await copyText(activeNote.body);
                  toast("Note copied", { tone: "success" });
                }}
              >
                <Copy size={16} aria-hidden="true" />
                Copy
              </button>
              <button className="danger-action" type="button" onClick={deleteNote}>
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state mini-empty">
            <span>No notes yet</span>
          </div>
        )}
      </div>
    </ToolFrame>
  );
}
