import { Globe2, ShieldCheck, X } from "lucide-react";

interface InternetAccessGateProps {
  open: boolean;
  title: string;
  domain: string;
  whatLeaves: string;
  why: string;
  storesLocal: string;
  onCancel: () => void;
  onContinue: () => void;
}

export function InternetAccessGate({
  open,
  title,
  domain,
  whatLeaves,
  why,
  storesLocal,
  onCancel,
  onContinue
}: InternetAccessGateProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="internet-gate command-palette" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <div className="active-title-group">
            <span className="tool-icon large active-icon">
              <Globe2 size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="eyebrow">Internet needed</span>
              <h2>{title}</h2>
              <p>{why}</p>
            </div>
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onCancel}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="trust-doc-page">
          <div className="internet-gate-row">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Domain: {domain}</span>
          </div>
          <div className="internet-gate-block">
            <strong>What will be sent</strong>
            <p>{whatLeaves}</p>
          </div>
          <div className="internet-gate-block">
            <strong>What stays local</strong>
            <p>{storesLocal}</p>
          </div>
        </div>
        <div className="action-strip compact-actions">
          <button className="primary-action" type="button" onClick={onContinue}>
            Continue
          </button>
          <button className="secondary-action" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
