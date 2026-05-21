import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyText } from "../lib/clipboard";
import { securePassword } from "../lib/random";

export function PasswordGenerator({ toolId }: { toolId: string }) {
  const [settings, setSettings] = useLocalStorage(`${toolId}:settings`, {
    length: 18,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true
  });
  const [password, setPassword] = useState("");

  const regenerate = () => {
    setPassword(securePassword(settings));
  };

  useEffect(() => {
    regenerate();
  }, [settings]);

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span>Generated with Web Crypto</span>
          <span className="pill">{settings.length} chars</span>
        </div>
      }
    >
      <div className="password-output">
        <KeyRound size={20} aria-hidden="true" />
        <code>{password || "Select at least one character set"}</code>
      </div>

      <label className="field">
        <span>Length</span>
        <input
          max={96}
          min={8}
          type="range"
          value={settings.length}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              length: Number(event.target.value)
            }))
          }
        />
      </label>

      <div className="toggle-grid">
        {[
          ["lowercase", "Lowercase"],
          ["uppercase", "Uppercase"],
          ["numbers", "Numbers"],
          ["symbols", "Symbols"]
        ].map(([key, label]) => (
          <label className="toggle-card" key={key}>
            <input
              checked={Boolean(settings[key as keyof typeof settings])}
              type="checkbox"
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  [key]: event.target.checked
                }))
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="action-strip">
        <button className="primary-action" type="button" onClick={regenerate}>
          <RefreshCw size={17} aria-hidden="true" />
          Generate
        </button>
        <button className="secondary-action" type="button" onClick={() => copyText(password)} disabled={!password}>
          <Copy size={17} aria-hidden="true" />
          Copy
        </button>
      </div>
    </ToolFrame>
  );
}
