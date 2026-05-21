import {
  AlarmClock,
  Battery,
  Brush,
  CheckSquare,
  Clipboard,
  Code2,
  Dice5,
  Eraser,
  Eye,
  FileText,
  Globe2,
  Highlighter,
  Image,
  KeyRound,
  Link,
  ListChecks,
  Music,
  Network,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  Sparkles,
  Timer,
  Trash2,
  Type,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { ShortcutField } from "../components/ShortcutField";
import { useToast } from "../context/ToastContext";
import { useAutomationStopShortcut } from "../hooks/useAutomationStopShortcut";
import { useInterval } from "../hooks/useInterval";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyText, readClipboardText } from "../lib/clipboard";
import { upsertHistoryEntry } from "../lib/history";
import {
  AUTOMATION_START_DELAY_MS,
  nativeAutomationError,
  startAutoScroll,
  startAutoTyper,
  startKeySpammer,
  startMultiClicker,
  stopNativeAutomation
} from "../lib/nativeAutomation";

const trackingParams = new Set([
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "ref",
  "spm"
]);

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanLink(value: string) {
  try {
    const url = new URL(value.trim());
    [...url.searchParams.keys()].forEach((key) => {
      if (key.toLowerCase().startsWith("utm_") || trackingParams.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    });
    return url.toString();
  } catch {
    return value;
  }
}

function lines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function unescapeHtml(value: string) {
  const parser = new DOMParser().parseFromString(value, "text/html");
  return parser.documentElement.textContent ?? "";
}

function simpleMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
}

function formatSql(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\b(SELECT|FROM|WHERE|INNER JOIN|LEFT JOIN|RIGHT JOIN|JOIN|GROUP BY|ORDER BY|HAVING|LIMIT|VALUES|SET)\b/gi, "\n$1")
    .replace(/\b(AND|OR)\b/gi, "\n  $1")
    .replace(/,/g, ",\n  ")
    .trim();
}

function formatXml(value: string) {
  try {
    const doc = new DOMParser().parseFromString(value, "application/xml");
    if (doc.querySelector("parsererror")) {
      return "Invalid XML";
    }
    const raw = new XMLSerializer().serializeToString(doc);
    return raw.replace(/></g, ">\n<");
  } catch {
    return "Invalid XML";
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim();
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="utility-card">
      <div className="utility-title">
        <strong>{title}</strong>
      </div>
      {children}
    </section>
  );
}

function useNativeStopShortcut(toolId: string, running: boolean, onStop: () => Promise<void>) {
  const [stopShortcut, setStopShortcut] = useLocalStorage(`${toolId}:stopShortcut`, "Escape");
  useAutomationStopShortcut({
    enabled: running,
    shortcut: stopShortcut,
    onStop
  });
  return [stopShortcut, setStopShortcut] as const;
}

export function AutomationBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "multi-point-auto-clicker") {
    return <MultiPointClicker toolId={toolId} />;
  }
  if (toolId === "key-spammer") {
    return <KeySpammer toolId={toolId} />;
  }
  if (toolId === "auto-typer") {
    return <AutoTyper toolId={toolId} />;
  }
  if (toolId === "auto-scroll") {
    return <AutoScroll toolId={toolId} />;
  }
  return <TextSnippets toolId={toolId} />;
}

function MultiPointClicker({ toolId }: { toolId: string }) {
  const [points, setPoints] = useLocalStorage(`${toolId}:points`, [
    { x: 120, y: 220 },
    { x: 420, y: 220 }
  ]);
  const [intervalMs, setIntervalMs] = useLocalStorage(`${toolId}:interval`, 500);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  async function stop() {
    await stopNativeAutomation();
    setRunning(false);
    toast("Multi-point clicker stopped", { tone: "success" });
  }

  const [stopShortcut, setStopShortcut] = useNativeStopShortcut(toolId, running, stop);

  const toggle = async () => {
    try {
      if (running) {
        await stop();
        return;
      }

      await startMultiClicker(points, intervalMs);
      setRunning(true);
      toast("Multi-point clicker starts in 3 seconds", {
        tone: "success",
        message: "Coordinates are absolute screen positions."
      });
    } catch (error) {
      setRunning(false);
      toast("Automation could not start", { tone: "error", message: nativeAutomationError(error) });
    }
  };

  return (
    <ToolFrame footer={<Status active={running} label={running ? "Native multi-click loop running" : "Idle"} />}>
      <div className="tool-grid two">
        <label className="field">
          <span>Interval</span>
          <input type="number" min={50} value={intervalMs} onChange={(event) => setIntervalMs(Number(event.target.value) || 50)} />
        </label>
        <button className="secondary-action fit-action" type="button" onClick={() => setPoints((current) => [...current, { x: 0, y: 0 }])}>
          <Plus size={16} aria-hidden="true" />
          Add point
        </button>
      </div>
      <ShortcutField
        className="shortcut-field-control"
        label="Stop shortcut"
        value={stopShortcut}
        onChange={setStopShortcut}
        helper="Press this combo while the loop is running to stop it."
      />
      <div className="mini-grid">
        {points.map((point, index) => (
          <div className="utility-card compact-card" key={index}>
            <strong>Point {index + 1}</strong>
            <div className="tool-grid two">
              <input
                aria-label={`Point ${index + 1} x`}
                type="number"
                value={point.x}
                onChange={(event) =>
                  setPoints((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, x: Number(event.target.value) || 0 } : item)))
                }
              />
              <input
                aria-label={`Point ${index + 1} y`}
                type="number"
                value={point.y}
                onChange={(event) =>
                  setPoints((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, y: Number(event.target.value) || 0 } : item)))
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div className="native-note">
        <Code2 size={16} aria-hidden="true" />
        <code>Starts after {AUTOMATION_START_DELAY_MS / 1000}s. Use absolute screen coordinates; macOS may require Accessibility permission.</code>
      </div>
      <RunControls running={running} onToggle={toggle} onReset={() => void stopNativeAutomation().then(() => setRunning(false))} />
    </ToolFrame>
  );
}

