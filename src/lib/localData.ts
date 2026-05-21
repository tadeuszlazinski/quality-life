export interface LocalDataSnapshot {
  app: "Quality life";
  version: 1;
  createdAt: string;
  localStorage: Record<string, string>;
}

export function readAllLocalStorage() {
  const localStorageData: Record<string, string> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) {
      continue;
    }
    localStorageData[key] = window.localStorage.getItem(key) ?? "";
  }
  return localStorageData;
}

export function createLocalDataSnapshot(): LocalDataSnapshot {
  return {
    app: "Quality life",
    version: 1,
    createdAt: new Date().toISOString(),
    localStorage: readAllLocalStorage()
  };
}

export function downloadLocalDataSnapshot(filename = "quality-life-local-data.json") {
  const snapshot = createLocalDataSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function importLocalDataSnapshot(text: string) {
  const parsed = JSON.parse(text) as Partial<LocalDataSnapshot> | Record<string, string>;

  if (parsed && typeof parsed === "object" && "localStorage" in parsed && parsed.localStorage) {
    for (const [key, value] of Object.entries(parsed.localStorage)) {
      window.localStorage.setItem(key, value);
    }
    return;
  }

  for (const [key, value] of Object.entries(parsed as Record<string, string>)) {
    window.localStorage.setItem(key, value);
  }
}

export function clearAllLocalData() {
  window.localStorage.clear();
}

export function clearHistoryLocalData() {
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key) {
      continue;
    }
    if (key.includes("history")) {
      window.localStorage.removeItem(key);
    }
  }
}

export function clearClipboardLocalData() {
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key) {
      continue;
    }
    if (key.includes("clipboard")) {
      window.localStorage.removeItem(key);
    }
  }
}
