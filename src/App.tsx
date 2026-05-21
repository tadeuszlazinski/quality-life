import {
  Activity,
  Files,
  House,
  LayoutGrid,
  Monitor,
  PictureInPicture2,
  Rocket,
  ShieldCheck,
  ShieldQuestion,
  ShieldAlert,
  X,
  type LucideIcon
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CommandBar } from "./components/CommandBar";
import { EmptyState } from "./components/EmptyState";
import { InsightDashboard } from "./components/InsightDashboard";
import { LandingPage } from "./components/LandingPage";
import { HomeWelcome } from "./components/HomeWelcome";
import { ToolInfoPanel } from "./components/ToolInfoPanel";
import { Sidebar } from "./components/Sidebar";
import { ToolCard } from "./components/ToolCard";
import { ToolLoading } from "./components/ToolLoading";
import { toolRegistry } from "./data/toolRegistry";
import { isDesktopOnlyTool } from "./lib/toolMeta";
import { useSettings } from "./context/SettingsContext";
import { ToolShellProvider } from "./context/ToolShellContext";
import { useToast } from "./context/ToastContext";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { addHistoryEntry } from "./lib/history";
import { openExternalTarget } from "./lib/nativeSystem";
import { playAppSound } from "./lib/sound";
import { isTauriRuntime } from "./lib/runtime";
import { smartSearchTools, type SmartSearchResult } from "./lib/search";
import { applySearchFeedback, type SearchLearningMap } from "./lib/searchLearning";
import { SettingsTool } from "./tools/SettingsTool";
import type { ToolCategory, ToolDefinition } from "./types/tools";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { trustLinks } from "./lib/trustLinks";
type AppSection = "home" | "tools" | "files" | "media" | "security" | "ai" | "system" | "permissions" | "insight" | "trust" | "settings";

const APP_SECTIONS: Array<{ id: AppSection; label: string; description: string; icon: LucideIcon }> = [
  { id: "home", label: "Home", description: "Search and recent work", icon: House },
  { id: "tools", label: "Tools", description: "Browse the full library", icon: LayoutGrid },
  { id: "files", label: "Files & Storage", description: "Organize and inspect files", icon: Files },
  { id: "media", label: "Screenshots & Media", description: "Images, screenshots, and media", icon: PictureInPicture2 },
  { id: "security", label: "Privacy & Security", description: "Safety and vault tools", icon: ShieldCheck },
  { id: "ai", label: "AI & Writing", description: "Rewrite and clarify text", icon: Rocket },
  { id: "system", label: "System", description: "Device and network tools", icon: Monitor },
  { id: "permissions", label: "Permissions", description: "Tools that need extra access", icon: ShieldAlert },
  { id: "insight", label: "Insight", description: "Open-source and live status", icon: Activity },
  { id: "trust", label: "Trust Center", description: "Mission and transparency", icon: ShieldQuestion },
];