function KeySpammer({ toolId }: { toolId: string }) {
  const [key, setKey] = useLocalStorage(`${toolId}:key`, "Space");
  const [rate, setRate] = useLocalStorage(`${toolId}:rate`, 8);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const [stopShortcut, setStopShortcut] = useNativeStopShortcut(toolId, running, async () => {
    await stopNativeAutomation();
    setRunning(false);
    toast("Key spammer stopped", { tone: "success" });
  });

  const toggle = async () => {
    try {
      if (running) {
        await stopNativeAutomation();
        setRunning(false);
        toast("Key spammer stopped", { tone: "success" });
        return;
      }

      await startKeySpammer(key, rate);
      setRunning(true);
      toast("Key spammer starts in 3 seconds", {
        tone: "success",
        message: "Focus the target app now."
      });
    } catch (error) {
      setRunning(false);
      toast("Automation could not start", { tone: "error", message: nativeAutomationError(error) });
    }
  };

  return (
    <ToolFrame footer={<Status active={running} label={running ? "Native key loop running" : "Idle"} />}>
      <div className="tool-grid two">
        <label className="field">
          <span>Key</span>
          <input value={key} onChange={(event) => setKey(event.target.value)} />
        </label>
        <label className="field">
          <span>Presses per second</span>
          <input type="number" min={1} max={60} value={rate} onChange={(event) => setRate(Number(event.target.value) || 1)} />
        </label>
      </div>
      <ShortcutField
        className="shortcut-field-control"
        label="Stop shortcut"
        value={stopShortcut}
        onChange={setStopShortcut}
        helper="Press this combo while the loop is running to stop it."
      />
      <div className="native-note">
        <Code2 size={16} aria-hidden="true" />
        <code>Supports one character or Space, Enter, Tab, Escape, Backspace, Delete, Up, Down, Left, Right.</code>
      </div>
      <RunControls running={running} onToggle={toggle} onReset={() => void stopNativeAutomation().then(() => setRunning(false))} />
    </ToolFrame>
  );
}

function AutoTyper({ toolId }: { toolId: string }) {
  const [text, setText] = useLocalStorage(`${toolId}:text`, "Quality life saves tiny bits of time.");
  const [speed, setSpeed] = useLocalStorage(`${toolId}:speed`, 35);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const [stopShortcut, setStopShortcut] = useNativeStopShortcut(toolId, running, async () => {
    await stopNativeAutomation();
    setRunning(false);
    toast("Auto typer stopped", { tone: "success" });
  });

  const toggle = async () => {
    try {
      if (running) {
        await stopNativeAutomation();
        setRunning(false);
        toast("Auto typer stopped", { tone: "success" });
        return;
      }

      await startAutoTyper(text, speed);
      setRunning(true);
      toast("Auto typer starts in 3 seconds", {
        tone: "success",
        message: "Click into the target text field now."
      });
    } catch (error) {
      setRunning(false);
      toast("Automation could not start", { tone: "error", message: nativeAutomationError(error) });
    }
  };

  return (
    <ToolFrame footer={<Status active={running} label={running ? "Native typing job running" : `${text.length} characters ready`} />}>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={5} />
      <label className="field">
        <span>Delay per character</span>
        <input type="number" min={5} value={speed} onChange={(event) => setSpeed(Number(event.target.value) || 5)} />
      </label>
      <ShortcutField
        className="shortcut-field-control"
        label="Stop shortcut"
        value={stopShortcut}
        onChange={setStopShortcut}
        helper="Press this combo while typing is running to stop it."
      />
      <div className="native-note">
        <Code2 size={16} aria-hidden="true" />
        <code>Starts after {AUTOMATION_START_DELAY_MS / 1000}s and types into whichever app has keyboard focus.</code>
      </div>
      <RunControls running={running} onToggle={toggle} onReset={() => void stopNativeAutomation().then(() => setRunning(false))} />
    </ToolFrame>
  );
}

function AutoScroll({ toolId }: { toolId: string }) {
  const [speed, setSpeed] = useLocalStorage(`${toolId}:speed`, 2);
  const [intervalMs, setIntervalMs] = useLocalStorage(`${toolId}:interval`, 120);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const [stopShortcut, setStopShortcut] = useNativeStopShortcut(toolId, running, async () => {
    await stopNativeAutomation();
    setRunning(false);
    toast("Auto scroll stopped", { tone: "success" });
  });

  const toggle = async () => {
    try {
      if (running) {
        await stopNativeAutomation();
        setRunning(false);
        toast("Auto scroll stopped", { tone: "success" });
        return;
      }

      await startAutoScroll(speed, intervalMs);
      setRunning(true);
      toast("Auto scroll starts in 3 seconds", {
        tone: "success",
        message: "Focus or hover the app you want to scroll."
      });
    } catch (error) {
      setRunning(false);
      toast("Automation could not start", { tone: "error", message: nativeAutomationError(error) });
    }
  };

  return (
    <ToolFrame footer={<Status active={running} label={running ? "Native scroll loop running" : "Idle"} />}>
      <label className="field">
        <span>Scroll amount</span>
        <input type="range" min={-10} max={10} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
      </label>
      <label className="field">
        <span>Interval</span>
        <input type="number" min={40} value={intervalMs} onChange={(event) => setIntervalMs(Number(event.target.value) || 40)} />
      </label>
      <ShortcutField
        className="shortcut-field-control"
        label="Stop shortcut"
        value={stopShortcut}
        onChange={setStopShortcut}
        helper="Press this combo while the scroll loop is running to stop it."
      />
      <div className="native-note">
        <Code2 size={16} aria-hidden="true" />
        <code>Positive values scroll down, negative values scroll up. Starts after {AUTOMATION_START_DELAY_MS / 1000}s.</code>
      </div>
      <RunControls running={running} onToggle={toggle} onReset={() => void stopNativeAutomation().then(() => setRunning(false))} />
    </ToolFrame>
  );
}

