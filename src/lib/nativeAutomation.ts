import { invoke } from "@tauri-apps/api/core";

export const AUTOMATION_START_DELAY_MS = 3000;

export interface ClickPoint {
  x: number;
  y: number;
}

export async function stopNativeAutomation() {
  await invoke("stop_automation");
}

export async function startAutoClicker(intervalMs: number, clickMode: "single" | "double") {
  await invoke("start_auto_clicker", {
    intervalMs,
    clickMode,
    startDelayMs: AUTOMATION_START_DELAY_MS
  });
}

export async function startMultiClicker(points: ClickPoint[], intervalMs: number) {
  await invoke("start_multi_clicker", {
    points,
    intervalMs,
    startDelayMs: AUTOMATION_START_DELAY_MS
  });
}

export async function startMouseJiggler(intervalMs: number, distance: number) {
  await invoke("start_mouse_jiggler", {
    intervalMs,
    distance,
    startDelayMs: AUTOMATION_START_DELAY_MS
  });
}

export async function startKeySpammer(keyText: string, ratePerSecond: number) {
  await invoke("start_key_spammer", {
    keyText,
    ratePerSecond,
    startDelayMs: AUTOMATION_START_DELAY_MS
  });
}

export async function startAutoTyper(text: string, delayMs: number) {
  await invoke("start_auto_typer", {
    text,
    delayMs,
    startDelayMs: AUTOMATION_START_DELAY_MS
  });
}

export async function startAutoScroll(amount: number, intervalMs: number) {
  await invoke("start_auto_scroll", {
    amount,
    intervalMs,
    startDelayMs: AUTOMATION_START_DELAY_MS
  });
}

export function nativeAutomationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("__TAURI__") || message.includes("not allowed") || message.includes("window.__TAURI_INTERNALS__")) {
    return "Computer-wide automation is unavailable in this preview.";
  }
  return message;
}
