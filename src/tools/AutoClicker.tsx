import { MousePointerClick, Pause, Play } from "lucide-react";
import { useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { ShortcutField } from "../components/ShortcutField";
import { useToast } from "../context/ToastContext";
import { useAutomationStopShortcut } from "../hooks/useAutomationStopShortcut";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  AUTOMATION_START_DELAY_MS,
  nativeAutomationError,
  startAutoClicker,
  stopNativeAutomation
} from "../lib/nativeAutomation";

export function AutoClicker({ toolId }: { toolId: string }) {
  const [settings, setSettings] = useLocalStorage(`${toolId}:settings`, {
    intervalMs: 1,
    clickMode: "single"
  });
  const [stopShortcut, setStopShortcut] = useLocalStorage(`${toolId}:stopShortcut`, "Escape");
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const stop = async () => {
    await stopNativeAutomation();
    setRunning(false);
    toast("Auto clicker stopped", { tone: "success" });
  };

  useAutomationStopShortcut({
    enabled: running,
    shortcut: stopShortcut,
    onStop: stop
  });

  const toggle = async () => {
    try {
      if (running) {
        await stop();
        return;
      }

      await startAutoClicker(settings.intervalMs, settings.clickMode as "single" | "double");
      setRunning(true);
      toast("Auto clicker starts in 3 seconds", {
        tone: "success",
        message: "Move the cursor to the target app."
      });
    } catch (error) {
      setRunning(false);
      toast("Automation could not start", { tone: "error", message: nativeAutomationError(error) });
    }
  };

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className={`status-dot ${running ? "on" : ""}`} />
          <span>{running ? "Native click loop running" : "Idle"}</span>
          <span className="pill">{AUTOMATION_START_DELAY_MS / 1000}s start delay</span>
        </div>
      }
    >
      <div className="tool-grid two">
        <label className="field">
          <span>Interval</span>
          <div className="number-input">
            <input
              min={1}
              step={1}
              type="number"
              value={settings.intervalMs}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  intervalMs: Math.max(1, Number(event.target.value) || 1)
                }))
              }
            />
            <small>ms</small>
          </div>
        </label>

        <ShortcutField
          className="shortcut-field-control"
          label="Stop shortcut"
          value={stopShortcut}
          onChange={setStopShortcut}
          helper="Press this combo while the loop is running to stop it."
        />

        <label className="field">
          <span>Click mode</span>
          <select
            value={settings.clickMode}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                clickMode: event.target.value as "single" | "double"
              }))
            }
          >
            <option value="single">Single click</option>
            <option value="double">Double click</option>
          </select>
        </label>
      </div>

      <div className="action-strip">
        <button className="primary-action" type="button" onClick={toggle}>
          {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {running ? "Stop" : "Start"}
        </button>
      </div>

      <div className="compact-panel">
        <MousePointerClick size={18} aria-hidden="true" />
        <div>
          <strong>Computer-wide automation</strong>
          <span>After starting, switch to any app before the delay finishes.</span>
        </div>
      </div>
    </ToolFrame>
  );
}