function TextSnippets({ toolId }: { toolId: string }) {
  const [snippets, setSnippets] = useLocalStorage(`${toolId}:items`, ["Thanks, I’ll take a look.", "On my way."]);
  const [draft, setDraft] = useState("");
  const { toast } = useToast();
  return (
    <ToolFrame footer={<Status active label={`${snippets.length} snippets saved`} />}>
      <div className="action-strip">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="New snippet..." />
        <button className="primary-action" type="button" onClick={() => draft.trim() && setSnippets((items) => [draft.trim(), ...items])}>
          <Plus size={16} aria-hidden="true" />
          Add
        </button>
      </div>
      <div className="scroll-list">
        {snippets.map((snippet) => (
          <div className="list-item" key={snippet}>
            <button className="list-copy" type="button" onClick={async () => {
              await copyText(snippet);
              toast("Snippet copied", { tone: "success" });
            }}>
              <strong>{snippet}</strong>
              <span>Click to copy</span>
            </button>
            <button className="icon-button" type="button" aria-label="Delete snippet" onClick={() => setSnippets((items) => items.filter((item) => item !== snippet))}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToolFrame>
  );
}

export function ClipboardBatchTool({ toolId }: { toolId: string }) {
  const { toast } = useToast();
  if (toolId === "multi-clipboard-slots") {
    return <MultiClipboardSlots toolId={toolId} />;
  }
  if (toolId === "clipboard-search") {
    return <ClipboardSearch toolId={toolId} />;
  }
  if (toolId === "paste-plain-text" || toolId === "paste-without-formatting") {
    return <PlainTextPaste />;
  }
  if (toolId === "link-cleaner" || toolId === "link-tracker-remover") {
    return <LinkCleaner />;
  }
  if (toolId === "favorite-snippets") {
    return <TextSnippets toolId={toolId} />;
  }
  const exportText = JSON.stringify(window.localStorage, null, 2);
  return (
    <ToolFrame footer={<Status active label="Local browser storage snapshot" />}>
      <pre>{exportText}</pre>
      <button className="secondary-action fit-action" type="button" onClick={async () => {
        await copyText(exportText);
        toast("Clipboard export copied", { tone: "success" });
      }}>
        <Save size={16} aria-hidden="true" />
        Copy export
      </button>
    </ToolFrame>
  );
}

function MultiClipboardSlots({ toolId }: { toolId: string }) {
  const [slots, setSlots] = useLocalStorage(`${toolId}:slots`, Array.from({ length: 6 }, () => ""));
  const { toast } = useToast();
  return (
    <ToolFrame footer={<Status active label="Slots are saved locally" />}>
      <div className="mini-grid">
        {slots.map((slot, index) => (
          <Panel key={index} title={`Slot ${index + 1}`}>
            <textarea rows={3} value={slot} onChange={(event) => setSlots((items) => items.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))} />
            <div className="action-strip compact-actions">
              <button className="secondary-action" type="button" onClick={async () => {
                const text = await readClipboardText();
                setSlots((items) => items.map((item, itemIndex) => (itemIndex === index ? text : item)));
              }}>Read clipboard</button>
              <button className="secondary-action" type="button" onClick={async () => {
                await copyText(slot);
                toast("Slot copied", { tone: "success" });
              }}>Copy</button>
            </div>
          </Panel>
        ))}
      </div>
    </ToolFrame>
  );
}

function ClipboardSearch({ toolId }: { toolId: string }) {
  const [items, setItems] = useLocalStorage<string[]>(`${toolId}:items`, []);
  const [query, setQuery] = useState("");
  const results = items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return (
    <ToolFrame footer={<Status active label={`${results.length} matches`} />}>
      <div className="action-strip">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved clipboard text..." />
        <button className="secondary-action" type="button" onClick={async () => {
          const text = await readClipboardText();
          if (text.trim()) setItems((current) => [text, ...current.filter((item) => item !== text)].slice(0, 80));
        }}>Capture</button>
      </div>
      <div className="scroll-list">
        {results.map((item) => (
          <button className="list-copy list-item" type="button" key={item} onClick={() => copyText(item)}>
            <strong>{item}</strong>
            <span>Copy</span>
          </button>
        ))}
      </div>
    </ToolFrame>
  );
}

function PlainTextPaste() {
  const [text, setText] = useState("");
  const plain = text.replace(/\s+/g, " ").trim();
  return (
    <ToolFrame footer={<Status active label="Formatting stripped" />}>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={7} placeholder="Paste styled text here..." />
      <pre>{plain}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(plain)}>Copy plain text</button>
    </ToolFrame>
  );
}

function LinkCleaner() {
  const [input, setInput] = useState("https://example.com/?utm_source=newsletter&fbclid=abc&id=42");
  const output = cleanLink(input);
  return (
    <ToolFrame footer={<Status active label="Tracker parameters removed locally" />}>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={4} />
      <pre>{output}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => {
        upsertHistoryEntry(
          {
            kind: "websites",
            source: "URL Cleaner",
            title: "Cleaned URL",
            preview: output,
            url: output
          },
          `clean-url:${output}`
        );
        void copyText(output);
      }}>Copy clean link</button>
    </ToolFrame>
  );
}

