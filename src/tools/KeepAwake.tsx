import { Moon, Power, TimerReset } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useInterval } from "../hooks/useInterval";
import { useLocalStorage } from "../hooks/useLocalStorage";

type WakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
};

export function KeepAwake({ toolId }: { toolId: string }) {
  const [presetMinutes, setPresetMinutes] = useLocalStorage(`${toolId}:preset`, 30);
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(presetMinutes > 0 ? presetMinutes * 60 : 0);
  const [wakeLockState, setWakeLockState] = useState("Ready");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) {
      setRemaining(presetMinutes > 0 ? presetMinutes * 60 : 0);
    }
  }, [active, presetMinutes]);

  useEffect(() => {
    const release = async () => {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        await wakeLockRef.current.release();
      }
      wakeLockRef.current = null;
    };

    if (!active) {
      void release();
      setWakeLockState("Ready");
      return;
    }

    const requestWakeLock = async () => {
      try {
        const wakeLock = (
          navigator as Navigator & {
            wakeLock?: { request: (kind: "screen") => Promise<WakeLockSentinel> };
          }
        ).wakeLock;

        wakeLockRef.current = wakeLock ? await wakeLock.request("screen") : null;
        setWakeLockState(wakeLockRef.current ? "Wake lock active" : "Timer fallback active");
      } catch {
        setWakeLockState("Timer fallback active");
      }
    };

    void requestWakeLock();
    return () => void release();
  }, [active]);

  useInterval(
    () => {
      if (presetMinutes === 0) {
        return;
      }
      setRemaining((seconds) => {
        if (seconds <= 1) {
          setActive(false);
          return 0;
        }
        return seconds - 1;
      });
    },
    active ? 1000 : null
  );

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className={`status-dot ${active ? "on" : ""}`} />
          <span>{wakeLockState}</span>
        </div>
      }
    >
      <div className="timer-face">
        <Moon size={22} aria-hidden="true" />
        <strong>
          {presetMinutes === 0 && active ? "ON" : `${minutes}:${seconds}`}
        </strong>
      </div>

      <div className="preset-grid">
        {[15, 30, 60, 0].map((minutesValue) => (
          <button
            className={presetMinutes === minutesValue ? "chip selected" : "chip"}
            type="button"
            key={minutesValue}
            onClick={() => setPresetMinutes(minutesValue)}
          >
            {minutesValue === 0 ? "Infinite" : `${minutesValue}m`}
          </button>
        ))}
      </div>

      <div className="action-strip">
        <button className="primary-action" type="button" onClick={() => setActive((value) => !value)}>
          <Power size={18} aria-hidden="true" />
          {active ? "Stop" : "Keep awake"}
        </button>
        <button className="secondary-action" type="button" onClick={() => setRemaining(presetMinutes > 0 ? presetMinutes * 60 : 0)}>
          <TimerReset size={17} aria-hidden="true" />
          Reset
        </button>
      </div>
    </ToolFrame>
  );
}
