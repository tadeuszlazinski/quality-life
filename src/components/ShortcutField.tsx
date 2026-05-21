import { Keyboard, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { captureShortcutFromEvent, formatShortcutLabel } from "../lib/hotkeys";

interface ShortcutFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  defaultValue?: string;
  className?: string;
}

export function ShortcutField({ label, value, onChange, helper, defaultValue = "Escape", className }: ShortcutFieldProps) {
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!capturing) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = captureShortcutFromEvent(event);
      if (!shortcut) {
        return;
      }

      event.preventDefault();
      setCapturing(false);
      onChange(shortcut);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [capturing, onChange]);

  return (
    <label className={className ? `field ${className}` : "field"}>
      <span>{label}</span>
      <div className="shortcut-field">
        <button className={capturing ? "primary-action selected-choice" : "secondary-action selected-choice"} type="button" onClick={() => setCapturing(true)}>
          <Keyboard size={16} aria-hidden="true" />
          {capturing ? "Press keys..." : formatShortcutLabel(value) || "Capture shortcut"}
        </button>
        <button className="icon-button" type="button" aria-label="Reset shortcut" onClick={() => onChange(defaultValue)}>
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </div>
      {helper && <small>{helper}</small>}
    </label>
  );
}
