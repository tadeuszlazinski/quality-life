import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { addHistoryEntry } from "./history";

export async function copyText(text: string) {
  try {
    await writeText(text);
    rememberCopiedText(text);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      rememberCopiedText(text);
      return true;
    } catch {
      return false;
    }
  }
}

export async function readClipboardText() {
  try {
    return await readText();
  } catch {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return "";
    }
  }
}

function rememberCopiedText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  addHistoryEntry({
    kind: "clipboard",
    source: "Clipboard",
    title: "Copied text",
    preview: trimmed.slice(0, 240),
    text: trimmed
  });
}
