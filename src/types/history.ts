export type HistoryKind =
  | "apps"
  | "websites"
  | "files"
  | "clipboard"
  | "notes"
  | "toolbelt"
  | "screenshots";

export interface HistoryEntry {
  id: string;
  title: string;
  source: string;
  kind: HistoryKind;
  timestamp: number;
  preview: string;
  text?: string;
  url?: string;
  path?: string;
  toolId?: string;
  pinned?: boolean;
  dedupeKey?: string;
}

export interface HistorySettings {
  enabled: boolean;
  excludedSources: string[];
  indexedKinds: HistoryKind[];
}
