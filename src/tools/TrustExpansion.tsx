import {
  AlertTriangle,
  ArrowLeftRight,
  AudioLines,
  BatteryCharging,
  Brain,
  CheckCircle2,
  Copy,
  BookOpen,
  Cpu,
  Database,
  Download,
  FileText,
  Globe2,
  Heart,
  Info,
  Laptop,
  Languages,
  Monitor,
  Network,
  RefreshCcw,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  Wifi,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { InternetAccessGate } from "../components/InternetAccessGate";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import { copyText } from "../lib/clipboard";
import { openExternalTarget } from "../lib/nativeSystem";
import { previewSoundTheme } from "../lib/sound";
import { APP_NAME, APP_VERSION } from "../lib/appInfo";
import { trustFileTargets, trustLinks } from "../lib/trustLinks";
import {
  clearAllLocalData,
  clearClipboardLocalData,
  clearHistoryLocalData,
  downloadLocalDataSnapshot,
  importLocalDataSnapshot
} from "../lib/localData";
import { useInterval } from "../hooks/useInterval";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { upsertHistoryEntry } from "../lib/history";
import { generateOpenAiText, openAiConfigured } from "../lib/ai";
import type { ToolProps } from "../types/tools";

type DeviceRow = {
  id: string;
  name: string;
  ip: string;
  kind: string;
  status: "online" | "offline" | "unknown";
  confidence: number;
};

type RemovalRequest = {
  id: string;
  label: string;
  status: "planned" | "sent" | "resolved";
  notes: string;
};

const languages = [
  ["auto", "Auto"],
  ["en", "English"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["de", "German"],
  ["it", "Italian"],
  ["pt", "Portuguese"],
  ["nl", "Dutch"],
  ["pl", "Polish"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["zh", "Chinese"]
] as const;

const trustIds = new Set(["trust-center"]);
const monitoringIds = new Set(["wifi-connected-devices-viewer", "system-device-information-dashboard"]);
const privacySearchIds = new Set(["private-information-exposure-search"]);
const customizationIds = new Set(["appearance-studio"]);
const soundDesignIds = new Set(["sound-design-studio"]);
const aiIds = new Set(["ai-translator", "text-formalizer", "popular-error-resolver"]);

export function TrustExpansion({ toolId }: ToolProps) {
  if (trustIds.has(toolId)) return <TrustCenter />;
  if (monitoringIds.has(toolId)) return <SystemMonitoring toolId={toolId} />;
  if (privacySearchIds.has(toolId)) return <PrivacyExposureSearch toolId={toolId} />;
  if (customizationIds.has(toolId)) return <AppearanceStudio />;
  if (soundDesignIds.has(toolId)) return <SoundDesignStudio />;
  if (aiIds.has(toolId)) return <TrustAiTools toolId={toolId} />;
  return <TrustCenter />;
}

function TrustCenter() {
  const { toast } = useToast();
  const [page, setPage] = useLocalStorage("quality-life:trust-center-page", "mission");

  const pages = [
    ["mission", "Our mission"],
    ["privacy", "Privacy policy"],
    ["local-data", "Local data"],
    ["transparency", "Transparency"],
    ["permissions", "Permissions"],
    ["about", "About"],
    ["first-launch", "First launch"]
  ] as const;

  return (
    <ToolFrame
      footer={<Status active label={`Quality life ${APP_VERSION} | private, local-first, update-ready`} />}
    >
      <div className="trust-doc-hero">
        <Shield size={34} aria-hidden="true" />
        <div>
          <span className="eyebrow">Trust Center</span>
          <h3>{APP_NAME}</h3>
          <p>One calm place for mission, privacy, local data, transparency, permissions, and first-launch trust.</p>
        </div>
      </div>

      <div className="trust-tabs" role="tablist" aria-label="Trust center pages">
        {pages.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={page === value ? "chip selected" : "chip"}
            onClick={() => setPage(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {page === "mission" && <MissionPage />}
      {page === "privacy" && <PrivacyPolicyPage />}
      {page === "local-data" && <LocalDataPage />}
      {page === "transparency" && <TransparencyPage />}
      {page === "permissions" && <PermissionsPage />}
      {page === "about" && <AboutTrustPage />}
      {page === "first-launch" && <FirstLaunchPreview />}

      <div className="action-strip compact-actions">
        <button className="secondary-action" type="button" onClick={() => window.dispatchEvent(new CustomEvent("quality-life-open-settings"))}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          Open settings
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={async () => {
            await copyText(`${APP_NAME} ${APP_VERSION}`);
            toast("Version copied", { tone: "success" });
          }}
        >
          <Copy size={16} aria-hidden="true" />
          Copy version
        </button>
      </div>
      <div className="native-note">
        <Heart size={16} aria-hidden="true" />
        <code>No analytics, no accounts, no hidden tracking, and no paywalls.</code>
      </div>
    </ToolFrame>
  );
}

function MissionPage() {
  return (
    <section className="trust-doc-page">
      <p>
        Quality life exists because small computer problems should not take over your day. The goal is to keep tiny
        annoying tasks inside one calm place so you do not need fifty separate apps just to copy text, check a file,
        make a QR code, or protect a download.
      </p>
      <p>
        Privacy matters here. Most tools work locally, the app does not sell user data, and there are no ads, paywalls,
        locked features, or subscriptions hiding behind the interface.
      </p>
    </section>
  );
}

function PrivacyPolicyPage() {
  return (
    <section className="trust-doc-page">
      <p>
        Data stays local by default: settings, pinned tools, recent tools, clipboard history, notes, password vault
        data, saved media, history search data, and appearance preferences are stored on this device.
      </p>
      <p>
        Some tools may need internet only when you explicitly ask them to open or fetch a public URL. Clipboard,
        history, and password data stay on-device, and password vault data is encrypted locally before saving.
        If you turn on OpenAI for AI tools, the text you submit for that tool is sent to OpenAI only for that request.
      </p>
      <p className="muted-line">
        This is not legal advice. Replace with a lawyer-reviewed policy before public release.
      </p>
    </section>
  );
}

function LocalDataPage() {
  const { toast } = useToast();
  const [importText, setImportText] = useState("");
  const localItems = [
    "Settings",
    "Pinned tools",
    "Recent tools",
    "Clipboard history if enabled",
    "Optional OpenAI API key and model choice if you enable real AI",
    "Local Smart Search learning from your tool picks",
    "Notes",
    "Password vault",
    "Saved media",
    "History search data",
    "Appearance preferences"
  ];

  return (
    <section className="trust-doc-page">
      <div className="mini-grid">
        {localItems.map((item) => (
          <div className="trust-fact" key={item}>
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="action-strip compact-actions">
        <button className="secondary-action" type="button" onClick={() => { clearHistoryLocalData(); toast("Local history cleared", { tone: "success" }); }}>
          Clear local history
        </button>
        <button className="secondary-action" type="button" onClick={() => { clearClipboardLocalData(); toast("Clipboard history cleared", { tone: "success" }); }}>
          Clear clipboard history
        </button>
        <button className="secondary-action" type="button" onClick={() => { downloadLocalDataSnapshot(); toast("Local data exported", { tone: "success" }); }}>
          Export local data
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={() => {
            try {
              importLocalDataSnapshot(importText);
              toast("Local data imported", { tone: "success" });
            } catch {
              toast("Import failed", { tone: "error", message: "Paste valid JSON first." });
            }
          }}
        >
          Import local data
        </button>
        <button
          className="danger-action"
          type="button"
          onClick={() => {
            clearAllLocalData();
            window.location.reload();
          }}
        >
          Reset all app data
        </button>
      </div>
      <label className="field">
        <span>Paste backup JSON for import</span>
        <textarea rows={6} value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste a local data backup here..." />
      </label>
    </section>
  );
}

function TransparencyPage() {
  const { toast } = useToast();
  const snippets = [
    {
      title: "Tool registry",
      explanation: "Tools are defined in one registry and loaded lazily so the app stays small and easy to inspect.",
      code: `const availableTools = toolRegistry.filter((tool) => !tool.requiresDesktop || isTauriRuntime());`
    },
    {
      title: "Local storage",
      explanation: "Settings and tool state use local storage so they stay on this device.",
      code: `const [value, setValue] = useLocalStorage(key, initialValue);`
    },
    {
      title: "Offline mode logic",
      explanation: "Internet work is guarded so local tools keep working without network access.",
      code: `if (settings.offlineMode || settings.blockExternalRequests) return toast("External requests are blocked");`
    },
    {
      title: "No telemetry config",
      explanation: "The app uses local storage and explicit actions instead of background analytics or tracking.",
      code: `window.localStorage.setItem("quality-life:settings", JSON.stringify(settings));`
    },
    {
      title: "Password vault encryption",
      explanation: "The vault encrypts entries locally before saving them.",
      code: `const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(entries)));`
    },
    {
      title: "History deletion",
      explanation: "History entries can be cleared locally at any time.",
      code: `export function clearHistoryEntries() { writeHistoryEntries([]); }`
    }
  ];

  return (
    <section className="trust-doc-page">
      {snippets.map((snippet) => (
        <article className="code-sample" key={snippet.title}>
          <div className="utility-title">
            <FileText size={16} aria-hidden="true" />
            <strong>{snippet.title}</strong>
          </div>
          <p>{snippet.explanation}</p>
          <pre>{snippet.code}</pre>
          <div className="action-strip compact-actions">
            <button className="secondary-action" type="button" onClick={async () => copyText(snippet.code)}>
              <Copy size={15} aria-hidden="true" />
              Copy
            </button>
            <button className="secondary-action" type="button" onClick={() => toast("Open full file", { tone: "info", message: "TODO: connect this to the source file." })}>
              Open full file
            </button>
            <button className="secondary-action" type="button" onClick={() => toast("Open GitHub repository", { tone: "info", message: "TODO: connect the repository link." })}>
              Open GitHub repository
            </button>
          </div>
        </article>
      ))}

      <article className="code-sample">
        <div className="utility-title">
          <BookOpen size={16} aria-hidden="true" />
          <strong>Where to connect full files and links</strong>
        </div>
        <p>
          Edit <code>src/lib/trustLinks.ts</code> to wire your public repository, website, issue tracker, and source browser URLs. The file targets below are the main code places this Trust Center points at.
        </p>
        <div className="trust-link-row">
          {Object.entries(trustLinks).map(([label, value]) => (
            <button className="chip" type="button" key={label} onClick={() => copyText(`${label}: ${value}`)}>
              {label}
            </button>
          ))}
        </div>
        <div className="trust-files">
          {trustFileTargets.map((item) => (
            <section className="trust-file-card" key={item.file}>
              <strong>{item.label}</strong>
              <code>{item.file}</code>
              <span>{item.note}</span>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}

function PermissionsPage() {
  const rows = [
    {
      name: "Clipboard access",
      why: "Needed for clipboard history, copy buttons, and paste helpers.",
      tools: "Clipboard History, Quick Utilities, Password Vault, many copy actions",
      optional: "Yes",
      disable: "Turn off clipboard watching in Clipboard History and disable clipboard-related features in Settings."
    },
    {
      name: "File access",
      why: "Needed for file search, renaming, duplicate scanning, and local media management.",
      tools: "Files tools, Offline Media, screenshot and export flows",
      optional: "Yes",
      disable: "Only use tools that do not require selecting files or folders."
    },
    {
      name: "Network access",
      why: "Needed only for public searches, direct downloads, and user-approved web requests.",
      tools: "Privacy Search, Offline Article Saver, Video Save / Offline Viewer",
      optional: "Yes",
      disable: "Keep offline mode on and block external requests in Settings."
    },
    {
      name: "Notifications",
      why: "Used for timer completions and gentle reminders.",
      tools: "Pomodoro, Tiny Timers, reminders",
      optional: "Yes",
      disable: "Turn off app sounds and avoid reminder tools if you do not want notifications."
    },
    {
      name: "Accessibility/input access",
      why: "Needed for native automation features that act outside the app window.",
      tools: "Auto Clicker, Mouse Jiggler, Special Key Launcher, Always On Top",
      optional: "Yes",
      disable: "Use browser-safe or local-only tools if you do not grant desktop access."
    },
    {
      name: "Microphone/camera",
      why: "Needed only for tools that request those devices explicitly.",
      tools: "Mic/Webcam Quick Toggle, screenshot or media tools where supported",
      optional: "Yes",
      disable: "Do not start those tools if you do not want device access."
    }
  ];

  return (
    <section className="trust-doc-page">
      <div className="permissions-grid">
        {rows.map((row) => (
          <article className="permission-card" key={row.name}>
            <strong>{row.name}</strong>
            <p>{row.why}</p>
            <p><span>Used by:</span> {row.tools}</p>
            <p><span>Optional:</span> {row.optional}</p>
            <p><span>Disable:</span> {row.disable}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutTrustPage() {
  const { toast } = useToast();
  return (
    <section className="trust-doc-page">
      <div className="about-hero trust-hero">
        <Shield size={34} aria-hidden="true" />
        <div>
          <span className="eyebrow">About Quality life</span>
          <h3>{APP_NAME}</h3>
          <p>{APP_VERSION} • Free forever • No ads • No telemetry • No subscriptions</p>
        </div>
      </div>
      <div className="trust-link-row">
        {[
          ["Website", trustLinks.websiteUrl],
          ["GitHub", trustLinks.repositoryUrl],
          ["Privacy Policy", trustLinks.privacyPolicyUrl],
          ["Report Issue", trustLinks.issueUrl],
          ["Suggest Feature", trustLinks.suggestFeatureUrl]
        ].map(([label, target]) => (
          <button className="chip" type="button" key={label} onClick={() => toast(`${label} link`, { tone: "info", message: String(target) })}>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function FirstLaunchPreview() {
  return (
    <section className="trust-doc-page">
      <div className="trust-doc-hero">
        <ShieldCheck size={30} aria-hidden="true" />
        <div>
          <span className="eyebrow">First launch</span>
          <h3>What to expect</h3>
          <p>Local-first tools, no account needed, no ads or paywalls, user-controlled data, and internet prompts before web actions.</p>
        </div>
      </div>
      <div className="trust-link-row">
        <span className="pill">Local only</span>
        <span className="pill">No account</span>
        <span className="pill">Internet asks first</span>
      </div>
    </section>
  );
}


function TrustAiTools({ toolId }: { toolId: string }) {
  if (toolId === "ai-translator") return <AiTranslator />;
  if (toolId === "text-formalizer") return <TextFormalizer />;
  return <PopularErrorResolver />;
}

function AiTranslator() {
  const [input, setInput] = useLocalStorage("quality-life:ai-translator:input", "Hello, can you help me with this?");
  const [source, setSource] = useLocalStorage("quality-life:ai-translator:source", "auto");
  const [target, setTarget] = useLocalStorage("quality-life:ai-translator:target", "es");
  const [output, setOutput] = useLocalStorage("quality-life:ai-translator:output", "");
  const { toast } = useToast();
  const { settings } = useSettings();
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<null | { source: string; target: string; input: string }>(null);
  const [busy, setBusy] = useState(false);

  const detected = useMemo(() => detectLanguage(input), [input]);
  const targetLabel = labelFor(target);

  useEffect(() => {
    setOutput(buildTranslationPreview(input, source, target, detected));
  }, [detected, input, setOutput, source, target]);

  const runTranslation = async (sourceLang: string, targetLang: string, text: string) => {
    if (openAiConfigured(settings)) {
      setBusy(true);
      try {
        const translated = await generateOpenAiText({
          settings,
          systemPrompt: "You translate text accurately and naturally. Detect the source language if the user selected auto. Return only the translated text.",
          userPrompt: `Source language: ${sourceLang}\nTarget language: ${targetLang}\nText:\n${text}`
        });
        setOutput(translated);
        toast("Translation ready", { tone: "success", message: "Generated with OpenAI after your confirmation." });
        return;
      } catch (error) {
        toast("AI translation failed", {
          tone: "error",
          message: error instanceof Error ? error.message : "OpenAI could not translate this right now."
        });
      } finally {
        setBusy(false);
      }
    }

    const resolvedSource = sourceLang === "auto" ? (detected.code === "auto" ? "en" : detected.code) : sourceLang;
    const request = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${resolvedSource}|${targetLang}`;
    try {
      setBusy(true);
      const response = await fetch(request);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json() as { responseData?: { translatedText?: string } };
      const translated = data.responseData?.translatedText?.trim();
      if (!translated) {
        throw new Error("No translation was returned.");
      }
      setOutput(translated);
      toast("Translation ready", { tone: "success", message: "Fetched from a public translation service after your confirmation." });
    } catch (error) {
      const fallback = buildTranslationPreview(text, sourceLang, targetLang, detected);
      setOutput(fallback);
      toast("Translation fell back", {
        tone: "info",
        message: error instanceof Error ? error.message : "The public translator was unavailable."
      });
    } finally {
      setBusy(false);
    }
  };

  const translate = () => {
    if (!input.trim()) {
      toast("Add text first", { tone: "error" });
      return;
    }
    if (settings.offlineMode || settings.blockExternalRequests) {
      setOutput(buildTranslationPreview(input, source, target, detected));
      toast("Internet is blocked", { tone: "error", message: "The app stayed offline and used a local preview instead." });
      return;
    }
    if (settings.askBeforeInternetAccess) {
      setPending({ source, target, input });
      setGateOpen(true);
      return;
    }
    void runTranslation(source, target, input);
  };

  return (
    <ToolFrame footer={<Status active label={openAiConfigured(settings) ? "OpenAI translation is enabled" : "Local preview with optional internet translation"} />}>
      <BadgeRow values={openAiConfigured(settings) ? ["Internet required", "Optional permission"] : ["Internet needed", "Local inputs only"]} />
      <div className="tool-grid two">
        <label className="field">
          <span>Source language</span>
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            {languages.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Target language</span>
          <select value={target} onChange={(event) => setTarget(event.target.value)}>
            {languages.filter(([value]) => value !== "auto").map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="action-strip compact-actions">
        <button
          className="secondary-action"
          type="button"
          onClick={() => {
            const nextSource = target;
            const nextTarget = source === "auto" ? "en" : source;
            setSource(nextSource);
            setTarget(nextTarget);
          }}
          >
            <ArrowLeftRight size={16} aria-hidden="true" />
            Swap languages
          </button>
        <button className="primary-action" type="button" onClick={translate} disabled={busy}>
          <Languages size={16} aria-hidden="true" />
          {busy ? "Translating..." : "Translate"}
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={async () => {
            await copyText(output);
            toast("Translation copied", { tone: "success" });
          }}
        >
          <Copy size={16} aria-hidden="true" />
          Copy translated text
        </button>
      </div>
      <div className="tool-grid two">
        <label className="field">
          <span>Input text</span>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={10} />
        </label>
        <label className="field">
          <span>Preview output</span>
          <textarea value={output} readOnly rows={10} />
        </label>
      </div>
      <div className="native-note">
        <Brain size={16} aria-hidden="true" />
        <code>{`Detected: ${detected.label}. Target: ${targetLabel}. The exact text you entered is only sent after your confirmation.`}</code>
      </div>
      <InternetAccessGate
        open={gateOpen}
        title="Translate text online"
        domain="api.mymemory.translated.net"
        why="A public translator can turn the text into another language when you ask it to."
        whatLeaves="The text you typed, plus the source and target language codes, are sent to the public translation service."
        storesLocal="Your text, translation history, and settings stay on this device unless you copy or export them."
        onCancel={() => setGateOpen(false)}
        onContinue={() => {
          setGateOpen(false);
          if (pending) {
            void runTranslation(pending.source, pending.target, pending.input);
          }
        }}
      />
    </ToolFrame>
  );
}

function TextFormalizer() {
  const [text, setText] = useLocalStorage("quality-life:text-formalizer:text", "hey can we push this later?");
  const [mode, setMode] = useLocalStorage("quality-life:text-formalizer:mode", "Professional");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { settings } = useSettings();

  useEffect(() => {
    setResult(formalizeText(text, mode));
  }, [mode, text]);

  const useRealAi = async () => {
    if (!openAiConfigured(settings)) {
      setResult(formalizeText(text, mode));
      return;
    }
    try {
      setBusy(true);
      const rewritten = await generateOpenAiText({
        settings,
        systemPrompt: "You rewrite user text to sound professional while preserving meaning. Return only the rewritten text.",
        userPrompt: `Mode: ${mode}\nText:\n${text}`
      });
      setResult(rewritten);
      toast("Formal rewrite ready", { tone: "success", message: "Generated with OpenAI." });
    } catch (error) {
      toast("AI rewrite failed", {
        tone: "error",
        message: error instanceof Error ? error.message : "OpenAI could not rewrite this right now."
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame footer={<Status active label={openAiConfigured(settings) ? "OpenAI rewriting is enabled" : "Local rewrite rules with meaning preserved"} />}>
      <BadgeRow values={openAiConfigured(settings) ? ["Internet required", "Optional permission"] : ["Works offline", "Local only"]} />
      <label className="field">
        <span>Mode</span>
        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          {["Professional", "Academic", "Business", "Friendly formal", "Short formal"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <div className="tool-grid two">
        <label className="field">
          <span>Original text</span>
          <textarea rows={10} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="field">
          <span>Formal version</span>
          <textarea rows={10} value={result} readOnly />
        </label>
      </div>
      <div className="action-strip compact-actions">
        <button className="primary-action fit-action" type="button" onClick={() => void useRealAi()} disabled={busy}>
          <Sparkles size={16} aria-hidden="true" />
          {busy ? "Rewriting..." : openAiConfigured(settings) ? "Rewrite with OpenAI" : "Refresh local rewrite"}
        </button>
        <button className="secondary-action fit-action" type="button" onClick={async () => { await copyText(result); toast("Formal text copied", { tone: "success" }); }}>
          <Copy size={16} aria-hidden="true" />
          Copy rewritten text
        </button>
      </div>
    </ToolFrame>
  );
}

function PopularErrorResolver() {
  const [query, setQuery] = useLocalStorage("quality-life:error-resolver:query", "Error 0x80070057");
  const [category, setCategory] = useState("Auto");
  const [aiSummary, setAiSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const { settings } = useSettings();
  const { toast } = useToast();
  const analysis = useMemo(() => resolveError(query, category), [category, query]);

  const analyzeWithAi = async () => {
    if (!openAiConfigured(settings)) {
      setAiSummary("");
      toast("OpenAI is not enabled", { tone: "error", message: "Turn on OpenAI in Settings to use real AI for this tool." });
      return;
    }
    try {
      setBusy(true);
      const summary = await generateOpenAiText({
        settings,
        systemPrompt: "You help users understand common computer or app error messages safely. Explain what the error usually means, likely causes, safe fixes, and advanced fixes. Be careful, practical, and calm.",
        userPrompt: `Category: ${category}\nError text:\n${query}`
      });
      setAiSummary(summary);
      toast("AI help ready", { tone: "success", message: "Generated with OpenAI." });
    } catch (error) {
      toast("AI help failed", {
        tone: "error",
        message: error instanceof Error ? error.message : "OpenAI could not analyze this error."
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame footer={<Status active label={openAiConfigured(settings) ? "OpenAI analysis available" : "Safe fixes first, advanced fixes clearly separated"} />}>
      <BadgeRow values={openAiConfigured(settings) ? ["Internet required", "Optional permission"] : ["Works offline", "Local only"]} />
      <div className="tool-grid two">
        <label className="field">
          <span>Error text or code</span>
          <textarea rows={6} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {["Auto", "Windows", "Steam", "Drivers", "Games", "Browsers", "Programming", "Network"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mini-grid">
        <section className="utility-card compact-card">
          <div className="utility-title"><ShieldCheck size={17} /><strong>What it usually means</strong></div>
          <span className="muted-line">{analysis.summary}</span>
        </section>
        <section className="utility-card compact-card">
          <div className="utility-title"><AlertTriangle size={17} /><strong>Common causes</strong></div>
          <span className="muted-line">{analysis.causes.join(" • ")}</span>
        </section>
      </div>
      <div className="tool-grid two">
        <InfoBlock title="Safe fixes" icon={Shield} items={analysis.safeFixes} />
        <InfoBlock title="Advanced fixes" icon={Sparkles} items={analysis.advancedFixes} />
      </div>
      <div className="action-strip compact-actions">
        <button className="primary-action fit-action" type="button" onClick={() => void analyzeWithAi()} disabled={busy}>
          <Sparkles size={16} aria-hidden="true" />
          {busy ? "Analyzing..." : openAiConfigured(settings) ? "Analyze with OpenAI" : "Enable OpenAI analysis"}
        </button>
      </div>
      {aiSummary && (
        <section className="utility-card compact-card">
          <div className="utility-title"><Sparkles size={17} /><strong>AI explanation</strong></div>
          <pre>{aiSummary}</pre>
        </section>
      )}
      {analysis.warning && (
        <div className="native-note">
          <AlertTriangle size={16} aria-hidden="true" />
          <code>{analysis.warning}</code>
        </div>
      )}
    </ToolFrame>
  );
}

function SystemMonitoring({ toolId }: { toolId: string }) {
  if (toolId === "wifi-connected-devices-viewer") return <WifiConnectedDevicesViewer />;
  return <SystemDashboard />;
}

function WifiConnectedDevicesViewer() {
  const [devices, setDevices] = useLocalStorage<DeviceRow[]>("quality-life:wifi-devices", [
    { id: "1", name: "Desk Laptop", ip: "192.168.1.12", kind: "Laptop", status: "online", confidence: 92 },
    { id: "2", name: "Phone", ip: "192.168.1.20", kind: "Phone", status: "online", confidence: 88 },
    { id: "3", name: "Living Room TV", ip: "192.168.1.31", kind: "TV", status: "unknown", confidence: 63 }
  ]);
  const { toast } = useToast();

  const refresh = () => {
    setDevices((current) =>
      current.map((device, index) => ({
        ...device,
        status: index === 2 ? "unknown" : Math.random() > 0.75 ? "offline" : "online",
        confidence: Math.max(45, Math.min(99, device.confidence + (Math.random() > 0.5 ? 2 : -3)))
      }))
    );
    toast("Local scan refreshed", { tone: "success", message: "Native network scanning is still a TODO." });
  };

  return (
    <ToolFrame footer={<Status active label={`${devices.length} network entries in the local view`} />}>
      <BadgeRow values={["Local only", "Native integration needed"]} />
      <div className="action-strip compact-actions">
        <button className="primary-action" type="button" onClick={refresh}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh scan
        </button>
        <button className="secondary-action" type="button" onClick={() => setDevices((current) => current.map((device) => ({ ...device, status: "unknown" })))}>
          <Network size={16} aria-hidden="true" />
          Mark unknowns
        </button>
      </div>
      <div className="scroll-list">
        {devices.map((device) => (
          <section className={`utility-card compact-card ${device.status === "unknown" ? "warning-card" : ""}`} key={device.id}>
            <div className="utility-title">
              <Wifi size={17} aria-hidden="true" />
              <strong>{device.name}</strong>
            </div>
            <span className="muted-line">{device.ip} | {device.kind} | {device.status} | confidence {device.confidence}%</span>
            {device.status === "unknown" && <div className="native-note"><AlertTriangle size={15} /><code>Unknown devices are highlighted for manual review.</code></div>}
          </section>
        ))}
      </div>
      <div className="native-note">
        <Info size={16} aria-hidden="true" />
        <code>TODO: connect native network scanning and device identification through Tauri.</code>
      </div>
    </ToolFrame>
  );
}

function SystemDashboard() {
  const [stats, setStats] = useState(createSystemSnapshot());
  useInterval(() => setStats(createSystemSnapshot()), 1400);

  return (
    <ToolFrame footer={<Status active label={`${stats.health.label} system health`} />}>
      <BadgeRow values={["Local only", "Native integration needed"]} />
      <div className="mini-grid">
        <StatCard icon={Cpu} label="CPU" value={`${stats.cpu}%`} tone={stats.cpu > 78 ? "warn" : "ok"} />
        <StatCard icon={Database} label="RAM" value={`${stats.ram}%`} tone={stats.ram > 80 ? "warn" : "ok"} />
        <StatCard icon={BatteryCharging} label="Battery" value={stats.battery} tone={stats.battery === "plugged" ? "ok" : "info"} />
        <StatCard icon={Laptop} label="Device" value={stats.deviceName} tone="info" />
        <StatCard icon={Monitor} label="OS" value={stats.osVersion} tone="info" />
        <StatCard icon={Network} label="Network" value={stats.networkSpeed} tone="info" />
      </div>
      <div className="mini-grid">
        <ProgressPanel title="CPU usage" value={stats.cpu} />
        <ProgressPanel title="RAM usage" value={stats.ram} />
        <ProgressPanel title="Storage usage" value={stats.storage} />
        <ProgressPanel title="Temperature" value={stats.temperature} />
      </div>
      <div className="native-note">
        <AlertTriangle size={16} aria-hidden="true" />
        <code>GPU, fan speed, temperature, and live charts are lightweight placeholders until native Tauri sensors are connected.</code>
      </div>
      {/* TODO: connect native system sensors, battery, temperatures, GPU, fan speed, and real network throughput. */}
    </ToolFrame>
  );
}

function PrivacyExposureSearch({ toolId }: { toolId: string }) {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [email, setEmail] = useLocalStorage(`${toolId}:email`, "");
  const [username, setUsername] = useLocalStorage(`${toolId}:username`, "");
  const [phone, setPhone] = useLocalStorage(`${toolId}:phone`, "");
  const [name, setName] = useLocalStorage(`${toolId}:name`, "");
  const [aliases, setAliases] = useLocalStorage(`${toolId}:aliases`, "");
  const [requests, setRequests] = useLocalStorage<RemovalRequest[]>(`${toolId}:requests`, []);
  const [consent, setConsent] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState("");

  const searchLabel = [email, username, phone, name, aliases].filter(Boolean).join(" · ") || "No search term yet";

  const query = [email, username, phone, name, aliases].filter(Boolean).join(" OR ");

  const runSearch = async () => {
    if (!query) {
      toast("Add at least one search value", { tone: "error" });
      return;
    }
    if (settings.offlineMode || settings.blockExternalRequests) {
      toast("External requests are blocked", { tone: "error", message: "Turn that off in Settings if you want to open public search pages." });
      return;
    }
    if (!consent) {
      toast("Consent needed", { tone: "error", message: "Turn on the consent checkbox first." });
      return;
    }
    if (settings.askBeforeInternetAccess) {
      setPendingQuery(query);
      setGateOpen(true);
      return;
    }
    await openSearch(query);
  };

  const openSearch = async (searchQuery: string) => {
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}+data+broker`;
    await openExternalTarget("website", url);
    upsertHistoryEntry({
      kind: "websites",
      source: "Private Information Exposure Search",
      title: `Public search: ${searchLabel}`,
      preview: "Opened a public search in the browser",
      url,
      toolId
    }, `privacy-search:${query}`);
    toast("Search opened", { tone: "success", message: "Only the exact query you chose left the device." });
  };

  return (
    <ToolFrame footer={<Status active label="Public searches are explicit and user-controlled" />}>
      <BadgeRow values={["Internet needed", "Local only"]} />
      <div className="privacy-status live">
        <Search size={24} aria-hidden="true" />
        <div>
          <strong>Privacy search plan</strong>
          <span>Search only the fields you explicitly choose. Nothing is queried until you click the button and confirm.</span>
        </div>
      </div>
      <div className="tool-grid two">
        <label className="field"><span>Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="field"><span>Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label className="field"><span>Phone</span><input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label className="field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="field"><span>Known aliases</span><input value={aliases} onChange={(event) => setAliases(event.target.value)} /></label>
        <label className="field"><span>Consent</span><label className="toggle-card"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I want to open a public search</span></label></label>
      </div>
      <div className="action-strip compact-actions">
        <button className="primary-action" type="button" onClick={() => void runSearch()}>
          <Globe2 size={16} aria-hidden="true" />
          Open public search
        </button>
        <button className="secondary-action" type="button" onClick={() => setRequests((current) => [{ id: crypto.randomUUID(), label: searchLabel, status: "planned", notes: "Ask the site for removal if needed." }, ...current])}>
          <Sparkles size={16} aria-hidden="true" />
          Save removal note
        </button>
      </div>
      <div className="mini-grid">
        <section className="utility-card compact-card">
          <div className="utility-title"><ShieldCheck size={17} /><strong>What may leave the device</strong></div>
          <span className="muted-line">Only the search terms you typed and the public lookup page you chose to open.</span>
        </section>
        <section className="utility-card compact-card">
          <div className="utility-title"><AlertTriangle size={17} /><strong>Removal steps</strong></div>
          <span className="muted-line">Use the public site's removal request page, keep a copy of the request, and mark it resolved here when done.</span>
        </section>
      </div>
      <div className="scroll-list">
        {requests.map((request) => (
          <section className="utility-card compact-card" key={request.id}>
            <div className="utility-title">
              <Shield size={17} aria-hidden="true" />
              <strong>{request.label}</strong>
            </div>
            <span className="muted-line">{request.status} | {request.notes}</span>
            <div className="action-strip compact-actions">
              <button className="secondary-action" type="button" onClick={() => setRequests((current) => current.map((item) => (item.id === request.id ? { ...item, status: "sent" } : item)))}>
                Mark sent
              </button>
              <button className="secondary-action" type="button" onClick={() => setRequests((current) => current.map((item) => (item.id === request.id ? { ...item, status: "resolved" } : item)))}>
                Mark resolved
              </button>
              <button className="icon-button" type="button" aria-label="Delete request" onClick={() => setRequests((current) => current.filter((item) => item.id !== request.id))}>
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          </section>
        ))}
      </div>
      <div className="native-note">
        <Network size={16} aria-hidden="true" />
        <code>Internet use is explicit, and searches are not stored unless you save them as a local removal note.</code>
      </div>
      <InternetAccessGate
        open={gateOpen}
        title="Open public privacy search?"
        domain="duckduckgo.com"
        why="This opens a public search page for the terms you typed."
        whatLeaves="Only the query text you entered is sent to the search engine."
        storesLocal="Removal notes, history data, and the app itself stay on this device."
        onCancel={() => setGateOpen(false)}
        onContinue={async () => {
          setGateOpen(false);
          await openSearch(pendingQuery);
        }}
      />
      {/* TODO: add trusted public data-broker and leak-style search APIs only after the user explicitly enables them. */}
    </ToolFrame>
  );
}

function AppearanceStudio() {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <ToolFrame footer={<Status active label="Display controls stay local" />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="tool-grid two">
        <label className="field">
          <span>Card size</span>
          <select value={settings.cardSize} onChange={(event) => updateSettings({ cardSize: event.target.value as typeof settings.cardSize })}>
            {["compact", "balanced", "airy"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Sidebar style</span>
          <select value={settings.sidebarStyle} onChange={(event) => updateSettings({ sidebarStyle: event.target.value as typeof settings.sidebarStyle })}>
            {["calm", "minimal", "floating"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <p className="section-note">Text size stays at the smallest comfortable scale automatically so the layout stays tidy.</p>
      <div className="tool-grid two">
        <label className="toggle-card"><input type="checkbox" checked={settings.calmMode} onChange={(event) => updateSettings({ calmMode: event.target.checked })} /><span>Calm mode</span></label>
        <label className="toggle-card"><input type="checkbox" checked={settings.minimalMode} onChange={(event) => updateSettings({ minimalMode: event.target.checked })} /><span>Minimal mode</span></label>
        <label className="toggle-card"><input type="checkbox" checked={settings.reducedAnimations} onChange={(event) => updateSettings({ reducedAnimations: event.target.checked })} /><span>Reduced animations</span></label>
        <label className="toggle-card"><input type="checkbox" checked={settings.launchAtStartup} onChange={(event) => updateSettings({ launchAtStartup: event.target.checked })} /><span>Startup behavior placeholder</span></label>
      </div>
      <button className="secondary-action fit-action" type="button" onClick={() => resetSettings()}>
        <RefreshCcw size={16} aria-hidden="true" />
        Reset layout
      </button>
    </ToolFrame>
  );
}

function SoundDesignStudio() {
  const { settings, updateSettings } = useSettings();

  return (
    <ToolFrame footer={<Status active label={settings.soundsEnabled ? `${settings.soundTheme} sounds ready` : "Sounds are muted"} />}>
      <BadgeRow values={["Works offline", "Local only"]} />
      <div className="tool-grid two">
        <section className="utility-card compact-card">
          <div className="utility-title"><AudioLines size={17} /><strong>Sound theme</strong></div>
          <div className="theme-grid">
            {(["soft", "minimal", "nature", "silent"] as const).map((theme) => (
              <button
                key={theme}
                className={settings.soundTheme === theme ? "theme-swatch active" : "theme-swatch"}
                type="button"
                onClick={() => updateSettings({ soundTheme: theme })}
              >
                <span style={{ background: soundThemeColor(theme) }} />
                {theme}
              </button>
            ))}
          </div>
        </section>
        <section className="utility-card compact-card">
          <div className="utility-title"><Volume2 size={17} /><strong>Volume</strong></div>
          <label className="toggle-card"><input type="checkbox" checked={settings.soundsEnabled} onChange={(event) => updateSettings({ soundsEnabled: event.target.checked })} /><span>Enable app sounds</span></label>
          <label className="field">
            <span>Sound volume</span>
            <input type="range" min={0} max={100} value={settings.soundVolume} onChange={(event) => updateSettings({ soundVolume: Number(event.target.value) || 0 })} />
          </label>
        </section>
      </div>
      <div className="action-strip compact-actions">
        {(["soft", "minimal", "nature"] as const).map((theme) => (
          <button className="secondary-action" type="button" key={theme} onClick={() => previewSoundTheme(theme, settings.soundVolume)}>
            <AudioLines size={16} aria-hidden="true" />
            Preview {theme}
          </button>
        ))}
      </div>
      <div className="native-note">
        <Info size={16} aria-hidden="true" />
        <code>Sound effects are tiny synth tones, optional, and fully local.</code>
      </div>
    </ToolFrame>
  );
}

function BadgeRow({ values }: { values: readonly string[] }) {
  return (
    <div className="status-row">
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

function InfoBlock({ title, icon: Icon, items }: { title: string; icon: LucideIcon; items: string[] }) {
  return (
    <section className="utility-card compact-card">
      <div className="utility-title">
        <Icon size={17} aria-hidden="true" />
        <strong>{title}</strong>
      </div>
      <div className="todo-list">
        {items.map((item) => (
          <div className="todo-row" key={item}>{item}</div>
        ))}
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: "ok" | "warn" | "info" }) {
  return (
    <section className={`utility-card compact-card stat-card ${tone}`}>
      <div className="utility-title">
        <Icon size={17} aria-hidden="true" />
        <strong>{label}</strong>
      </div>
      <strong className="stat-value">{value}</strong>
    </section>
  );
}

function ProgressPanel({ title, value }: { title: string; value: number }) {
  return (
    <section className="utility-card compact-card">
      <div className="utility-title">
        <strong>{title}</strong>
      </div>
      <div className="meter">
        <span style={{ width: `${Math.max(8, Math.min(100, value))}%` }} />
      </div>
    </section>
  );
}

function detectLanguage(text: string) {
  const sample = text.toLowerCase();
  if (!sample.trim()) return { code: "auto", label: "Auto" };
  if (/[¿¡ñáéíóú]/i.test(text) || /\b(hola|gracias|mañana|usted)\b/i.test(sample)) return { code: "es", label: "Spanish" };
  if (/[àâçéèêëîïôùûü]/i.test(text) || /\b(bonjour|merci|vous|être)\b/i.test(sample)) return { code: "fr", label: "French" };
  if (/[äöüß]/i.test(text) || /\b(und|danke|bitte|ich)\b/i.test(sample)) return { code: "de", label: "German" };
  if (/[\u3040-\u30ff]/.test(text)) return { code: "ja", label: "Japanese" };
  if (/[\u4e00-\u9fff]/.test(text)) return { code: "zh", label: "Chinese" };
  if (/[\uac00-\ud7af]/.test(text)) return { code: "ko", label: "Korean" };
  if (/\b(cześć|dziękuję|proszę)\b/i.test(sample)) return { code: "pl", label: "Polish" };
  return { code: "en", label: "English" };
}

function labelFor(code: string) {
  return languages.find(([value]) => value === code)?.[1] ?? code;
}

function buildTranslationPreview(input: string, source: string, target: string, detected: { code: string; label: string }) {
  if (!input.trim()) {
    return "";
  }
  const sourceLabel = source === "auto" ? detected.label : labelFor(source);
  const targetLabel = labelFor(target);
  return [
    `[${sourceLabel} -> ${targetLabel}]`,
    "Offline/local placeholder is ready for a future translation engine.",
    "",
    input.trim()
  ].join("\n");
}

function formalizeText(text: string, mode: string) {
  const normalized = text.trim();
  if (!normalized) return "";

  const replacements: Record<string, string> = {
    "hey": "Hello",
    "hi": "Hello",
    "can't": "cannot",
    "won't": "will not",
    "don't": "do not",
    "gonna": "going to",
    "wanna": "want to",
    "btw": "by the way",
    "pls": "please",
    "thanks": "thank you"
  };
  let result = normalized
    .replace(/\s+/g, " ")
    .replace(/\b(hey|hi|btw|pls|can't|won't|don't|gonna|wanna|thanks)\b/gi, (match) => replacements[match.toLowerCase()] ?? match);

  if (mode === "Academic") {
    result = `This text may be expressed as follows: ${capitalize(result)}.`;
  } else if (mode === "Business") {
    result = `We would like to note that ${lowerFirst(result)}.`;
  } else if (mode === "Friendly formal") {
    result = `${capitalize(result)}.`;
  } else if (mode === "Short formal") {
    result = result.replace(/\bperhaps\b/gi, "possibly").replace(/\bmaybe\b/gi, "possibly");
  } else {
    result = `Please note that ${lowerFirst(result)}.`;
  }

  return result.replace(/\s+/g, " ").trim();
}

function resolveError(message: string, category: string) {
  const text = `${category} ${message}`.toLowerCase();
  const isNetwork = /dns|timeout|network|ssl|certificate|connection/.test(text);
  const isDriver = /driver|gpu|graphics|display|vulkan|directx/.test(text);
  const isSteam = /steam|easy anti cheat|eac|vac/.test(text);
  const isBrowser = /browser|chrome|edge|firefox|page|cookie/.test(text);
  const isProgramming = /exception|traceback|stack trace|nullreference|syntax|compile/.test(text);

  if (isNetwork) {
    return {
      summary: "This usually means the app could not reach the server or verify a secure connection.",
      causes: ["Temporary internet outage", "Wrong DNS or proxy settings", "Certificate or firewall problems"],
      safeFixes: ["Retry on another network", "Restart the app", "Check system date and time", "Turn off VPN or proxy briefly if you trust the site"],
      advancedFixes: ["Flush DNS", "Inspect firewall or antivirus rules", "Compare the certificate with the official site"],
      warning: "Avoid running random repair commands from forums unless you trust the source."
    };
  }

  if (isDriver) {
    return {
      summary: "This often points to a graphics or device driver that needs attention.",
      causes: ["Old driver version", "Recent driver update", "Conflicting hardware utility"],
      safeFixes: ["Restart the computer", "Check for official driver updates", "Replug the device if it is external"],
      advancedFixes: ["Use the vendor's clean install option", "Check Device Manager for warning icons"],
      warning: "Be careful with registry or driver-cleaner utilities."
    };
  }

  if (isSteam) {
    return {
      summary: "This usually means the launcher, anti-cheat, or game files need a repair.",
      causes: ["Corrupted game files", "Anti-cheat mismatch", "Permissions or overlay conflicts"],
      safeFixes: ["Verify game files", "Restart Steam", "Close overlays and launchers you do not need"],
      advancedFixes: ["Reinstall the anti-cheat package from the game's own installer", "Check for GPU driver updates"],
      warning: "Do not download fix tools from random links."
    };
  }

  if (isBrowser) {
    return {
      summary: "This often means the browser cache, extension, or site settings are blocking something.",
      causes: ["Broken extension", "Cached site data", "Permission or cookie issue"],
      safeFixes: ["Open a private window", "Disable recent extensions", "Clear the site's local data"],
      advancedFixes: ["Check browser console errors", "Reset the site permissions"],
      warning: "Only change settings from the browser itself."
    };
  }

  if (isProgramming) {
    return {
      summary: "This looks like a code or build error rather than a computer failure.",
      causes: ["Missing dependency", "Incorrect syntax", "Bad data shape or null value"],
      safeFixes: ["Read the first line of the error carefully", "Undo the most recent code change", "Run the project again after a clean restart"],
      advancedFixes: ["Check the stack trace", "Look for the file and line number", "Compare the value types being passed in"],
      warning: "Avoid copying commands you do not understand."
    };
  }

  return {
    summary: "The error is not specific enough to identify one cause yet.",
    causes: ["Temporary hiccup", "Wrong setting", "Input the app did not expect"],
    safeFixes: ["Retry once", "Restart the app", "Paste the exact error again with the category set to Auto"],
    advancedFixes: ["Check logs or stack traces if you have them", "Search the exact error text in the official help docs"],
    warning: ""
  };
}

function createSystemSnapshot() {
  const cpu = 18 + Math.round(Math.random() * 42);
  const ram = 30 + Math.round(Math.random() * 36);
  const storage = 40 + Math.round(Math.random() * 22);
  const temperature = 41 + Math.round(Math.random() * 15);
  const battery = Math.random() > 0.55 ? "plugged" : `${54 + Math.round(Math.random() * 34)}%`;
  return {
    cpu,
    ram,
    storage,
    temperature,
    battery,
    deviceName: navigator.platform || "Desktop",
    osVersion: navigator.userAgent.split(")")[0].slice(0, 26),
    networkSpeed: navigator.onLine ? "Online" : "Offline",
    health: {
      label: cpu > 78 || ram > 82 ? "needs attention" : "steady"
    }
  };
}

function soundThemeColor(theme: string) {
  switch (theme) {
    case "minimal":
      return "#9aa4b2";
    case "nature":
      return "#6bcb77";
    case "silent":
      return "#5b6876";
    default:
      return "#6e8bff";
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
