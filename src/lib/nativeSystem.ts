import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "./runtime";

export interface WindowLayoutSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function openExternalTarget(kind: string, target: string) {
  if (kind === "website" && !isTauriRuntime()) {
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }

  if (!isTauriRuntime()) {
    throw new Error("Desktop open actions run in the installed app.");
  }

  await invoke("open_target", { kind, target });
}

export async function setWindowAlwaysOnTop(enabled: boolean) {
  if (!isTauriRuntime()) {
    throw new Error("Always-on-top runs in the installed app.");
  }
  await invoke("set_main_always_on_top", { enabled });
}

export async function getCurrentWindowLayout() {
  if (!isTauriRuntime()) {
    return {
      x: window.screenX,
      y: window.screenY,
      width: window.outerWidth,
      height: window.outerHeight
    };
  }
  return invoke<WindowLayoutSnapshot>("get_window_layout");
}

export async function restoreWindowLayout(layout: WindowLayoutSnapshot) {
  if (!isTauriRuntime()) {
    window.resizeTo(layout.width, layout.height);
    window.moveTo(layout.x, layout.y);
    return;
  }
  await invoke("restore_window_layout", { layout });
}
