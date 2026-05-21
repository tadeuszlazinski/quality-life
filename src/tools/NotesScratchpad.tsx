import { Copy, Eraser } from "lucide-react";
import { useMemo } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyText } from "../lib/clipboard";

export function NotesScratchpad({ toolId }: { toolId: string }) {
  const [note, setNote] = useLocalStorage(`${toolId}:note`, "");
  const stats = useMemo(
    () => ({
      words: note.trim() ? note.trim().split(/\s+/).length : 0,
      chars: note.length
    }),
    [note]
  );

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span>Auto-saved locally</span>
          <span className="pill">{stats.words} words</span>
          <span className="pill">{stats.chars} chars</span>
        </div>
      }
    >
      <textarea
        className="scratchpad"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Quick thoughts..."
      />
      <div className="action-strip">
        <button className="secondary-action" type="button" onClick={() => copyText(note)}>
          <Copy size={17} aria-hidden="true" />
          Copy
        </button>
        <button className="danger-action" type="button" onClick={() => setNote("")}>
          <Eraser size={17} aria-hidden="true" />
          Clear
        </button>
      </div>
    </ToolFrame>
  );
}
