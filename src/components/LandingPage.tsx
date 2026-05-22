import { ArrowRight, CheckCircle2, Download, Github, HeartHandshake, LayoutGrid, Monitor, Shield, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_VERSION } from "../lib/appInfo";
import { openExternalTarget } from "../lib/nativeSystem";
import { trustLinks } from "../lib/trustLinks";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const platform = detectPlatform();
  const suggestedLabel = platform === "Windows" ? "Windows installer" : "macOS app";
  const [webInfoDismissed, setWebInfoDismissed] = useLocalStorage("quality-life:web-preview-info-dismissed", false);
  const [webInfoOpen, setWebInfoOpen] = useState(!webInfoDismissed);
  const [downloadChooserOpen, setDownloadChooserOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#download") {
      setWebInfoOpen(true);
    }
  }, []);

  const handleDownload = () => setDownloadChooserOpen(true);

  const openDownloadTarget = async (target: "mac" | "windows") => {
    const url =
      target === "windows"
        ? trustLinks.windowsDownloadUrl
        : target === "mac"
          ? trustLinks.macDownloadUrl
          : trustLinks.downloadUrl;
    await openExternalTargetOrInfo(url, setWebInfoOpen);
    setDownloadChooserOpen(false);
  };

  const handleInsightDownload = () => void openExternalTargetOrInfo(trustLinks.insightDownloadUrl, setWebInfoOpen);

  const closeWebInfo = () => {
    setWebInfoDismissed(true);
    setWebInfoOpen(false);
  };

  return (
    <main className="landing-page">
      {webInfoOpen && (
        <div className="palette-backdrop web-info-backdrop" role="presentation" onMouseDown={closeWebInfo}>
          <section className="web-info-card command-palette" role="dialog" aria-modal="true" aria-label="Web preview limitations" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div className="active-title-group">
                <span className="tool-icon large active-icon">
                  <Monitor size={22} aria-hidden="true" />
                </span>
                <div>
                  <span className="eyebrow">Web preview</span>
                  <h2>This version is lighter than the desktop app</h2>
                  <p>Some desktop features need native Tauri access, so the browser preview stays calm and limited.</p>
                </div>
              </div>
              <button className="icon-button" type="button" aria-label="Close" onClick={closeWebInfo}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="trust-doc-page">
              <div className="internet-gate-block">
                <strong>Why it is different</strong>
                <p>The web version can show the interface, search, help pages, and safe local tools, but it cannot do system-level actions like real desktop automation, native file access, or OS controls.</p>
              </div>
              <div className="internet-gate-block">
                <strong>What to use for full features</strong>
                <p>Download the desktop app for the complete offline utility toolkit with file access, desktop helpers, updates, and native integrations.</p>
              </div>
            </div>
            <div className="action-strip compact-actions">
              <button className="primary-action" type="button" onClick={handleDownload}>
                <Download size={16} aria-hidden="true" />
                Download Quality life
              </button>
              <button className="secondary-action" type="button" onClick={closeWebInfo}>
                Continue in web preview
              </button>
            </div>
          </section>
        </div>
      )}

      {downloadChooserOpen && (
        <div className="palette-backdrop web-info-backdrop" role="presentation" onMouseDown={() => setDownloadChooserOpen(false)}>
          <section className="web-info-card command-palette" role="dialog" aria-modal="true" aria-label="Choose download" onMouseDown={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div className="active-title-group">
                <span className="tool-icon large active-icon">
                  <Download size={22} aria-hidden="true" />
                </span>
                <div>
                  <span className="eyebrow">Download Quality life</span>
                  <h2>Choose your installer</h2>
                  <p>Select the version that matches your computer.</p>
                </div>
              </div>
              <button className="icon-button" type="button" aria-label="Close" onClick={() => setDownloadChooserOpen(false)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="download-choice-grid">
              <button className={platform === "macOS" ? "primary-action selected-choice" : "secondary-action selected-choice"} type="button" onClick={() => void openDownloadTarget("mac")}>
                Download for macOS
              </button>
              <button className={platform === "Windows" ? "primary-action selected-choice" : "secondary-action selected-choice"} type="button" onClick={() => void openDownloadTarget("windows")}>
                Download for Windows
              </button>
            </div>
            <div className="download-choice-note">
              <p className="muted-line">
                Your choice opens the correct release page or installer link. Insight stays available as a smaller separate download.
              </p>
            </div>
          </section>
        </div>
      )}

      <section className="landing-hero glass-panel">
        <div className="landing-hero-copy">
          <span className="eyebrow">Quality life</span>
          <h1>Tiny tools for annoying moments.</h1>
          <p>
            A calm, private utility app for little computer problems. It is local-first, free forever, and built to
            work without ads, accounts, paywalls, or subscriptions.
          </p>
          <div className="download-callout">
            <strong>{platform === "Windows" ? "Windows download" : suggestedLabel}</strong>
            <span>{platform === "Windows" ? "Click the Windows installer first for the fastest setup." : `Suggested for your device: ${suggestedLabel}.`}</span>
          </div>
          <div className="action-strip compact-actions">
            <button className="primary-action hero-download-button" type="button" onClick={platform === "Windows" ? () => void openDownloadTarget("windows") : handleDownload}>
              <Download size={16} aria-hidden="true" />
              {platform === "Windows" ? "Download Windows installer" : "Download Quality life"}
            </button>
            <button className="secondary-action fit-action small-inline-action" type="button" onClick={() => void openExternalTargetOrInfo(trustLinks.windowsDownloadUrl, setWebInfoOpen)}>
              Windows installer link
            </button>
            <button className="secondary-action fit-action small-inline-action" type="button" onClick={() => void openExternalTargetOrInfo(trustLinks.macDownloadUrl, setWebInfoOpen)}>
              macOS installer link
            </button>
            <button className="secondary-action fit-action" type="button" onClick={onEnterApp}>
              Open app preview
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button className="secondary-action fit-action small-inline-action" type="button" onClick={handleInsightDownload}>
              <Sparkles size={16} aria-hidden="true" />
              Download Insight
            </button>
          </div>
          <div className="trust-badge-row">
            <span className="pill">Free forever</span>
            <span className="pill">No ads</span>
            <span className="pill">No telemetry</span>
            <span className="pill">No subscriptions</span>
            <span className="pill">Version {APP_VERSION}</span>
          </div>
        </div>

        <div className="landing-preview-grid">
          <section className="preview-tile">
            <Monitor size={18} aria-hidden="true" />
            <strong>Fast tool launcher</strong>
            <span>Search, pin, and open tiny utility tools in one calm place.</span>
          </section>
          <section className="preview-tile">
            <Shield size={18} aria-hidden="true" />
            <strong>Privacy-first</strong>
            <span>Local storage, clear permission prompts, and offline defaults.</span>
          </section>
          <section className="preview-tile">
            <Sparkles size={18} aria-hidden="true" />
            <strong>Small everyday helpers</strong>
            <span>Clipboard, timers, passwords, downloads, links, and more.</span>
          </section>
          <section className="preview-tile">
            <HeartHandshake size={18} aria-hidden="true" />
            <strong>Trust over tricks</strong>
            <span>No fake premium buttons. No locked features. No hidden data use.</span>
          </section>
        </div>
      </section>

      <section className="landing-band">
        <div className="landing-band-inner">
          <div>
            <span className="eyebrow">Why it exists</span>
            <h2>One app instead of fifty small annoyances.</h2>
            <p>
              Quality life exists because tiny problems should be easy to solve. You should not need separate apps for
              clipboard recovery, quick notes, file checks, QR codes, timers, and safety checks.
            </p>
          </div>
          <div className="feature-badges">
            <span className="pill"><CheckCircle2 size={14} aria-hidden="true" /> Local only</span>
            <span className="pill"><CheckCircle2 size={14} aria-hidden="true" /> Works offline</span>
            <span className="pill"><CheckCircle2 size={14} aria-hidden="true" /> Internet needed only when asked</span>
          </div>
        </div>
      </section>

      <section className="landing-band">
        <div className="section-heading">
          <span className="eyebrow">Download</span>
          <h2>Download Quality life</h2>
          <p>Suggested for your device: {suggestedLabel}. Windows users can click the installer directly.</p>
        </div>
        <div className="download-panel">
          <button className="primary-action hero-download-button" type="button" onClick={platform === "Windows" ? () => void openDownloadTarget("windows") : handleDownload}>
            <Download size={16} aria-hidden="true" />
            {platform === "Windows" ? "Download Windows installer" : "Download Quality life"}
          </button>
          <button className="secondary-action fit-action small-inline-action" type="button" onClick={() => void openExternalTargetOrInfo(trustLinks.windowsDownloadUrl, setWebInfoOpen)}>
            Windows installer link
          </button>
          <button className="secondary-action fit-action small-inline-action" type="button" onClick={() => void openExternalTargetOrInfo(trustLinks.macDownloadUrl, setWebInfoOpen)}>
            macOS installer link
          </button>
          <button className="secondary-action fit-action small-inline-action" type="button" onClick={handleInsightDownload}>
            <Sparkles size={16} aria-hidden="true" />
            Download Insight
          </button>
          <div className="download-choices">
            {["Windows", "macOS"].map((label) => (
              <button className={platform === label ? "chip selected" : "chip"} type="button" key={label}>
                {label}
              </button>
            ))}
          </div>
          <div className="download-notes">
            <span className="pill">Version {APP_VERSION}</span>
            <span className="pill">Free forever</span>
            <span className="pill">No ads</span>
            <span className="pill">No telemetry</span>
            <span className="pill">Insight companion available</span>
          </div>
          <p className="muted-line">
            TODO: connect the download button to your hosted release files or release page when you publish the app.
          </p>
        </div>
      </section>

      <section className="landing-band faq-band">
        <div className="section-heading">
          <span className="eyebrow">FAQ</span>
          <h2>Questions people usually ask</h2>
        </div>
        <div className="faq-grid">
          <FAQ question="Does it need an account?" answer="No. It is designed to work without signing in." />
          <FAQ question="Does it send data anywhere?" answer="Not by default. Internet tools always ask first." />
          <FAQ question="Can it work offline?" answer="Yes. Most of the app stays local and offline-first." />
          <FAQ question="Is it free?" answer="Yes. There are no ads, paywalls, subscriptions, or locked features." />
        </div>
      </section>

      <section className="landing-band">
        <div className="section-heading">
          <span className="eyebrow">Screens</span>
          <h2>Calm, compact, and readable</h2>
        </div>
        <div className="screenshot-row">
          <div className="screenshot-card">
            <LayoutGrid size={18} aria-hidden="true" />
            <strong>Sidebar navigation</strong>
            <span>Categories, pinned tools, and recent tools stay easy to scan.</span>
          </div>
          <div className="screenshot-card">
            <Sparkles size={18} aria-hidden="true" />
            <strong>Trust pages</strong>
            <span>Mission, privacy, local data, and transparency live in one place.</span>
          </div>
          <div className="screenshot-card">
            <Monitor size={18} aria-hidden="true" />
            <strong>Tool workspace</strong>
            <span>Each utility opens into a focused, private working area.</span>
          </div>
        </div>
      </section>

      <section className="landing-band landing-footer">
        <div>
          <span className="eyebrow">Open source</span>
          <h2>Built to be understood, not just used.</h2>
        </div>
        <div className="action-strip compact-actions">
          <button className="secondary-action" type="button" onClick={handleDownload}>
            <Github size={16} aria-hidden="true" />
            Download / GitHub
          </button>
          <button className="secondary-action" type="button" onClick={onEnterApp}>
            Open app preview
          </button>
        </div>
      </section>
    </main>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <section className="faq-card">
      <strong>{question}</strong>
      <p>{answer}</p>
    </section>
  );
}

function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "Windows";
  if (ua.includes("mac")) return "macOS";
  if (ua.includes("linux")) return "Linux";
  return "Your platform";
}

async function openExternalTargetOrInfo(url: string, openInfo: (open: boolean) => void) {
  if (/^https?:\/\//i.test(url)) {
    await openExternalTarget("website", url);
    return;
  }
  openInfo(true);
}