export function TextBatchTool({ toolId }: { toolId: string }) {
  const [input, setInput] = useState("banana\napple\nbanana\nCherry");
  const [other, setOther] = useState("banana\norange\nCherry");
  const output = useMemo(() => {
    const lines = input.split(/\r?\n/);
    if (toolId === "remove-duplicate-lines") return [...new Set(lines)].join("\n");
    if (toolId === "sort-lines") return [...lines].sort((a, b) => a.localeCompare(b)).join("\n");
    if (toolId === "slug-generator") return slugify(input);
    if (toolId === "case-converter") return `UPPER\n${input.toUpperCase()}\n\nlower\n${input.toLowerCase()}\n\nTitle\n${input.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase())}`;
    if (toolId === "html-escape-unescape") return input.includes("&lt;") || input.includes("&amp;") ? unescapeHtml(input) : escapeHtml(input);
    if (toolId === "invisible-character-detector") return input.replace(/[\u200B-\u200D\uFEFF]/g, "[zero-width]").replace(/\t/g, "[tab]").replace(/ /g, "·");
    if (toolId === "text-diff-checker") {
      const a = new Set(lines);
      const b = new Set(other.split(/\r?\n/));
      return [`Only left:\n${[...a].filter((line) => !b.has(line)).join("\n")}`, `Only right:\n${[...b].filter((line) => !a.has(line)).join("\n")}`].join("\n\n");
    }
    return simpleMarkdown(input);
  }, [input, other, toolId]);

  return (
    <ToolFrame footer={<Status active label={`${input.length} characters`} />}>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} />
      {toolId === "text-diff-checker" && <textarea value={other} onChange={(event) => setOther(event.target.value)} rows={7} />}
      {toolId === "markdown-preview" ? (
        <div className="preview-box" dangerouslySetInnerHTML={{ __html: output }} />
      ) : (
        <pre>{output}</pre>
      )}
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(output)}>Copy result</button>
    </ToolFrame>
  );
}

export function DeveloperBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "cron-builder") return <CronBuilder />;
  if (toolId === "http-status-lookup") return <HttpStatusLookup />;
  if (toolId === "environment-variable-helper") return <EnvHelper />;
  return <FormatterTool toolId={toolId} />;
}

function CronBuilder() {
  const [minute, setMinute] = useState("0");
  const [hour, setHour] = useState("9");
  const [day, setDay] = useState("*");
  const [month, setMonth] = useState("*");
  const [weekday, setWeekday] = useState("1-5");
  const cron = `${minute} ${hour} ${day} ${month} ${weekday}`;
  return (
    <ToolFrame footer={<Status active label="Standard 5-field cron" />}>
      <div className="mini-grid five">
        {[
          ["Minute", minute, setMinute],
          ["Hour", hour, setHour],
          ["Day", day, setDay],
          ["Month", month, setMonth],
          ["Weekday", weekday, setWeekday]
        ].map(([label, value, setter]) => (
          <label className="field" key={label as string}>
            <span>{label as string}</span>
            <input value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} />
          </label>
        ))}
      </div>
      <pre>{cron}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(cron)}>Copy cron</button>
    </ToolFrame>
  );
}

function FormatterTool({ toolId }: { toolId: string }) {
  const [input, setInput] = useState(toolId === "xml-formatter" ? "<root><name>Quality life</name></root>" : "select id, name from users where active = true order by name");
  const output = toolId === "sql-formatter" ? formatSql(input) : toolId === "xml-formatter" ? formatXml(input) : input.split(/\r?\n/).map((line) => line.trimEnd()).join("\n");
  return (
    <ToolFrame footer={<Status active label="Formatted locally" />}>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} />
      <pre>{output}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(output)}>Copy formatted</button>
    </ToolFrame>
  );
}

function HttpStatusLookup() {
  const statuses: Record<string, string> = {
    "200": "OK",
    "201": "Created",
    "204": "No Content",
    "301": "Moved Permanently",
    "302": "Found",
    "400": "Bad Request",
    "401": "Unauthorized",
    "403": "Forbidden",
    "404": "Not Found",
    "409": "Conflict",
    "418": "I'm a teapot",
    "429": "Too Many Requests",
    "500": "Internal Server Error",
    "502": "Bad Gateway",
    "503": "Service Unavailable"
  };
  const [code, setCode] = useState("404");
  return (
    <ToolFrame footer={<Status active label="Common status reference" />}>
      <input value={code} onChange={(event) => setCode(event.target.value)} />
      <div className="timer-face compact-face">
        <Globe2 size={22} aria-hidden="true" />
        <strong>{statuses[code] ?? "Unknown"}</strong>
      </div>
    </ToolFrame>
  );
}

