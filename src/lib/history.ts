import type { HistoryEntry, HistoryKind, HistorySettings } from "../types/history";

const HISTORY_KEY = "quality-life:general-history";
const HISTORY_SETTINGS_KEY = "quality-life:general-history-settings";
const HISTORY_EVENT = "quality-life-history-updated";

const indexedKinds: HistoryKind[] = [
  "apps",
  "websites",
  "files",
  "clipboard",
  "notes",
  "toolbelt",
  "screenshots"
];

const defaultSettings: HistorySettings = {
  enabled: true,
  excludedSources: [],
  indexedKinds
};

export function readHistoryEntries() {
  return readJson<HistoryEntry[]>(HISTORY_KEY, []);
}

export function writeHistoryEntries(entries: HistoryEntry[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 500)));
  notifyHistoryChanged();
}

export function readHistorySettings() {
  return readJson<HistorySettings>(HISTORY_SETTINGS_KEY, defaultSettings);
}

export function writeHistorySettings(settings: HistorySettings) {
  window.localStorage.setItem(HISTORY_SETTINGS_KEY, JSON.stringify(settings));
  notifyHistoryChanged();
}

export function addHistoryEntry(input: Omit<HistoryEntry, "id" | "timestamp"> & { timestamp?: number }) {
  const settings = readHistorySettings();
  if (!canStore(input, settings)) {
    return;
  }

  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: input.timestamp ?? Date.now(),
    ...input
  };
  const entries = readHistoryEntries();
  writeHistoryEntries([entry, ...entries].slice(0, 500));
}

export function upsertHistoryEntry(
  input: Omit<HistoryEntry, "id" | "timestamp" | "dedupeKey"> & { timestamp?: number },
  dedupeKey: string
) {
  const settings = readHistorySettings();
  if (!canStore(input, settings)) {
    return;
  }

  const entries = readHistoryEntries();
  const existing = entries.find((entry) => entry.dedupeKey === dedupeKey);
  const entry: HistoryEntry = {
    id: existing?.id ?? crypto.randomUUID(),
    timestamp: input.timestamp ?? Date.now(),
    pinned: existing?.pinned ?? input.pinned,
    dedupeKey,
    ...input
  };

  writeHistoryEntries([entry, ...entries.filter((item) => item.dedupeKey !== dedupeKey)].slice(0, 500));
}

export function clearHistoryEntries() {
  writeHistoryEntries([]);
}

export function deleteHistoryEntry(id: string) {
  writeHistoryEntries(readHistoryEntries().filter((entry) => entry.id !== id));
}

export function toggleHistoryPin(id: string) {
  writeHistoryEntries(
    readHistoryEntries().map((entry) => (entry.id === id ? { ...entry, pinned: !entry.pinned } : entry))
  );
}

export function excludeHistorySource(source: string) {
  const settings = readHistorySettings();
  writeHistorySettings({
    ...settings,
    excludedSources: [...new Set([source, ...settings.excludedSources])]
  });
}

export function subscribeToHistory(listener: () => void) {
  window.addEventListener(HISTORY_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(HISTORY_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function canStore(input: Pick<HistoryEntry, "source" | "kind">, settings: HistorySettings) {
  return (
    settings.enabled &&
    readAppHistoryEnabled() &&
    settings.indexedKinds.includes(input.kind) &&
    !settings.excludedSources.some((source) => input.source.toLowerCase().includes(source.toLowerCase()))
  );
}

function readAppHistoryEnabled() {
  try {
    const settings = JSON.parse(window.localStorage.getItem("quality-life:settings") ?? "{}") as {
      historyTracking?: boolean;
    };
    return settings.historyTracking !== false;
  } catch {
    return true;
  }
}

function notifyHistoryChanged() {
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}
