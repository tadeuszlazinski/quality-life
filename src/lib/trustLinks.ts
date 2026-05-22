function readLink(key: string, fallback: string) {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const trustLinks = {
  websiteUrl: readLink("VITE_QUALITY_LIFE_WEBSITE_URL", "TODO: set your public website URL"),
  downloadUrl: readLink("VITE_QUALITY_LIFE_DOWNLOAD_URL", "TODO: set your public installer or releases URL"),
  macDownloadUrl: readLink("VITE_QUALITY_LIFE_MAC_DOWNLOAD_URL", "TODO: set your macOS installer or releases URL"),
  windowsDownloadUrl: readLink(
    "VITE_QUALITY_LIFE_WINDOWS_DOWNLOAD_URL",
    "https://github.com/tadeuszlazinski/quality-life/releases/latest/download/quality-life-windows-setup.exe"
  ),
  insightDownloadUrl: readLink("VITE_QUALITY_LIFE_INSIGHT_DOWNLOAD_URL", "TODO: set your Insight app installer or releases URL"),
  repositoryUrl: readLink("VITE_QUALITY_LIFE_REPOSITORY_URL", "TODO: set your public repository URL"),
  issueUrl: readLink("VITE_QUALITY_LIFE_ISSUE_URL", "TODO: set your issue tracker URL"),
  suggestFeatureUrl: readLink("VITE_QUALITY_LIFE_SUGGEST_FEATURE_URL", "TODO: set your feature request URL"),
  privacyPolicyUrl: readLink("VITE_QUALITY_LIFE_PRIVACY_URL", "TODO: set your public privacy policy URL"),
  sourceBrowserUrl: readLink("VITE_QUALITY_LIFE_SOURCE_URL", "TODO: set your public source browser URL")
};

export const trustFileTargets = [
  {
    label: "Tool registry",
    file: "src/data/toolRegistry.tsx",
    note: "All tools are registered here."
  },
  {
    label: "Settings context",
    file: "src/context/SettingsContext.tsx",
    note: "App appearance and local settings live here."
  },
  {
    label: "Transparency pages",
    file: "src/tools/TrustExpansion.tsx",
    note: "Trust Center, privacy pages, and code snippets are defined here."
  },
  {
    label: "Local persistence",
    file: "src/lib/localData.ts",
    note: "Export, import, and reset local data flows are here."
  },
  {
    label: "Updater wiring",
    file: "src-tauri/src/lib.rs",
    note: "Native update checks and installer actions live here."
  }
];