function EnvHelper() {
  const [input, setInput] = useState("API_URL=https://example.com\nFEATURE_FLAG=true");
  const output = input
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [key, ...value] = line.split("=");
      return `${key.trim()}=${JSON.stringify(value.join("=").trim())}`;
    })
    .join("\n");
  return (
    <ToolFrame footer={<Status active label="Quotes values safely" />}>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} />
      <pre>{output}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(output)}>Copy env</button>
    </ToolFrame>
  );
}

export function FilesBatchTool({ toolId }: { toolId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const [pattern, setPattern] = useState("photo-{n}");
  const rows = files.map((file, index) => ({
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    renamed: toolId === "filename-sanitizer" ? sanitizeFilename(file.name) : `${pattern.replace("{n}", String(index + 1))}.${file.name.split(".").pop() ?? ""}`
  }));
  const sorted = [...rows].sort((a, b) => b.size - a.size);

  return (
    <ToolFrame footer={<Status active label={`${files.length} files, ${formatBytes(totalSize)}`} />}>
      <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
      {toolId === "batch-file-renamer" && <input value={pattern} onChange={(event) => setPattern(event.target.value)} />}
      <div className="scroll-list">
        {(toolId === "large-file-scanner" ? sorted : rows).map((file) => (
          <div className="list-item" key={`${file.name}-${file.size}`}>
            <button className="list-copy" type="button" onClick={() => copyText(toolId.includes("renamer") || toolId.includes("sanitizer") ? file.renamed : file.name)}>
              <strong>{toolId.includes("renamer") || toolId.includes("sanitizer") ? `${file.name} → ${file.renamed}` : file.name}</strong>
              <span>{file.type} · {formatBytes(file.size)}</span>
            </button>
          </div>
        ))}
      </div>
      {toolId === "folder-size-calculator" && (
        <div className="native-note">
          <Code2 size={16} aria-hidden="true" />
          <code>Select files above to calculate the total shown in this tool.</code>
        </div>
      )}
    </ToolFrame>
  );
}

export function ImageBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "gradient-generator") return <GradientGenerator />;
  if (toolId === "aspect-ratio-helper") return <AspectRatioHelper />;
  if (toolId === "palette-extractor") return <PaletteExtractor />;
  if (toolId === "favicon-generator") return <FaviconGenerator />;
  return <ColorPickerLocal />;
}

function ColorPickerLocal() {
  const [color, setColor] = useState("#78f0c8");
  return (
    <ToolFrame footer={<Status active label="Local color conversion" />}>
      <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
      <div className="color-tile" style={{ background: color }} />
      <pre>{color.toUpperCase()}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(color)}>Copy HEX</button>
    </ToolFrame>
  );
}

function GradientGenerator() {
  const [a, setA] = useState("#78f0c8");
  const [b, setB] = useState("#f6c177");
  const css = `linear-gradient(135deg, ${a}, ${b})`;
  return (
    <ToolFrame footer={<Status active label="CSS gradient generated" />}>
      <div className="tool-grid two">
        <input type="color" value={a} onChange={(event) => setA(event.target.value)} />
        <input type="color" value={b} onChange={(event) => setB(event.target.value)} />
      </div>
      <div className="color-tile wide-tile" style={{ background: css }} />
      <pre>{`background: ${css};`}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(`background: ${css};`)}>Copy CSS</button>
    </ToolFrame>
  );
}