export function App() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [pinnedToolIds, setPinnedToolIds] = useLocalStorage<string[]>("quality-life:pinned-tools", [
    "clipboard-manager",
    "quick-utilities",
    "floating-notes",
    "regex-tester"
  ]);
  const [recentToolIds, setRecentToolIds] = useLocalStorage<string[]>("quality-life:recent-tools", []);
  const [activeSection, setActiveSection] = useLocalStorage<AppSection>("quality-life:active-section", "home");
  const [search, setSearch] = useState("");
  const [searchLearning, setSearchLearning] = useLocalStorage<SearchLearningMap>("quality-life:search-learning", {});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoToolId, setInfoToolId] = useState<string | null>(null);
  const [firstLaunchSeen, setFirstLaunchSeen] = useLocalStorage("quality-life:first-launch-seen", false);
  const [webLandingDismissed, setWebLandingDismissed] = useLocalStorage("quality-life:web-landing-dismissed", false);

  const availableTools = useMemo(() => toolRegistry.filter((tool) => !isDesktopOnlyTool(tool) || isTauriRuntime()), []);
  const sidebarTools = useMemo(
    () => availableTools.filter((tool) => tool.category !== "Settings & Trust"),
    [availableTools]
  );
  const activeTool = activeToolId ? availableTools.find((tool) => tool.id === activeToolId) ?? null : null;
  const ActiveComponent = activeTool?.component ?? null;
  const toolsById = useMemo(() => new Map(availableTools.map((tool) => [tool.id, tool])), [availableTools]);
  const infoTool = infoToolId ? toolsById.get(infoToolId) ?? null : null;

  const sectionTools = useMemo(() => filterBySection(availableTools, activeSection), [activeSection, availableTools]);
  const debouncedSearch = useDebouncedValue(search, 180);
  const searchQuery = debouncedSearch.trim();
  const showSearchBar = activeSection !== "home" && activeSection !== "settings" && activeSection !== "insight" && activeSection !== "permissions";
  const searchResults = useMemo(
    () =>
      searchQuery
        ? smartSearchTools(sectionTools, searchQuery, {
            pinnedToolIds,
            recentToolIds,
            learnedBoosts: searchLearning,
            limit: 18
          })
        : [],
    [pinnedToolIds, recentToolIds, searchLearning, sectionTools, searchQuery]
  );
  const visibleTools = searchQuery ? searchResults.map((result) => result.tool) : sectionTools;
  const resultCount = visibleTools.length;

  const pinnedTools = pinnedToolIds.flatMap((id) => {
    const tool = toolsById.get(id);
    return tool ? [tool] : [];
  });
  const selectTool = (
    toolId: string,
    searchContext?: { query?: string; results?: SmartSearchResult[] }
  ) => {
    if (!toolsById.has(toolId)) {
      return;
    }
    const tool = toolsById.get(toolId);
    if (!tool) {
      return;
    }
    const nextSection = sectionForTool(tool);
    playAppSound("button");
    if (nextSection !== activeSection) {
      setActiveSection(nextSection);
    }
    if (searchContext?.query?.trim() && searchContext.results?.length) {
      setSearchLearning((current) => applySearchFeedback(current, searchContext.results ?? [], toolId));
    }
    setActiveToolId(toolId);
    setSearch("");
    setRecentToolIds((current) => [toolId, ...current.filter((id) => id !== toolId)].slice(0, 12));
    if (tool) {
      addHistoryEntry({
        kind: "toolbelt",
        source: "Quality life",
        title: tool.name,
        preview: `Opened ${tool.name}`,
        toolId
      });
    }
  };

  const togglePin = (toolId: string) => {
    const tool = toolsById.get(toolId);
    setPinnedToolIds((current) => {
      const isPinned = current.includes(toolId);
      toast(isPinned ? "Removed from favorites" : "Added to favorites", {
        tone: "success",
        message: tool?.name
      });
      return isPinned ? current.filter((id) => id !== toolId) : [toolId, ...current];
    });
  };

  const selectFirstResult = () => {
    const first = searchResults[0]?.tool ?? visibleTools[0];
    if (first) {
      selectTool(first.id, { query: searchQuery, results: searchResults });
      setSearch("");
    }
  };

  const browseTools = () => {
    setActiveSection("tools");
    setSearch("");
  };

  const openInsightDownload = async () => {
    if (!/^https?:\/\//i.test(trustLinks.insightDownloadUrl)) {
      toast("Insight download is not configured yet", {
        tone: "info",
        message: "Set trustLinks.insightDownloadUrl to a real release URL."
      });
      return;
    }
    await openExternalTarget("website", trustLinks.insightDownloadUrl);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const commandKey = event.metaKey || event.ctrlKey;
      if (event.key === "Escape" && activeTool && !infoTool && !settingsOpen) {
        setActiveToolId(null);
        return;
      }
      if (commandKey && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        if (activeTool) {
          togglePin(activeTool.id);
        }
      }

      if (commandKey && event.altKey) {
      const target = availableTools.find((tool) => tool.shortcut?.toLowerCase() === event.key.toLowerCase());
      if (target) {
        event.preventDefault();
        selectTool(target.id);
      }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTool, availableTools, infoTool, settingsOpen, toolsById]);

  useEffect(() => {
    const onOpenTool = (event: Event) => {
      const toolId = (event as CustomEvent<string>).detail;
      if (toolId) {
        selectTool(toolId);
      }
    };

    window.addEventListener("quality-life-open-tool", onOpenTool);
    return () => window.removeEventListener("quality-life-open-tool", onOpenTool);
  }, [toolsById]);

  useEffect(() => {
    const onOpenSettings = () => setSettingsOpen(true);
    window.addEventListener("quality-life-open-settings", onOpenSettings);
    return () => window.removeEventListener("quality-life-open-settings", onOpenSettings);
  }, []);

  useEffect(() => {
    if (activeSection === "home" && activeToolId) {
      setActiveToolId(null);
    }
  }, [activeSection, activeToolId]);

  useEffect(() => {
    if (activeSection === "home" && search) {
      setSearch("");
    }
  }, [activeSection, search]);

  if (!isTauriRuntime() && !webLandingDismissed) {
    return <LandingPage onEnterApp={() => setWebLandingDismissed(true)} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        sections={APP_SECTIONS}
        tools={sidebarTools}
        pinnedToolIds={pinnedToolIds}
        recentToolIds={recentToolIds}
        onSelectSection={(section) => setActiveSection(section as AppSection)}
        onSelectTool={selectTool}
      />

      <main className="main-area">
        {activeSection === "home" && (
          <HomeWelcome
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenTools={browseTools}
            onDownloadInsight={openInsightDownload}
          />
        )}
        {activeSection === "permissions" && <PermissionsOverview tools={availableTools} />}
        {showSearchBar && (
          <CommandBar
            value={search}
            resultCount={resultCount}
            onChange={setSearch}
            onSubmit={selectFirstResult}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
        {activeSection === "settings" ? (
          <section className="settings-page glass-panel" aria-label="Settings">
            <div className="page-banner">
              <div>
                <span className="eyebrow">Settings</span>
                <h2>Appearance, privacy, sounds, and storage</h2>
                <p>These controls explain themselves in plain language and stay local unless a feature needs more.</p>
              </div>
            </div>
            <SettingsTool toolId="settings" />
          </section>
        ) : activeSection === "insight" ? (
          <InsightDashboard
            sharingEnabled={settings.insightDataSharing}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenTools={browseTools}
          />
        ) : activeSection === "home" ? null : (
          <div className={activeTool ? "workspace redesigned-workspace redesigned-open" : "workspace redesigned-workspace redesigned-home"}>
            <section className="tool-browser glass-panel" aria-label={pageHeading(activeSection).title}>
              <div className="page-banner">
                <div>
                  <span className="eyebrow">{pageHeading(activeSection).eyebrow}</span>
                  <h2>{pageHeading(activeSection).title}</h2>
                  <p>{pageHeading(activeSection).description}</p>
                </div>
                <div className="page-banner-actions">
                  <span className="pill">{`${visibleTools.length} tools`}</span>
                </div>
              </div>

              <>
                {visibleTools.length === 0 ? (
                  <EmptyState query={search} examples={["fix steam error", "copy text from image", "clean link", "my pc is slow"]} />
                ) : (
                  <div className={`card-grid tool-list-grid tool-list-layout-${settings.toolListLayout}`}>
                    {(search.trim()
                      ? searchResults
                      : visibleTools.map(
                          (tool) =>
                            ({ tool, score: 0, whyMatched: "", reasons: [], relatedTools: [], fallback: false } as SmartSearchResult)
                        )
                    ).map((result) => (
                      <ToolCard
                        key={result.tool.id}
                        tool={result.tool}
                        matchReason={result.whyMatched}
                        compact={Boolean(activeTool) || settings.toolListLayout !== "cards"}
                        isActive={result.tool.id === activeTool?.id}
                        isPinned={pinnedToolIds.includes(result.tool.id)}
                        onSelect={selectTool}
                        onTogglePin={togglePin}
                        onMoreInfo={(toolId) => setInfoToolId(toolId)}
                      />
                    ))}
                  </div>
                )}
              </>
            </section>

            {activeTool && ActiveComponent && (
              <section className="active-tool glass-panel" aria-label={activeTool.name}>
                <ToolShellProvider
                  tool={activeTool}
                  isPinned={pinnedToolIds.includes(activeTool.id)}
                  onTogglePin={() => togglePin(activeTool.id)}
                  onOpenInfo={() => setInfoToolId(activeTool.id)}
                  onClose={() => setActiveToolId(null)}
                >
                  <Suspense fallback={<ToolLoading />}>
                    <ActiveComponent toolId={activeTool.id} />
                  </Suspense>
                </ToolShellProvider>
              </section>
            )}
          </div>
        )}
      </main>

      <ToolInfoPanel open={Boolean(infoTool)} tool={infoTool} onClose={() => setInfoToolId(null)} />

      {settingsOpen && (
        <div className="palette-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section
            className="settings-modal command-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-modal-top">
              <div>
                <span className="eyebrow">Settings</span>
                <h2>App controls</h2>
                <p className="muted-line">These are app controls, not a tool card.</p>
              </div>
              <button className="icon-button" type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="settings-modal-body">
              <SettingsTool toolId="settings" />
            </div>
          </section>
        </div>
      )}

      {!firstLaunchSeen && isTauriRuntime() && (
        <FirstLaunchScreen
          onStart={() => {
            setFirstLaunchSeen(true);
          }}
        />
      )}
    </div>
  );
}

function FirstLaunchScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="palette-backdrop first-launch" role="presentation">
      <section className="first-launch-card command-palette" role="dialog" aria-modal="true" aria-label="First launch trust screen">
        <div className="trust-doc-hero">
          <ShieldCheck size={34} aria-hidden="true" />
          <div>
            <span className="eyebrow">First launch</span>
            <h2>Welcome to Quality life</h2>
            <p className="muted-line">Local-first, no account needed, no ads, no paywalls, and internet tools ask before they run.</p>
          </div>
        </div>
        <div className="trust-badge-row">
          <span className="pill">Local only</span>
          <span className="pill">Works offline</span>
          <span className="pill">No telemetry</span>
        </div>
        <div className="trust-doc-actions">
          <button className="primary-action" type="button" onClick={onStart}>
            Start using Quality life
          </button>
        </div>
      </section>
    </div>
  );
}

