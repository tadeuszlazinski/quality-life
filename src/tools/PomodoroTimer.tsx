import { Bell, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useInterval } from "../hooks/useInterval";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { notify } from "../lib/notify";

type PomodoroMode = "focus" | "break";

export function PomodoroTimer({ toolId }: { toolId: string }) {
  const [settings, setSettings] = useLocalStorage(`${toolId}:settings`, {
    focusMinutes: 25,
    breakMinutes: 5
  });
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(settings.focusMinutes * 60);
  const [sessions, setSessions] = useLocalStorage(`${toolId}:sessions`, 0);

  useEffect(() => {
    if (!running) {
      setRemaining((mode === "focus" ? settings.focusMinutes : settings.breakMinutes) * 60);
    }
  }, [mode, running, settings.breakMinutes, settings.focusMinutes]);

  useInterval(
    () => {
      setRemaining((seconds) => {
        if (seconds > 1) {
          return seconds - 1;
        }

        const nextMode: PomodoroMode = mode === "focus" ? "break" : "focus";
        if (mode === "focus") {
          setSessions((count) => count + 1);
        }
        setMode(nextMode);
        void notify(
          nextMode === "break" ? "Focus complete" : "Break complete",
          nextMode === "break" ? "Time for a short reset." : "Ready for the next session."
        );
        return (nextMode === "focus" ? settings.focusMinutes : settings.breakMinutes) * 60;
      });
    },
    running ? 1000 : null
  );

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className={`status-dot ${running ? "on" : ""}`} />
          <span>{mode === "focus" ? "Focus" : "Break"}</span>
          <span className="pill">{sessions} sessions</span>
        </div>
      }
    >
      <div className="timer-face pomodoro">
        <Bell size={22} aria-hidden="true" />
        <strong>
          {minutes}:{seconds}
        </strong>
      </div>

      <div className="tool-grid two">
        <label className="field">
          <span>Focus</span>
          <div className="number-input">
            <input
              min={1}
              max={90}
              type="number"
              value={settings.focusMinutes}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  focusMinutes: Math.max(1, Number(event.target.value) || 1)
                }))
              }
            />
            <small>min</small>
          </div>
        </label>
        <label className="field">
          <span>Break</span>
          <div className="number-input">
            <input
              min={1}
              max={45}
              type="number"
              value={settings.breakMinutes}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  breakMinutes: Math.max(1, Number(event.target.value) || 1)
                }))
              }
            />
            <small>min</small>
          </div>
        </label>
      </div>

      <div className="action-strip">
        <button className="primary-action" type="button" onClick={() => setRunning((value) => !value)}>
          {running ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining((mode === "focus" ? settings.focusMinutes : settings.breakMinutes) * 60);
          }}
        >
          <RotateCcw size={17} aria-hidden="true" />
          Reset
        </button>
      </div>
    </ToolFrame>
  );
}
