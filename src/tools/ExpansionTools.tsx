import {
  AlertTriangle,
  Archive,
  BookOpen,
  Check,
  Clipboard,
  Copy,
  Dice5,
  Download,
  Eraser,
  Eye,
  FileSearch,
  FolderSearch,
  Hash,
  Image,
  KeyRound,
  Link,
  ListChecks,
  Lock,
  Palette,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
  Wand2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { InternetAccessGate } from "../components/InternetAccessGate";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import { useInterval } from "../hooks/useInterval";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { generateOpenAiText, openAiConfigured } from "../lib/ai";
import { copyText, readClipboardText } from "../lib/clipboard";
import { clearHistoryEntries, writeHistorySettings } from "../lib/history";
import type { ToolProps } from "../types/tools";

type FileRow = {
  id: string;
  name: string;
  size: number;
  extension: string;
  modifiedAt: number;
  createdAt: string;
  type: string;
  path: string;
  file: File;
};

type VaultEntry = {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  tags: string[];
  updatedAt: number;
};

type EncryptedVault = {
  version: 1;
  salt: string;
  iv: string;
  data: string;
};

const suspiciousExtensions = new Set(["exe", "msi", "bat", "cmd", "scr", "ps1", "vbs", "js", "jar", "dll"]);
const trackerParams = new Set(["fbclid", "gclid", "msclkid", "ref"]);
const directoryProps = { webkitdirectory: "", directory: "" } as Record<string, string>;

export function ExpansionTool({ toolId }: ToolProps) {
  if (securityIds.has(toolId)) return <SecurityPrivacyTool toolId={toolId} />;
  if (aiIds.has(toolId)) return <AiTool toolId={toolId} />;
  if (offlineMediaIds.has(toolId)) return <OfflineMediaTool toolId={toolId} />;
  if (funExpansionIds.has(toolId)) return <FunExpansionTool toolId={toolId} />;
  return <UsefulTool toolId={toolId} />;
}

const securityIds = new Set([
  "suspicious-file-scanner",
  "fake-download-checker",
  "checksum-verifier",
  "data-leak-guard",
  "privacy-file-inspector",
  "extension-safety-checklist",
  "startup-risk-viewer",
  "process-risk-viewer",
  "command-safety-checker",
  "security-link-tracker-remover",
  "phishing-link-preview",
  "sensitive-folder-watchlist",
  "local-password-vault",
  "security-checklist",
  "privacy-offline-settings"
]);

const aiIds = new Set([
  "prompt-maker",
  "prompt-improver",
  "natural-rewriter",
  "ai-writing-heuristic",
  "tone-changer",
  "explain-like-im-five",
  "summary-maker",
  "title-generator",
  "idea-expander",
  "name-generator"
]);

const offlineMediaIds = new Set([
  "video-save-offline-viewer",
  "offline-article-saver",
  "local-media-library",
  "link-save-queue"
]);

const funExpansionIds = new Set([
  "card-deck",
  "poker-hand-dealer",
  "blackjack-counter",
  "solitaire-cards",
  "tarot-random-cards",
  "truth-or-dare",
  "would-you-rather",
  "random-party-question",
  "dice-bag",
  "spin-wheel",
  "bingo-card-generator",
  "tiny-drawing-canvas",
  "pixel-art-maker",
  "reaction-buttons",
  "random-challenge-generator"
]);

function SecurityPrivacyTool({ toolId }: ToolProps) {
  if (toolId === "suspicious-file-scanner") return <SuspiciousFileScanner />;
  if (toolId === "fake-download-checker") return <FakeDownloadChecker />;
  if (toolId === "checksum-verifier") return <ChecksumVerifier />;
  if (toolId === "data-leak-guard") return <DataLeakGuard />;
  if (toolId === "privacy-file-inspector") return <PrivacyFileInspector />;
  if (toolId === "extension-safety-checklist") return <ExtensionSafetyChecklist />;
  if (toolId === "startup-risk-viewer") return <StartupRiskViewer />;
  if (toolId === "process-risk-viewer") return <ProcessRiskViewer />;
  if (toolId === "command-safety-checker") return <CommandSafetyChecker />;
  if (toolId === "security-link-tracker-remover") return <TrackerRemover />;
  if (toolId === "phishing-link-preview") return <PhishingPreview />;
  if (toolId === "sensitive-folder-watchlist") return <SensitiveFolderWatchlist />;
  if (toolId === "local-password-vault") return <LocalPasswordVault />;
  if (toolId === "privacy-offline-settings") return <PrivacyOfflineSettings />;
  return <SecurityChecklist toolId={toolId} />;
}

function SuspiciousFileScanner() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const rows = useMemo(() => files.map((file) => ({ file, findings: fileFindings(file) })), [files]);
  return (
    <ToolFrame footer={<Status active label={`${rows.length} files checked locally`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input type="file" multiple {...directoryProps} onChange={(event) => setFiles(readFiles(event))} />
      <div className="scroll-list">
        {rows.map(({ file, findings }) => (
          <section className="utility-card compact-card" key={file.id}>
            <div className="utility-title">
              <ShieldAlert size={17} />
              <strong>{file.name}</strong>
            </div>
            <span className="muted-line">
              .{file.extension || "none"} | {formatBytes(file.size)} | created {file.createdAt} | modified {new Date(file.modifiedAt).toLocaleString()}
            </span>
            <FindingList findings={findings} />
          </section>
        ))}
        {rows.length === 0 && <EmptyHint text="Pick files or a folder. Nothing is uploaded or deleted." />}
      </div>
      {/* TODO: wire native file metadata for true created dates and code-signature checks. */}
    </ToolFrame>
  );
}

function FakeDownloadChecker() {
  const [url, setUrl] = useState("https://example.com/download/app-setup.exe");
  const [expected, setExpected] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [actual, setActual] = useState("");
  const domainInfo = parseDomain(url);
  const warnings = downloadWarnings(url);
  const compare = expected && actual ? normalizeHash(expected) === normalizeHash(actual) : null;

  const verify = async (selected?: File) => {
    const nextFile = selected ?? file;
    if (!nextFile) return;
    setActual(await shaHash(nextFile, "SHA-256"));
  };

  return (
    <ToolFrame footer={<Status active label="Manual URL and checksum check" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={url} onChange={(event) => setUrl(event.target.value)} rows={3} />
      <div className="utility-card compact-card">
        <strong>Real domain: {domainInfo.domain || "Invalid URL"}</strong>
        <span className="muted-line">{domainInfo.protocol}</span>
      </div>
      <FindingList findings={warnings} />
      <section className="utility-card compact-card">
        <div className="utility-title"><ListChecks size={17} /><strong>Official source checklist</strong></div>
        {["Typed the address yourself", "Domain matches the vendor exactly", "HTTPS is enabled", "Checksum is published by the vendor", "No fake urgent popups pushed you here"].map((item) => (
          <label className="toggle-card" key={item}><input type="checkbox" /><span>{item}</span></label>
        ))}
      </section>
      <div className="tool-grid two">
        <input value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="Expected SHA256..." />
        <input type="file" onChange={(event) => {
          const next = event.target.files?.[0] ?? null;
          setFile(next);
          if (next) void verify(next);
        }} />
      </div>
      {actual && <pre>{`Actual SHA256:\n${actual}\n\n${compare === null ? "Paste expected hash to compare." : compare ? "MATCH" : "MISMATCH"}`}</pre>}
    </ToolFrame>
  );
}

function ChecksumVerifier() {
  const [file, setFile] = useState<File | null>(null);
  const [expected, setExpected] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const compareHash = expected ? Object.values(hashes).some((hash) => normalizeHash(hash) === normalizeHash(expected)) : false;

  const onFile = async (next?: File) => {
    if (!next) return;
    setFile(next);
    const [sha256, sha1, md5] = await Promise.all([
      shaHash(next, "SHA-256"),
      shaHash(next, "SHA-1"),
      md5File(next)
    ]);
    setHashes({ SHA256: sha256, SHA1: sha1, MD5: md5 });
  };

  return (
    <ToolFrame footer={<Status active={Boolean(file)} label={file ? file.name : "Choose a file"} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input type="file" onChange={(event) => onFile(event.target.files?.[0])} />
      <input value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="Expected SHA256, SHA1, or MD5..." />
      {Object.entries(hashes).map(([name, value]) => (
        <div className="list-item" key={name}>
          <button className="list-copy" type="button" onClick={() => copyText(value)}>
            <strong>{name}</strong>
            <span>{value}</span>
          </button>
          <button className="icon-button" type="button" aria-label="Copy hash" onClick={() => copyText(value)}><Copy size={15} /></button>
        </div>
      ))}
      {expected && <div className={compareHash ? "privacy-status live" : "privacy-status danger-panel"}><Hash size={26} /><strong>{compareHash ? "Checksum matches" : "Checksum mismatch"}</strong></div>}
    </ToolFrame>
  );
}

function DataLeakGuard() {
  const [text, setText] = useState("");
  const [watching, setWatching] = useState(false);
  const [autoClear, setAutoClear] = useState(0);
  const findings = secretFindings(text);
  const { toast } = useToast();

  useInterval(async () => {
    const next = await readClipboardText();
    if (next !== text) setText(next);
  }, watching ? 1500 : null);

  useInterval(() => {
    if (autoClear > 0) void copyText("");
  }, autoClear > 0 ? autoClear * 1000 : null);

  return (
    <ToolFrame footer={<Status active={watching} label={watching ? "Clipboard monitor running locally" : "Manual scan"} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} placeholder="Paste clipboard text or enable monitor..." />
      <div className="action-strip compact-actions">
        <button className="secondary-action" type="button" onClick={async () => setText(await readClipboardText())}><Clipboard size={16} />Read clipboard</button>
        <button className={watching ? "danger-action" : "primary-action"} type="button" onClick={() => setWatching((value) => !value)}>{watching ? "Stop monitor" : "Monitor clipboard"}</button>
        <button className="danger-action" type="button" onClick={async () => { await copyText(""); toast("Clipboard cleared", { tone: "success" }); }}><Trash2 size={16} />Clear clipboard</button>
      </div>
      <label className="field"><span>Auto-clear clipboard timer, seconds</span><input type="number" min={0} value={autoClear} onChange={(event) => setAutoClear(Number(event.target.value) || 0)} /></label>
      <FindingList findings={findings.length ? findings : ["No obvious secret patterns found."]} />
    </ToolFrame>
  );
}

function PrivacyFileInspector() {
  const [rows, setRows] = useState<Array<FileRow & { imageUrl?: string; metadata: string[] }>>([]);
  const { toast } = useToast();

  const inspect = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextRows = await Promise.all(readFiles(event).map(async (file) => ({
      ...file,
      imageUrl: file.type.startsWith("image/") ? URL.createObjectURL(file.file) : undefined,
      metadata: await fileMetadata(file.file)
    })));
    setRows(nextRows);
  };

  return (
    <ToolFrame footer={<Status active label={`${rows.length} files inspected`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={inspect} />
      <div className="scroll-list">
        {rows.map((row) => (
          <section className="utility-card compact-card" key={row.id}>
            <div className="utility-title"><Image size={17} /><strong>{row.name}</strong></div>
            <FindingList findings={row.metadata} />
            {row.imageUrl && (
              <button className="secondary-action fit-action" type="button" onClick={() => stripImageMetadata(row.file, toast)}>
                <Eraser size={16} />Remove EXIF by re-saving image
              </button>
            )}
          </section>
        ))}
      </div>
      {/* TODO: add PDF/doc author/title metadata removal through native document libraries. */}
    </ToolFrame>
  );
}

function ExtensionSafetyChecklist() {
  const [permissions, setPermissions] = useState("Read and change all your data on all websites\nManage your downloads\nRead clipboard");
  const findings = extensionRisk(permissions);
  const risk = findings.length >= 3 ? "High" : findings.length >= 1 ? "Medium" : "Low";
  return (
    <ToolFrame footer={<Status active label={`${risk} permission risk`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={permissions} onChange={(event) => setPermissions(event.target.value)} rows={7} />
      <div className="privacy-status"><Shield size={26} /><strong>Risk level: {risk}</strong></div>
      <FindingList findings={findings.length ? findings : ["No high-risk permission phrases detected."]} />
      <section className="utility-card compact-card">
        <strong>Review checklist</strong>
        {["Do you know the publisher?", "Does it need all websites?", "Does it modify page data?", "Does it read clipboard or downloads?", "Can you disable it when not needed?"].map((item) => (
          <label className="toggle-card" key={item}><input type="checkbox" /><span>{item}</span></label>
        ))}
      </section>
      {/* TODO: add browser extension audit imports from local browser profiles with explicit user permission. */}
    </ToolFrame>
  );
}

function StartupRiskViewer() {
  return <ManualRiskList toolId="startup-risk-viewer" title="Startup Risk Viewer" fields={["App", "Path", "Publisher", "Impact"]} riskyWords={["temp", "downloads", "random", "unknown"]} todo="TODO: connect native startup item scanning and publisher verification." />;
}

function ProcessRiskViewer() {
  return <ManualRiskList toolId="process-risk-viewer" title="Process Risk Viewer" fields={["Process", "Path", "Publisher", "CPU"]} riskyWords={["temp", "downloads", "appdata", "random"]} todo="TODO: connect native process list scanning and signature checks." />;
}

function CommandSafetyChecker() {
  const [command, setCommand] = useState("curl https://example.com/install.sh | sh");
  const findings = commandWarnings(command);
  return (
    <ToolFrame footer={<Status active label="Commands are analyzed only, never executed" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={command} onChange={(event) => setCommand(event.target.value)} rows={7} />
      <FindingList findings={findings.length ? findings : ["No obvious risky action found. Still verify commands from strangers carefully."]} />
      <div className="native-note"><Terminal size={16} /><code>This tool never runs terminal commands.</code></div>
    </ToolFrame>
  );
}

function TrackerRemover() {
  const [input, setInput] = useState("https://example.com/page?utm_source=x&utm_medium=y&fbclid=abc&id=42");
  const cleaned = cleanTracking(input);
  const impersonation = impersonationCheck(input);
  return (
    <ToolFrame footer={<Status active label="Tracking and lookalike checks run locally" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={4} />
      <section className="utility-card compact-card">
        <div className="utility-title">
          <ShieldAlert size={17} />
          <strong>Impersonation check</strong>
        </div>
        <p className="muted-line">{impersonation.summary}</p>
        <FindingList findings={impersonation.findings} />
      </section>
      <pre>{`Before:\n${input}\n\nAfter:\n${cleaned}`}</pre>
      <button className="secondary-action fit-action" type="button" onClick={() => copyText(cleaned)}><Copy size={16} />Copy cleaned link</button>
    </ToolFrame>
  );
}

function PhishingPreview() {
  const [display, setDisplay] = useState("https://bank.example.com");
  const [actual, setActual] = useState("https://bank.example.com.login-check.example.net/session");
  const parsed = parseDomain(actual);
  const warnings = phishingWarnings(display, actual);
  return (
    <ToolFrame footer={<Status active label="Preview only. Links never open automatically." />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <label className="field"><span>Text shown to you</span><input value={display} onChange={(event) => setDisplay(event.target.value)} /></label>
      <label className="field"><span>Real link target</span><input value={actual} onChange={(event) => setActual(event.target.value)} /></label>
      <pre>{decodeURIComponent(actual)}</pre>
      <div className="privacy-status"><Link size={26} /><strong>Domain: {parsed.domain || "Invalid URL"}</strong></div>
      <FindingList findings={warnings} />
      {/* TODO: add IDNA/punycode homograph detection via a small local parser. */}
    </ToolFrame>
  );
}

function SensitiveFolderWatchlist() {
  const [folders, setFolders] = useLocalStorage<Array<{ id: string; name: string; sensitivity: string }>>("quality-life:sensitive-folders", []);
  const [name, setName] = useState("");
  return (
    <ToolFrame footer={<Status active label={`${folders.length} folders in watchlist`} />}>
      <BadgeRow values={["Works offline", "Local only", "Native integration needed"]} />
      <div className="action-strip">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Folder name or path..." />
        <button className="primary-action" type="button" onClick={() => name.trim() && setFolders((items) => [{ id: crypto.randomUUID(), name, sensitivity: "Important" }, ...items])}><Plus size={16} />Add</button>
      </div>
      <input type="file" multiple {...directoryProps} onChange={(event) => {
        const first = readFiles(event)[0];
        if (first) setFolders((items) => [{ id: crypto.randomUUID(), name: first.path.split("/")[0] || first.name, sensitivity: "Important" }, ...items]);
      }} />
      <div className="scroll-list">
        {folders.map((folder) => (
          <div className="list-item" key={folder.id}>
            <button className="list-copy" type="button"><strong>{folder.name}</strong><span>Alert rule: warn if many files change quickly</span></button>
            <button className="icon-button" type="button" aria-label="Remove folder" onClick={() => setFolders((items) => items.filter((item) => item.id !== folder.id))}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      {/* TODO: add local native file watcher and burst-change ransomware-style alerts. */}
    </ToolFrame>
  );
}

function LocalPasswordVault() {
  const [stored, setStored] = useLocalStorage<EncryptedVault | null>("quality-life:encrypted-vault", null);
  const [master, setMaster] = useState("");
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Omit<VaultEntry, "id" | "updatedAt">>({ title: "", username: "", password: "", url: "", notes: "", tags: [] });
  const [lastActive, setLastActive] = useState(Date.now());
  const { toast } = useToast();
  const visible = entries.filter((entry) => `${entry.title} ${entry.username} ${entry.url} ${entry.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));

  const saveVault = async (nextEntries: VaultEntry[], existingKey = key) => {
    if (!existingKey) return;
    const next = await encryptVault(nextEntries, existingKey, stored?.salt);
    setStored(next);
    setEntries(nextEntries);
  };

  const unlock = async () => {
    try {
      if (!stored) {
        const salt = randomBytes(16);
        const nextKey = await deriveVaultKey(master, salt);
        const nextStored = await encryptVault([], nextKey, bytesToBase64(salt));
        setStored(nextStored);
        setKey(nextKey);
        setEntries([]);
      } else {
        const nextKey = await deriveVaultKey(master, base64ToBytes(stored.salt));
        const decrypted = await decryptVault(stored, nextKey);
        setKey(nextKey);
        setEntries(decrypted);
      }
      setMaster("");
      setLastActive(Date.now());
      toast("Vault unlocked", { tone: "success" });
    } catch {
      toast("Vault unlock failed", { tone: "error", message: "Wrong master password or damaged vault." });
    }
  };

  useInterval(() => {
    if (key && Date.now() - lastActive > 5 * 60_000) {
      setKey(null);
      setEntries([]);
      toast("Vault auto-locked", { tone: "info" });
    }
  }, key ? 10_000 : null);

  if (!key) {
    return (
      <ToolFrame footer={<Status active={false} label="Locked. Data is encrypted before saving." />}>
        <BadgeRow values={["Works offline", "Local only"]} />
        <div className="native-note"><Lock size={16} /><code>If you lose the master password, this vault cannot be recovered.</code></div>
        <input type="password" value={master} onChange={(event) => setMaster(event.target.value)} placeholder="Master password" />
        <button className="primary-action fit-action" type="button" onClick={unlock} disabled={master.length < 8}><KeyRound size={16} />Unlock or create vault</button>
        {stored && <textarea value={JSON.stringify(stored, null, 2)} onChange={(event) => {
          try { setStored(JSON.parse(event.target.value) as EncryptedVault); } catch { /* keep invalid import out */ }
        }} rows={8} placeholder="Paste encrypted vault backup here..." />}
      </ToolFrame>
    );
  }

  return (
    <ToolFrame footer={<Status active label={`${entries.length} encrypted entries`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vault..." onFocus={() => setLastActive(Date.now())} />
      <div className="tool-grid two">
        <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" />
        <input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} placeholder="Username" />
        <input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="URL" />
        <input value={draft.tags.join(", ")} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="Tags" />
      </div>
      <div className="action-strip">
        <input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} placeholder="Password" />
        <button className="secondary-action" type="button" onClick={() => setDraft({ ...draft, password: makePassword(20) })}>Generate</button>
      </div>
      <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={3} placeholder="Notes..." />
      <div className="action-strip compact-actions">
        <button className="primary-action" type="button" onClick={() => {
          const entry = { ...draft, id: crypto.randomUUID(), updatedAt: Date.now() };
          void saveVault([entry, ...entries]);
          setDraft({ title: "", username: "", password: "", url: "", notes: "", tags: [] });
        }} disabled={!draft.title || !draft.password}><Save size={16} />Save entry</button>
        <button className="secondary-action" type="button" onClick={() => copyText(JSON.stringify(stored, null, 2))}><Download size={16} />Copy encrypted export</button>
        <button className="danger-action" type="button" onClick={() => { setKey(null); setEntries([]); }}><Lock size={16} />Lock</button>
      </div>
      <div className="scroll-list">
        {visible.map((entry) => (
          <div className="list-item multi-actions" key={entry.id}>
            <button className="list-copy" type="button"><strong>{entry.title}</strong><span>{entry.username} | {entry.tags.join(", ")}</span></button>
            <button className="icon-button" type="button" aria-label="Copy password" onClick={() => {
              void copyText(entry.password);
              window.setTimeout(() => void copyText(""), 30_000);
              toast("Password copied for 30 seconds", { tone: "success" });
            }}><Copy size={15} /></button>
            <button className="icon-button" type="button" aria-label="Delete entry" onClick={() => void saveVault(entries.filter((item) => item.id !== entry.id))}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      {/* Security note: plaintext vault entries only live in React state after unlock; localStorage receives AES-GCM encrypted JSON only. */}
    </ToolFrame>
  );
}

function SecurityChecklist({ toolId }: ToolProps) {
  const defaults = ["Update OS", "Check startup apps", "Review browser extensions", "Clear clipboard", "Back up important files", "Verify downloads", "Remove unused apps"];
  const [items, setItems] = useLocalStorage(`${toolId}:items`, defaults.map((text) => ({ text, done: false })));
  return (
    <ToolFrame footer={<Status active label={`${items.filter((item) => item.done).length}/${items.length} complete`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      {items.map((item, index) => (
        <label className="toggle-card" key={item.text}>
          <input type="checkbox" checked={item.done} onChange={(event) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, done: event.target.checked } : entry))} />
          <span>{item.text}</span>
        </label>
      ))}
      <button className="secondary-action fit-action" type="button" onClick={() => setItems(defaults.map((text) => ({ text, done: false })))}><RefreshCcw size={16} />Reset checklist</button>
    </ToolFrame>
  );
}

function PrivacyOfflineSettings() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const snapshot = localStorageSnapshot();
  return (
    <ToolFrame footer={<Status active={settings.offlineMode} label={settings.offlineMode ? "Offline-first mode on" : "Offline-first mode off"} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="settings-grid">
        <section className="utility-card">
          <strong>Privacy controls</strong>
          {[
            ["offlineMode", "Offline mode"],
            ["blockExternalRequests", "Block all external requests"],
            ["askBeforeInternetAccess", "Ask before internet access"],
            ["historyTracking", "History tracking"],
            ["storeAiInputs", "Allow AI tools to store inputs"],
            ["mediaDownloads", "Allow media downloads"]
          ].map(([key, label]) => (
            <label className="toggle-card" key={key}>
              <input type="checkbox" checked={Boolean(settings[key as keyof typeof settings])} onChange={(event) => updateSettings({ [key]: event.target.checked } as Partial<typeof settings>)} />
              <span>{label}</span>
            </label>
          ))}
        </section>
        <section className="utility-card">
          <strong>Clipboard and exclusions</strong>
          <label className="field"><span>Auto-clear clipboard seconds</span><input type="number" min={0} value={settings.autoClearClipboardSeconds} onChange={(event) => updateSettings({ autoClearClipboardSeconds: Number(event.target.value) || 0 })} /></label>
          <textarea value={settings.excludedSources} onChange={(event) => updateSettings({ excludedSources: event.target.value })} rows={6} placeholder="Excluded folders, apps, or sites, one per line..." />
        </section>
        <section className="utility-card wide">
          <strong>Stored local data</strong>
          <pre>{snapshot}</pre>
          <div className="action-strip compact-actions">
            <button className="secondary-action" type="button" onClick={() => copyText(snapshot)}><Copy size={16} />Export all local data</button>
            <button className="danger-action" type="button" onClick={() => {
              [...Object.keys(localStorage)].filter((key) => key.startsWith("quality-life:")).forEach((key) => localStorage.removeItem(key));
              clearHistoryEntries();
              writeHistorySettings({ enabled: false, excludedSources: [], indexedKinds: [] });
              toast("Local Quality life data cleared", { tone: "success" });
            }}><Trash2 size={16} />Clear all local data</button>
          </div>
        </section>
        <section className="utility-card wide">
          <strong>Import local backup</strong>
          <ImportSnapshot />
        </section>
      </div>
    </ToolFrame>
  );
}

function ImportSnapshot() {
  const [text, setText] = useState("");
  const { toast } = useToast();
  return (
    <>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={7} placeholder="Paste a Quality life local data JSON backup..." />
      <button className="primary-action fit-action" type="button" onClick={() => {
        try {
          const parsed = JSON.parse(text) as Record<string, string>;
          Object.entries(parsed).forEach(([key, value]) => {
            if (key.startsWith("quality-life:")) localStorage.setItem(key, value);
          });
          toast("Local backup imported", { tone: "success" });
        } catch {
          toast("Import failed", { tone: "error", message: "Invalid JSON" });
        }
      }} disabled={!text.trim()}><Upload size={16} />Import</button>
    </>
  );
}

function AiTool({ toolId }: ToolProps) {
  const [input, setInput] = useState("I need help planning a small project.");
  const [mode, setMode] = useState("coding");
  const [output, setOutput] = useState(() => aiOutput(toolId, input, mode));
  const [busy, setBusy] = useState(false);
  const { settings } = useSettings();
  const modes = toolId === "prompt-maker" ? ["coding", "studying", "writing", "brainstorming", "debugging", "business", "image generation"] : ["casual", "professional", "simple", "friendly", "shorter", "clearer"];

  useEffect(() => {
    setOutput(aiOutput(toolId, input, mode));
  }, [input, mode, toolId]);

  const runRealAi = async () => {
    if (!openAiConfigured(settings)) {
      setOutput(aiOutput(toolId, input, mode));
      return;
    }
    try {
      setBusy(true);
      const generated = await generateOpenAiText({
        settings,
        systemPrompt: buildAiSystemPrompt(toolId, mode),
        userPrompt: buildAiUserPrompt(toolId, input, mode)
      });
      setOutput(generated);
    } catch (error) {
      setOutput(aiOutput(toolId, input, mode));
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame footer={<Status active label={openAiConfigured(settings) ? "OpenAI is enabled for this tool" : "Local preview. Enable OpenAI in Settings for real AI."} />}>
      <BadgeRow values={openAiConfigured(settings) ? ["Internet needed", "Optional permission"] : ["Works offline", "Local only"]} />
      <div className="filter-row">
        {modes.map((item) => <button className={mode === item ? "chip selected" : "chip"} type="button" key={item} onClick={() => setMode(item)}>{item}</button>)}
      </div>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} />
      <pre>{output}</pre>
      <div className="action-strip compact-actions">
        <button className="primary-action fit-action" type="button" onClick={() => void runRealAi()} disabled={busy}>
          <Sparkles size={16} aria-hidden="true" />
          {busy ? "Generating..." : openAiConfigured(settings) ? "Generate with OpenAI" : "Refresh local preview"}
        </button>
        <button className="secondary-action fit-action" type="button" onClick={() => copyText(output)}>
          <Copy size={16} />
          Copy result
        </button>
      </div>
      {/* TODO: add local model fallback for fully offline AI generation when a bundled model is available. */}
    </ToolFrame>
  );
}

function OfflineMediaTool({ toolId }: ToolProps) {
  if (toolId === "video-save-offline-viewer") return <VideoSaveOfflineViewer />;
  if (toolId === "offline-article-saver") return <OfflineArticleSaver />;
  if (toolId === "local-media-library") return <LocalMediaLibrary />;
  return <LinkSaveQueue toolId={toolId} />;
}

function VideoSaveOfflineViewer() {
  const [url, setUrl] = useState("https://example.com/video.mp4");
  const [library, setLibrary] = useLocalStorage<Array<{ id: string; title: string; url: string; tags: string[]; source: string }>>("quality-life:offline-videos", []);
  const [activeUrl, setActiveUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const { settings } = useSettings();
  const { toast } = useToast();
  const direct = isDirectMediaUrl(url);

  const downloadDirect = async () => {
    if (!direct) return toast("Only direct media files are supported", { tone: "error" });
    if (settings.blockExternalRequests || !settings.mediaDownloads) return toast("External requests are blocked in settings", { tone: "error" });
    if (settings.askBeforeInternetAccess) {
      setGateOpen(true);
      return;
    }
    await fetchAndSave(url);
  };

  const fetchAndSave = async (targetUrl: string) => {
    setBusy(true);
    try {
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setActiveUrl(objectUrl);
      setLibrary((items) => [{ id: crypto.randomUUID(), title: filenameFromUrl(targetUrl), url: objectUrl, tags: ["downloaded"], source: "direct-url" }, ...items]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame footer={<Status active label="Only download media you have the right to save." />}>
      <BadgeRow values={["Works offline", "Internet needed"]} />
      <textarea value={url} onChange={(event) => setUrl(event.target.value)} rows={3} />
      <FindingList findings={[direct ? "Direct media URL detected." : "Not a direct .mp4, .webm, .mov, .m4v, .mp3, or .wav file.", "DRM, paywalls, logins, private content, and platform restrictions are not bypassed."]} />
      <div className="action-strip compact-actions">
        <button className="primary-action" type="button" onClick={downloadDirect} disabled={busy || !direct}><Download size={16} />Download allowed direct media</button>
        <input type="file" accept="video/*,audio/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const objectUrl = URL.createObjectURL(file);
          setActiveUrl(objectUrl);
          setLibrary((items) => [{ id: crypto.randomUUID(), title: file.name, url: objectUrl, tags: ["local"], source: "local-file" }, ...items]);
        }} />
      </div>
      {activeUrl && <video className="media-player" src={activeUrl} controls />}
      <MediaList library={library} onPlay={setActiveUrl} onChange={setLibrary} />
      <InternetAccessGate
        open={gateOpen}
        title="Download direct media?"
        domain={new URL(url).hostname || "the URL you entered"}
        why="This fetches a direct media file you entered so it can be saved locally."
        whatLeaves="The direct media URL you pasted is requested from the remote server."
        storesLocal="The saved file and the offline library stay on this device."
        onCancel={() => setGateOpen(false)}
        onContinue={async () => {
          setGateOpen(false);
          await fetchAndSave(url);
        }}
      />
    </ToolFrame>
  );
}

function OfflineArticleSaver() {
  const [url, setUrl] = useState("https://example.com/article");
  const [articles, setArticles] = useLocalStorage<Array<{ id: string; title: string; url: string; text: string; savedAt: number }>>("quality-life:offline-articles", []);
  const [manualText, setManualText] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const { settings } = useSettings();
  const { toast } = useToast();

  const saveFromUrl = async () => {
    if (settings.blockExternalRequests) return toast("External requests are blocked", { tone: "error" });
    if (settings.askBeforeInternetAccess) {
      setGateOpen(true);
      return;
    }
    await fetchAndSave(url);
  };

  const fetchAndSave = async (targetUrl: string) => {
    const response = await fetch(targetUrl);
    const html = await response.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    setArticles((items) => [{ id: crypto.randomUUID(), title: filenameFromUrl(targetUrl), url: targetUrl, text: text.slice(0, 12000), savedAt: Date.now() }, ...items]);
  };

  return (
    <ToolFrame footer={<Status active label={`${articles.length} offline article copies`} />}>
      <BadgeRow values={["Works offline", "Internet needed"]} />
      <input value={url} onChange={(event) => setUrl(event.target.value)} />
      <button className="primary-action fit-action" type="button" onClick={saveFromUrl}><Download size={16} />Fetch and save text copy</button>
      <textarea value={manualText} onChange={(event) => setManualText(event.target.value)} rows={5} placeholder="Or paste article text manually..." />
      <button className="secondary-action fit-action" type="button" onClick={() => manualText.trim() && setArticles((items) => [{ id: crypto.randomUUID(), title: "Manual article", url: "local", text: manualText, savedAt: Date.now() }, ...items])}>Save pasted article</button>
      <SavedTextList items={articles} onDelete={(id) => setArticles((items) => items.filter((item) => item.id !== id))} />
      <InternetAccessGate
        open={gateOpen}
        title="Fetch and save article?"
        domain={new URL(url).hostname || "the URL you entered"}
        why="This fetches a public article so you can save a text copy for offline reading."
        whatLeaves="The article URL you pasted is requested from the remote site."
        storesLocal="The cleaned article text stays on this device as an offline copy."
        onCancel={() => setGateOpen(false)}
        onContinue={async () => {
          setGateOpen(false);
          await fetchAndSave(url);
        }}
      />
    </ToolFrame>
  );
}

function LocalMediaLibrary() {
  const [items, setItems] = useLocalStorage<Array<{ id: string; title: string; url: string; tags: string[]; source: string }>>("quality-life:local-media-library", []);
  const [query, setQuery] = useState("");
  const visible = items.filter((item) => `${item.title} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const [activeUrl, setActiveUrl] = useState("");
  return (
    <ToolFrame footer={<Status active label={`${visible.length} local media items`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tags or filenames..." />
      <input type="file" multiple accept="video/*,audio/*,image/*" onChange={(event) => {
        const next = Array.from(event.target.files ?? []).map((file) => ({ id: crypto.randomUUID(), title: file.name, url: URL.createObjectURL(file), tags: [], source: "local-file" }));
        setItems((current) => [...next, ...current]);
      }} />
      {activeUrl && (activeUrl.match(/\.(png|jpe?g|gif|webp)$/i) ? <img className="screenshot-preview" src={activeUrl} alt="Local media" /> : <video className="media-player" src={activeUrl} controls />)}
      <MediaList library={visible} onPlay={setActiveUrl} onChange={setItems} />
    </ToolFrame>
  );
}

function LinkSaveQueue({ toolId }: ToolProps) {
  const [links, setLinks] = useLocalStorage<Array<{ id: string; url: string; status: "online" | "offline"; note: string }>>(`${toolId}:links`, []);
  const [url, setUrl] = useState("");
  return (
    <ToolFrame footer={<Status active label={`${links.length} saved links`} />}>
      <BadgeRow values={["Works offline", "Internet needed"]} />
      <div className="action-strip">
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste link..." />
        <button className="primary-action" type="button" onClick={() => url.trim() && setLinks((items) => [{ id: crypto.randomUUID(), url, status: isDirectMediaUrl(url) ? "offline" : "online", note: "" }, ...items])}><Plus size={16} />Add</button>
      </div>
      <div className="scroll-list">
        {links.map((link) => <div className="list-item" key={link.id}><button className="list-copy" type="button" onClick={() => copyText(link.url)}><strong>{link.url}</strong><span>{link.status} | direct downloads only when allowed</span></button><button className="icon-button" type="button" aria-label="Delete" onClick={() => setLinks((items) => items.filter((item) => item.id !== link.id))}><Trash2 size={15} /></button></div>)}
      </div>
    </ToolFrame>
  );
}

function FunExpansionTool({ toolId }: ToolProps) {
  if (toolId === "card-deck" || toolId === "poker-hand-dealer") return <CardDeck poker={toolId === "poker-hand-dealer"} />;
  if (toolId === "blackjack-counter") return <BlackjackCounter />;
  if (toolId === "dice-bag") return <DiceBag />;
  if (toolId === "spin-wheel") return <SpinWheel />;
  if (toolId === "bingo-card-generator") return <BingoCard />;
  if (toolId === "tiny-drawing-canvas") return <TinyDrawingCanvas />;
  if (toolId === "pixel-art-maker") return <PixelArtMaker />;
  if (toolId === "reaction-buttons") return <ReactionButtons />;
  return <PromptCardFun toolId={toolId} />;
}

function CardDeck({ poker }: { poker: boolean }) {
  const [jokers, setJokers] = useState(false);
  const [cards, setCards] = useState<string[]>([]);
  const deck = makeDeck(jokers);
  const deal = () => setCards(shuffle(deck).slice(0, poker ? 5 : 1));
  const rank = poker ? pokerRank(cards) : "";
  return (
    <ToolFrame footer={<Status active label={poker ? "Offline poker hand dealer" : "Offline card deck"} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <label className="toggle-card"><input type="checkbox" checked={jokers} onChange={(event) => setJokers(event.target.checked)} /><span>Include jokers</span></label>
      <button className="primary-action fit-action" type="button" onClick={deal}>{poker ? "Deal 5 cards" : "Draw card"}</button>
      <div className="card-hand">
        {cards.map((card) => (
          <PlayingCardFace key={card} card={card} />
        ))}
      </div>
      {rank && <pre>{rank}</pre>}
    </ToolFrame>
  );
}

function BlackjackCounter() {
  const [deck, setDeck] = useState<string[]>(() => shuffle(makeDeck(false)));
  const [player, setPlayer] = useState<string[]>([]);
  const [dealer, setDealer] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "playing" | "dealer" | "done">("idle");
  const [message, setMessage] = useState("Deal a hand to start.");
  const [hideDealer, setHideDealer] = useState(true);

  const deal = () => {
    const shuffled = shuffle(makeDeck(false));
    const [p1, p2, d1, d2, ...rest] = shuffled;
    setDeck(rest);
    setPlayer([p1, p2]);
    setDealer([d1, d2]);
    setHideDealer(true);
    setPhase("playing");
    setMessage("Your turn. Hit or stand.");
  };

  const hit = () => {
    if (phase !== "playing") return;
    const sourceDeck = deck.length ? deck : shuffle(makeDeck(false));
    const [card, ...rest] = sourceDeck;
    const nextDeck = rest;
    const nextHand = [...player, card];
    setDeck(nextDeck);
    setPlayer(nextHand);
    if (blackjackValue(nextHand) > 21) {
      setHideDealer(false);
      setPhase("done");
      setMessage("You bust. Dealer wins this hand.");
    }
  };

  const stand = () => {
    if (phase !== "playing") return;
    let nextDeck = deck.slice();
    let nextDealer = dealer.slice();
    while (blackjackValue(nextDealer) < 17) {
      if (nextDeck.length === 0) {
        nextDeck = shuffle(makeDeck(false));
      }
      const card = nextDeck.shift();
      if (card) {
        nextDealer.push(card);
      }
    }
    const playerValue = blackjackValue(player);
    const dealerValue = blackjackValue(nextDealer);
    setDeck(nextDeck);
    setDealer(nextDealer);
    setHideDealer(false);
    setPhase("done");
    if (dealerValue > 21 || playerValue > dealerValue) {
      setMessage("You win this hand.");
    } else if (dealerValue === playerValue) {
      setMessage("Push. No winner this hand.");
    } else {
      setMessage("Dealer wins this hand.");
    }
  };

  return (
    <ToolFrame footer={<Status active label="No money, just offline card practice" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="dealer-table">
        <section className="dealer-zone">
          <strong>Dealer</strong>
          <div className="card-hand">
            {dealer.map((card, index) => (
              index === 1 && hideDealer && phase === "playing"
                ? <PlayingCardFace key={`${card}-${index}`} card="back" hidden />
                : <PlayingCardFace key={`${card}-${index}`} card={card} />
            ))}
          </div>
        </section>
        <section className="player-zone">
          <strong>You</strong>
          <div className="card-hand">
            {player.map((card) => <PlayingCardFace key={card} card={card} />)}
          </div>
        </section>
      </div>
      <div className="native-note">
        <Shield size={16} aria-hidden="true" />
        <code>{message}</code>
      </div>
      <div className="action-strip compact-actions">
        <button className="primary-action" type="button" onClick={deal}>Deal</button>
        <button className="secondary-action" type="button" onClick={hit} disabled={phase !== "playing"}>Hit</button>
        <button className="secondary-action" type="button" onClick={stand} disabled={phase !== "playing"}>Stand</button>
        <button className="danger-action" type="button" onClick={() => { setPlayer([]); setDealer([]); setPhase("idle"); setHideDealer(true); setMessage("Deal a hand to start."); }}>Reset</button>
      </div>
    </ToolFrame>
  );
}

function DiceBag() {
  const dice = [4, 6, 8, 10, 12, 20, 100];
  const [rolls, setRolls] = useState<Array<{ id: string; sides: number; value: number }>>([]);
  return (
    <ToolFrame footer={<Status active label="Offline random dice" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="mini-grid">
        {dice.map((sides) => (
          <button className="primary-action" type="button" key={sides} onClick={() => setRolls((items) => [{ id: crypto.randomUUID(), sides, value: 1 + Math.floor(Math.random() * sides) }, ...items].slice(0, 12))}>
            <Dice5 size={16} />
            d{sides}
          </button>
        ))}
      </div>
      <div className="card-hand dice-hand">
        {rolls.map((roll) => (
          <section className="dice-card" key={roll.id}>
            <strong>d{roll.sides}</strong>
            <DieFace value={roll.value} sides={roll.sides} />
          </section>
        ))}
      </div>
    </ToolFrame>
  );
}

function SpinWheel() {
  const [options, setOptions] = useState("Pizza\nTacos\nPasta\nSoup");
  const [choice, setChoice] = useState("");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const entries = lines(options);
  const segments = entries.length || 1;
  const colors = ["#6e8bff", "#5bc7b7", "#6bcb77", "#e6b566", "#cba6f7", "#f38ba8"];
  const wheel = entries
    .map((entry, index) => `${colors[index % colors.length]} ${(index / segments) * 100}% ${((index + 1) / segments) * 100}%`)
    .join(", ");
  return (
    <ToolFrame footer={<Status active label="Random choice wheel" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={options} onChange={(event) => setOptions(event.target.value)} rows={7} />
      <div className="wheel-stage">
        <div className={`spin-wheel ${spinning ? "spinning" : ""}`} style={{ transform: `rotate(${rotation}deg)`, background: `conic-gradient(${wheel})` }}>
          <div className="wheel-pointer" />
          <div className="wheel-center">
            <strong>{choice || "Ready"}</strong>
            <span>{entries.length} choices</span>
          </div>
        </div>
      </div>
      <button
        className="primary-action fit-action"
        type="button"
        onClick={() => {
          if (!entries.length || spinning) return;
          const index = Math.floor(Math.random() * entries.length);
          setSpinning(true);
          setRotation((current) => current + 1080 + index * (360 / entries.length));
          window.setTimeout(() => {
            setChoice(entries[index]);
            setSpinning(false);
          }, 850);
        }}
      >
        <RefreshCcw size={16} />
        Spin
      </button>
    </ToolFrame>
  );
}

function BingoCard() {
  const [words, setWords] = useState("Focus\nCoffee\nBug\nDeploy\nMeeting\nReview\nDone\nLater\nIdea\nTiny\nLocal\nFast\nFree\nPrivate\nOffline\nUtility\nShortcut\nNote\nTimer\nLink\nFile\nHash\nQR\nClean\nWin");
  const grid = shuffle(lines(words)).slice(0, 25);
  return (
    <ToolFrame footer={<Status active label="Custom local bingo card" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={words} onChange={(event) => setWords(event.target.value)} rows={5} />
      <div className="bingo-grid">{grid.map((word, index) => <button className="bingo-cell" type="button" key={`${word}-${index}`}>{index === 12 ? "FREE" : word}</button>)}</div>
    </ToolFrame>
  );
}

function TinyDrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#78f0c8");
  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !drawing) return;
    const rect = canvas.getBoundingClientRect();
    context.fillStyle = color;
    context.beginPath();
    context.arc(event.clientX - rect.left, event.clientY - rect.top, 5, 0, Math.PI * 2);
    context.fill();
  };
  return (
    <ToolFrame footer={<Status active label="Local drawing canvas" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
      <canvas className="draw-canvas" width={640} height={320} ref={canvasRef} onPointerDown={() => setDrawing(true)} onPointerUp={() => setDrawing(false)} onPointerLeave={() => setDrawing(false)} onPointerMove={draw} />
      <div className="action-strip compact-actions">
        <button className="secondary-action" type="button" onClick={() => canvasRef.current?.getContext("2d")?.clearRect(0, 0, 640, 320)}><Eraser size={16} />Clear</button>
        <button className="secondary-action" type="button" onClick={() => downloadDataUrl(canvasRef.current?.toDataURL("image/png") ?? "", "quality-life-drawing.png")}><Download size={16} />Save image</button>
      </div>
    </ToolFrame>
  );
}

function PixelArtMaker() {
  const [color, setColor] = useState("#78f0c8");
  const [pixels, setPixels] = useState(Array.from({ length: 16 * 16 }, () => ""));
  return (
    <ToolFrame footer={<Status active label="16x16 local pixel art" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
      <div className="pixel-grid">{pixels.map((pixel, index) => <button aria-label={`Pixel ${index}`} className="pixel-cell" type="button" key={index} style={{ background: pixel || "rgba(255,255,255,0.04)" }} onClick={() => setPixels((items) => items.map((item, itemIndex) => itemIndex === index ? color : item))} />)}</div>
      <button className="secondary-action fit-action" type="button" onClick={() => setPixels(Array.from({ length: 16 * 16 }, () => ""))}>Clear</button>
    </ToolFrame>
  );
}

function ReactionButtons() {
  const sounds = [["Nice", 440], ["Wow", 660], ["Done", 880], ["Oops", 220]] as const;
  return (
    <ToolFrame footer={<Status active label="Generated local sounds only" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="mini-grid">
        {sounds.map(([label, hz]) => <button className="primary-action" type="button" key={label} onClick={() => playTone(hz)}><Play size={16} />{label}</button>)}
      </div>
    </ToolFrame>
  );
}

function PlayingCardFace({ card, hidden = false }: { card: string; hidden?: boolean }) {
  if (hidden || card === "back") {
    return (
      <div className="playing-card face-back">
        <span className="card-back-pattern">Quality life</span>
      </div>
    );
  }
  const suit = card.slice(-1);
  const rank = card.replace(/[HDCS]/, "");
  const red = suit === "H" || suit === "D";
  return (
    <div className={`playing-card face-front ${red ? "red" : ""}`}>
      <span className="card-rank">{rank}</span>
      <span className="card-suit">{suitSymbol(suit)}</span>
      <span className="card-rank bottom">{rank}</span>
    </div>
  );
}

function DieFace({ value, sides }: { value: number; sides: number }) {
  if (sides === 20) {
    return <strong className="die-number large">{value}</strong>;
  }
  const layout = dieLayout(value);
  return (
    <div className="die-grid">
      {layout.map((spot) => <span className={`die-pip ${spot}`} key={spot} />)}
    </div>
  );
}

function suitSymbol(suit: string) {
  switch (suit) {
    case "H":
      return "♥";
    case "D":
      return "♦";
    case "C":
      return "♣";
    case "S":
      return "♠";
    default:
      return "?";
  }
}

function dieLayout(value: number) {
  const layouts: Record<number, string[]> = {
    1: ["center"],
    2: ["tl", "br"],
    3: ["tl", "center", "br"],
    4: ["tl", "tr", "bl", "br"],
    5: ["tl", "tr", "center", "bl", "br"],
    6: ["tl", "tr", "ml", "mr", "bl", "br"]
  };
  return layouts[value] ?? ["center"];
}

function PromptCardFun({ toolId }: ToolProps) {
  const data: Record<string, string[]> = {
    "solitaire-cards": ["Classic tableau ready", "Draw three", "Move aces to foundation"],
    "tarot-random-cards": ["The Compass: choose direction", "The Lantern: find one clear step", "The Bridge: reconnect two ideas"],
    "truth-or-dare": ["Truth: what tiny habit helps you?", "Dare: send a kind message", "Truth: best recent surprise?"],
    "would-you-rather": ["Would you rather have perfect focus or perfect memory?", "Would you rather finish early or start calmly?"],
    "random-party-question": ["What app should exist but doesn't?", "What is a small luxury you love?"],
    "random-challenge-generator": ["Drink water and clear one tiny task", "Organize five files", "Write a two-line note to future you"]
  };
  const [value, setValue] = useState(pick(data[toolId] ?? data["random-challenge-generator"]));
  return (
    <ToolFrame footer={<Status active label="Safe local prompts" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="timer-face compact-face"><strong>{value}</strong></div>
      <button className="primary-action fit-action" type="button" onClick={() => setValue(pick(data[toolId] ?? []))}><Sparkles size={16} />New</button>
    </ToolFrame>
  );
}

function UsefulTool({ toolId }: ToolProps) {
  if (toolId === "decision-matrix") return <DecisionMatrix toolId={toolId} />;
  if (toolId === "size-converter") return <SizeConverter />;
  if (toolId === "shopping-compare") return <ShoppingCompare toolId={toolId} />;
  if (toolId === "emergency-info-card") return <EmergencyInfoCard toolId={toolId} />;
  if (toolId === "quick-forms") return <QuickForms toolId={toolId} />;
  if (toolId === "local-bookmark-manager") return <BookmarkManager toolId={toolId} />;
  if (toolId === "random-meal-picker") return <RandomMealPicker toolId={toolId} />;
  return <GenericUsefulList toolId={toolId} />;
}

function GenericUsefulList({ toolId }: ToolProps) {
  const label = titleFromId(toolId);
  const [items, setItems] = useLocalStorage<Array<Record<string, string> & { id: string }>>(`${toolId}:items`, []);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const fields = usefulFields(toolId);
  return (
    <ToolFrame footer={<Status active label={`${items.length} local records`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="mini-grid">
        {fields.map((field) => <input key={field} value={draft[field] ?? ""} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} placeholder={field} />)}
      </div>
      <button className="primary-action fit-action" type="button" onClick={() => setItems((current) => [{ id: crypto.randomUUID(), ...draft }, ...current])}><Plus size={16} />Add {label}</button>
      <div className="scroll-list">
        {items.map((item) => <div className="list-item" key={item.id}><button className="list-copy" type="button" onClick={() => copyText(JSON.stringify(item, null, 2))}><strong>{item[fields[0]] || label}</strong><span>{fields.slice(1).map((field) => item[field]).filter(Boolean).join(" | ")}</span></button><button className="icon-button" type="button" aria-label="Delete" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={15} /></button></div>)}
      </div>
      {(toolId.includes("reminder") || toolId.includes("tracker")) && <div className="native-note"><AlertTriangle size={16} /><code>Local reminders can be connected to native notifications later.</code></div>}
    </ToolFrame>
  );
}

function DecisionMatrix({ toolId }: ToolProps) {
  const [options, setOptions] = useLocalStorage(`${toolId}:options`, "Option A\nOption B");
  const [criteria, setCriteria] = useLocalStorage(`${toolId}:criteria`, "Cost:3\nEase:2\nImpact:5");
  const rows = lines(options).map((option, optionIndex) => {
    const score = lines(criteria).reduce((sum, line, index) => {
      const weight = Number(line.split(":")[1]) || 1;
      return sum + ((optionIndex + index) % 5 + 1) * weight;
    }, 0);
    return { option, score };
  }).sort((a, b) => b.score - a.score);
  return (
    <ToolFrame footer={<Status active label="Weighted comparison" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="tool-grid two"><textarea value={options} onChange={(event) => setOptions(event.target.value)} rows={6} /><textarea value={criteria} onChange={(event) => setCriteria(event.target.value)} rows={6} /></div>
      {rows.map((row) => <div className="list-item" key={row.option}><button className="list-copy" type="button"><strong>{row.option}</strong><span>Score {row.score}</span></button></div>)}
    </ToolFrame>
  );
}

function SizeConverter() {
  const [note, setNote] = useLocalStorage("quality-life:size-notes", "US shoe 10 = EU 43\nMen M = Women L often varies by brand");
  const [cm, setCm] = useState(27);
  return (
    <ToolFrame footer={<Status active label="Manual size notes and quick estimates" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <input type="number" value={cm} onChange={(event) => setCm(Number(event.target.value) || 0)} />
      <pre>{`Foot ${cm}cm\nApprox US men: ${(cm - 18).toFixed(1)}\nApprox EU: ${Math.round(cm * 1.5 + 2)}`}</pre>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={7} />
    </ToolFrame>
  );
}

function ShoppingCompare({ toolId }: ToolProps) {
  const [items, setItems] = useLocalStorage<Array<{ id: string; name: string; price: number; rating: number; notes: string }>>(`${toolId}:items`, []);
  const [draft, setDraft] = useState({ name: "", price: 0, rating: 3, notes: "" });
  return (
    <ToolFrame footer={<Status active label={`${items.length} products compared`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="mini-grid">
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Product" />
        <input type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) || 0 })} placeholder="Price" />
        <input type="number" min={1} max={5} value={draft.rating} onChange={(event) => setDraft({ ...draft, rating: Number(event.target.value) || 1 })} placeholder="Rating" />
        <input value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Notes" />
      </div>
      <button className="primary-action fit-action" type="button" onClick={() => setItems((current) => [{ ...draft, id: crypto.randomUUID() }, ...current])}>Add product</button>
      <div className="scroll-list">{items.map((item) => <div className="list-item" key={item.id}><button className="list-copy" type="button"><strong>{item.name}</strong><span>${item.price} | rating {item.rating}/5 | {item.notes}</span></button><button className="icon-button" type="button" aria-label="Delete" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={15} /></button></div>)}</div>
    </ToolFrame>
  );
}

function EmergencyInfoCard({ toolId }: ToolProps) {
  const [hidden, setHidden] = useState(true);
  const [info, setInfo] = useLocalStorage(`${toolId}:info`, "Name:\nEmergency contact:\nAllergies:\nMedication:\nNotes:");
  return (
    <ToolFrame footer={<Status active label="Local only and user-controlled" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <button className="secondary-action fit-action" type="button" onClick={() => setHidden((value) => !value)}>{hidden ? <Eye size={16} /> : <X size={16} />}{hidden ? "Show card" : "Hide card"}</button>
      {!hidden && <textarea value={info} onChange={(event) => setInfo(event.target.value)} className="scratchpad" />}
    </ToolFrame>
  );
}

function QuickForms({ toolId }: ToolProps) {
  const [forms, setForms] = useLocalStorage<Record<string, string>>(`${toolId}:forms`, {
    Address: "",
    Email: "",
    "Common reply": "Thanks, I will take a look.",
    "Support message": "Hi, I need help with..."
  });
  return (
    <ToolFrame footer={<Status active label="Reusable local text templates" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="mini-grid">
        {Object.entries(forms).map(([name, value]) => <section className="utility-card compact-card" key={name}><strong>{name}</strong><textarea value={value} onChange={(event) => setForms({ ...forms, [name]: event.target.value })} rows={4} /><button className="secondary-action fit-action" type="button" onClick={() => copyText(value)}><Copy size={16} />Copy</button></section>)}
      </div>
    </ToolFrame>
  );
}

function BookmarkManager({ toolId }: ToolProps) {
  const [items, setItems] = useLocalStorage<Array<{ id: string; title: string; url: string; tags: string }>>(`${toolId}:items`, []);
  const [draft, setDraft] = useState({ title: "", url: "", tags: "" });
  return (
    <ToolFrame footer={<Status active label={`${items.length} local bookmarks`} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="mini-grid"><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" /><input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="URL" /><input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="Tags" /></div>
      <button className="primary-action fit-action" type="button" onClick={() => setItems((current) => [{ ...draft, id: crypto.randomUUID() }, ...current])}>Add bookmark</button>
      <div className="scroll-list">{items.map((item) => <div className="list-item" key={item.id}><button className="list-copy" type="button" onClick={() => copyText(item.url)}><strong>{item.title || item.url}</strong><span>{item.tags}</span></button><button className="icon-button" type="button" aria-label="Delete" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={15} /></button></div>)}</div>
    </ToolFrame>
  );
}

function RandomMealPicker({ toolId }: ToolProps) {
  const [meals, setMeals] = useLocalStorage(`${toolId}:meals`, "Tacos - tortillas, beans, salsa\nPasta - noodles, sauce\nSalad - greens, protein");
  const [choice, setChoice] = useState("");
  return (
    <ToolFrame footer={<Status active label="Local meal list" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <textarea value={meals} onChange={(event) => setMeals(event.target.value)} rows={8} />
      <button className="primary-action fit-action" type="button" onClick={() => setChoice(pick(lines(meals)))}><Sparkles size={16} />Pick meal</button>
      <div className="timer-face compact-face"><strong>{choice || "Ready"}</strong></div>
    </ToolFrame>
  );
}

function ManualRiskList({ toolId, title, fields, riskyWords, todo }: { toolId: string; title: string; fields: string[]; riskyWords: string[]; todo: string }) {
  const [items, setItems] = useLocalStorage<Array<Record<string, string> & { id: string }>>(`${toolId}:items`, []);
  const [draft, setDraft] = useState<Record<string, string>>({});
  return (
    <ToolFrame footer={<Status active label={`${items.length} manual entries`} />}>
      <BadgeRow values={["Works offline", "Local only", "Native integration needed"]} />
      <div className="mini-grid">{fields.map((field) => <input key={field} value={draft[field] ?? ""} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} placeholder={field} />)}</div>
      <button className="primary-action fit-action" type="button" onClick={() => setItems((current) => [{ id: crypto.randomUUID(), ...draft }, ...current])}>Add {title} entry</button>
      <div className="scroll-list">
        {items.map((item) => {
          const risky = Object.values(item).some((value) => riskyWords.some((word) => value.toLowerCase().includes(word)));
          return <div className="list-item" key={item.id}><button className="list-copy" type="button"><strong>{item[fields[0]] || title}</strong><span>{risky ? "Review: unusual path or publisher" : "No local keyword warning"} | {fields.slice(1).map((field) => item[field]).filter(Boolean).join(" | ")}</span></button><button className="icon-button" type="button" aria-label="Delete" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={15} /></button></div>;
        })}
      </div>
      <div className="native-note"><AlertTriangle size={16} /><code>{todo}</code></div>
    </ToolFrame>
  );
}

function Status({ active, label }: { active: boolean; label: string }) {
  return <div className="status-row"><span className={`status-dot ${active ? "on" : ""}`} /><span>{label}</span></div>;
}

function BadgeRow({ values }: { values: string[] }) {
  return <div className="filter-row">{values.map((value) => <span className="pill" key={value}>{value}</span>)}</div>;
}

function EmptyHint({ text }: { text: string }) {
  return <div className="empty-inline">{text}</div>;
}

function FindingList({ findings }: { findings: string[] }) {
  return <div className="match-list">{findings.map((finding) => <div className="native-note" key={finding}><AlertTriangle size={15} /><code>{finding}</code></div>)}</div>;
}

function readFiles(event: ChangeEvent<HTMLInputElement>): FileRow[] {
  return Array.from(event.target.files ?? []).map((file, index) => {
    const withPath = file as File & { webkitRelativePath?: string };
    const path = withPath.webkitRelativePath || file.name;
    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "" : "";
    return { id: `${path}-${file.size}-${file.lastModified}-${index}`, name: file.name, size: file.size, extension, modifiedAt: file.lastModified, createdAt: "Needs native metadata", type: file.type || "unknown", path, file };
  });
}

function fileFindings(file: FileRow) {
  const findings: string[] = [];
  if (suspiciousExtensions.has(file.extension)) findings.push(`Suspicious executable extension: .${file.extension}`);
  if (/\.(pdf|docx?|xlsx?|png|jpg|jpeg)\.(exe|msi|bat|cmd|scr|ps1|vbs|js|jar|dll)$/i.test(file.name)) findings.push("Double extension detected. This can hide an executable.");
  if (/^\./.test(file.name) && suspiciousExtensions.has(file.extension)) findings.push("Hidden executable-style filename.");
  if (Date.now() - file.modifiedAt < 7 * 86_400_000) findings.push("Recently modified/downloaded-style file. Verify source before opening.");
  if (["exe", "msi", "dll"].includes(file.extension)) findings.push("Signature check needs native integration. Prefer signed installers from official sources.");
  if (!findings.length) findings.push("No obvious local warning. Still open files only from sources you trust.");
  findings.push("Recommendation: verify checksum, scan with your OS security tools, and avoid running unknown files.");
  return findings;
}

function parseDomain(value: string) {
  try {
    const url = new URL(value.trim());
    return { domain: url.hostname, protocol: url.protocol };
  } catch {
    return { domain: "", protocol: "Invalid URL" };
  }
}

function downloadWarnings(value: string) {
  const { domain, protocol } = parseDomain(value);
  const warnings: string[] = [];
  if (!domain) return ["Invalid URL."];
  if (protocol !== "https:") warnings.push("URL is not HTTPS.");
  if (/(rnicrosoft|paypa1|g00gle|app1e|faceb00k|micros0ft|disc0rd)/i.test(domain)) warnings.push("Domain contains common typosquatting-style characters.");
  if (domain.split(".").length > 3) warnings.push("Deep subdomain. Check which part is the real registered domain.");
  if (/[0-9]{5,}|--/.test(domain)) warnings.push("Odd domain pattern. Verify before downloading.");
  if (!warnings.length) warnings.push("No obvious domain warning. Still verify the source and checksum.");
  return warnings;
}

function normalizeHash(value: string) {
  return value.replace(/[^a-f0-9]/gi, "").toLowerCase();
}

async function shaHash(file: File, algorithm: "SHA-1" | "SHA-256") {
  const digest = await crypto.subtle.digest(algorithm, await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function md5File(file: File) {
  return md5Bytes(new Uint8Array(await file.arrayBuffer()));
}

function secretFindings(value: string) {
  const patterns: Array<[RegExp, string]> = [
    [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, "Email address found."],
    [/\+?[0-9][0-9 .\-()]{8,}/, "Phone-number-like text found."],
    [/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, "JWT token pattern found."],
    [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, "Private key block found."],
    [/gh[pousr]_[A-Za-z0-9_]{20,}/, "GitHub token-like pattern found."],
    [/AKIA[0-9A-Z]{16}/, "AWS-style access key found."],
    [/[A-Za-z0-9_\-]{24}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27}/, "Discord-token-like pattern found."],
    [/(api[_-]?key|secret|password|token)\s*[:=]\s*["']?[^"'\s]{8,}/i, "Secret assignment pattern found."]
  ];
  return patterns.filter(([pattern]) => pattern.test(value)).map(([, label]) => label);
}

async function fileMetadata(file: File) {
  const findings = [`Type: ${file.type || "unknown"}`, `Size: ${formatBytes(file.size)}`, `Modified: ${new Date(file.lastModified).toLocaleString()}`];
  const bytes = new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer());
  const text = new TextDecoder("latin1").decode(bytes);
  if (/Exif\0\0/.test(text)) findings.push("EXIF metadata marker found.");
  if (/xmpmeta|photoshop|Adobe/i.test(text)) findings.push("Image/editor metadata marker found.");
  if (/\/Author|\/Title|\/Creator|\/Producer/.test(text)) findings.push("PDF/doc metadata marker found.");
  if (!findings.some((item) => item.includes("metadata marker"))) findings.push("No obvious metadata marker in first 64KB.");
  return findings;
}

function stripImageMetadata(file: File, toast: ReturnType<typeof useToast>["toast"]) {
  const image = document.createElement("img");
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")?.drawImage(image, 0, 0);
    downloadDataUrl(canvas.toDataURL("image/png"), `${file.name.replace(/\.[^.]+$/, "")}-metadata-stripped.png`);
    URL.revokeObjectURL(image.src);
    toast("Metadata-stripped image exported", { tone: "success" });
  };
  image.src = URL.createObjectURL(file);
}

function extensionRisk(value: string) {
  const lower = value.toLowerCase();
  const findings: string[] = [];
  if (lower.includes("all websites") || lower.includes("all your data")) findings.push("Can read broad website data.");
  if (lower.includes("modify") || lower.includes("change")) findings.push("Can modify page data.");
  if (lower.includes("clipboard")) findings.push("Can access clipboard data.");
  if (lower.includes("download")) findings.push("Can access downloads.");
  return findings;
}

function commandWarnings(command: string) {
  const lower = command.toLowerCase();
  const warnings: string[] = [];
  if (/curl.+\|\s*(sh|bash|zsh)|wget.+\|\s*(sh|bash|zsh)/i.test(command)) warnings.push("Downloads a script and pipes it directly into a shell.");
  if (/powershell.+-enc|powershell.+encodedcommand/i.test(command)) warnings.push("PowerShell encoded command detected.");
  if (/rm\s+-rf\s+\/|del\s+\/s|format\s+[a-z]:/i.test(command)) warnings.push("Destructive delete or format command detected.");
  if (/reg\s+add|regedit|launchctl|schtasks|startup|runonce/i.test(command)) warnings.push("Persistence or registry/startup edit detected.");
  if (/curl|wget|invoke-webrequest|bitsadmin/.test(lower)) warnings.push("Hidden download behavior may be present.");
  return warnings;
}

function cleanTracking(value: string) {
  try {
    const url = new URL(value.trim());
    [...url.searchParams.keys()].forEach((key) => {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm_") || trackerParams.has(lower)) url.searchParams.delete(key);
    });
    return url.toString();
  } catch {
    return value;
  }
}

function impersonationCheck(value: string) {
  const parsed = parseDomain(value);
  if (!parsed.domain) {
    return {
      summary: "Enter a link to check whether it is trying to look like a real website.",
      findings: ["Invalid URL."]
    };
  }

  const domain = parsed.domain.toLowerCase();
  const normalizedDomain = normalizeLookalikeDomain(domain);
  const candidates = [
    "youtube.com",
    "google.com",
    "facebook.com",
    "instagram.com",
    "apple.com",
    "microsoft.com",
    "paypal.com",
    "discord.com",
    "github.com",
    "steamcommunity.com",
    "netflix.com",
    "spotify.com",
    "openai.com",
    "amazon.com",
    "reddit.com",
    "x.com"
  ];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeLookalikeDomain(candidate);
    if (normalizedDomain === normalizedCandidate && domain !== candidate) {
      return {
        summary: `This looks like a lookalike of ${candidate}.`,
        findings: [
          `The typed domain is ${domain}, which is visually or structurally very close to ${candidate}.`,
          "A real brand usually uses the exact official domain, not a modified spelling or extra words.",
          "Double-check the address before signing in or downloading anything."
        ]
      };
    }

    if (normalizedDomain.includes(normalizedCandidate) && domain !== candidate) {
      return {
        summary: `This domain may be impersonating ${candidate}.`,
        findings: [
          `The domain ${domain} contains the brand name for ${candidate} but is not the official domain.`,
          "That pattern often shows up in fake login pages and scam download sites.",
          "Verify the site manually before entering any password or payment details."
        ]
      };
    }
  }

  return {
    summary: "No obvious impersonation found. Still verify the spelling and official domain before trusting the link.",
    findings: ["No obvious brand lookalike detected."]
  };
}

function phishingWarnings(display: string, actual: string) {
  const warnings: string[] = [];
  const displayDomain = parseDomain(display).domain;
  const actualDomain = parseDomain(actual).domain;
  if (!actualDomain) warnings.push("Invalid real URL.");
  if (displayDomain && actualDomain && displayDomain !== actualDomain) warnings.push(`Displayed domain does not match real domain: ${displayDomain} vs ${actualDomain}.`);
  if (/%[0-9a-f]{2}/i.test(actual)) warnings.push("Encoded characters are present. Review decoded URL.");
  if (/xn--/.test(actualDomain)) warnings.push("Punycode domain warning. This may be an internationalized domain.");
  if (!warnings.length) warnings.push("No obvious mismatch. Never enter passwords after following unexpected links.");
  return warnings;
}

function normalizeLookalikeDomain(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1]/g, "l")
    .replace(/[3]/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z0-9]/g, "");
}

function aiOutput(toolId: string, input: string, mode: string) {
  const trimmed = input.trim();
  if (toolId === "prompt-maker") return `Role: Act as a helpful ${mode} assistant.\nGoal: ${trimmed}\nContext: Add relevant background.\nConstraints: Be accurate, concise, and practical.\nOutput format: Use clear sections and examples.\nAsk questions only if needed.`;
  if (toolId === "prompt-improver") return `Goal:\n${firstSentence(trimmed)}\n\nContext:\n${trimmed}\n\nConstraints:\n- Keep it practical\n- Avoid unsupported assumptions\n\nOutput format:\n- Summary\n- Steps\n- Final answer`;
  if (toolId === "natural-rewriter") return rewriteText(trimmed, mode);
  if (toolId === "ai-writing-heuristic") return writingHeuristic(trimmed);
  if (toolId === "tone-changer") return rewriteText(trimmed, mode);
  if (toolId === "explain-like-im-five") return `Simple version:\n${trimmed.split(/[.!?]/).filter(Boolean).slice(0, 4).map((part) => `- ${part.trim().replace(/\butilize\b/gi, "use").replace(/\bfacilitate\b/gi, "help")}`).join("\n")}`;
  if (toolId === "summary-maker") return summarize(trimmed);
  if (toolId === "title-generator") return lines(trimmed).slice(0, 1).flatMap((line) => [`${titleCase(line)}`, `${titleCase(line)} Guide`, `How to ${line.toLowerCase()}`, `${titleCase(line)} Checklist`]).join("\n");
  if (toolId === "idea-expander") return `Features:\n- ${trimmed} dashboard\n- Quick capture\n- Local history\n\nRisks:\n- Scope creep\n- Confusing controls\n\nNext steps:\n- Build the smallest useful version\n- Test with real examples`;
  return ["Nova", "Pocket", "Kite", "Anchor", "Bright", "Local", "Tiny"].map((word) => `${word} ${titleCase(trimmed || "Project")}`).join("\n");
}

function buildAiSystemPrompt(toolId: string, mode: string) {
  if (toolId === "prompt-maker") return `You write structured prompts for ${mode} work. Return only the finished prompt template with clear sections.`;
  if (toolId === "prompt-improver") return "You rewrite messy prompts into a clearer structure with goal, context, constraints, output format, and examples.";
  if (toolId === "natural-rewriter") return `You rewrite text to sound ${mode} while preserving meaning. Return only the rewritten text.`;
  if (toolId === "ai-writing-heuristic") return "You analyze writing for signs that it was likely generated by AI, but you must be cautious and explicitly state that this is not proof.";
  if (toolId === "tone-changer") return `You change the tone of the user's text to ${mode} while preserving meaning. Return only the rewritten text.`;
  if (toolId === "explain-like-im-five") return "You simplify the user's text into very plain language, keeping the key idea intact.";
  if (toolId === "summary-maker") return "You summarize text using a concise, accurate, and helpful style.";
  if (toolId === "title-generator") return "You generate short, useful title ideas. Return one per line.";
  if (toolId === "idea-expander") return "You expand one idea into practical features, risks, and next steps.";
  return "You generate clear, practical name ideas. Return one per line.";
}

function buildAiUserPrompt(toolId: string, input: string, mode: string) {
  const trimmed = input.trim();
  if (toolId === "prompt-maker") {
    return `Mode: ${mode}\nGoal: ${trimmed}\nMake the template ready for a large language model, with sections for goal, context, constraints, output format, and examples.`;
  }
  if (toolId === "prompt-improver") {
    return `Rewrite this prompt into a sharper version:\n\n${trimmed}`;
  }
  if (toolId === "natural-rewriter") {
    return `Rewrite this text in a ${mode} tone:\n\n${trimmed}`;
  }
  if (toolId === "ai-writing-heuristic") {
    return `Check this text for signs of AI-like writing and give a careful suspicion level with short reasons. Do not claim certainty.\n\n${trimmed}`;
  }
  if (toolId === "tone-changer") {
    return `Convert this text to a ${mode} tone while preserving meaning:\n\n${trimmed}`;
  }
  if (toolId === "explain-like-im-five") {
    return `Explain this in very simple language:\n\n${trimmed}`;
  }
  if (toolId === "summary-maker") {
    return `Summarize the text below with 3-5 bullet points:\n\n${trimmed}`;
  }
  if (toolId === "title-generator") {
    return `Generate 8 title ideas for this topic. Keep them short and useful:\n\n${trimmed}`;
  }
  if (toolId === "idea-expander") {
    return `Expand this idea into features, possible risks, and next steps:\n\n${trimmed}`;
  }
  return `Generate 8 concise name ideas for this project, app, or team:\n\n${trimmed}`;
}

function rewriteText(text: string, mode: string) {
  const base = text.replace(/\s+/g, " ").trim();
  if (mode === "shorter" || mode === "concise") return firstSentence(base);
  if (mode === "professional" || mode === "formal") return `Please note: ${base}`;
  if (mode === "friendly" || mode === "casual") return `Hey, ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
  if (mode === "simple" || mode === "clearer") return base.replace(/\butilize\b/gi, "use").replace(/\bapproximately\b/gi, "about").replace(/\btherefore\b/gi, "so");
  return base;
}

function writingHeuristic(text: string) {
  const signs = [
    [/\bmoreover\b|\bfurthermore\b|\bin conclusion\b/gi, "repeated formal transitions"],
    [/\bdelve\b|\btapestry\b|\brobust\b|\bleverage\b/gi, "generic polished phrasing"],
    [/^(firstly|secondly|finally)/gim, "repetitive structure"]
  ].filter(([pattern]) => (pattern as RegExp).test(text)).map(([, label]) => label);
  const suspicion = signs.length >= 3 ? "high suspicion" : signs.length >= 1 ? "medium suspicion" : "low suspicion";
  return `This is not definitive proof.\nResult: ${suspicion}\nSignals:\n${signs.length ? signs.map((sign) => `- ${sign}`).join("\n") : "- No strong heuristic signals found."}`;
}

function summarize(text: string) {
  return lines(text.replace(/([.!?])\s+/g, "$1\n")).sort((a, b) => b.length - a.length).slice(0, 4).map((line) => `- ${line}`).join("\n");
}

function MediaList({ library, onPlay, onChange }: { library: Array<{ id: string; title: string; url: string; tags: string[]; source: string }>; onPlay: (url: string) => void; onChange: (items: Array<{ id: string; title: string; url: string; tags: string[]; source: string }> | ((items: Array<{ id: string; title: string; url: string; tags: string[]; source: string }>) => Array<{ id: string; title: string; url: string; tags: string[]; source: string }>)) => void }) {
  return <div className="scroll-list">{library.map((item) => <div className="list-item multi-actions" key={item.id}><button className="list-copy" type="button" onClick={() => onPlay(item.url)}><strong>{item.title}</strong><span>{item.source} | {item.tags.join(", ") || "no tags"} | duration metadata later</span></button><button className="icon-button" type="button" aria-label="Play" onClick={() => onPlay(item.url)}><Play size={15} /></button><button className="icon-button" type="button" aria-label="Delete" onClick={() => onChange((items) => items.filter((entry) => entry.id !== item.id))}><Trash2 size={15} /></button></div>)}</div>;
}

function SavedTextList({ items, onDelete }: { items: Array<{ id: string; title: string; url: string; text: string; savedAt: number }>; onDelete: (id: string) => void }) {
  return <div className="scroll-list">{items.map((item) => <section className="utility-card compact-card" key={item.id}><strong>{item.title}</strong><span className="muted-line">Saved local copy | {new Date(item.savedAt).toLocaleString()}</span><pre>{item.text}</pre><button className="danger-action fit-action" type="button" onClick={() => onDelete(item.id)}><Trash2 size={15} />Delete</button></section>)}</div>;
}

function makeDeck(jokers: boolean) {
  const suits = ["H", "D", "C", "S"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  return suits.flatMap((suit) => ranks.map((rank) => `${rank}${suit}`)).concat(jokers ? ["Joker", "Joker"] : []);
}

function blackjackValue(cards: string[]) {
  let total = 0;
  let aces = 0;
  cards.forEach((card) => {
    const rank = card.replace(/[HDCS]/, "");
    if (rank === "A") { aces += 1; total += 11; }
    else total += ["K", "Q", "J"].includes(rank) ? 10 : Number(rank) || 0;
  });
  while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
  return total;
}

function pokerRank(cards: string[]) {
  if (cards.length < 5) return "Deal a hand.";
  const ranks = cards.map((card) => card.replace(/[HDCS]/, ""));
  const counts = new Map(ranks.map((rank) => [rank, ranks.filter((item) => item === rank).length]));
  const values = [...counts.values()].sort((a, b) => b - a);
  if (values[0] === 4) return "Hand rank placeholder: Four of a kind";
  if (values[0] === 3 && values[1] === 2) return "Hand rank placeholder: Full house";
  if (values[0] === 3) return "Hand rank placeholder: Three of a kind";
  if (values[0] === 2 && values[1] === 2) return "Hand rank placeholder: Two pair";
  if (values[0] === 2) return "Hand rank placeholder: One pair";
  return "Hand rank placeholder: High card";
}

function usefulFields(toolId: string) {
  const map: Record<string, string[]> = {
    "warranty-tracker": ["Product", "Purchase date", "Warranty length", "Notes"],
    "receipt-saver": ["Receipt", "Date", "Tags", "Amount"],
    "document-expiry-reminder": ["Document", "Expiry date", "Owner", "Notes"],
    "home-inventory": ["Item", "Serial number", "Location", "Photo note"],
    "repair-log": ["Item", "Date", "Repair", "Parts"],
    "package-tracker": ["Package", "Carrier", "Tracking number", "Status"],
    "price-memory": ["Item", "Price", "Store", "Date"],
    "travel-pack-list": ["Trip", "Item", "Category", "Notes"]
  };
  return map[toolId] ?? ["Name", "Date", "Tags", "Notes"];
}

function titleFromId(id: string) {
  return id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function localStorageSnapshot() {
  return JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith("quality-life:"))), null, 2);
}

function isDirectMediaUrl(value: string) {
  return /^https?:\/\/.+\.(mp4|webm|mov|m4v|mp3|wav)(\?.*)?$/i.test(value.trim());
}

function filenameFromUrl(value: string) {
  try {
    return decodeURIComponent(new URL(value).pathname.split("/").pop() || "media");
  } catch {
    return "media";
  }
}

function lines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * Math.max(1, items.length))];
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function firstSentence(value: string) {
  return value.split(/[.!?]/).find(Boolean)?.trim() || value;
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function downloadDataUrl(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

function playTone(frequency: number) {
  const settings = (() => {
    try {
      return JSON.parse(window.localStorage.getItem("quality-life:settings") ?? "{}") as {
        soundsEnabled?: boolean;
        soundTheme?: string;
        soundVolume?: number;
      };
    } catch {
      return {};
    }
  })();
  if (settings.soundsEnabled === false || settings.soundTheme === "silent") {
    return;
  }
  const scale = Math.max(0, Math.min(100, settings.soundVolume ?? 42)) / 100;
  if (scale <= 0) {
    return;
  }
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.value = Math.pow(scale, 0.85) * 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.22);
}

function makePassword(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = randomBytes(length);
  return [...bytes].map((byte) => chars[byte % chars.length]).join("");
}

async function deriveVaultKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: asBufferSource(salt), iterations: 150_000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function encryptVault(entries: VaultEntry[], key: CryptoKey, existingSalt?: string): Promise<EncryptedVault> {
  const salt = existingSalt ?? bytesToBase64(randomBytes(16));
  const iv = randomBytes(12);
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv: asBufferSource(iv) }, key, new TextEncoder().encode(JSON.stringify(entries)));
  return { version: 1, salt, iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(data)) };
}

async function decryptVault(vault: EncryptedVault, key: CryptoKey) {
  const data = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asBufferSource(base64ToBytes(vault.iv)) }, key, asBufferSource(base64ToBytes(vault.data)));
  return JSON.parse(new TextDecoder().decode(data)) as VaultEntry[];
}

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function md5Bytes(input: Uint8Array) {
  function rotateLeft(value: number, amount: number) { return (value << amount) | (value >>> (32 - amount)); }
  function add(x: number, y: number) { return (x + y) & 0xffffffff; }
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const k = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32));
  const bytes = [...input, 0x80];
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bitLength = input.length * 8;
  for (let index = 0; index < 8; index += 1) bytes.push((bitLength >>> (8 * index)) & 0xff);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const m = Array.from({ length: 16 }, (_, index) => bytes[offset + index * 4] | (bytes[offset + index * 4 + 1] << 8) | (bytes[offset + index * 4 + 2] << 16) | (bytes[offset + index * 4 + 3] << 24));
    let a = a0, b = b0, c = c0, d = d0;
    for (let index = 0; index < 64; index += 1) {
      let f = 0, g = 0;
      if (index < 16) { f = (b & c) | (~b & d); g = index; }
      else if (index < 32) { f = (d & b) | (~d & c); g = (5 * index + 1) % 16; }
      else if (index < 48) { f = b ^ c ^ d; g = (3 * index + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * index) % 16; }
      const temp = d;
      d = c;
      c = b;
      b = add(b, rotateLeft(add(add(a, f), add(k[index], m[g])), s[index]));
      a = temp;
    }
    a0 = add(a0, a); b0 = add(b0, b); c0 = add(c0, c); d0 = add(d0, d);
  }
  return [a0, b0, c0, d0].flatMap((word) => [word & 0xff, (word >>> 8) & 0xff, (word >>> 16) & 0xff, (word >>> 24) & 0xff]).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
