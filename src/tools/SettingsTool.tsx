import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Play,
  RefreshCcw,
  Settings,
  Sparkles,
  Upload,
  Volume2
} from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ToolFrame } from "../components/ToolFrame";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import { copyText } from "../lib/clipboard";
import { APP_VERSION } from "../lib/appInfo";
import { previewSoundTheme } from "../lib/sound";
import { defaultSettings, soundThemes, type QualityLifeSettings } from "../types/settings";

interface Snapshot {
  app: "Quality life";
  version: 1;
  createdAt: string;
  localStorage: Record<string, string>;
}

interface UpdateCheckResult {
  available: boolean;
  version?: string;
  notes?: string;
  date?: string;
  message?: string;
}

function createSnapshot(): Snapshot {
  const localStorageData: Record<string, string> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("quality-life:")) {
      localStorageData[key] = window.localStorage.getItem(key) ?? "";
    }
  }

  return {
    app: "Quality life",
    version: 1,
    createdAt: new Date().toISOString(),
    localStorage: localStorageData
  };
}

export function SettingsTool(_props: { toolId: string }) {
  const { settings, updateSettings, replaceSettings, resetSettings } = useSettings();
  const { toast } = useToast();
  const [importText, setImportText] = useState("");
  const [updateState, setUpdateState] = useState<{
    phase: "idle" | "checking" | "available" | "none" | "installing" | "error";
    version?: string;
    notes?: string;
    message?: string;
  }>({ phase: "idle" });

  const exportText = JSON.stringify(createSnapshot(), null, 2);

  const downloadSettings = () => {
    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quality-life-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    toast("Settings exported", { tone: "success" });
  };

  const importSettings = () => {
    try {
      const parsed = JSON.parse(importText) as Partial<Snapshot> | Partial<QualityLifeSettings>;

      if ("localStorage" in parsed && parsed.localStorage) {
        Object.entries(parsed.localStorage).forEach(([key, value]) => {
          if (key.startsWith("quality-life:")) {
            window.localStorage.setItem(key, value);
          }
        });
        toast("Settings imported", { tone: "success", message: "Reloading to apply the snapshot." });
        window.setTimeout(() => window.location.reload(), 500);
        return;
      }

      replaceSettings(parsed as QualityLifeSettings);
      toast("Settings imported", { tone: "success" });
    } catch (error) {
      toast("Import failed", {
        tone: "error",
        message: error instanceof Error ? error.message : "Invalid JSON"
      });
    }
  };

  const checkForUpdates = async () => {
    if (settings.offlineMode || settings.blockExternalRequests) {
      setUpdateState({
        phase: "error",
        message: "Turn off offline mode or external-request blocking to check for updates."
      });
      return;
    }

    try {
      setUpdateState({ phase: "checking" });
      const result = await invoke<UpdateCheckResult>("check_for_updates", {
        endpoint: settings.updateFeedUrl.trim()
      });
      if (result.available) {
        setUpdateState({
          phase: "available",
          version: result.version,
          notes: result.notes
        });
        toast("Update found", { tone: "success", message: result.version });
      } else {
        setUpdateState({
          phase: "none",
          message: result.message ?? "No update is available right now."
        });
        toast("No update available", { tone: "info" });
      }
    } catch (error) {
      setUpdateState({
        phase: "error",
        message: error instanceof Error ? error.message : "Update check failed"
      });
      toast("Update check failed", {
        tone: "error",
        message: error instanceof Error ? error.message : "Could not contact the update feed"
      });
    }
  };

  const installUpdate = async () => {
    try {
      setUpdateState((current) => ({ ...current, phase: "installing" }));
      await invoke("install_pending_update");
      toast("Installing update", { tone: "success", message: "The app will restart after the update finishes." });
    } catch (error) {
      setUpdateState({
        phase: "error",
        message: error instanceof Error ? error.message : "Install failed"
      });
      toast("Install failed", {
        tone: "error",
        message: error instanceof Error ? error.message : "No pending update is ready to install"
      });
    }
  };

  const resetAppearance = () => {
    updateSettings({
      themeMode: defaultSettings.themeMode,
      accentTheme: defaultSettings.accentTheme,
      sidebarStyle: defaultSettings.sidebarStyle,
      cardSize: defaultSettings.cardSize,
      toolListLayout: defaultSettings.toolListLayout,
      fontScale: defaultSettings.fontScale,
      dyslexicFriendlyFont: defaultSettings.dyslexicFriendlyFont,
      beginnerFriendlyMode: defaultSettings.beginnerFriendlyMode,
      calmMode: defaultSettings.calmMode,
      minimalMode: defaultSettings.minimalMode,
      reducedAnimations: defaultSettings.reducedAnimations
    });
  };

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span>Runs locally</span>
          <span className="pill">Version {APP_VERSION}</span>
          <span className="pill">No telemetry</span>
          <span className="pill">No account required</span>
        </div>
      }
    >
      <div className="settings-grid">
        <section className="utility-card settings-section">
          <div className="utility-title">
            <Settings size={17} aria-hidden="true" />
            <strong>Updates</strong>
          </div>
          <p className="section-note">Check for signed updates with one button. No feed link is shown here.</p>
          <div className="action-strip compact-actions">
            <button className="primary-action" type="button" onClick={() => void checkForUpdates()}>
              <Download size={16} aria-hidden="true" />
              Check for updates
            </button>
            <button className="secondary-action" type="button" onClick={() => void installUpdate()} disabled={updateState.phase !== "available"}>
              <RefreshCcw size={16} aria-hidden="true" />
              Download and install
            </button>
          </div>
          <div className="native-note">
            <CheckCircle2 size={16} aria-hidden="true" />
            <code>Current version: {APP_VERSION}</code>
          </div>
          {updateState.phase === "checking" && <div className="native-note"><Sparkles size={16} aria-hidden="true" /><code>Checking the signed release feed...</code></div>}
          {updateState.phase === "available" && (
            <section className="utility-card compact-card update-card">
              <div className="utility-title">
                <Sparkles size={17} aria-hidden="true" />
                <strong>Update available</strong>
              </div>
              <span className="muted-line">Version {updateState.version}</span>
              {updateState.notes && <pre>{updateState.notes}</pre>}
              <button className="primary-action fit-action" type="button" onClick={() => void installUpdate()}>
                Install and restart
              </button>
            </section>
          )}
          {updateState.phase === "none" && <div className="native-note"><InfoLine text={updateState.message ?? "No update available."} /></div>}
          {updateState.phase === "error" && <div className="native-note danger-note"><AlertTriangle size={16} aria-hidden="true" /><code>{updateState.message ?? "Update failed."}</code></div>}
        </section>

        <section className="utility-card settings-section">
          <div className="utility-title">
            <Settings size={17} aria-hidden="true" />
            <strong>Appearance</strong>
          </div>
          <p className="section-note">Keep the app readable and calm. Beginner friendly mode stays on by default.</p>
          <label className="toggle-card">
            <input
              checked={settings.beginnerFriendlyMode}
              type="checkbox"
              onChange={(event) => updateSettings({ beginnerFriendlyMode: event.target.checked })}
            />
            <span>Beginner friendly mode</span>
            <small>Simpler wording and fewer advanced controls.</small>
          </label>
          <label className="field">
            <span>Theme mode</span>
            <select value={settings.themeMode} onChange={(event) => updateSettings({ themeMode: event.target.value as QualityLifeSettings["themeMode"] })}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label className="field">
            <span>Tool list layout</span>
            <select
              value={settings.toolListLayout}
              onChange={(event) => updateSettings({ toolListLayout: event.target.value as QualityLifeSettings["toolListLayout"] })}
            >
              <option value="cards">Cards</option>
              <option value="list">List</option>
              <option value="gallery">Gallery</option>
            </select>
            <small>Choose how the tool browser itself is arranged.</small>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.calmMode}
              type="checkbox"
              onChange={(event) => updateSettings({ calmMode: event.target.checked })}
            />
            <span>Calm mode</span>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.minimalMode}
              type="checkbox"
              onChange={(event) => updateSettings({ minimalMode: event.target.checked })}
            />
            <span>Minimal mode</span>
          </label>
          <div className={settings.beginnerFriendlyMode ? "tool-grid two beginner-hidden" : "tool-grid two"}>
            <label className="field">
              <span>Card size</span>
              <select value={settings.cardSize} onChange={(event) => updateSettings({ cardSize: event.target.value as QualityLifeSettings["cardSize"] })}>
                {[
                  ["compact", "Compact"],
                  ["balanced", "Balanced"],
                  ["airy", "Airy"]
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Sidebar style</span>
              <select value={settings.sidebarStyle} onChange={(event) => updateSettings({ sidebarStyle: event.target.value as QualityLifeSettings["sidebarStyle"] })}>
                {[
                  ["calm", "Calm"],
                  ["minimal", "Minimal"],
                  ["floating", "Floating"]
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="section-note">Text size stays at the smallest comfortable scale automatically so the interface stays tidy.</p>
          <label className="toggle-card">
            <input
              checked={settings.dyslexicFriendlyFont}
              type="checkbox"
              onChange={(event) => updateSettings({ dyslexicFriendlyFont: event.target.checked })}
            />
            <span>Dyslexic-friendly font</span>
            <small>Use a clearer reading font if your system has one available.</small>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.reducedAnimations}
              type="checkbox"
              onChange={(event) => updateSettings({ reducedAnimations: event.target.checked })}
            />
            <span>Reduced animations</span>
          </label>
          <button className="secondary-action fit-action" type="button" onClick={resetAppearance}>
            <RefreshCcw size={16} aria-hidden="true" />
            Reset appearance
          </button>
        </section>

        <section className="utility-card settings-section">
          <div className="utility-title">
            <Sparkles size={17} aria-hidden="true" />
            <strong>AI</strong>
          </div>
          <p className="section-note">Turn on real OpenAI-backed AI tools when you want them. The key stays on this device and is only used for requests you start.</p>
          <label className="toggle-card">
            <input
              checked={settings.openAiEnabled}
              type="checkbox"
              onChange={(event) => updateSettings({ openAiEnabled: event.target.checked })}
            />
            <span>Use OpenAI for AI tools</span>
            <small>When off, the app keeps the local preview versions instead.</small>
          </label>
          <label className="field">
            <span>OpenAI API key</span>
            <input
              type="password"
              value={settings.openAiApiKey}
              onChange={(event) => updateSettings({ openAiApiKey: event.target.value })}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="field">
            <span>Model</span>
            <select value={settings.openAiModel} onChange={(event) => updateSettings({ openAiModel: event.target.value })}>
              {["gpt-5.4-mini", "gpt-5.4", "gpt-5.5"].map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
          <div className="native-note">
            <KeyRound size={16} aria-hidden="true" />
            <code>Nothing leaves the device unless you enable OpenAI and run an AI tool.</code>
          </div>
        </section>

        <section className="utility-card settings-section">
          <div className="utility-title">
            <Volume2 size={17} aria-hidden="true" />
            <strong>Sounds</strong>
          </div>
          <p className="section-note">Gentle sounds for confirmations, timers, and small reminders.</p>
          <div className="theme-grid">
            {(Object.keys(soundThemes) as Array<keyof typeof soundThemes>).map((theme) => (
              <button
                className={settings.soundTheme === theme ? "theme-swatch active" : "theme-swatch"}
                key={theme}
                type="button"
                onClick={() => updateSettings({ soundTheme: theme })}
              >
                <span style={{ background: soundThemeColor(theme) }} />
                {soundThemes[theme].label}
              </button>
            ))}
          </div>
          <div className="action-strip compact-actions">
            <button className="secondary-action" type="button" onClick={() => previewSoundTheme(settings.soundTheme, settings.soundVolume)}>
              <Play size={16} aria-hidden="true" />
              Preview
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                toast("Sound preview", { tone: "success" });
              }}
            >
              <Sparkles size={16} aria-hidden="true" />
              Toast sound
            </button>
          </div>
          <label className="toggle-card">
            <input
              checked={settings.soundsEnabled}
              type="checkbox"
              onChange={(event) => updateSettings({ soundsEnabled: event.target.checked })}
            />
            <span>Enable app sounds</span>
          </label>
          <label className="field">
            <span>Volume {settings.soundVolume}%</span>
            <input
              min={0}
              max={100}
              type="range"
              value={settings.soundVolume}
              onChange={(event) => updateSettings({ soundVolume: Number(event.target.value) || 0 })}
            />
          </label>
        </section>

        <section className="utility-card settings-section">
          <div className="utility-title">
            <Settings size={17} aria-hidden="true" />
            <strong>Privacy & offline</strong>
          </div>
          <p className="section-note">Keep the app local, private, and predictable.</p>
          <label className="toggle-card">
            <input
              checked={settings.offlineMode}
              type="checkbox"
              onChange={(event) => updateSettings({ offlineMode: event.target.checked })}
            />
            <span>Offline mode</span>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.blockExternalRequests}
              type="checkbox"
              onChange={(event) => updateSettings({ blockExternalRequests: event.target.checked })}
            />
            <span>Block external requests</span>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.askBeforeInternetAccess}
              type="checkbox"
              onChange={(event) => updateSettings({ askBeforeInternetAccess: event.target.checked })}
            />
            <span>Ask before internet access</span>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.historyTracking}
              type="checkbox"
              onChange={(event) => updateSettings({ historyTracking: event.target.checked })}
            />
            <span>Keep history tracking on</span>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.storeAiInputs}
              type="checkbox"
              onChange={(event) => updateSettings({ storeAiInputs: event.target.checked })}
            />
            <span>Store AI inputs locally</span>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.mediaDownloads}
              type="checkbox"
              onChange={(event) => updateSettings({ mediaDownloads: event.target.checked })}
            />
            <span>Allow media downloads</span>
          </label>
          <label className="toggle-card">
            <input
              checked={settings.insightDataSharing}
              type="checkbox"
              onChange={(event) => updateSettings({ insightDataSharing: event.target.checked })}
            />
            <span>Share basic signals with Insight</span>
            <small>Only app presence, the tool names you open, and rough usage frequency. No task details or copied content.</small>
          </label>
          <label className="field">
            <span>Auto-clear clipboard seconds</span>
            <input
              type="number"
              min={0}
              value={settings.autoClearClipboardSeconds}
              onChange={(event) => updateSettings({ autoClearClipboardSeconds: Number(event.target.value) || 0 })}
            />
          </label>
        </section>

        <section className="utility-card wide settings-section">
          <div className="utility-title">
            <Download size={17} aria-hidden="true" />
            <strong>Export</strong>
          </div>
          <p className="section-note">Save a local backup of your settings.</p>
          <pre>{exportText}</pre>
          <div className="action-strip compact-actions">
            <button
              className="secondary-action"
              type="button"
              onClick={async () => {
                await copyText(exportText);
                toast("Settings copied", { tone: "success" });
              }}
            >
              <Copy size={15} aria-hidden="true" />
              Copy
            </button>
            <button className="secondary-action" type="button" onClick={downloadSettings}>
              <Download size={15} aria-hidden="true" />
              Download
            </button>
            <button
              className="danger-action"
              type="button"
              onClick={() => {
                resetSettings();
                toast("Settings reset", { tone: "success" });
              }}
            >
              <RefreshCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>
        </section>

        <section className="utility-card wide settings-section">
          <div className="utility-title">
            <Upload size={17} aria-hidden="true" />
            <strong>Import</strong>
          </div>
          <p className="section-note">Restore a local backup you exported earlier.</p>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="Paste a Quality life settings JSON snapshot..."
            rows={7}
          />
          <button className="primary-action fit-action" type="button" onClick={importSettings} disabled={!importText.trim()}>
            <Upload size={16} aria-hidden="true" />
            Import settings
          </button>
        </section>
      </div>
    </ToolFrame>
  );
}

function InfoLine({ text }: { text: string }) {
  return (
    <>
      <InfoLineIcon />
      <code>{text}</code>
    </>
  );
}

function InfoLineIcon() {
  return <CheckCircle2 size={16} aria-hidden="true" />;
}

function soundThemeColor(theme: keyof typeof soundThemes) {
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
