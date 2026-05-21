import { AlarmClock, Pause, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useInterval } from "../hooks/useInterval";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { notify } from "../lib/notify";

export function CountdownTimer({ toolId }: { toolId: string }) {
  const [durationMinutes, setDurationMinutes] = useLocalStorage(`${toolId}:minutes`, 10);
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [running, setRunning] = useState(false);

  useInterval(
    () => {
      setRemaining((seconds) => {
        if (seconds <= 1) {
          setRunning(false);
          void notify("Countdown complete", "Your Quality life timer finished.");
          return 0;
        }
        return seconds - 1;
      });
    },
    running ? 1000 : null
  );

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  const reset = (minutesValue = durationMinutes) => {
    setRunning(false);
    setRemaining(minutesValue * 60);
  };

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className={`status-dot ${running ? "on" : ""}`} />
          <span>{running ? "Counting down" : "Ready"}</span>
        </div>
      }
    >
      <div className="timer-face">
        <AlarmClock size={23} aria-hidden="true" />
        <strong>
          {minutes}:{seconds}
        </strong>
      </div>

      <div className="preset-grid">
        {[1, 5, 10, 25].map((minutesValue) => (
          <button
            className={durationMinutes === minutesValue ? "chip selected" : "chip"}
            type="button"
            key={minutesValue}
            onClick={() => {
              setDurationMinutes(minutesValue);
              reset(minutesValue);
            }}
          >
            {minutesValue}m
          </button>
        ))}
      </div>

      <label className="field">
        <span>Custom minutes</span>
        <input
          min={1}
          max={240}
          type="number"
          value={durationMinutes}
          onChange={(event) => {
            const next = Math.max(1, Number(event.target.value) || 1);
            setDurationMinutes(next);
            reset(next);
          }}
        />
      </label>

      <div className="action-strip">
        <button className="primary-action" type="button" onClick={() => setRunning((value) => !value)}>
          {running ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          {running ? "Pause" : "Start"}
        </button>
        <button className="secondary-action" type="button" onClick={() => reset()}>
          <RotateCcw size={17} aria-hidden="true" />
          Reset
        </button>
      </div>
    </ToolFrame>
  );
}
