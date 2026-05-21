import { ArrowRight, Pin, Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { smartSearchTools } from "../lib/search";
import type { ToolDefinition } from "../types/tools";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

interface CommandPaletteProps {
  open: boolean;
  tools: ToolDefinition[];
  activeToolId: string;
  pinnedToolIds: string[];
  recentToolIds: string[];
  learnedBoosts: Record<string, number>;
  onClose: () => void;
  onSelectTool: (
    toolId: string,
    context?: { query?: string; results?: Array<{ tool: ToolDefinition }>; rank?: number }
  ) => void;
}

export function CommandPalette({
  open,
  tools,
  activeToolId,
  pinnedToolIds,
  recentToolIds,
  learnedBoosts,
  onClose,
  onSelectTool
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const deferredQuery = useDebouncedValue(query, 90);

  const toolsById = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), [tools]);
  const searchResults = useMemo(
    () =>
      deferredQuery.trim()
        ? smartSearchTools(tools, deferredQuery, {
            pinnedToolIds,
            recentToolIds,
            learnedBoosts,
            limit: 14
          })
        : [],
    [deferredQuery, learnedBoosts, pinnedToolIds, recentToolIds, tools]
  );

  const results = useMemo(() => {
    const pinned = pinnedToolIds.flatMap((id) => {
      const tool = toolsById.get(id);
      return tool ? [tool] : [];
    });
    const recent = recentToolIds.flatMap((id) => {
      const tool = toolsById.get(id);
      return tool ? [tool] : [];
    });
    const seen = new Set<string>();

    const addGroup = (label: string, items: ToolDefinition[]) =>
      items
        .filter((tool) => {
          if (seen.has(tool.id)) {
            return false;
          }
          seen.add(tool.id);
          return true;
        })
        .map((tool) => ({ label, tool }));

    if (deferredQuery.trim()) {
      return addGroup("Results", searchResults.map((result) => result.tool));
    }

    return [
      ...addGroup("Pinned", pinned),
      ...addGroup("Recent", recent),
      ...addGroup("All tools", tools)
    ];
  }, [deferredQuery, pinnedToolIds, recentToolIds, searchResults, tools, toolsById]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [deferredQuery]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
      }
      if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        onSelectTool(results[activeIndex].tool.id, {
          query: deferredQuery,
          results: searchResults.map((result) => ({ tool: result.tool })),
          rank: activeIndex
        });
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, onClose, onSelectTool, open, results]);

  if (!open) {
    return null;
  }

  let currentLabel = "";

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="palette-search">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search what you want to do..."
          />
          <kbd>Esc</kbd>
        </div>

        <div className="palette-results">
          {results.length === 0 ? (
            <div className="palette-empty">
              <Search size={20} aria-hidden="true" />
              <span>No matching tools</span>
            </div>
          ) : (
            results.slice(0, 14).map(({ label, tool }, index) => {
              const Icon = tool.icon;
              const showLabel = label !== currentLabel;
              currentLabel = label;
              const match = searchResults.find((result) => result.tool.id === tool.id) ?? null;

              return (
                <div key={`${label}-${tool.id}`}>
                  {showLabel && <span className="palette-group">{label}</span>}
                  <button
                    className={index === activeIndex ? "palette-item active" : "palette-item"}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      onSelectTool(tool.id, {
                        query: deferredQuery,
                        results: searchResults.map((result) => ({ tool: result.tool })),
                        rank: index
                      });
                      onClose();
                    }}
                  >
                    <span className="palette-icon">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <span className="palette-copy">
                      <strong>{tool.name}</strong>
                      <small>{tool.category}</small>
                      {match?.whyMatched && <small className="palette-reason">{match.whyMatched}</small>}
                    </span>
                    {pinnedToolIds.includes(tool.id) && <Pin size={14} aria-hidden="true" />}
                    {tool.id === activeToolId && <Star size={14} aria-hidden="true" />}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