function pageHeading(section: AppSection) {
  switch (section) {
    case "home":
      return {
        eyebrow: "Home",
        title: "Welcome to Quality life",
        description: "A calm place to start before you choose a tool."
      };
    case "tools":
      return {
        eyebrow: "Tools",
        title: "Browse the full library",
        description: "A calm, searchable catalog for when you already know the kind of tool you want."
      };
    case "files":
      return {
        eyebrow: "Files & Storage",
        title: "Search, sort, rename, and inspect files",
        description: "Focused file tools for cleaning up storage and checking local file details."
      };
    case "media":
      return {
        eyebrow: "Screenshots & Media",
        title: "Work with screenshots, images, and allowed media",
        description: "Tools for visual work, offline viewing, and small image tasks."
      };
    case "security":
      return {
        eyebrow: "Privacy & Security",
        title: "Safer checks for files, links, clipboard text, and passwords",
        description: "Tools that help you review risk, protect secrets, and understand what stays local."
      };
    case "ai":
      return {
        eyebrow: "AI & Writing",
        title: "Rewrite, clarify, and organize text",
        description: "Local-first writing helpers with explicit permission for anything that needs the web."
      };
    case "system":
      return {
        eyebrow: "System",
        title: "Device, network, and desktop utilities",
        description: "Quick checks and calm controls for the computer you are using right now."
      };
    case "permissions":
      return {
        eyebrow: "Permissions",
        title: "Tools and the access they need",
        description: "A simple list of tool names grouped by the permission they use."
      };
    case "insight":
      return {
        eyebrow: "Insight",
        title: "Open-source notes and live product signals",
        description: "A transparent view of the app, its code, and the public-facing status it can show."
      };
    case "trust":
      return {
        eyebrow: "Trust Center",
        title: "Mission, privacy, permissions, and transparency",
        description: "A clear look at how the app works, what it stores, and why it asks for access."
      };
    case "settings":
      return {
        eyebrow: "Settings",
        title: "Appearance, privacy, sounds, and storage",
        description: "Simple controls with plain explanations and local storage by default."
      };
  }
}

