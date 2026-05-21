import { CheckCircle2, Copy, Download, HeartHandshake, Info, RotateCcw, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useToast } from "../context/ToastContext";
import { APP_IDENTIFIER, APP_NAME, APP_TAGLINE, APP_VERSION } from "../lib/appInfo";
import { copyText } from "../lib/clipboard";
import { clearHistoryEntries } from "../lib/history";

export function AboutTool() {
  const [updateStatus, setUpdateStatus] = useState("Ready");
  const { toast } = useToast();
  const appInfo = `${APP_NAME} ${APP_VERSION}\n${APP_TAGLINE}\n${APP_IDENTIFIER}`;

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span>{updateStatus}</span>
          <span className="pill">Version {APP_VERSION}</span>
        </div>
      }
    >
      <section className="about-hero">
        <img className="brand-mark" src="/icon.svg" alt="" aria-hidden="true" />
        <div>
          <span className="eyebrow">About</span>
          <h3>{APP_NAME}</h3>
          <p>{APP_TAGLINE}</p>
        </div>
      </section>

      <div className="mini-grid">
        <section className="utility-card compact-card">
          <div className="utility-title">
            <HeartHandshake size={17} aria-hidden="true" />
            <strong>Free for everyone</strong>
          </div>
          <span className="muted-line">No paywalls, ads, subscriptions, locked tools, accounts, or upgrade prompts.</span>
        </section>
        <section className="utility-card compact-card">
          <div className="utility-title">
            <Shield size={17} aria-hidden="true" />
            <strong>Offline-first</strong>
          </div>
          <span className="muted-line">Tools are built to run locally and keep user data on this device.</span>
        </section>
      </div>

      <div className="tool-grid two">
        <button
          className="secondary-action"
          type="button"
          onClick={async () => {
            await copyText(appInfo);
            toast("App info copied", { tone: "success" });
          }}
        >
          <Copy size={16} aria-hidden="true" />
          Copy app info
        </button>
        <button
          className="primary-action"
          type="button"
          onClick={() => {
            setUpdateStatus("Open Settings to check the signed release feed");
            window.dispatchEvent(new CustomEvent("quality-life-open-settings"));
            toast("Update tools live in Settings", {
              message: "Paste the signed release feed URL there, then check for updates.",
              tone: "info"
            });
          }}
        >
          <Download size={16} aria-hidden="true" />
          Check for updates
        </button>
      </div>
    </ToolFrame>
  );
}

export function PrivacyTool() {
  const { toast } = useToast();
  const localStores = [
    "Settings and accent theme",
    "Pinned and recently used tools",
    "Clipboard history saved by the user",
    "General History Search entries",
    "Notes, shortcuts, timers, and tool presets"
  ];

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span>Private by design</span>
          <span className="pill">Local storage only</span>
        </div>
      }
    >
      <section className="about-hero">
        <Shield size={34} aria-hidden="true" />
        <div>
          <span className="eyebrow">Privacy</span>
          <h3>Your data stays local</h3>
          <p>Quality life has no analytics, telemetry, ads, accounts, or cloud lock-in.</p>
        </div>
      </section>

      <div className="mini-grid">
        {localStores.map((item) => (
          <section className="utility-card compact-card" key={item}>
            <div className="utility-title">
              <CheckCircle2 size={17} aria-hidden="true" />
              <strong>{item}</strong>
            </div>
            <span className="muted-line">Stored on this device and included in local export/import snapshots.</span>
          </section>
        ))}
      </div>

      <div className="action-strip compact-actions">
        <button
          className="secondary-action"
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("quality-life-open-settings"))}
        >
          <Sparkles size={16} aria-hidden="true" />
          Export/import settings
        </button>
        <button
          className="danger-action"
          type="button"
          onClick={() => {
            clearHistoryEntries();
            toast("General history cleared", { tone: "success" });
          }}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Clear general history
        </button>
      </div>

      <div className="native-note">
        <Info size={16} aria-hidden="true" />
        <code>Network access is not required for core tools. Any future update check should be explicit and user-controlled.</code>
      </div>
    </ToolFrame>
  );
}
