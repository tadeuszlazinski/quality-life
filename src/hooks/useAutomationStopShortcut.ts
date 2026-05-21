import { useEffect, useRef } from "react";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { isTauriRuntime } from "../lib/runtime";
import { captureShortcutFromEvent, normalizeShortcut } from "../lib/hotkeys";

export function useAutomationStopShortcut({
  enabled,
  shortcut,
  onStop
}: {
  enabled: boolean;
  shortcut: string;
  onStop: () => void | Promise<void>;
}) {
  const stopRef = useRef(onStop);

  useEffect(() => {
    stopRef.current = onStop;
  }, [onStop]);

  useEffect(() => {
    if (!enabled || !shortcut.trim()) {
      return;
    }

    let active = true;

    const stop = () => {
      if (!active) {
        return;
      }
      void stopRef.current();
    };

    if (isTauriRuntime()) {
      void unregister(shortcut).catch(() => undefined);
      void register(shortcut, stop).catch(() => undefined);
      return () => {
        active = false;
        void unregister(shortcut).catch(() => undefined);
      };
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const pressed = captureShortcutFromEvent(event);
      if (pressed && normalizeShortcut(pressed) === normalizeShortcut(shortcut)) {
        event.preventDefault();
        stop();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      active = false;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, shortcut, onStop]);
}
