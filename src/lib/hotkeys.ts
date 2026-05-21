export function captureShortcutFromEvent(event: KeyboardEvent) {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) {
    parts.push("CommandOrControl");
  }
  if (event.altKey) {
    parts.push("Alt");
  }
  if (event.shiftKey) {
    parts.push("Shift");
  }

  if (["Control", "Meta", "Alt", "Shift"].includes(event.key)) {
    return null;
  }

  const key =
    event.key === " " ? "Space" :
    event.key.length === 1 ? event.key.toUpperCase() :
    event.key;

  parts.push(key);
  return parts.join("+");
}

export function normalizeShortcut(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

export function formatShortcutLabel(value: string) {
  if (!value.trim()) {
    return "None";
  }

  return value
    .replace(/CommandOrControl/gi, "Ctrl/Cmd")
    .replace(/\+/g, " + ")
    .replace(/\s+/g, " ")
    .trim();
}
