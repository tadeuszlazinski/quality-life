import type { LucideIcon } from "lucide-react";
import type { ToolDefinition } from "../types/tools";

interface SidebarProps {
  activeSection: string;
  sections: Array<{ id: string; label: string; description: string; icon: LucideIcon }>;
  tools: ToolDefinition[];
  recentToolIds: string[];
  pinnedToolIds: string[];
  onSelectSection: (section: string) => void;
  onSelectTool: (toolId: string) => void;
}

export function Sidebar({
  activeSection,
  sections,
  tools,
  recentToolIds,
  pinnedToolIds,
  onSelectSection,
  onSelectTool
}: SidebarProps) {
  const toolsById = new Map(tools.map((tool) => [tool.id, tool]));
  const recentTools = recentToolIds.map((id) => toolsById.get(id)).filter(Boolean) as ToolDefinition[];
  const pinnedTools = pinnedToolIds.map((id) => toolsById.get(id)).filter(Boolean) as ToolDefinition[];

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <img className="brand-mark" src="/icon.svg" alt="" aria-hidden="true" />
        <div>
          <h1>Quality life</h1>
          <p>Tiny tools for annoying moments.</p>
        </div>
      </div>

      <nav className="sidebar-pages" aria-label="Main sections">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              className={section.id === activeSection ? "nav-item active page-item" : "nav-item page-item"}
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
            >
              <span className="page-item-copy">
                <span className="page-item-row">
                  <Icon size={15} aria-hidden="true" />
                  <span>{section.label}</span>
                </span>
                <small>{section.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <details className="sidebar-section" open>
        <summary>
          <span className="section-label">Favorites</span>
          <span className="muted-line">Pinned tools</span>
        </summary>
        <SidebarToolList tools={pinnedTools} onSelectTool={onSelectTool} />
      </details>

      <details className="sidebar-section">
        <summary>
          <span className="section-label">Recent</span>
          <span className="muted-line">Recently opened</span>
        </summary>
        <SidebarToolList tools={recentTools.slice(0, 5)} onSelectTool={onSelectTool} />
      </details>
    </aside>
  );
}

function SidebarToolList({
  tools,
  onSelectTool
}: {
  tools: ToolDefinition[];
  onSelectTool: (toolId: string) => void;
}) {
  return tools.length === 0 ? (
    <div className="sidebar-empty">
      <span className="muted-line">None yet</span>
    </div>
  ) : (
    <div className="sidebar-mini-list">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button key={tool.id} className="mini-tool" type="button" onClick={() => onSelectTool(tool.id)}>
            <Icon size={15} aria-hidden="true" />
            <span>{tool.name}</span>
          </button>
        );
      })}
    </div>
  );
}
