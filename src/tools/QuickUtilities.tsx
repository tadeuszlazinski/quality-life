import { Copy, FileJson, Fingerprint, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { copyText } from "../lib/clipboard";
import { uuid } from "../lib/random";

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  return btoa(String.fromCharCode(...bytes));
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function convertLength(value: number, from: string, to: string) {
  const meters: Record<string, number> = {
    m: 1,
    km: 1000,
    ft: 0.3048,
    mi: 1609.344
  };
  return (value * meters[from]) / meters[to];
}

export function QuickUtilities(_props: { toolId: string }) {
  const [currentUuid, setCurrentUuid] = useState(uuid());
  const [jsonInput, setJsonInput] = useState('{"quality":"life"}');
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [baseInput, setBaseInput] = useState("Quality life");
  const [baseOutput, setBaseOutput] = useState("");
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000).toString());
  const [lengthValue, setLengthValue] = useState(1);
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");

  const timestampDate = useMemo(() => {
    const numeric = Number(timestamp);
    if (!Number.isFinite(numeric)) {
      return "Invalid timestamp";
    }
    const millis = timestamp.length <= 10 ? numeric * 1000 : numeric;
    return new Date(millis).toLocaleString();
  }, [timestamp]);

  const lengthResult = convertLength(lengthValue, fromUnit, toUnit);

  const formatJson = (minify = false) => {
    try {
      setJsonOutput(JSON.stringify(JSON.parse(jsonInput), null, minify ? 0 : 2));
      setJsonError("");
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  return (
    <ToolFrame>
      <div className="utility-grid">
        <section className="utility-card">
          <div className="utility-title">
            <Fingerprint size={18} aria-hidden="true" />
            <strong>UUID</strong>
          </div>
          <code>{currentUuid}</code>
          <div className="action-strip compact-actions">
            <button className="secondary-action" type="button" onClick={() => setCurrentUuid(uuid())}>
              <RefreshCw size={15} aria-hidden="true" />
              New
            </button>
            <button className="secondary-action" type="button" onClick={() => copyText(currentUuid)}>
              <Copy size={15} aria-hidden="true" />
              Copy
            </button>
          </div>
        </section>

        <section className="utility-card wide">
          <div className="utility-title">
            <FileJson size={18} aria-hidden="true" />
            <strong>JSON</strong>
          </div>
          <textarea value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} rows={5} />
          <div className="action-strip compact-actions">
            <button className="secondary-action" type="button" onClick={() => formatJson(false)}>
              Format
            </button>
            <button className="secondary-action" type="button" onClick={() => formatJson(true)}>
              Minify
            </button>
            <button className="secondary-action" type="button" onClick={() => copyText(jsonOutput)}>
              Copy
            </button>
          </div>
          {jsonError ? <span className="error-line">{jsonError}</span> : <pre>{jsonOutput}</pre>}
        </section>

        <section className="utility-card">
          <div className="utility-title">
            <strong>Base64</strong>
          </div>
          <textarea value={baseInput} onChange={(event) => setBaseInput(event.target.value)} rows={3} />
          <div className="action-strip compact-actions">
            <button className="secondary-action" type="button" onClick={() => setBaseOutput(encodeBase64(baseInput))}>
              Encode
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                try {
                  setBaseOutput(decodeBase64(baseInput));
                } catch {
                  setBaseOutput("Invalid Base64");
                }
              }}
            >
              Decode
            </button>
          </div>
          <pre>{baseOutput}</pre>
        </section>

        <section className="utility-card">
          <div className="utility-title">
            <strong>Timestamp</strong>
          </div>
          <input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} />
          <span className="result-line">{timestampDate}</span>
          <button
            className="secondary-action"
            type="button"
            onClick={() => setTimestamp(Math.floor(Date.now() / 1000).toString())}
          >
            Now
          </button>
        </section>

        <section className="utility-card">
          <div className="utility-title">
            <strong>Units</strong>
          </div>
          <input
            type="number"
            value={lengthValue}
            onChange={(event) => setLengthValue(Number(event.target.value) || 0)}
          />
          <div className="unit-row">
            <select value={fromUnit} onChange={(event) => setFromUnit(event.target.value)}>
              <option value="m">meters</option>
              <option value="km">kilometers</option>
              <option value="ft">feet</option>
              <option value="mi">miles</option>
            </select>
            <select value={toUnit} onChange={(event) => setToUnit(event.target.value)}>
              <option value="m">meters</option>
              <option value="km">kilometers</option>
              <option value="ft">feet</option>
              <option value="mi">miles</option>
            </select>
          </div>
          <span className="result-line">{Number.isFinite(lengthResult) ? lengthResult.toFixed(4) : "0"}</span>
        </section>
      </div>
    </ToolFrame>
  );
}
