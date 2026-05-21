import { Info, Pin, PinOff, X } from "lucide-react";
import type { ReactNode } from "react";
import { useToolShell } from "../context/ToolShellContext";
import { ToolBadges, ToolMark } from "./ToolCard";

export function ToolFrame({
  children,
  footer
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const shell = useToolShell();

  return (
    <div className="tool-frame">
      {shell && (
        <div className="tool-shell">
          <div className="tool-shell-heading">
            <div className="tool-shell-title">
              <ToolMark tool={shell.tool} size="large" />
              <div>
                <span className="eyebrow">{shell.tool.category}</span>
                <h2>{shell.tool.name}</h2>
                <p>{shell.tool.description}</p>
                <ToolBadges badges={shell.tool.badges?.length ? shell.tool.badges : ["offline", "local"]} />
              </div>
            </div>
            <div className="tool-shell-actions">
              <button className="secondary-action fit-action" type="button" onClick={shell.onTogglePin}>
                {shell.isPinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
                {shell.isPinned ? "Unpin" : "Pin"}
              </button>
              <button className="secondary-action fit-action" type="button" onClick={shell.onOpenInfo}>
                <Info size={16} aria-hidden="true" />
                More info
              </button>
              <button className="secondary-action fit-action" type="button" onClick={shell.onClose}>
                <X size={16} aria-hidden="true" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="tool-body">{children}</div>
      {footer && <div className="tool-footer">{footer}</div>}
    </div>
  );
}
