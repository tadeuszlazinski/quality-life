import {
  AlarmClock,
  AppWindow,
  Camera,
  Check,
  Clipboard,
  Copy,
  Crosshair,
  Download,
  Eye,
  EyeOff,
  FileSearch,
  Folder,
  Globe2,
  History,
  Keyboard,
  LayoutPanelTop,
  Mic,
  MicOff,
  Monitor,
  MousePointer2,
  Palette,
  Pin,
  PinOff,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  SlidersHorizontal,
  Timer,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Wand2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useToast } from "../context/ToastContext";
import { useInterval } from "../hooks/useInterval";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyText } from "../lib/clipboard";
import {
  clearHistoryEntries,
  deleteHistoryEntry,
  excludeHistorySource,
  readHistoryEntries,
  readHistorySettings,
  subscribeToHistory,
  toggleHistoryPin,
  upsertHistoryEntry,
  writeHistorySettings
} from "../lib/history";
import {
  getCurrentWindowLayout,
  openExternalTarget,
  restoreWindowLayout,
  setWindowAlwaysOnTop,
  type WindowLayoutSnapshot
} from "../lib/nativeSystem";
import type { HistoryEntry, HistoryKind } from "../types/history";
import type { ShortcutActionType, SpecialShortcut } from "../types/shortcuts";
import type { ToolProps } from "../types/tools";

type IndexedFile = {
  id: string;
  name: string;
  extension: string;
  folder: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
  file: File;
};

type DuplicateGroup = {
  hash: string;
  files: IndexedFile[];
};

const directoryPickerProps = {
  webkitdirectory: "",
  directory: ""
} as Record<string, string>;

const historyKindLabels: Array<{ kind: HistoryKind; label: string }> = [
  { kind: "apps", label: "Apps" },
  { kind: "websites", label: "Websites" },
  { kind: "files", label: "Files" },
  { kind: "clipboard", label: "Clipboard" },
  { kind: "notes", label: "Notes" },
  { kind: "toolbelt", label: "Quality life activity" },
  { kind: "screenshots", label: "Screenshots/OCR" }
];

const shortcutActionLabels: Array<{ type: ShortcutActionType; label: string; placeholder: string }> = [
  { type: "app", label: "Open app", placeholder: "/Applications/Notes.app" },
  { type: "website", label: "Open website", placeholder: "https://example.com" },
  { type: "file", label: "Open file", placeholder: "/Users/name/Desktop/file.txt" },
  { type: "folder", label: "Open folder", placeholder: "/Users/name/Downloads" },
  { type: "tool", label: "Open Quality life tool", placeholder: "clipboard-manager" },
  { type: "chain", label: "Run saved action chain", placeholder: "tool:qr-generator\nurl:https://example.com" }
];

const trackingParams = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "ref",
  "spm"
]);

export function HighValueTool({ toolId }: ToolProps) {
  if (toolId === "instant-file-search") return <InstantFileSearch toolId={toolId} />;
  if (toolId === "mic-webcam-toggle") return <MicWebcamToggle />;
  if (toolId === "cursor-finder") return <CursorFinder />;
  if (toolId === "better-volume-controls") return <BetterVolumeControls />;
  if (toolId === "screenshot-ocr") return <ScreenshotOcr toolId={toolId} />;
  if (toolId === "window-layout-restorer") return <WindowLayoutRestorer toolId={toolId} />;
  if (toolId === "startup-app-manager") return <StartupAppManager toolId={toolId} />;
  if (toolId === "duplicate-file-finder") return <DuplicateFileFinder toolId={toolId} />;
  if (toolId === "screen-color-picker") return <ScreenColorPicker />;
  if (toolId === "always-on-top") return <AlwaysOnTop />;
  if (toolId === "bulk-file-renamer") return <BulkFileRenamer />;
  if (toolId === "tiny-timers") return <TinyTimers />;
  if (toolId === "better-screenshot-tool") return <BetterScreenshotTool toolId={toolId} />;
  if (toolId === "clean-desktop-button") return <CleanDesktopButton />;
  if (toolId === "general-history-search") return <GeneralHistorySearch />;
  return <SpecialKeyLauncher toolId={toolId} />;
}

