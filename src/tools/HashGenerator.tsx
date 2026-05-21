import { Copy, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useToast } from "../context/ToastContext";
import { copyText } from "../lib/clipboard";

const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type HashAlgorithm = (typeof algorithms)[number];

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function HashGenerator(_props: { toolId: string }) {
  const [input, setInput] = useState("Quality life");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState("Ready");
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    crypto.subtle
      .digest(algorithm, new TextEncoder().encode(input))
      .then((buffer) => {
        if (!cancelled) {
          setHash(toHex(buffer));
          setStatus("Generated locally");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("Hash failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [algorithm, input]);

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span>{status}</span>
          <span className="pill">{algorithm}</span>
        </div>
      }
    >
      <div className="tool-grid two">
        <label className="field">
          <span>Algorithm</span>
          <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}>
            {algorithms.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="compact-panel">
          <Hash size={18} aria-hidden="true" />
          <span>Web Crypto API, no network.</span>
        </div>
      </div>

      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} />
      <div className="password-output">
        <Hash size={18} aria-hidden="true" />
        <code>{hash}</code>
      </div>
      <button
        className="secondary-action fit-action"
        type="button"
        onClick={async () => {
          await copyText(hash);
          toast("Hash copied", { tone: "success" });
        }}
      >
        <Copy size={16} aria-hidden="true" />
        Copy hash
      </button>
    </ToolFrame>
  );
}