function PaletteExtractor() {
  const [colors, setColors] = useState<string[]>([]);
  const onFile = (file?: File) => {
    if (!file) return;
    const img = document.createElement("img");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 40;
      canvas.height = 40;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(img, 0, 0, 40, 40);
      const data = context.getImageData(0, 0, 40, 40).data;
      const buckets = new Map<string, number>();
      for (let index = 0; index < data.length; index += 16) {
        const key = `#${[data[index], data[index + 1], data[index + 2]].map((n) => Math.round(n / 32) * 32).map((n) => Math.min(255, n).toString(16).padStart(2, "0")).join("")}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      setColors([...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([color]) => color));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };
  return (
    <ToolFrame footer={<Status active label={`${colors.length} colors`} />}>
      <input type="file" accept="image/*" onChange={(event) => onFile(event.target.files?.[0])} />
      <div className="palette-grid">
        {colors.map((color) => <button className="color-chip" key={color} type="button" style={{ background: color }} onClick={() => copyText(color)}>{color}</button>)}
      </div>
    </ToolFrame>
  );
}

function FaviconGenerator() {
  const [letter, setLetter] = useState("Q");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#111113"/><text x="32" y="42" text-anchor="middle" font-family="Arial" font-size="34" fill="#78f0c8">${escapeHtml(letter.slice(0, 2))}</text></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return (
    <ToolFrame footer={<Status active label="SVG favicon data URL" />}>
      <input value={letter} onChange={(event) => setLetter(event.target.value)} maxLength={2} />
      <img className="favicon-preview" src={url} alt="Generated favicon" />
      <pre>{url}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(url)}>Copy data URL</button>
    </ToolFrame>
  );
}

function AspectRatioHelper() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const ratio = `${width / gcd(width, height)}:${height / gcd(width, height)}`;
  return (
    <ToolFrame footer={<Status active label={ratio} />}>
      <div className="tool-grid two">
        <input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value) || 1)} />
        <input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value) || 1)} />
      </div>
      <div className="timer-face compact-face"><strong>{ratio}</strong></div>
    </ToolFrame>
  );
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function ScreenBatchTool({ toolId }: { toolId: string }) {
  return (
    <ToolFrame footer={<Status active label="Preview overlay runs inside the app" />}>
      <div className={`screen-demo ${toolId}`}>
        <span>{toolId.replace(/-/g, " ")}</span>
        {(toolId === "crosshair-overlay" || toolId === "pixel-ruler") && <div className="crosshair-lines" />}
        {toolId === "focus-overlay" && <div className="focus-hole" />}
        {toolId === "cursor-highlighter" && <div className="cursor-dot" />}
        {toolId === "magnifier" && <strong>2x</strong>}
      </div>
      <div className="native-note">
        <Code2 size={16} aria-hidden="true" />
        <code>This overlay preview runs inside the app window.</code>
      </div>
    </ToolFrame>
  );
}

export function SystemBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "battery-info") return <BatteryInfo />;
  return (
    <ToolFrame footer={<Status active={false} label="Native system API needed" />}>
      <div className="placeholder-hero">
        <Code2 size={24} aria-hidden="true" />
        <div>
          <strong>{toolId.replace(/-/g, " ")}</strong>
          <span>No local action is available for this entry.</span>
        </div>
      </div>
    </ToolFrame>
  );
}

function BatteryInfo() {
  const [battery, setBattery] = useState("Battery API unavailable in this environment.");
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    void nav.getBattery?.().then((info) => setBattery(`${Math.round(info.level * 100)}% · ${info.charging ? "charging" : "not charging"}`));
  }, []);
  return (
    <ToolFrame footer={<Status active label="Local device API when available" />}>
      <div className="timer-face compact-face">
        <Battery size={24} aria-hidden="true" />
        <strong>{battery}</strong>
      </div>
    </ToolFrame>
  );
}

export function NetworkBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "url-parser") return <UrlParser />;
  if (toolId === "local-ip-viewer") {
    return (
      <ToolFrame footer={<Status active={false} label="Browser privacy may hide local IPs" />}>
        <div className="native-note">
          <Network size={17} aria-hidden="true" />
          <code>No local network interface data is available here.</code>
        </div>
      </ToolFrame>
    );
  }
  return (
    <ToolFrame footer={<Status active={false} label="Network access intentionally explicit" />}>
      <div className="native-note">
        <Globe2 size={17} aria-hidden="true" />
        <code>No network request is sent from this tool.</code>
      </div>
    </ToolFrame>
  );
}

function UrlParser() {
  const [input, setInput] = useState("https://example.com:443/path?q=hello#section");
  let output = "";
  try {
    const url = new URL(input);
    output = JSON.stringify({
      protocol: url.protocol,
      host: url.host,
      pathname: url.pathname,
      search: Object.fromEntries(url.searchParams.entries()),
      hash: url.hash
    }, null, 2);
  } catch {
    output = "Invalid URL";
  }
  return (
    <ToolFrame footer={<Status active label="Parsed locally" />}>
      <input value={input} onChange={(event) => setInput(event.target.value)} />
      <pre>{output}</pre>
    </ToolFrame>
  );
}

export function ProductivityBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "stopwatch") return <Stopwatch />;
  if (toolId === "daily-checklist") return <DailyChecklist toolId={toolId} />;
  if (toolId === "tiny-kanban-board") return <TinyKanban toolId={toolId} />;
  if (toolId === "random-decision-picker") return <RandomPicker title="Decision picker" />;
  if (toolId === "timezone-converter") return <TimezoneConverter />;
  return <MeetingNotes toolId={toolId} />;
}

function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  useInterval(() => setMs((value) => value + 100), running ? 100 : null);
  return (
    <ToolFrame footer={<Status active={running} label="Stopwatch" />}>
      <div className="timer-face"><Timer size={22} aria-hidden="true" /><strong>{(ms / 1000).toFixed(1)}s</strong></div>
      <RunControls running={running} onToggle={() => setRunning((value) => !value)} onReset={() => setMs(0)} />
    </ToolFrame>
  );
}

function DailyChecklist({ toolId }: { toolId: string }) {
  const [items, setItems] = useLocalStorage(`${toolId}:items`, [{ text: "Triage inbox", done: false }]);
  const [draft, setDraft] = useState("");
  return (
    <ToolFrame footer={<Status active label={`${items.filter((item) => item.done).length}/${items.length} done`} />}>
      <div className="action-strip">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button className="primary-action" type="button" onClick={() => draft && setItems((current) => [...current, { text: draft, done: false }])}>Add</button>
      </div>
      {items.map((item, index) => (
        <label className="toggle-card" key={`${item.text}-${index}`}>
          <input type="checkbox" checked={item.done} onChange={(event) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, done: event.target.checked } : entry))} />
          <span>{item.text}</span>
        </label>
      ))}
    </ToolFrame>
  );
}

function TinyKanban({ toolId }: { toolId: string }) {
  const [columns, setColumns] = useLocalStorage<Record<string, string[]>>(`${toolId}:columns`, {
    Todo: ["Small thing"],
    Doing: [],
    Done: []
  });
  const [draft, setDraft] = useState("");
  return (
    <ToolFrame footer={<Status active label="Local board" />}>
      <div className="action-strip">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button className="primary-action" type="button" onClick={() => draft && setColumns((current) => ({ ...current, Todo: [draft, ...current.Todo] }))}>Add card</button>
      </div>
      <div className="kanban-grid">
        {Object.entries(columns).map(([name, cards]) => (
          <Panel title={name} key={name}>
            {cards.map((card) => <code key={card}>{card}</code>)}
          </Panel>
        ))}
      </div>
    </ToolFrame>
  );
}

function RandomPicker({ title }: { title: string }) {
  const [items, setItems] = useState("Tea\nCoffee\nWater");
  const [choice, setChoice] = useState("");
  const options = lines(items);
  return (
    <ToolFrame footer={<Status active label={title} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={items} onChange={(event) => setItems(event.target.value)} rows={7} />
      <div className="wheel-stage">
        <div className="wheel-ring">
          <div className="wheel-center">
            <strong>{choice || "Ready"}</strong>
            <span>{options.length} options</span>
          </div>
        </div>
      </div>
      <button className="primary-action fit-action" type="button" onClick={() => setChoice(randomItem(options) ?? "")}>Pick</button>
    </ToolFrame>
  );
}

function TimezoneConverter() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const zones = ["UTC", "Europe/Warsaw", "America/New_York", "America/Los_Angeles", "Asia/Tokyo"];
  return (
    <ToolFrame footer={<Status active label="Local Intl conversion" />}>
      <input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} />
      {zones.map((zone) => <code key={zone}>{zone}: {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: zone }).format(new Date(date))}</code>)}
    </ToolFrame>
  );
}

function MeetingNotes({ toolId }: { toolId: string }) {
  const [note, setNote] = useLocalStorage(`${toolId}:note`, "Attendees:\n\nDecisions:\n\nNext steps:\n");
  return (
    <ToolFrame footer={<Status active label="Auto-saved locally" />}>
      <textarea className="scratchpad" value={note} onChange={(event) => setNote(event.target.value)} />
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(note)}>Copy notes</button>
    </ToolFrame>
  );
}

export function AudioBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "white-noise-generator" || toolId === "background-sound-player") return <NoiseGenerator label={toolId} />;
  return (
    <ToolFrame footer={<Status active={false} label="Native audio permission needed" />}>
      <div className="native-note">
        <Music size={17} aria-hidden="true" />
        <code>No microphone capture starts from this tool.</code>
      </div>
    </ToolFrame>
  );
}

function NoiseGenerator({ label }: { label: string }) {
  const audioRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = async () => {
    if (playing) {
      nodeRef.current?.stop();
      audioRef.current?.close();
      setPlaying(false);
      return;
    }
    const context = new AudioContext();
    audioRef.current = context;
    if (label === "white-noise-generator") {
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(context.destination);
      source.start();
      nodeRef.current = source;
    } else {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = 174;
      oscillator.connect(context.destination);
      oscillator.start();
      nodeRef.current = oscillator;
    }
    setPlaying(true);
  };
  return (
    <ToolFrame footer={<Status active={playing} label="Generated locally" />}>
      <button className="primary-action fit-action" type="button" onClick={toggle}>{playing ? <Pause size={16} /> : <Play size={16} />} {playing ? "Stop" : "Play"}</button>
    </ToolFrame>
  );
}

export function PrivacyBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "password-strength-checker") return <PasswordStrength />;
  if (toolId === "clipboard-auto-clear") return <ClipboardAutoClear />;
  if (toolId === "secure-notes" || toolId === "temporary-notes") return <PrivateNotes toolId={toolId} temporary={toolId === "temporary-notes"} />;
  if (toolId === "link-tracker-remover") return <LinkCleaner />;
  return (
    <ToolFrame footer={<Status active={false} label="No action selected" />}>
      <div className="native-note">
        <Shield size={17} aria-hidden="true" />
        <code>No destructive action is attached to this entry.</code>
      </div>
    </ToolFrame>
  );
}

function PasswordStrength() {
  const [password, setPassword] = useState("");
  const score = [password.length >= 12, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  return (
    <ToolFrame footer={<Status active label={`Score ${score}/5`} />}>
      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <div className="meter"><span style={{ width: `${score * 20}%` }} /></div>
      <pre>{score >= 4 ? "Strong" : score >= 3 ? "Okay" : "Weak"}</pre>
    </ToolFrame>
  );
}

function ClipboardAutoClear() {
  const [seconds, setSeconds] = useState(30);
  const [armed, setArmed] = useState(false);
  const [remaining, setRemaining] = useState(seconds);
  useInterval(() => {
    setRemaining((value) => {
      if (value <= 1) {
        void copyText("");
        setArmed(false);
        return seconds;
      }
      return value - 1;
    });
  }, armed ? 1000 : null);
  return (
    <ToolFrame footer={<Status active={armed} label={armed ? `${remaining}s remaining` : "Idle"} />}>
      <input type="number" value={seconds} onChange={(event) => setSeconds(Number(event.target.value) || 1)} />
      <button className="primary-action fit-action" type="button" onClick={() => { setRemaining(seconds); setArmed((value) => !value); }}>{armed ? "Cancel" : "Arm clear"}</button>
    </ToolFrame>
  );
}

function PrivateNotes({ toolId, temporary }: { toolId: string; temporary: boolean }) {
  const storage = useLocalStorage(`${toolId}:note`, "");
  const [memoryNote, setMemoryNote] = useState("");
  const [savedNote, setSavedNote] = storage;
  const value = temporary ? memoryNote : savedNote;
  const setter = temporary ? setMemoryNote : setSavedNote;
  return (
    <ToolFrame footer={<Status active label={temporary ? "Memory only" : "Saved locally"} />}>
      <textarea className="scratchpad" value={value} onChange={(event) => setter(event.target.value)} />
      <button className="danger-action fit-action" type="button" onClick={() => setter("")}>Clear</button>
    </ToolFrame>
  );
}

export function FunBatchTool({ toolId }: { toolId: string }) {
  if (toolId === "coin-flip") return <CoinFlipToy />;
  if (toolId === "dice-roller") return <DiceRollToy />;
  if (toolId === "random-picker") return <RandomPicker title="Random picker" />;
  if (toolId === "emoji-search") return <EmojiSearch />;
  if (toolId === "ascii-art-generator") return <AsciiArt />;
  return <DailyFact />;
}

function CoinFlipToy() {
  const [result, setResult] = useState<"Heads" | "Tails">("Heads");
  const [flipping, setFlipping] = useState(false);
  const [rotation, setRotation] = useState(0);
  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    const next = Math.random() > 0.5 ? "Heads" : "Tails";
    setRotation((current) => current + 540);
    window.setTimeout(() => {
      setResult(next);
      setFlipping(false);
    }, 620);
  };
  return (
    <ToolFrame footer={<Status active label="Animated local coin flip" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="coin-stage">
        <div className={`coin-disc ${flipping ? "spinning" : ""}`} style={{ transform: `rotateY(${rotation}deg)` }}>
          <span className="coin-face front">Heads</span>
          <span className="coin-face back">Tails</span>
        </div>
      </div>
      <div className="timer-face compact-face">
        <Sparkles size={20} aria-hidden="true" />
        <strong>{flipping ? "Flipping..." : result}</strong>
      </div>
      <button className="primary-action fit-action" type="button" onClick={flip}>Flip coin</button>
    </ToolFrame>
  );
}

function DiceRollToy() {
  const [value, setValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [sides, setSides] = useState<6 | 20>(6);
  const roll = () => {
    if (rolling) return;
    setRolling(true);
    window.setTimeout(() => {
      setValue(1 + Math.floor(Math.random() * sides));
      setRolling(false);
    }, 520);
  };
  return (
    <ToolFrame footer={<Status active label={`d${sides} animated roll`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="action-strip compact-actions">
        {[6, 20].map((face) => (
          <button
            className={sides === face ? "chip selected" : "chip"}
            key={face}
            type="button"
            onClick={() => setSides(face as 6 | 20)}
          >
            d{face}
          </button>
        ))}
      </div>
      <div className={`die-face ${rolling ? "rolling" : ""}`} aria-label={`d${sides} result ${value}`}>
        <DiePips value={value} sides={sides} />
      </div>
      <button className="primary-action fit-action" type="button" onClick={roll}>Roll die</button>
    </ToolFrame>
  );
}

function EmojiSearch() {
  const emojis = ["😀 smile", "🚀 rocket", "✅ check", "🔥 fire", "✨ sparkles", "🧠 brain", "☕ coffee"];
  const [query, setQuery] = useState("");
  return (
    <ToolFrame footer={<Status active label="Small offline emoji set" />}>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="palette-grid">
        {emojis.filter((item) => item.includes(query.toLowerCase())).map((item) => (
          <button className="secondary-action" type="button" key={item} onClick={() => copyText(item.split(" ")[0])}>{item}</button>
        ))}
      </div>
    </ToolFrame>
  );
}

function AsciiArt() {
  const [text, setText] = useState("QL");
  const output = text.toUpperCase().split("").map((char) => `[ ${char} ]`).join("\n");
  return (
    <ToolFrame footer={<Status active label="Tiny ASCII block" />}>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <pre>{output}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(output)}>Copy art</button>
    </ToolFrame>
  );
}

function DailyFact() {
  const facts = [
    "The first computer mouse was made of wood.",
    "QR codes can encode thousands of characters.",
    "A UUID v4 has 122 random bits.",
    "The Pomodoro technique was named after a kitchen timer."
  ];
  const index = new Date().getFullYear() + new Date().getMonth() + new Date().getDate();
  return (
    <ToolFrame footer={<Status active label="Offline daily fact" />}>
      <div className="placeholder-hero"><Sparkles size={24} aria-hidden="true" /><strong>{facts[index % facts.length]}</strong></div>
    </ToolFrame>
  );
}

function DiePips({ value, sides }: { value: number; sides: 6 | 20 }) {
  const pipLayouts: Record<number, string[]> = {
    1: ["center"],
    2: ["tl", "br"],
    3: ["tl", "center", "br"],
    4: ["tl", "tr", "bl", "br"],
    5: ["tl", "tr", "center", "bl", "br"],
    6: ["tl", "tr", "ml", "mr", "bl", "br"]
  };
  const positions = sides === 20 ? [String(value)] : pipLayouts[value] ?? [String(value)];
  return (
    <div className="die-grid">
      {sides === 20 ? (
        <strong className="die-number">{value}</strong>
      ) : (
        positions.map((pip, index) => <span className={`die-pip ${pip}`} key={`${pip}-${index}`} />)
      )}
    </div>
  );
}

function BadgeRow({ values }: { values: string[] }) {
  return (
    <div className="trust-badge-row">
      {values.map((value) => (
        <span className="pill" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}

function Status({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="status-row">
      <span className={`status-dot ${active ? "on" : ""}`} />
      <span>{label}</span>
    </div>
  );
}

function RunControls({ running, onToggle, onReset }: { running: boolean; onToggle: () => void; onReset: () => void }) {
  return (
    <div className="action-strip">
      <button className="primary-action" type="button" onClick={onToggle}>
        {running ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {running ? "Stop" : "Start"}
      </button>
      <button className="secondary-action" type="button" onClick={onReset}>
        <RotateCcw size={16} aria-hidden="true" />
        Reset
      </button>
    </div>
  );
}
