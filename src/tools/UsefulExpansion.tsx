import {
  AlarmClock,
  Clock,
  ClipboardList,
  Copy,
  Download,
  FileJson,
  Hash,
  Image,
  Keyboard,
  MousePointerClick,
  Palette,
  QrCode,
  ScanText,
  Search,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useInterval } from "../hooks/useInterval";
import { copyText } from "../lib/clipboard";
import type { ToolProps } from "../types/tools";

type AnyObject = Record<string, unknown>;

export function UsefulExpansion({ toolId }: ToolProps) {
  if (toolId === "clipboard-duplicate-remover") return <ClipboardDuplicateRemover />;
  if (toolId === "text-cleaner") return <TextCleaner />;
  if (toolId === "url-encoder-decoder") return <UrlEncoderDecoder />;
  if (toolId === "json-validator" || toolId === "json-minifier") return <JsonWorkbench toolId={toolId} />;
  if (toolId === "contrast-checker") return <ContrastChecker />;
  if (toolId === "file-hash-generator") return <FileHashGenerator />;
  if (toolId === "image-resizer" || toolId === "image-converter" || toolId === "image-compressor") return <ImageWorkbench toolId={toolId} />;
  if (toolId === "keyboard-tester") return <KeyboardTester />;
  if (toolId === "mouse-tester") return <MouseTester />;
  if (toolId === "uptime-tracker") return <UptimeTracker />;
  if (toolId === "wifi-qr-generator") return <WifiQrGenerator />;
  if (toolId === "qr-scanner-placeholder") return <QrScannerPlaceholder />;
  if (toolId === "recent-files-viewer" || toolId === "download-folder-cleaner" || toolId === "screenshot-organizer" || toolId === "desktop-cleanup-helper") {
    return <UsefulPlaceholder toolId={toolId} />;
  }
  if (toolId === "hotkey-launcher" || toolId === "quick-action-chains" || toolId === "scheduled-reminders" || toolId === "repeating-notifications") {
    return <AutomationPlaceholder toolId={toolId} />;
  }

  return (
    <ToolFrame footer={<Footer label="No additional useful tool was selected." />}>
      <UsefulPlaceholder toolId={toolId} />
    </ToolFrame>
  );
}

