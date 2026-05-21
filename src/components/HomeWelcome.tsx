import { ArrowRight, Sparkles, ShieldCheck, Sparkles as SparkleMark, ScanSearch, Lock, Rocket } from "lucide-react";

interface HomeWelcomeProps {
  onOpenTools: () => void;
  onOpenSettings: () => void;
  onDownloadInsight: () => void;
}

export function HomeWelcome({ onOpenTools, onOpenSettings, onDownloadInsight }: HomeWelcomeProps) {
  return (
    <section className="home-welcome-panel glass-panel" aria-label="Welcome">
      <section className="home-trust-box">
        <div className="home-trust-head">
          <ShieldCheck size={18} aria-hidden="true" />
          <div>
            <span className="eyebrow">Most important features</span>
            <h3>Safe, local, offline, private</h3>
          </div>
        </div>
        <p>
          You do not need an account, and the core app keeps your daily utility work on the machine you are already using.
          Anything that needs the internet asks first instead of quietly reaching out in the background.
        </p>
      </section>

      <section className="home-trust-text">
        <div className="home-text-block">
          <h3>Why trust Quality life</h3>
          <p>
            It stays free, avoids account walls, keeps the core app local, and asks before anything needs the
            internet. The goal is plain utility, not attention tricks or hidden collection.
          </p>
        </div>

        <div className="home-text-block">
          <h3>Why use Quality life</h3>
          <p>
            Small annoyances stop feeling scattered when the common fixes live in one calm place. You can clean links,
            scan files, rewrite text, work with screenshots, and check system details without bouncing between apps.
          </p>
          <p>
            The layout keeps the important actions easy to reach and the rest of the app quiet until you need it.
            That makes the tool flow feel faster without making it feel busy.
          </p>
        </div>

        <div className="home-text-block">
          <h3>What is our mission</h3>
          <p>
            Make a desktop utility app that feels honest, private, and easy to return to. We want it to be the thing
            people keep installed because it quietly solves everyday problems well.
          </p>
          <p>
            We are trying to make the small stuff less annoying by keeping the app calm, local-first, and simple
            enough that people can use it without learning a new system.
          </p>
        </div>
      </section>

      <section className="home-facts-grid" aria-label="How it feels to use Quality life">
        <article className="home-fact-card">
          <ScanSearch size={18} aria-hidden="true" />
          <strong>Start from a problem</strong>
          <span>Search for what you want to do, then open a focused tool instead of hunting through a menu tree.</span>
        </article>
        <article className="home-fact-card">
          <Lock size={18} aria-hidden="true" />
          <strong>Keep work private</strong>
          <span>Settings, pinned tools, recent tools, notes, and other local data stay on your device unless you choose otherwise.</span>
        </article>
        <article className="home-fact-card">
          <Rocket size={18} aria-hidden="true" />
          <strong>Stay quick</strong>
          <span>Common actions open fast, and the layout keeps the main controls in one calm working area.</span>
        </article>
        <article className="home-fact-card">
          <SparkleMark size={18} aria-hidden="true" />
          <strong>Insight is separate</strong>
          <span>The Insight companion app is where public-facing status, open-source notes, and live product signals live.</span>
        </article>
      </section>

      <section className="home-action-box">
        <div className="home-welcome-copy">
          <span className="eyebrow">Quality life</span>
          <h2>Tiny tools for annoying moments.</h2>
        </div>

        <div className="home-welcome-actions">
          <button className="primary-action hero-action" type="button" onClick={onOpenTools}>
            Open tools
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button className="secondary-action fit-action" type="button" onClick={onOpenSettings}>
            Open settings
          </button>
          <button className="secondary-action fit-action small-inline-action" type="button" onClick={onDownloadInsight}>
            <Sparkles size={15} aria-hidden="true" />
            Download Insight
          </button>
        </div>

        <p>
          The app is built for small, repeated tasks that usually interrupt the day: cleaning links, checking files,
          handling screenshots, rewriting text, and looking up system details without bouncing through a pile of
          separate utilities.
        </p>
      </section>
    </section>
  );
}