function InstantFileSearch({ toolId }: { toolId: string }) {
  const [files, setFiles] = useState<IndexedFile[]>([]);
  const [query, setQuery] = useState("");
  const [extension, setExtension] = useState("");
  const [folder, setFolder] = useState("");
  const [kind, setKind] = useState("all");
  const [afterDate, setAfterDate] = useState("");
  const [beforeDate, setBeforeDate] = useState("");
  const { toast } = useToast();

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []).map(fileToIndexedFile);
    setFiles(nextFiles);
    toast("Files indexed", { tone: "success", message: `${nextFiles.length} local files ready to search` });
  };

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedExtension = extension.trim().replace(/^\./, "").toLowerCase();
    const normalizedFolder = folder.trim().toLowerCase();
    const after = afterDate ? new Date(afterDate).getTime() : 0;
    const before = beforeDate ? new Date(beforeDate).getTime() + 86_399_999 : Number.POSITIVE_INFINITY;
    return files.filter((file) => {
      const haystack = `${file.name} ${file.path} ${file.type}`.toLowerCase();
      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (!normalizedExtension || file.extension === normalizedExtension) &&
        (!normalizedFolder || file.folder.toLowerCase().includes(normalizedFolder)) &&
        (kind === "all" || fileKind(file) === kind) &&
        file.lastModified >= after &&
        file.lastModified <= before
      );
    });
  }, [afterDate, beforeDate, extension, files, folder, kind, query]);

  useEffect(() => {
    if (!query.trim()) {
      return;
    }
    upsertHistoryEntry(
      {
        kind: "files",
        source: "Instant File Search",
        title: `File search: ${query}`,
        preview: `${results.length} matches in selected local files`,
        toolId
      },
      `file-search:${query}:${extension}:${folder}:${kind}`
    );
  }, [extension, folder, kind, query, results.length, toolId]);

  return (
    <ToolFrame footer={<Status active label={`${results.length} matches from ${files.length} indexed files`} />}>
      <input type="file" multiple {...directoryPickerProps} onChange={onFiles} />
      <div className="tool-grid two">
        <label className="field">
          <span>Name, type, or path</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="invoice, .png, Downloads..." />
        </label>
        <label className="field">
          <span>Extension</span>
          <input value={extension} onChange={(event) => setExtension(event.target.value)} placeholder="pdf" />
        </label>
        <label className="field">
          <span>Folder</span>
          <input value={folder} onChange={(event) => setFolder(event.target.value)} placeholder="Screenshots" />
        </label>
        <label className="field">
          <span>Type</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="all">All</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="archive">Archives</option>
            <option value="code">Code</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="field">
          <span>Modified after</span>
          <input type="date" value={afterDate} onChange={(event) => setAfterDate(event.target.value)} />
        </label>
        <label className="field">
          <span>Modified before</span>
          <input type="date" value={beforeDate} onChange={(event) => setBeforeDate(event.target.value)} />
        </label>
      </div>
      <div className="scroll-list">
        {results.slice(0, 80).map((file) => (
          <div className="list-item" key={file.id}>
            <button className="list-copy" type="button" onClick={() => copyText(file.path)}>
              <strong>{file.name}</strong>
              <span>{file.folder || "Selected files"} · {formatBytes(file.size)} · {new Date(file.lastModified).toLocaleDateString()}</span>
            </button>
            <button className="icon-button" type="button" aria-label="Copy file path" onClick={() => copyText(file.path)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
        {files.length === 0 && <div className="empty-inline">Pick a folder or a group of files to build a private local index.</div>}
      </div>
    </ToolFrame>
  );
}

function MicWebcamToggle() {
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState("No device stream is active");
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const requestStream = async (kind: "mic" | "camera") => {
    try {
      stopStreams(streamRef.current);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: kind === "mic",
        video: kind === "camera"
      });
      streamRef.current = stream;
      setMicActive(kind === "mic");
      setCameraActive(kind === "camera");
      setStatus(kind === "mic" ? "Mic stream active in Quality life" : "Webcam stream active in Quality life");
    } catch (error) {
      toast("Device permission blocked", {
        tone: "error",
        message: error instanceof Error ? error.message : "Could not start device check"
      });
    }
  };

  const stopAll = () => {
    stopStreams(streamRef.current);
    streamRef.current = null;
    setMicActive(false);
    setCameraActive(false);
    setStatus("No device stream is active");
  };

  useEffect(() => stopAll, []);

  return (
    <ToolFrame footer={<Status active={micActive || cameraActive} label={status} />}>
      <div className={micActive || cameraActive ? "privacy-status live" : "privacy-status"}>
        <Shield size={28} aria-hidden="true" />
        <div>
          <strong>{micActive || cameraActive ? "Privacy check running" : "Privacy guard ready"}</strong>
          <span>{micActive ? "Microphone is being tested here." : cameraActive ? "Webcam is being tested here." : "No app-owned stream is open."}</span>
        </div>
      </div>
      <div className="tool-grid two">
        <button className={micActive ? "danger-action" : "secondary-action"} type="button" onClick={() => (micActive ? stopAll() : requestStream("mic"))}>
          {micActive ? <MicOff size={17} aria-hidden="true" /> : <Mic size={17} aria-hidden="true" />}
          {micActive ? "Release mic" : "Check mic"}
        </button>
        <button className={cameraActive ? "danger-action" : "secondary-action"} type="button" onClick={() => (cameraActive ? stopAll() : requestStream("camera"))}>
          {cameraActive ? <EyeOff size={17} aria-hidden="true" /> : <Camera size={17} aria-hidden="true" />}
          {cameraActive ? "Release webcam" : "Check webcam"}
        </button>
      </div>
      {/* TODO: wire OS-level mic mute, camera disable, and global hotkeys through native Tauri APIs. */}
    </ToolFrame>
  );
}

function CursorFinder() {
  const [active, setActive] = useState(false);
  const pulse = () => {
    setActive(true);
    window.setTimeout(() => setActive(false), 1800);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        pulse();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <ToolFrame footer={<Status active={active} label={active ? "Cursor spotlight visible" : "Press Ctrl+Alt+C while focused"} />}>
      <div className={active ? "screen-demo cursor-finder active" : "screen-demo cursor-finder"}>
        <MousePointer2 size={32} aria-hidden="true" />
        <div className="cursor-dot finder-pulse" />
      </div>
      <button className="primary-action fit-action" type="button" onClick={pulse}>
        <Crosshair size={17} aria-hidden="true" />
        Find cursor
      </button>
      {/* TODO: replace the in-window demo with a native transparent overlay and mouse-shake detector. */}
    </ToolFrame>
  );
}

function BetterVolumeControls() {
  const [volume, setVolume] = useLocalStorage("quality-life:volume-preset", 45);
  const [muted, setMuted] = useLocalStorage("quality-life:quick-muted", false);
  const [output, setOutput] = useLocalStorage("quality-life:audio-output-label", "Default output");
  const audioContext = useRef<AudioContext | null>(null);

  const playTestTone = () => {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 440;
    gain.gain.value = muted ? 0 : volume / 100;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
    audioContext.current = context;
  };

  useEffect(() => () => void audioContext.current?.close(), []);

  return (
    <ToolFrame footer={<Status active={!muted} label={muted ? "Quick mute preset active" : `${volume}% app test volume`} />}>
      <div className="privacy-status">
        {muted ? <VolumeX size={28} aria-hidden="true" /> : <Volume2 size={28} aria-hidden="true" />}
        <div>
          <strong>{muted ? "Muted preset" : "Volume preset"}</strong>
          <span>{output}</span>
        </div>
      </div>
      <label className="field">
        <span>Volume</span>
        <input type="range" min={0} max={100} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
      </label>
      <div className="action-strip compact-actions">
        {[15, 35, 65, 100].map((preset) => (
          <button className={volume === preset ? "chip selected" : "chip"} type="button" key={preset} onClick={() => setVolume(preset)}>
            {preset}%
          </button>
        ))}
      </div>
      <div className="tool-grid two">
        <button className={muted ? "danger-action" : "secondary-action"} type="button" onClick={() => setMuted((value) => !value)}>
          {muted ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
          {muted ? "Unmute preset" : "Quick mute"}
        </button>
        <button className="secondary-action" type="button" onClick={playTestTone}>
          <Play size={17} aria-hidden="true" />
          Test tone
        </button>
      </div>
      <label className="field">
        <span>Output label</span>
        <input value={output} onChange={(event) => setOutput(event.target.value)} />
      </label>
      {/* TODO: wire system output device switching and app volume mixer control through native Tauri commands. */}
    </ToolFrame>
  );
}

function ScreenshotOcr({ toolId }: { toolId: string }) {
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [ocrText, setOcrText] = useLocalStorage(`${toolId}:text`, "");
  const { toast } = useToast();

  const onImage = (file?: File) => {
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageName(file.name);
    upsertHistoryEntry(
      {
        kind: "screenshots",
        source: "Screenshot OCR",
        title: file.name,
        preview: `Image queued for local OCR: ${formatBytes(file.size)}`,
        toolId
      },
      `ocr:${file.name}:${file.size}:${file.lastModified}`
    );
    toast("Image loaded", { tone: "success", message: "Ready for local OCR text" });
  };

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  return (
    <ToolFrame footer={<Status active={Boolean(imageUrl)} label={imageUrl ? imageName : "No image selected"} />}>
      <input type="file" accept="image/*" onChange={(event) => onImage(event.target.files?.[0])} />
      {imageUrl ? <img className="screenshot-preview" src={imageUrl} alt="Selected screenshot" /> : <div className="empty-state mini-empty"><Search size={24} /><span>Select an image or screenshot</span></div>}
      <textarea value={ocrText} onChange={(event) => setOcrText(event.target.value)} rows={7} placeholder="OCR text appears here when native OCR is connected. You can also type or paste extracted text here now." />
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(ocrText)} disabled={!ocrText.trim()}>
        <Copy size={16} aria-hidden="true" />
        Copy text
      </button>
      {/* TODO: connect native OCR through platform APIs, then write recognized text into this local field. */}
    </ToolFrame>
  );
}

function WindowLayoutRestorer({ toolId }: { toolId: string }) {
  const [layouts, setLayouts] = useLocalStorage<Array<WindowLayoutSnapshot & { id: string; name: string; createdAt: number }>>(`${toolId}:layouts`, []);
  const { toast } = useToast();

  const saveLayout = async () => {
    const layout = await getCurrentWindowLayout();
    setLayouts((current) => [
      { ...layout, id: crypto.randomUUID(), name: `Layout ${current.length + 1}`, createdAt: Date.now() },
      ...current
    ].slice(0, 12));
    toast("Window layout saved", { tone: "success" });
  };

  const restoreLayout = async (layout: WindowLayoutSnapshot) => {
    await restoreWindowLayout(layout);
    toast("Window layout restored", { tone: "success" });
  };

  return (
    <ToolFrame footer={<Status active label={`${layouts.length} saved layouts`} />}>
      <button className="primary-action fit-action" type="button" onClick={saveLayout}>
        <Save size={17} aria-hidden="true" />
        Save current window
      </button>
      <div className="scroll-list">
        {layouts.map((layout) => (
          <div className="list-item multi-actions" key={layout.id}>
            <button className="list-copy" type="button" onClick={() => restoreLayout(layout)}>
              <strong>{layout.name}</strong>
              <span>{layout.width}x{layout.height} at {layout.x}, {layout.y} · {new Date(layout.createdAt).toLocaleString()}</span>
            </button>
            <button className="icon-button" type="button" aria-label="Restore layout" onClick={() => restoreLayout(layout)}>
              <LayoutPanelTop size={15} aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Delete layout" onClick={() => setLayouts((current) => current.filter((item) => item.id !== layout.id))}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {/* TODO: extend this from the Quality life window to all app windows on every connected monitor. */}
    </ToolFrame>
  );
}

function StartupAppManager({ toolId }: { toolId: string }) {
  const [items, setItems] = useLocalStorage<Array<{ id: string; name: string; path: string; enabled: boolean; impact: "Low" | "Medium" | "High" }>>(`${toolId}:items`, [
    { id: "quality-life", name: "Quality life", path: "app.qualitylife.desktop", enabled: false, impact: "Low" }
  ]);
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [impact, setImpact] = useState<"Low" | "Medium" | "High">("Low");

  const addItem = () => {
    if (!name.trim()) return;
    setItems((current) => [
      { id: crypto.randomUUID(), name: name.trim(), path: path.trim(), enabled: true, impact },
      ...current
    ]);
    setName("");
    setPath("");
  };

  return (
    <ToolFrame footer={<Status active label={`${items.filter((item) => item.enabled).length} enabled in local startup list`} />}>
      <div className="tool-grid two">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="App name" />
        <select value={impact} onChange={(event) => setImpact(event.target.value as "Low" | "Medium" | "High")}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>
      <div className="action-strip">
        <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="App path or identifier" />
        <button className="primary-action" type="button" onClick={addItem}>
          <Plus size={16} aria-hidden="true" />
          Add
        </button>
      </div>
      <div className="scroll-list">
        {items.map((item) => (
          <div className="list-item multi-actions" key={item.id}>
            <button className="list-copy" type="button" onClick={() => copyText(item.path)}>
              <strong>{item.name}</strong>
              <span>{item.impact} startup impact · {item.path || "No path"}</span>
            </button>
            <button className={item.enabled ? "icon-button active-icon" : "icon-button"} type="button" aria-label="Toggle startup item" onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, enabled: !entry.enabled } : entry))}>
              <Check size={15} aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Delete startup item" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {/* TODO: read and update OS startup entries through native Tauri commands. */}
    </ToolFrame>
  );
}

function DuplicateFileFinder({ toolId }: { toolId: string }) {
  const [files, setFiles] = useState<IndexedFile[]>([]);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const scan = async () => {
    setScanning(true);
    try {
      const byHash = new Map<string, IndexedFile[]>();
      for (const file of files) {
        const hash = await hashFile(file.file);
        byHash.set(hash, [...(byHash.get(hash) ?? []), file]);
      }
      const duplicates = [...byHash.entries()]
        .map(([hash, duplicateFiles]) => ({ hash, files: duplicateFiles }))
        .filter((group) => group.files.length > 1);
      setGroups(duplicates);
      toast("Duplicate scan complete", { tone: "success", message: `${duplicates.length} duplicate groups` });
      upsertHistoryEntry(
        {
          kind: "files",
          source: "Duplicate File Finder",
          title: "Duplicate file scan",
          preview: `${duplicates.length} duplicate groups from ${files.length} files`,
          toolId
        },
        `duplicate-scan:${files.length}:${duplicates.length}:${Date.now()}`
      );
    } finally {
      setScanning(false);
    }
  };

  const report = groups.map((group) => `${group.hash}\n${group.files.map((file) => `- ${file.path} (${formatBytes(file.size)})`).join("\n")}`).join("\n\n");

  return (
    <ToolFrame footer={<Status active={scanning} label={scanning ? "Hashing selected files" : `${groups.length} duplicate groups`} />}>
      <input type="file" multiple {...directoryPickerProps} onChange={(event) => setFiles(Array.from(event.target.files ?? []).map(fileToIndexedFile))} />
      <div className="action-strip compact-actions">
        <button className="primary-action" type="button" onClick={scan} disabled={files.length === 0 || scanning}>
          <FileSearch size={17} aria-hidden="true" />
          Scan
        </button>
        <button className="secondary-action" type="button" onClick={() => copyText(report)} disabled={groups.length === 0}>
          <Copy size={16} aria-hidden="true" />
          Copy report
        </button>
      </div>
      <div className="scroll-list">
        {groups.map((group) => (
          <section className="utility-card compact-card" key={group.hash}>
            <strong>{group.files.length} matching files</strong>
            {group.files.map((file) => (
              <code key={file.id}>{file.path} · {formatBytes(file.size)}</code>
            ))}
          </section>
        ))}
        {files.length > 0 && groups.length === 0 && !scanning && <div className="empty-inline">No duplicates found in the selected files yet.</div>}
      </div>
      {/* TODO: add native safe-delete using OS trash APIs after full file paths are available from Tauri. */}
    </ToolFrame>
  );
}

function ScreenColorPicker() {
  const [hex, setHex] = useState("#78f0c8");
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const { toast } = useToast();

  const pickFromScreen = async () => {
    const EyeDropperClass = (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!EyeDropperClass) {
      toast("Screen picker not available here", { message: "Use the color input below.", tone: "info" });
      return;
    }
    const result = await new EyeDropperClass().open();
    setHex(result.sRGBHex);
  };

  return (
    <ToolFrame footer={<Status active label={`${hex.toUpperCase()} copied-ready`} />}>
      <div className="tool-grid two">
        <input type="color" value={hex} onChange={(event) => setHex(event.target.value)} />
        <button className="secondary-action" type="button" onClick={pickFromScreen}>
          <Palette size={17} aria-hidden="true" />
          Pick from screen
        </button>
      </div>
      <div className="color-tile wide-tile" style={{ background: hex }} />
      <div className="mini-grid">
        {[
          hex.toUpperCase(),
          `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
        ].map((value) => (
          <button className="secondary-action" type="button" key={value} onClick={() => copyText(value)}>
            <Copy size={15} aria-hidden="true" />
            {value}
          </button>
        ))}
      </div>
      {/* TODO: fall back to a native Tauri screen picker on systems without EyeDropper support. */}
    </ToolFrame>
  );
}

function AlwaysOnTop() {
  const [enabled, setEnabled] = useState(false);
  const { toast } = useToast();

  const toggle = async () => {
    const next = !enabled;
    try {
      await setWindowAlwaysOnTop(next);
      setEnabled(next);
      toast(next ? "Window pinned on top" : "Window unpinned", { tone: "success" });
    } catch (error) {
      toast("Always-on-top failed", { tone: "error", message: error instanceof Error ? error.message : "Could not update window" });
    }
  };

  return (
    <ToolFrame footer={<Status active={enabled} label={enabled ? "Quality life stays above other windows" : "Normal window behavior"} />}>
      <div className={enabled ? "privacy-status live" : "privacy-status"}>
        <Pin size={28} aria-hidden="true" />
        <div>
          <strong>{enabled ? "Pinned" : "Ready to pin"}</strong>
          <span>Keep this utility window visible while you work.</span>
        </div>
      </div>
      <button className="primary-action fit-action" type="button" onClick={toggle}>
        {enabled ? <PinOff size={17} aria-hidden="true" /> : <Pin size={17} aria-hidden="true" />}
        {enabled ? "Turn off" : "Always on top"}
      </button>
    </ToolFrame>
  );
}

function BulkFileRenamer() {
  const [files, setFiles] = useState<IndexedFile[]>([]);
  const [pattern, setPattern] = useState("file-{n}");
  const [start, setStart] = useState(1);
  const [replaceSpaces, setReplaceSpaces] = useState(true);
  const [caseMode, setCaseMode] = useState<"keep" | "lower" | "upper">("keep");

  const preview = files.map((file, index) => {
    const ext = file.extension ? `.${file.extension}` : "";
    let name = pattern
      .replace(/\{n\}/g, String(start + index))
      .replace(/\{name\}/g, file.name.replace(/\.[^.]+$/, ""));
    if (replaceSpaces) name = name.replace(/\s+/g, "-");
    if (caseMode === "lower") name = name.toLowerCase();
    if (caseMode === "upper") name = name.toUpperCase();
    return { from: file.name, to: `${sanitizeFilename(name)}${ext}` };
  });

  return (
    <ToolFrame footer={<Status active label={`${preview.length} rename previews`} />}>
      <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).map(fileToIndexedFile))} />
      <div className="tool-grid two">
        <label className="field">
          <span>Pattern</span>
          <input value={pattern} onChange={(event) => setPattern(event.target.value)} />
        </label>
        <label className="field">
          <span>Start number</span>
          <input type="number" value={start} onChange={(event) => setStart(Number(event.target.value) || 1)} />
        </label>
      </div>
      <div className="action-strip compact-actions">
        <label className="toggle-card">
          <input type="checkbox" checked={replaceSpaces} onChange={(event) => setReplaceSpaces(event.target.checked)} />
          <span>Replace spaces</span>
        </label>
        {(["keep", "lower", "upper"] as const).map((mode) => (
          <button className={caseMode === mode ? "chip selected" : "chip"} type="button" key={mode} onClick={() => setCaseMode(mode)}>
            {mode}
          </button>
        ))}
      </div>
      <div className="scroll-list">
        {preview.map((row) => (
          <div className="list-item" key={`${row.from}-${row.to}`}>
            <button className="list-copy" type="button" onClick={() => copyText(row.to)}>
              <strong>{row.from}</strong>
              <span>{row.to}</span>
            </button>
            <button className="icon-button" type="button" aria-label="Copy new filename" onClick={() => copyText(row.to)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {/* TODO: apply renames through a native file picker once Tauri returns writable file paths. */}
    </ToolFrame>
  );
}

function TinyTimers() {
  const [seconds, setSeconds] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [counting, setCounting] = useState(false);
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);

  useInterval(() => {
    setRemaining((value) => {
      if (value <= 1) {
        setCounting(false);
        return 0;
      }
      return value - 1;
    });
  }, counting ? 1000 : null);
  useInterval(() => setStopwatchMs((value) => value + 100), stopwatchRunning ? 100 : null);

  return (
    <ToolFrame footer={<Status active={counting || stopwatchRunning} label="Local timers" />}>
      <div className="tool-grid two">
        <section className="utility-card">
          <div className="utility-title"><AlarmClock size={17} /><strong>Countdown</strong></div>
          <input type="number" min={1} value={seconds} onChange={(event) => {
            const value = Number(event.target.value) || 1;
            setSeconds(value);
            setRemaining(value);
          }} />
          <div className="timer-face compact-face"><strong>{formatTime(remaining)}</strong></div>
          <RunControls running={counting} onToggle={() => setCounting((value) => !value)} onReset={() => setRemaining(seconds)} />
        </section>
        <section className="utility-card">
          <div className="utility-title"><Timer size={17} /><strong>Stopwatch</strong></div>
          <div className="timer-face compact-face"><strong>{(stopwatchMs / 1000).toFixed(1)}s</strong></div>
          <RunControls running={stopwatchRunning} onToggle={() => setStopwatchRunning((value) => !value)} onReset={() => setStopwatchMs(0)} />
        </section>
      </div>
      {/* TODO: add a tiny floating timer window through native Tauri window APIs. */}
    </ToolFrame>
  );
}

function BetterScreenshotTool({ toolId }: { toolId: string }) {
  const [imageUrl, setImageUrl] = useState("");
  const [annotation, setAnnotation] = useLocalStorage(`${toolId}:annotation`, "");
  const [redaction, setRedaction] = useState(false);
  const { toast } = useToast();

  const onImage = (file?: File) => {
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    upsertHistoryEntry(
      {
        kind: "screenshots",
        source: "Screenshot Tool",
        title: file.name,
        preview: `Screenshot loaded for annotation: ${formatBytes(file.size)}`,
        toolId
      },
      `screenshot:${file.name}:${file.size}:${file.lastModified}`
    );
  };

  const downloadAnnotated = async () => {
    if (!imageUrl) return;
    const dataUrl = await renderAnnotatedImage(imageUrl, annotation, redaction);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "quality-life-screenshot.png";
    link.click();
    toast("Screenshot saved", { tone: "success" });
  };

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  return (
    <ToolFrame footer={<Status active={Boolean(imageUrl)} label={imageUrl ? "Screenshot editor ready" : "Load a screenshot"} />}>
      <input type="file" accept="image/*" onChange={(event) => onImage(event.target.files?.[0])} />
      <div className="screenshot-stage">
        {imageUrl ? <img src={imageUrl} alt="Screenshot preview" /> : <Monitor size={34} aria-hidden="true" />}
        {redaction && <div className="redaction-box" />}
        {annotation && <span className="annotation-label">{annotation}</span>}
      </div>
      <input value={annotation} onChange={(event) => setAnnotation(event.target.value)} placeholder="Annotation label..." />
      <div className="action-strip compact-actions">
        <button className={redaction ? "chip selected" : "chip"} type="button" onClick={() => setRedaction((value) => !value)}>
          Blur box
        </button>
        <button className="secondary-action" type="button" onClick={downloadAnnotated} disabled={!imageUrl}>
          <Download size={16} aria-hidden="true" />
          Save
        </button>
      </div>
      {/* TODO: add native screenshot capture and clipboard image copy through Tauri. */}
    </ToolFrame>
  );
}

function CleanDesktopButton() {
  const [files, setFiles] = useState<IndexedFile[]>([]);
  const groups = useMemo(() => groupFilesForCleanup(files), [files]);
  const report = Object.entries(groups).map(([group, groupedFiles]) => `${group}\n${groupedFiles.map((file) => `- ${file.name}`).join("\n")}`).join("\n\n");

  return (
    <ToolFrame footer={<Status active label={`${files.length} selected files organized into ${Object.keys(groups).length} buckets`} />}>
      <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).map(fileToIndexedFile))} />
      <div className="mini-grid">
        {Object.entries(groups).map(([group, groupedFiles]) => (
          <section className="utility-card compact-card" key={group}>
            <div className="utility-title"><Folder size={17} /><strong>{group}</strong></div>
            <span className="muted-line">{groupedFiles.length} files</span>
          </section>
        ))}
      </div>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(report)} disabled={!files.length}>
        <Copy size={16} aria-hidden="true" />
        Copy cleanup plan
      </button>
      {/* TODO: connect safe desktop hiding and file organization to native folder commands. */}
    </ToolFrame>
  );
}

function GeneralHistorySearch() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => readHistoryEntries());
  const [settings, setSettings] = useState(() => readHistorySettings());
  const [query, setQuery] = useState("");
  const [activeKinds, setActiveKinds] = useState<HistoryKind[]>(settings.indexedKinds);
  const [dateFilter, setDateFilter] = useState("last-7-days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const { toast } = useToast();

  useEffect(() => subscribeToHistory(() => {
    setEntries(readHistoryEntries());
    setSettings(readHistorySettings());
  }), []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries
      .filter((entry) => activeKinds.includes(entry.kind))
      .filter((entry) => matchesDate(entry.timestamp, dateFilter, customStart, customEnd))
      .filter((entry) => !normalized || `${entry.title} ${entry.source} ${entry.preview}`.toLowerCase().includes(normalized))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.timestamp - a.timestamp);
  }, [activeKinds, customEnd, customStart, dateFilter, entries, query]);

  const updateSettings = (next: typeof settings) => {
    setSettings(next);
    writeHistorySettings(next);
  };

  const openEntry = async (entry: HistoryEntry) => {
    if (entry.toolId) {
      window.dispatchEvent(new CustomEvent("quality-life-open-tool", { detail: entry.toolId }));
      return;
    }
    if (entry.url) {
      await openExternalTarget("website", entry.url);
      return;
    }
    if (entry.path) {
      await openExternalTarget("file", entry.path);
      return;
    }
    await copyText(entry.text ?? entry.preview);
  };

  return (
    <ToolFrame footer={<Status active={settings.enabled} label={settings.enabled ? `${filtered.length} local results` : "History indexing off"} />}>
      <div className="history-search-bar">
        <History size={20} aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search things you opened, copied, generated, or saved..." />
      </div>
      <div className="filter-row">
        {historyKindLabels.map(({ kind, label }) => (
          <button
            className={activeKinds.includes(kind) ? "chip selected" : "chip"}
            type="button"
            key={kind}
            onClick={() => setActiveKinds((current) => current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind])}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filter-row">
        {[
          ["today", "Today"],
          ["yesterday", "Yesterday"],
          ["last-7-days", "Last 7 days"],
          ["last-30-days", "Last 30 days"],
          ["custom", "Custom"]
        ].map(([value, label]) => (
          <button className={dateFilter === value ? "chip selected" : "chip"} type="button" key={value} onClick={() => setDateFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      {dateFilter === "custom" && (
        <div className="tool-grid two">
          <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
          <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
        </div>
      )}
      <div className="action-strip compact-actions">
        <label className="toggle-card">
          <input type="checkbox" checked={settings.enabled} onChange={(event) => updateSettings({ ...settings, enabled: event.target.checked })} />
          <span>Index Quality life activity locally</span>
        </label>
        <button className="danger-action" type="button" onClick={() => {
          clearHistoryEntries();
          toast("History cleared", { tone: "success" });
        }}>
          <Trash2 size={16} aria-hidden="true" />
          Clear all
        </button>
      </div>
      {settings.excludedSources.length > 0 && (
        <div className="filter-row">
          {settings.excludedSources.map((source) => (
            <button className="chip" type="button" key={source} onClick={() => updateSettings({ ...settings, excludedSources: settings.excludedSources.filter((item) => item !== source) })}>
              Excluded: {source} <X size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <div className="scroll-list history-results">
        {filtered.map((entry) => (
          <article className="history-card" key={entry.id}>
            <div>
              <strong>{entry.title}</strong>
              <span>{entry.source} · {entry.kind} · {new Date(entry.timestamp).toLocaleString()}</span>
              <p>{entry.preview}</p>
            </div>
            <div className="history-actions">
              <button className="icon-button" type="button" aria-label="Open" onClick={() => openEntry(entry)}>
                <Play size={15} aria-hidden="true" />
              </button>
              <button className="icon-button" type="button" aria-label="Copy" onClick={() => copyText(entry.text ?? entry.url ?? entry.path ?? entry.preview)}>
                <Copy size={15} aria-hidden="true" />
              </button>
              <button className="icon-button" type="button" aria-label="Pin" onClick={() => toggleHistoryPin(entry.id)}>
                {entry.pinned ? <PinOff size={15} aria-hidden="true" /> : <Pin size={15} aria-hidden="true" />}
              </button>
              <button className="icon-button" type="button" aria-label="Exclude source" onClick={() => excludeHistorySource(entry.source)}>
                <EyeOff size={15} aria-hidden="true" />
              </button>
              <button className="icon-button" type="button" aria-label="Delete" onClick={() => deleteHistoryEntry(entry.id)}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="empty-inline">Local history results will appear here as you use Quality life.</div>}
      </div>
      {/* TODO: add opt-in importers for browser history, recent files, app usage, system search, documents, and OCR history. */}
    </ToolFrame>
  );
}

function SpecialKeyLauncher({ toolId }: { toolId: string }) {
  const [shortcuts, setShortcuts] = useLocalStorage<SpecialShortcut[]>("quality-life:special-shortcuts", []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [draft, setDraft] = useState<Omit<SpecialShortcut, "id" | "createdAt">>({
    name: "",
    hotkey: "",
    actionType: "website",
    target: "",
    enabled: true
  });
  const { toast } = useToast();

  const duplicate = shortcuts.find((shortcut) => shortcut.id !== editingId && normalizeHotkey(shortcut.hotkey) === normalizeHotkey(draft.hotkey));

  useEffect(() => {
    if (!capturing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      const hotkey = hotkeyFromEvent(event);
      if (hotkey) {
        setDraft((current) => ({ ...current, hotkey }));
        setCapturing(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [capturing]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const pressed = normalizeHotkey(hotkeyFromEvent(event));
      const shortcut = shortcuts.find((item) => item.enabled && normalizeHotkey(item.hotkey) === pressed);
      if (!shortcut || capturing) return;
      event.preventDefault();
      void runShortcut(shortcut, toast);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [capturing, shortcuts, toast]);

  const saveShortcut = () => {
    if (!draft.name.trim() || !draft.hotkey.trim() || !draft.target.trim() || duplicate) {
      return;
    }
    if (editingId) {
      setShortcuts((current) => current.map((shortcut) => shortcut.id === editingId ? { ...shortcut, ...draft } : shortcut));
      setEditingId(null);
    } else {
      setShortcuts((current) => [{ ...draft, id: crypto.randomUUID(), createdAt: Date.now() }, ...current]);
    }
    setDraft({ name: "", hotkey: "", actionType: "website", target: "", enabled: true });
    upsertHistoryEntry(
      {
        kind: "toolbelt",
        source: "Special Key Launcher",
        title: "Shortcut saved",
        preview: draft.hotkey,
        toolId
      },
      `shortcut:${draft.hotkey}:${draft.target}`
    );
  };

  const startEdit = (shortcut: SpecialShortcut) => {
    setEditingId(shortcut.id);
    setDraft({
      name: shortcut.name,
      hotkey: shortcut.hotkey,
      actionType: shortcut.actionType,
      target: shortcut.target,
      enabled: shortcut.enabled
    });
  };

  return (
    <ToolFrame footer={<Status active label={`${shortcuts.filter((shortcut) => shortcut.enabled).length} enabled shortcuts`} />}>
      <div className="tool-grid two">
        <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Shortcut name" />
        <select value={draft.actionType} onChange={(event) => setDraft((current) => ({ ...current, actionType: event.target.value as ShortcutActionType }))}>
          {shortcutActionLabels.map((option) => <option value={option.type} key={option.type}>{option.label}</option>)}
        </select>
      </div>
      <div className="tool-grid two">
        <button className={capturing ? "chip selected" : "secondary-action"} type="button" onClick={() => setCapturing(true)}>
          <Keyboard size={16} aria-hidden="true" />
          {capturing ? "Press keys..." : draft.hotkey || "Record hotkey"}
        </button>
        <input
          value={draft.target}
          onChange={(event) => setDraft((current) => ({ ...current, target: event.target.value }))}
          placeholder={shortcutActionLabels.find((option) => option.type === draft.actionType)?.placeholder}
        />
      </div>
      {duplicate && <div className="native-note"><Keyboard size={16} /><code>Shortcut conflicts with {duplicate.name}.</code></div>}
      <button className="primary-action fit-action" type="button" onClick={saveShortcut} disabled={Boolean(duplicate) || !draft.name.trim() || !draft.hotkey.trim() || !draft.target.trim()}>
        <Save size={16} aria-hidden="true" />
        {editingId ? "Save changes" : "Add shortcut"}
      </button>
      <div className="scroll-list">
        {shortcuts.map((shortcut) => (
          <div className="list-item multi-actions" key={shortcut.id}>
            <button className="list-copy" type="button" onClick={() => runShortcut(shortcut, toast)}>
              <strong>{shortcut.name}</strong>
              <span>{shortcut.hotkey} · {shortcut.actionType} · {shortcut.target}</span>
            </button>
            <button className={shortcut.enabled ? "icon-button active-icon" : "icon-button"} type="button" aria-label="Enable shortcut" onClick={() => setShortcuts((current) => current.map((item) => item.id === shortcut.id ? { ...item, enabled: !item.enabled } : item))}>
              <Check size={15} aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Edit shortcut" onClick={() => startEdit(shortcut)}>
              <SlidersHorizontal size={15} aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Delete shortcut" onClick={() => setShortcuts((current) => current.filter((item) => item.id !== shortcut.id))}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {/* TODO: register these shortcuts globally through Tauri's global shortcut plugin. */}
    </ToolFrame>
  );
}

async function runShortcut(shortcut: SpecialShortcut, toast: (title: string, options?: { message?: string; tone?: "success" | "info" | "error" }) => void) {
  try {
    if (shortcut.actionType === "tool") {
      window.dispatchEvent(new CustomEvent("quality-life-open-tool", { detail: shortcut.target }));
      return;
    }
    if (shortcut.actionType === "chain") {
      await runActionChain(shortcut.target);
      toast("Action chain ran", { tone: "success", message: shortcut.name });
      return;
    }
    await openExternalTarget(shortcut.actionType, shortcut.target);
  } catch (error) {
    toast("Shortcut failed", { tone: "error", message: error instanceof Error ? error.message : "Could not run shortcut" });
  }
}

async function runActionChain(value: string) {
  const steps = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const step of steps) {
    if (step.startsWith("tool:")) {
      window.dispatchEvent(new CustomEvent("quality-life-open-tool", { detail: step.slice(5).trim() }));
    } else if (step.startsWith("url:")) {
      await openExternalTarget("website", step.slice(4).trim());
    } else if (step.startsWith("copy:")) {
      await copyText(step.slice(5).trim());
    }
  }
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
    <div className="action-strip compact-actions">
      <button className="primary-action" type="button" onClick={onToggle}>{running ? "Pause" : "Start"}</button>
      <button className="secondary-action" type="button" onClick={onReset}>
        <RotateCcw size={16} aria-hidden="true" />
        Reset
      </button>
    </div>
  );
}

function fileToIndexedFile(file: File, index: number): IndexedFile {
  const fileWithPath = file as File & { webkitRelativePath?: string };
  const path = fileWithPath.webkitRelativePath || file.name;
  const lastSlash = path.lastIndexOf("/");
  const name = file.name;
  const extension = name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : "";
  return {
    id: `${path}-${file.size}-${file.lastModified}-${index}`,
    name,
    extension,
    folder: lastSlash >= 0 ? path.slice(0, lastSlash) : "",
    path,
    size: file.size,
    type: file.type || "unknown",
    lastModified: file.lastModified,
    file
  };
}

function fileKind(file: IndexedFile) {
  if (file.type.startsWith("image/")) return "image";
  if (["pdf", "doc", "docx", "txt", "md", "rtf"].includes(file.extension)) return "document";
  if (["zip", "rar", "7z", "tar", "gz"].includes(file.extension)) return "archive";
  if (["js", "ts", "tsx", "jsx", "rs", "py", "json", "css", "html", "xml", "yaml", "yml"].includes(file.extension)) return "code";
  return "other";
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function hashFile(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stopStreams(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function cleanUrl(value: string) {
  try {
    const url = new URL(value.trim());
    [...url.searchParams.keys()].forEach((key) => {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm_") || trackingParams.has(lower)) {
        url.searchParams.delete(key);
      }
    });
    return url.toString();
  } catch {
    return value;
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim();
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    if (max === g) h = (b - r) / d + 2;
    if (max === b) h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

async function renderAnnotatedImage(imageUrl: string, annotation: string, redaction: boolean) {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return imageUrl;
  context.drawImage(image, 0, 0);
  if (redaction) {
    context.fillStyle = "rgba(0, 0, 0, 0.86)";
    context.fillRect(canvas.width * 0.08, canvas.height * 0.12, canvas.width * 0.34, canvas.height * 0.12);
  }
  if (annotation.trim()) {
    context.fillStyle = "rgba(16, 17, 18, 0.82)";
    context.fillRect(0, canvas.height - 56, canvas.width, 56);
    context.fillStyle = "#f5f4f1";
    context.font = "24px sans-serif";
    context.fillText(annotation, 24, canvas.height - 20);
  }
  return canvas.toDataURL("image/png");
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function groupFilesForCleanup(files: IndexedFile[]) {
  return files.reduce<Record<string, IndexedFile[]>>((groups, file) => {
    const group =
      file.type.startsWith("image/") && /screenshot|screen shot/i.test(file.name) ? "Screenshots" :
      file.type.startsWith("image/") ? "Images" :
      ["zip", "rar", "7z", "tar", "gz"].includes(file.extension) ? "Archives" :
      ["pdf", "doc", "docx", "txt", "md", "rtf"].includes(file.extension) ? "Documents" :
      "Other";
    groups[group] = [...(groups[group] ?? []), file];
    return groups;
  }, {});
}

function matchesDate(timestamp: number, filter: string, customStart: string, customEnd: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (filter === "today") return timestamp >= startOfToday;
  if (filter === "yesterday") return timestamp >= startOfToday - 86_400_000 && timestamp < startOfToday;
  if (filter === "last-7-days") return timestamp >= Date.now() - 7 * 86_400_000;
  if (filter === "last-30-days") return timestamp >= Date.now() - 30 * 86_400_000;
  if (filter === "custom") {
    const start = customStart ? new Date(customStart).getTime() : 0;
    const end = customEnd ? new Date(customEnd).getTime() + 86_399_999 : Number.POSITIVE_INFINITY;
    return timestamp >= start && timestamp <= end;
  }
  return true;
}

function normalizeHotkey(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function hotkeyFromEvent(event: KeyboardEvent) {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Cmd");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key.replace(" ", "Space");
  if (!["Control", "Meta", "Alt", "Shift"].includes(event.key)) {
    parts.push(key);
  }
  return parts.join(" + ");
}

export function UrlCleanerTool() {
  const [input, setInput] = useState("https://example.com/?utm_source=newsletter&fbclid=abc&id=42");
  const output = cleanUrl(input);
  return (
    <ToolFrame footer={<Status active label="Tracking parameters removed locally" />}>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={5} />
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
      }}>
        <Copy size={16} aria-hidden="true" />
        Copy cleaned URL
      </button>
    </ToolFrame>
  );
}
