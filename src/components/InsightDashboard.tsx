import { Activity, BookOpen, CheckCircle2, Info, Sparkles } from "lucide-react";
import { APP_VERSION } from "../lib/appInfo";

interface InsightDashboardProps {
  sharingEnabled: boolean;
  onOpenSettings: () => void;
  onOpenTools: () => void;
}

export function InsightDashboard({ sharingEnabled, onOpenSettings, onOpenTools }: InsightDashboardProps) {
  return (
    <section className="insight-page glass-panel" aria-label="Insight">
      <div className="page-banner">
        <div>
          <span className="eyebrow">Insight</span>
          <h2>Open-source notes, technical explanations, and live product signals</h2>
          <p>
            This is the third view: the app is for using the tools, the web version is for finding them, and Insight is for
            understanding what is happening around the project.
          </p>
        </div>
        <div className="page-banner-actions">
          <span className="pill">Version {APP_VERSION}</span>
          <span className={sharingEnabled ? "pill" : "pill"}>{sharingEnabled ? "Basic sharing on" : "Basic sharing off"}</span>
        </div>
      </div>

      <div className="insight-grid">
        <section className="utility-card insight-card">
          <div className="utility-title">
            <BookOpen size={17} aria-hidden="true" />
            <strong>Open-source notes</strong>
          </div>
          <p className="section-note">Read calmer explanations of the code, the update path, and how the app is structured.</p>
          <button className="secondary-action fit-action" type="button" onClick={onOpenTools}>
            <Info size={16} aria-hidden="true" />
            Go to tools
          </button>
        </section>

        <section className="utility-card insight-card">
          <div className="utility-title">
            <Sparkles size={17} aria-hidden="true" />
            <strong>Live product signals</strong>
          </div>
          <p className="section-note">This is the place for counts like downloads, current usage, and tool popularity when the insight backend is connected.</p>
          <div className="insight-stats">
            <div className="native-note">
              <Activity size={16} aria-hidden="true" />
              <code>Downloads: coming soon</code>
            </div>
            <div className="native-note">
              <CheckCircle2 size={16} aria-hidden="true" />
              <code>Active now: coming soon</code>
            </div>
          </div>
        </section>

        <section className="utility-card insight-card">
          <div className="utility-title">
            <Info size={17} aria-hidden="true" />
            <strong>Data sharing</strong>
          </div>
          <p className="section-note">
            If you turn on basic sharing, the app only sends whether it is installed, whether it is currently active,
            which tool names you open, and roughly how often you use the app.
          </p>
          <button className="secondary-action fit-action" type="button" onClick={onOpenSettings}>
            Open settings
          </button>
        </section>
      </div>
    </section>
  );
}
