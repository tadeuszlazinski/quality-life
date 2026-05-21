import { Clipboard, ClipboardCheck, Pin, PinOff, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useInterval } from "../hooks/useInterval";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyText, readClipboardText } from "../lib/clipboard";

interface ClipboardEntry {
  id: string;
  text: string;
  pinned: boolean;
  createdAt: number;
}

export function ClipboardHistory({ toolId }: { toolId: string }) {
  const [history, setHistory] = useLocalStorage<ClipboardEntry[]>(`${toolId}:history`, []);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [watching, setWatching] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setHistory((current) => {
      const withoutDuplicate = current.filter((entry) => entry.text !== trimmed);
      return [
        {
          id: crypto.randomUUID(),
          text: trimmed,
          pinned: false,
          createdAt: Date.now()
        },
        ...withoutDuplicate
      ].slice(0, 80);
    });
  };

  useInterval(
    async () => {
      const text = await readClipboardText();
      addText(text);
    },
    watching ? 1800 : null
  );

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt),
    [history]
  );
  const visibleHistory = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sortedHistory;
    }
    return sortedHistory.filter((entry) => entry.text.toLowerCase().includes(normalized));
  }, [query, sortedHistory]);

  const recopy = async (entry: ClipboardEntry) => {
    if (await copyText(entry.text)) {
      setCopiedId(entry.id);
      window.setTimeout(() => setCopiedId(null), 900);
    }
  };

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className={`status-dot ${watching ? "on" : ""}`} />
          <span>{watching ? "Watching clipboard" : "Manual capture"}</span>
          <span className="pill">{history.length} saved</span>
        </div>
      }
    >
      <div className="stacked-actions">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Drop text here..."
          rows={3}
        />
        <div className="action-strip">
          <button className="primary-action" type="button" onClick={() => addText(draft)}>
            <ClipboardCheck size={17} aria-hidden="true" />
            Save text
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={async () => addText(await readClipboardText())}
          >
            <Clipboard size={17} aria-hidden="true" />
            Save clipboard
          </button>
          <button className="secondary-action" type="button" onClick={() => setWatching((value) => !value)}>
            {watching ? "Pause watch" : "Resume watch"}
          </button>
          <button className="danger-action" type="button" onClick={() => setHistory([])}>
            <Trash2 size={16} aria-hidden="true" />
            Clear
          </button>
        </div>
        <div className="command-bar inline-command">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clipboard history..."
          />
          <span className="pill">{visibleHistory.length} matches</span>
        </div>
      </div>

      <div className="scroll-list">
        {visibleHistory.length === 0 ? (
          <div className="empty-inline">Clipboard saves will appear here.</div>
        ) : (
          visibleHistory.map((entry) => (
            <div className="list-item multi-actions" key={entry.id}>
              <button className="list-copy" type="button" onClick={() => recopy(entry)}>
                <strong>{copiedId === entry.id ? "Copied" : entry.text}</strong>
                <span>Copy plain text · {new Date(entry.createdAt).toLocaleString()}</span>
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label={entry.pinned ? "Unpin clipboard item" : "Pin clipboard item"}
                title={entry.pinned ? "Unpin" : "Pin"}
                onClick={() =>
                  setHistory((current) =>
                    current.map((item) => (item.id === entry.id ? { ...item, pinned: !item.pinned } : item))
                  )
                }
              >
                {entry.pinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Delete clipboard item"
                title="Delete"
                onClick={() => setHistory((current) => current.filter((item) => item.id !== entry.id))}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>
    </ToolFrame>
  );
}
