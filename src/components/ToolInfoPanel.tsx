import { BookOpen, Copy, FileText, Github, Info, Link2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import type { ToolDefinition } from "../types/tools";
import { ToolBadges } from "./ToolCard";
import { buildToolInfo } from "../lib/toolInfo";
import { copyText } from "../lib/clipboard";
import { useToast } from "../context/ToastContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { ToolBadge } from "../types/tools";

interface ToolInfoPanelProps {
  tool: ToolDefinition | null;
  open: boolean;
  onClose: () => void;
}

export function ToolInfoPanel({ tool, open, onClose }: ToolInfoPanelProps) {
  const { toast } = useToast();
  const [advancedExplanation, setAdvancedExplanation] = useLocalStorage(
    "quality-life:more-info-advanced",
    false
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !tool) {
    return null;
  }

  const info = buildToolInfo(tool, advancedExplanation);
  const scopeBadges = [
    ...(tool.badges?.length ? tool.badges : (["offline", "local"] as const)),
    ...(tool.moreInfo.internetRequired ? (["internet"] as const) : []),
    ...(tool.moreInfo.localOnly ? (["local"] as const) : [])
  ];
  const displayedBadges = [...new Set(scopeBadges)] as ToolBadge[];

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="tool-info-panel command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={`${tool.name} more info`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="panel-heading info-heading">
          <div className="active-title-group">
            <span className="tool-icon large" style={{ "--accent": tool.accent } as CSSProperties}>
              <Info size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="eyebrow">{tool.category}</span>
              <h2>{tool.name}</h2>
              <p>{tool.shortDescription}</p>
              <ToolBadges badges={displayedBadges} />
            </div>
          </div>
          <button className="secondary-action fit-action" type="button" aria-label="Close info panel" onClick={onClose}>
            <X size={16} aria-hidden="true" />
            Close
          </button>
        </div>

        <div className="info-toolbar">
          <label className="info-toggle">
            <span>
              {advancedExplanation ? <ToggleRight size={18} aria-hidden="true" /> : <ToggleLeft size={18} aria-hidden="true" />}
              Advanced explanation
            </span>
            <input
              type="checkbox"
              checked={advancedExplanation}
              onChange={(event) => setAdvancedExplanation(event.target.checked)}
            />
          </label>
          <div className="info-toolbar-meta">
            <span className="pill">{tool.moreInfo.localOnly ? "Runs locally" : "Internet required"}</span>
          </div>
        </div>

        <div className="info-stack">
          <InfoSection icon={BookOpen} title="What this tool does" text={info.does} />
          <InfoSection icon={Link2} title="Where this tool does it" text={info.where} />
          <InfoSection
            icon={Info}
            title="Detailed behavior"
            text={info.details}
            extra={[
              `Permissions used: ${tool.moreInfo.permissions.length ? tool.moreInfo.permissions.join(", ") : "none beyond standard app access"}`,
              `Stored locally: ${tool.moreInfo.dataStored.join(", ")}`,
              `Sent externally: ${tool.moreInfo.dataSent.length ? tool.moreInfo.dataSent.join(", ") : "nothing by default"}`,
              `Not collected: ${info.whatIsNotCollected}`,
              `Risks and limits: ${info.risks}`
            ]}
          />
          <div className="info-footer">
            <ToolBadges badges={displayedBadges} />
            <div className="action-strip compact-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={async () => {
                  await copyText(
                    [
                      info.does,
                      info.where,
                      info.details,
                      `Not collected: ${info.whatIsNotCollected}`,
                      `Risks and limits: ${info.risks}`
                    ].join("\n\n")
                  );
                  toast("Details copied", { tone: "success" });
                }}
              >
                <Copy size={16} aria-hidden="true" />
                Copy details
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={() => toast("Open full file", { tone: "info", message: "TODO: open the source file for this tool." })}
              >
                <FileText size={16} aria-hidden="true" />
                Open source file
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={() => toast("GitHub link", { tone: "info", message: "TODO: connect the repository link." })}
              >
                <Github size={16} aria-hidden="true" />
                Open repository
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoSection({
  title,
  icon: Icon,
  text,
  extra
}: {
  title: string;
  icon: LucideIcon;
  text: string;
  extra?: string[];
}) {
  return (
    <section className="info-section">
      <div className="utility-title">
        <Icon size={17} aria-hidden="true" />
        <strong>{title}</strong>
      </div>
      <p>{text}</p>
      {extra && (
        <div className="info-extra">
          {extra.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      )}
    </section>
  );
}