function BadgeRow({ values }: { values: string[] }) {
  return (
    <div className="trust-badge-row">
      {values.map((value) => (
        <span className="tool-status offline" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}

function Footer({ label }: { label: string }) {
  return (
    <div className="status-row">
      <span className="status-dot on" />
      <span>{label}</span>
    </div>
  );
}

function UsefulPlaceholder({ toolId }: { toolId: string }) {
  const titleMap: Record<string, string> = {
    "recent-files-viewer": "Recent Files Viewer",
    "download-folder-cleaner": "Download Folder Cleaner",
    "screenshot-organizer": "Screenshot Organizer",
    "desktop-cleanup-helper": "Desktop Cleanup Helper"
  };

  const noteMap: Record<string, string> = {
    "recent-files-viewer": "TODO: connect native recent-file history so users can jump back to what they opened.",
    "download-folder-cleaner": "TODO: connect native download-folder detection and safe cleanup actions.",
    "screenshot-organizer": "TODO: connect local screenshot folders and grouping rules.",
    "desktop-cleanup-helper": "TODO: connect desktop file grouping and one-click cleanup suggestions."
  };

  return (
    <ToolFrame footer={<Footer label="Native integration needed" />}>
      <BadgeRow values={["Works offline", "Native integration needed"]} />
      <div className="placeholder-hero">
        <Sparkles size={22} aria-hidden="true" />
        <div>
          <strong>{titleMap[toolId] ?? toolId.replace(/-/g, " ")}</strong>
          <span>This is a calm placeholder for a practical OS-level tool.</span>
        </div>
      </div>
      <div className="native-note">
        <Search size={16} aria-hidden="true" />
        <code>{noteMap[toolId] ?? "TODO: connect a safe native implementation."}</code>
      </div>
      <div className="trust-fact">
        <X size={16} aria-hidden="true" />
        <span>No automatic deletion, hidden uploads, or surprise actions.</span>
      </div>
    </ToolFrame>
  );
}

function ClipboardDuplicateRemover() {
  const [input, setInput] = useState("apples\nbananas\napples\noranges\nbananas");
  const output = useMemo(() => dedupeLines(input), [input]);
  return (
    <ToolFrame footer={<Footer label="Duplicate lines removed locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} placeholder="Paste text with duplicates..." />
      <pre>{output}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => void copyText(output)}>
        <Copy size={16} aria-hidden="true" />
        Copy result
      </button>
    </ToolFrame>
  );
}

function TextCleaner() {
  const [input, setInput] = useState("A  quick   example.\n\n\nAnother   line.");
  const output = useMemo(() => cleanText(input), [input]);
  return (
    <ToolFrame footer={<Footer label="Whitespace normalized locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} placeholder="Paste messy text..." />
      <pre>{output}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => void copyText(output)}>
        <Copy size={16} aria-hidden="true" />
        Copy cleaned text
      </button>
    </ToolFrame>
  );
}

function UrlEncoderDecoder() {
  const [input, setInput] = useState("Quality life tools");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const output = mode === "encode" ? encodeURIComponent(input) : safeDecodeURIComponent(input);
  return (
    <ToolFrame footer={<Footer label="URL text transformed locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="filter-row">
        {(["encode", "decode"] as const).map((item) => (
          <button className={mode === item ? "chip selected" : "chip"} key={item} type="button" onClick={() => setMode(item)}>
            {item}
          </button>
        ))}
      </div>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={5} placeholder="Paste a URL or plain text..." />
      <pre>{output}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => void copyText(output)}>
        <Copy size={16} aria-hidden="true" />
        Copy result
      </button>
    </ToolFrame>
  );
}

function JsonWorkbench({ toolId }: { toolId: string }) {
  const [input, setInput] = useState('{"name":"Quality life","free":true}');
  const result = useMemo(() => {
    try {
      const parsed = JSON.parse(input) as AnyObject;
      return { error: null as string | null, output: toolId === "json-minifier" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2) };
    } catch (value) {
      return { error: value instanceof Error ? value.message : "Invalid JSON", output: "" };
    }
  }, [input, toolId]);

  return (
    <ToolFrame footer={<Footer label={result.error ? "JSON has errors" : "JSON checked locally"} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} placeholder="Paste JSON..." />
      {result.error ? <div className="danger-note native-note"><AlertText /></div> : <pre>{result.output}</pre>}
      {!result.error && (
        <button className="secondary-action fit-action" type="button" onClick={() => void copyText(result.output)}>
          <Copy size={16} aria-hidden="true" />
          Copy result
        </button>
      )}
    </ToolFrame>
  );
}

function AlertText() {
  return (
    <>
      <FileJson size={16} aria-hidden="true" />
      <code>Invalid JSON. Check commas, quotes, and brackets.</code>
    </>
  );
}

function ContrastChecker() {
  const [foreground, setForeground] = useState("#f5f7fa");
  const [background, setBackground] = useState("#101217");
  const contrast = useMemo(() => getContrastRatio(foreground, background), [foreground, background]);
  const verdict = contrast >= 7 ? "Excellent" : contrast >= 4.5 ? "Good" : contrast >= 3 ? "Borderline" : "Low";
  return (
    <ToolFrame footer={<Footer label={`Contrast ${contrast.toFixed(2)}:1`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="tool-grid two">
        <label className="field">
          <span>Text color</span>
          <input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} />
        </label>
        <label className="field">
          <span>Background color</span>
          <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
        </label>
      </div>
      <div className="color-tile wide-tile" style={{ background: background, color: foreground, display: "grid", placeItems: "center", fontWeight: 800 }}>
        Aa
      </div>
      <div className="privacy-status live">
        <Palette size={22} aria-hidden="true" />
        <strong>{verdict}</strong>
      </div>
    </ToolFrame>
  );
}

function FileHashGenerator() {
  const [rows, setRows] = useState<Array<{ name: string; size: number; hash: string }>>([]);
  const onFiles = async (files: FileList | null) => {
    const next = await Promise.all(Array.from(files ?? []).map(async (file) => ({
      name: file.name,
      size: file.size,
      hash: await sha256(file)
    })));
    setRows(next);
  };

  return (
    <ToolFrame footer={<Footer label="Hashes generated locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input type="file" multiple onChange={(event) => void onFiles(event.target.files)} />
      <div className="scroll-list">
        {rows.map((row) => (
          <div className="list-item" key={`${row.name}-${row.hash}`}>
            <button className="list-copy" type="button" onClick={() => void copyText(row.hash)}>
              <strong>{row.name}</strong>
              <span>{formatBytes(row.size)} · SHA-256</span>
            </button>
            <button className="icon-button" type="button" aria-label="Copy hash" onClick={() => void copyText(row.hash)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToolFrame>
  );
}

function ImageWorkbench({ toolId }: { toolId: string }) {
  const mode = toolId === "image-resizer" ? "resize" : toolId === "image-converter" ? "convert" : "compress";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [output, setOutput] = useState("");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState(82);

  useEffect(() => {
    if (!file) {
      setPreview("");
      setOutput("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    let cancelled = false;
    if (!preview) return;
    void renderImage(preview, { width, height, format, quality, mode }).then((result) => {
      if (!cancelled) setOutput(result);
    });
    return () => {
      cancelled = true;
    };
  }, [preview, width, height, format, quality, mode]);

  const title =
    mode === "resize" ? "Resize image" : mode === "convert" ? "Convert format" : "Compress image";

  return (
    <ToolFrame footer={<Footer label="Image processing happens locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      {preview && <img className="screenshot-preview" src={preview} alt="Selected image preview" />}
      <div className="tool-grid two">
        {mode === "resize" && (
          <label className="field">
            <span>Width</span>
            <input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value) || 1)} />
          </label>
        )}
        {mode === "resize" && (
          <label className="field">
            <span>Height</span>
            <input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value) || 1)} />
          </label>
        )}
        {mode !== "resize" && (
          <label className="field">
            <span>Format</span>
            <select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
        )}
        {mode === "compress" && (
          <label className="field">
            <span>Quality {quality}%</span>
            <input type="range" min={10} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value) || 10)} />
          </label>
        )}
      </div>
      <div className="native-note">
        <Image size={16} aria-hidden="true" />
        <code>{title}. Output is a local data URL ready for download.</code>
      </div>
      {output && <pre>{output.slice(0, 2200)}</pre>}
      {output && (
        <div className="action-strip compact-actions">
          <a className="secondary-action link-button" href={output} download={`quality-life-${mode}.png`}>
            <Download size={16} aria-hidden="true" />
            Download
          </a>
          <button className="secondary-action" type="button" onClick={() => void copyText(output)}>
            <Copy size={16} aria-hidden="true" />
            Copy data URL
          </button>
        </div>
      )}
    </ToolFrame>
  );
}

function KeyboardTester() {
  const [keys, setKeys] = useState<string[]>([]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      setKeys((current) => [event.key, ...current.filter((item) => item !== event.key)].slice(0, 8));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <ToolFrame footer={<Footer label="Keyboard input shown locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="privacy-status live">
        <Keyboard size={24} aria-hidden="true" />
        <div>
          <strong>Press keys to test</strong>
          <span>{keys.length ? keys.join(" · ") : "Waiting for input..."}</span>
        </div>
      </div>
    </ToolFrame>
  );
}

function MouseTester() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState<string>("None");
  useEffect(() => {
    const move = (event: PointerEvent) => setPosition({ x: Math.round(event.clientX), y: Math.round(event.clientY) });
    const down = (event: PointerEvent) => setPressed(event.button === 0 ? "Left" : event.button === 1 ? "Middle" : "Right");
    const up = () => setPressed("None");
    window.addEventListener("pointermove", move as EventListener);
    window.addEventListener("pointerdown", down as EventListener);
    window.addEventListener("pointerup", up as EventListener);
    return () => {
      window.removeEventListener("pointermove", move as EventListener);
      window.removeEventListener("pointerdown", down as EventListener);
      window.removeEventListener("pointerup", up as EventListener);
    };
  }, []);

  return (
    <ToolFrame footer={<Footer label="Mouse input shown locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="privacy-status live">
        <MousePointerClick size={24} aria-hidden="true" />
        <div>
          <strong>Move or click the pointer</strong>
          <span>{`X ${position.x} · Y ${position.y} · Button ${pressed}`}</span>
        </div>
      </div>
    </ToolFrame>
  );
}

function UptimeTracker() {
  const startedAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), 1000);
  const elapsed = now - startedAt.current;
  return (
    <ToolFrame footer={<Footer label="Uptime tracked while this tab is open" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="timer-face">
        <Clock size={24} aria-hidden="true" />
        <strong>{formatDuration(elapsed)}</strong>
      </div>
    </ToolFrame>
  );
}

function AutomationPlaceholder({ toolId }: { toolId: string }) {
  const titleMap: Record<string, string> = {
    "hotkey-launcher": "Hotkey Launcher",
    "quick-action-chains": "Quick Action Chains",
    "scheduled-reminders": "Scheduled Reminders",
    "repeating-notifications": "Repeating Notifications"
  };

  const noteMap: Record<string, string> = {
    "hotkey-launcher": "TODO: connect native global hotkey registration through Tauri.",
    "quick-action-chains": "TODO: connect saved action chains to native desktop commands.",
    "scheduled-reminders": "TODO: connect desktop reminders and background scheduling.",
    "repeating-notifications": "TODO: connect persistent repeat notifications through native APIs."
  };

  return (
    <ToolFrame footer={<Footer label="Native integration needed" />}>
      <BadgeRow values={["Works offline", "Native integration needed"]} />
      <div className="placeholder-hero">
        <AlarmClock size={22} aria-hidden="true" />
        <div>
          <strong>{titleMap[toolId] ?? toolId.replace(/-/g, " ")}</strong>
          <span>Helpful, but it needs native hooks to do the desktop-level job properly.</span>
        </div>
      </div>
      <div className="native-note">
        <Wand2 size={16} aria-hidden="true" />
        <code>{noteMap[toolId] ?? "TODO: connect a safe native implementation."}</code>
      </div>
    </ToolFrame>
  );
}

function WifiQrGenerator() {
  const [ssid, setSsid] = useState("Quality life");
  const [password, setPassword] = useState("password123");
  const [security, setSecurity] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const payload = wifiPayload(ssid, password, security);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(payload || " ", { margin: 2, width: 420 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <ToolFrame footer={<Footer label="Wi-Fi QR generated locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="tool-grid two">
        <input value={ssid} onChange={(event) => setSsid(event.target.value)} placeholder="Wi-Fi name" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
      </div>
      <select value={security} onChange={(event) => setSecurity(event.target.value as typeof security)}>
        <option value="WPA">WPA/WPA2</option>
        <option value="WEP">WEP</option>
        <option value="nopass">No password</option>
      </select>
      <div className="qr-layout">
        <div className="qr-preview">{qrDataUrl ? <img alt="Wi-Fi QR code" src={qrDataUrl} /> : <QrCode size={96} aria-hidden="true" />}</div>
        <div className="stacked-actions">
          <pre>{payload}</pre>
          <button className="secondary-action fit-action" type="button" onClick={() => void copyText(payload)}>
            <Copy size={16} aria-hidden="true" />
            Copy Wi-Fi payload
          </button>
        </div>
      </div>
    </ToolFrame>
  );
}

function QrScannerPlaceholder() {
  return (
    <ToolFrame footer={<Footer label="Native camera or file integration needed" />}>
      <BadgeRow values={["Works offline", "Native integration needed"]} />
      <div className="placeholder-hero">
        <ScanText size={22} aria-hidden="true" />
        <div>
          <strong>QR Scanner</strong>
          <span>TODO: connect camera or image scanning through a native desktop integration.</span>
        </div>
      </div>
      <div className="native-note">
        <Search size={16} aria-hidden="true" />
        <code>For now this stays as a clear placeholder instead of pretending to scan.</code>
      </div>
    </ToolFrame>
  );
}

function dedupeLines(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .filter((line) => {
      const key = line.trim();
      if (!key) {
        return true;
      }
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .join("\n");
}

function cleanText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "Cannot decode text safely.";
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function sha256(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function renderImage(
  source: string,
  options: { width: number; height: number; format: "image/png" | "image/jpeg" | "image/webp"; quality: number; mode: "resize" | "convert" | "compress" }
) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const width = options.mode === "resize" ? Math.max(1, options.width) : image.naturalWidth || image.width;
  const height = options.mode === "resize" ? Math.max(1, options.height) : image.naturalHeight || image.height;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }
  context.drawImage(image, 0, 0, width, height);
  const format = options.mode === "convert" ? options.format : options.mode === "compress" ? options.format : "image/png";
  const quality = options.mode === "compress" ? options.quality / 100 : undefined;
  return canvas.toDataURL(format, quality);
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load"));
    image.src = url;
  });
}

function getContrastRatio(foreground: string, background: string) {
  const [r1, g1, b1] = hexToRgb(foreground).map(sRgbToLinear);
  const [r2, g2, b2] = hexToRgb(background).map(sRgbToLinear);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16) || 0;
  const green = Number.parseInt(value.slice(2, 4), 16) || 0;
  const blue = Number.parseInt(value.slice(4, 6), 16) || 0;
  return [red, green, blue];
}

function sRgbToLinear(value: number) {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(red: number, green: number, blue: number) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function wifiPayload(ssid: string, password: string, security: "WPA" | "WEP" | "nopass") {
  const safeSsid = ssid.replace(/([\\;,:"])/g, "\\$1");
  const safePassword = password.replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${security};S:${safeSsid};P:${safePassword};;`;
}

function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
