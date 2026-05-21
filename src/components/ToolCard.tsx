import { Info, Pin, PinOff } from "lucide-react";
import type { CSSProperties } from "react";
import type { ToolBadge, ToolDefinition } from "../types/tools";

interface ToolCardProps {
  compact?: boolean;
  isActive: boolean;
  isPinned: boolean;
  matchReason?: string;
  tool: ToolDefinition;
  onSelect: (toolId: string) => void;
  onTogglePin: (toolId: string) => void;
  onMoreInfo: (toolId: string) => void;
}

export function ToolCard({
  compact = false,
  isActive,
  isPinned,
  matchReason,
  tool,
  onSelect,
  onTogglePin,
  onMoreInfo
}: ToolCardProps) {
  const Icon = tool.icon;
  const badges: ToolBadge[] = tool.badges?.length ? tool.badges : ["offline", "local"];

  return (
    <article className={`tool-card ${compact ? "compact" : ""} ${isActive ? "active" : ""}`}>
      <button className="tool-card-main" type="button" onClick={() => onSelect(tool.id)}>
        <ToolMark tool={tool} size={compact ? "compact" : "regular"} />
        <span className="tool-copy">
          <strong>{tool.name}</strong>
          {!compact && <small>{tool.description}</small>}
          {!compact && matchReason && <small className="tool-match">{matchReason}</small>}
          {!compact && <ToolBadges badges={badges} />}
        </span>
      </button>
      <div className="tool-card-actions">
        <button
          className="icon-button"
          type="button"
          aria-label={isPinned ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
          title={isPinned ? "Unpin" : "Pin"}
          onClick={() => onTogglePin(tool.id)}
        >
          {isPinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={`More info about ${tool.name}`}
          title="More info"
          onClick={() => onMoreInfo(tool.id)}
        >
          <Info size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export function ToolMark({
  tool,
  size = "regular"
}: {
  tool: ToolDefinition;
  size?: "compact" | "regular" | "large";
}) {
  const Icon = tool.icon;
  const initials = tool.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const textSize = size === "compact" ? 10 : size === "large" ? 12 : 11;
  const iconSize = size === "compact" ? 16 : size === "large" ? 24 : 20;
  return (
    <span className={`tool-icon tool-mark ${size}`} style={{ "--accent": tool.accent } as CSSProperties} aria-hidden="true">
      <Icon size={iconSize} aria-hidden="true" />
      <span className="tool-mark-badge" style={{ fontSize: `${textSize}px` }}>{initials || "Q"}</span>
    </span>
  );
}

export function ToolBadges({ badges }: { badges: ToolBadge[] }) {
  const labels: Record<ToolBadge, string> = {
    offline: "Works offline",
    local: "Runs locally",
    internet: "Internet required",
    native: "Native integration"
  };

  return (
    <span className="tool-badges" aria-label="Tool privacy and capability badges">
      {badges.map((badge) => (
        <span className={`tool-status ${badge}`} key={badge}>
          {labels[badge]}
        </span>
      ))}
    </span>
  );
}
