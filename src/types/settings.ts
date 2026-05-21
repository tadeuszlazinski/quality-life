export type AccentTheme = "mint" | "blue" | "amber" | "rose" | "violet";
export type ThemeMode = "dark" | "light";
export type SidebarStyle = "calm" | "minimal" | "floating";
export type CardSize = "compact" | "balanced" | "airy";
export type ToolListLayout = "list" | "cards" | "gallery";
export type SoundTheme = "soft" | "minimal" | "nature" | "silent";

export interface QualityLifeSettings {
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
  sidebarStyle: SidebarStyle;
  cardSize: CardSize;
  toolListLayout: ToolListLayout;
  fontScale: number;
  dyslexicFriendlyFont: boolean;
  beginnerFriendlyMode: boolean;
  calmMode: boolean;
  minimalMode: boolean;
  reducedAnimations: boolean;
  launchAtStartup: boolean;
  restoreLastTool: boolean;
  offlineMode: boolean;
  blockExternalRequests: boolean;
  askBeforeInternetAccess: boolean;
  autoClearClipboardSeconds: number;
  historyTracking: boolean;
  storeAiInputs: boolean;
  openAiEnabled: boolean;
  openAiApiKey: string;
  openAiModel: string;
  mediaDownloads: boolean;
  insightDataSharing: boolean;
  excludedSources: string;
  updateFeedUrl: string;
  soundsEnabled: boolean;
  soundTheme: SoundTheme;
  soundVolume: number;
}

export const accentThemes: Record<
  AccentTheme,
  {
    label: string;
    color: string;
    soft: string;
  }
> = {
  mint: {
    label: "Mint",
    color: "#78f0c8",
    soft: "rgba(120, 240, 200, 0.16)"
  },
  blue: {
    label: "Blue",
    color: "#8ab4ff",
    soft: "rgba(138, 180, 255, 0.16)"
  },
  amber: {
    label: "Amber",
    color: "#f6c177",
    soft: "rgba(246, 193, 119, 0.16)"
  },
  rose: {
    label: "Rose",
    color: "#f38ba8",
    soft: "rgba(243, 139, 168, 0.16)"
  },
  violet: {
    label: "Violet",
    color: "#cba6f7",
    soft: "rgba(203, 166, 247, 0.16)"
  }
};

export const soundThemes: Record<
  SoundTheme,
  {
    label: string;
    description: string;
  }
> = {
  soft: {
    label: "Soft",
    description: "Warm, subtle tones for confirmations."
  },
  minimal: {
    label: "Minimal",
    description: "Very light click tones with short fades."
  },
  nature: {
    label: "Nature",
    description: "Gentle, airy tones with slightly softer edges."
  },
  silent: {
    label: "Silent",
    description: "No app sounds."
  }
};

export const defaultSettings: QualityLifeSettings = {
  themeMode: "dark",
  accentTheme: "mint",
  sidebarStyle: "calm",
  cardSize: "balanced",
  toolListLayout: "cards",
  fontScale: 90,
  dyslexicFriendlyFont: false,
  beginnerFriendlyMode: true,
  calmMode: true,
  minimalMode: false,
  reducedAnimations: false,
  launchAtStartup: false,
  restoreLastTool: true,
  offlineMode: true,
  blockExternalRequests: false,
  askBeforeInternetAccess: true,
  autoClearClipboardSeconds: 0,
  historyTracking: true,
  storeAiInputs: false,
  openAiEnabled: false,
  openAiApiKey: "",
  openAiModel: "gpt-5.4-mini",
  mediaDownloads: true,
  insightDataSharing: false,
  excludedSources: "",
  updateFeedUrl: "",
  soundsEnabled: true,
  soundTheme: "soft",
  soundVolume: 42
};