function sectionForTool(tool: ToolDefinition): AppSection {
  switch (tool.category) {
    case "Files & Storage":
      return "files";
    case "Screenshots & Media":
    case "Files & Media":
      return "media";
    case "Security & Privacy":
      return "security";
    case "AI Tools":
      return "ai";
    case "System & Device":
    case "Network & Web":
      return "system";
    case "Settings & Trust":
      return "trust";
    default:
      return "tools";
  }
}

function PermissionsOverview({ tools }: { tools: ToolDefinition[] }) {
  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, ToolDefinition[]>();

    tools.forEach((tool) => {
      tool.moreInfo.permissions.forEach((permission) => {
        const current = groups.get(permission) ?? [];
        current.push(tool);
        groups.set(permission, current);
      });
    });

    return [...groups.entries()]
      .map(([permission, permissionTools]) => ({
        permission,
        tools: permissionTools.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.permission.localeCompare(b.permission));
  }, [tools]);

  const toolCount = groupedPermissions.reduce((total, group) => total + group.tools.length, 0);

  return (
    <section className="tool-browser glass-panel" aria-label="Permissions">
      <div className="page-banner">
        <div>
          <span className="eyebrow">Permissions</span>
          <h2>Tools and the access they need</h2>
          <p>Expand a permission to see which tools use it. Only tools that need extra access appear here.</p>
        </div>
        <div className="page-banner-actions">
          <span className="pill">{`${toolCount} tools`}</span>
        </div>
      </div>

      {groupedPermissions.length === 0 ? (
        <div className="empty-state permissions-empty">
          <ShieldAlert size={24} aria-hidden="true" />
          <span>No permissions needed yet</span>
          <p className="muted-line">The tools currently available in this build do not request any extra access.</p>
        </div>
      ) : (
        <div className="permissions-accordion">
          {groupedPermissions.map((group) => (
            <details className="permissions-group" key={group.permission}>
              <summary>
                <span className="permission-title">{group.permission}</span>
                <span className="muted-line">{`${group.tools.length} tool${group.tools.length === 1 ? "" : "s"}`}</span>
              </summary>
              <div className="permissions-list">
                {group.tools.map((tool) => (
                  <div className="permission-row" key={tool.id}>
                    <span className="permission-tool-name">{tool.name}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function filterBySection(tools: ToolDefinition[], section: AppSection) {
  const isTrustSection = section === "settings" || section === "trust";

  if (section === "settings") {
    return tools.filter((tool) => tool.category === "Settings & Trust");
  }

  if (section === "trust") {
    return tools.filter((tool) => tool.category === "Settings & Trust");
  }

  if (section === "insight") {
    return tools;
  }

  const sectionCategories: Record<Exclude<AppSection, "home" | "settings" | "trust">, ToolCategory[]> = {
    tools: [
      "Automation",
      "Clipboard & Text",
      "AI Tools",
      "Security & Privacy",
      "Files & Media",
      "Files & Storage",
      "Screenshots & Media",
      "System & Device",
      "Network & Web",
      "Developer",
      "Productivity",
      "Everyday Utilities",
      "Fun"
    ],
    files: ["Files & Storage"],
    media: ["Screenshots & Media", "Files & Media"],
    security: ["Security & Privacy", "Files & Media"],
    ai: ["AI Tools", "Clipboard & Text"],
    system: ["System & Device", "Network & Web"],
    permissions: [],
    insight: ["Settings & Trust", "Automation", "Clipboard & Text", "Files & Storage", "Screenshots & Media", "System & Device", "Network & Web", "Developer", "Productivity", "Everyday Utilities", "AI Tools", "Fun", "Security & Privacy"]
  };

  const allowedCategories =
    section === "home"
      ? undefined
      : sectionCategories[section as Exclude<AppSection, "home" | "settings" | "trust">];

  return tools.filter((tool) => {
    if (tool.category === "Settings & Trust" && !isTrustSection) {
      return false;
    }
    const categoryAllowed = allowedCategories ? allowedCategories.includes(tool.category) : true;
    return categoryAllowed;
  });
}
