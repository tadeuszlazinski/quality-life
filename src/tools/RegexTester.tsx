import { Copy, Regex, Replace } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useToast } from "../context/ToastContext";
import { copyText } from "../lib/clipboard";

export function RegexTester(_props: { toolId: string }) {
  const [pattern, setPattern] = useState("\\btool\\w*");
  const [flags, setFlags] = useState("gi");
  const [sample, setSample] = useState("Quality life is a toolkit of tiny tools.");
  const [replacement, setReplacement] = useState("utility");
  const { toast } = useToast();

  const result = useMemo(() => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = [...sample.matchAll(regex)].map((match) => ({
        value: match[0],
        index: match.index ?? 0,
        groups: match.slice(1)
      }));
      return {
        error: "",
        matches,
        replaced: sample.replace(regex, replacement)
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Invalid expression",
        matches: [],
        replaced: ""
      };
    }
  }, [flags, pattern, replacement, sample]);

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className={`status-dot ${result.error ? "error" : "on"}`} />
          <span>{result.error || `${result.matches.length} matches`}</span>
        </div>
      }
    >
      <div className="tool-grid two">
        <label className="field">
          <span>Pattern</span>
          <input value={pattern} onChange={(event) => setPattern(event.target.value)} />
        </label>
        <label className="field">
          <span>Flags</span>
          <input value={flags} onChange={(event) => setFlags(event.target.value)} />
        </label>
      </div>

      <textarea value={sample} onChange={(event) => setSample(event.target.value)} rows={7} />

      <div className="regex-results">
        <section className="utility-card">
          <div className="utility-title">
            <Regex size={17} aria-hidden="true" />
            <strong>Matches</strong>
          </div>
          {result.error ? (
            <span className="error-line">{result.error}</span>
          ) : result.matches.length === 0 ? (
            <span className="muted-line">No matches</span>
          ) : (
            <div className="match-list">
              {result.matches.slice(0, 20).map((match, index) => (
                <code key={`${match.value}-${match.index}-${index}`}>
                  {match.index}: {match.value}
                </code>
              ))}
            </div>
          )}
        </section>

        <section className="utility-card">
          <div className="utility-title">
            <Replace size={17} aria-hidden="true" />
            <strong>Replace</strong>
          </div>
          <input value={replacement} onChange={(event) => setReplacement(event.target.value)} />
          <pre>{result.replaced}</pre>
          <button
            className="secondary-action fit-action"
            type="button"
            onClick={async () => {
              await copyText(result.replaced);
              toast("Replacement copied", { tone: "success" });
            }}
            disabled={!result.replaced}
          >
            <Copy size={15} aria-hidden="true" />
            Copy
          </button>
        </section>
      </div>
    </ToolFrame>
  );
}
