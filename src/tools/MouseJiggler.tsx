import { Move, Pause, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { ShortcutField } from "../components/ShortcutField";
import { useToast } from "../context/ToastContext";
import { useAutomationStopShortcut } from "../hooks/useAutomationStopShortcut";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  nativeAutomationError,
  startMouseJiggler,
  stopNativeAutomation
} from "../lib/nativeAutomation";

export function MouseJiggler({ toolId }: { toolId: string }) {
  const [settings, setSettings] = useLocalStorage(`${toolId}:settings`, {
    intervalSeconds: 30,
    distance: 3
  });
  const [stopShortcut, setStopShortcut] = useLocalStorage(`${toolId}:stopShortcut`, "Escape");
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const stop = async () => {
    await stopNativeAutomation();
    setRunning(false);
    toast("Mouse jiggler stopped", { tone: "success" });
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

      await startMouseJiggler(settings.intervalSeconds * 1000, settings.distance);
      setRunning(true);
      toast("Mouse jiggler starts in 3 seconds", {
        tone: "success",
        message: "It will move the real cursor slightly."
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
          <span>{running ? "Native jiggler running" : "Idle"}</span>
        </div>
      }
    >
      <div className="timer-face compact-face">
        <Move size={22} aria-hidden="true" />
        <strong>{settings.intervalSeconds}s</strong>
      </div>

      <div className="tool-grid two">
        <label className="field">
          <span>Interval</span>
          <div className="number-input">
            <input
              min={5}
              step={5}
              type="number"
              value={settings.intervalSeconds}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  intervalSeconds: Math.max(5, Number(event.target.value) || 5)
                }))
              }
            />
            <small>sec</small>
          </div>
        </label>
        <label className="field">
          <span>Distance</span>
          <div className="number-input">
            <input
              min={1}
              max={20}
              type="number"
              value={settings.distance}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  distance: Math.max(1, Number(event.target.value) || 1)
                }))
              }
            />
            <small>px</small>
          </div>
        </label>
      </div>

      <ShortcutField
        className="shortcut-field-control"
        label="Stop shortcut"
        value={stopShortcut}
        onChange={setStopShortcut}
        helper="Press this combo while the jiggle loop is running to stop it."
      />

      <div className="action-strip">
        <button className="primary-action" type="button" onClick={toggle}>
          {running ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          {running ? "Stop" : "Start"}
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={async () => {
            await stopNativeAutomation();
            setRunning(false);
          }}
        >
          <RotateCcw size={17} aria-hidden="true" />
          Stop native job
        </button>
      </div>
    </ToolFrame>
  );
}
