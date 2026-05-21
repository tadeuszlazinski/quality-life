import { Copy, Scissors, Type } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { copyText } from "../lib/clipboard";

function removeDuplicateLines(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .filter((line) => {
      const key = line.trim();
      if (!key) {
        return true;
      }
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .join("\n");
}

export function TextTools(_props: { toolId: string }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const stats = useMemo(() => {
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const lines = input ? input.split(/\r?\n/).length : 0;
    return { words, chars: input.length, lines };
  }, [input]);

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span className="pill">{stats.words} words</span>
          <span className="pill">{stats.chars} chars</span>
          <span className="pill">{stats.lines} lines</span>
        </div>
      }
    >
      <div className="text-tool-layout">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} />
        <textarea value={output} onChange={(event) => setOutput(event.target.value)} rows={8} />
      </div>

      <div className="action-strip wrap">
        <button className="secondary-action" type="button" onClick={() => setOutput(input.toUpperCase())}>
          <Type size={16} aria-hidden="true" />
          Uppercase
        </button>
        <button className="secondary-action" type="button" onClick={() => setOutput(input.toLowerCase())}>
          Lowercase
        </button>
        <button className="secondary-action" type="button" onClick={() => setOutput(removeDuplicateLines(input))}>
          <Scissors size={16} aria-hidden="true" />
          Dedupe lines
        </button>
        <button className="secondary-action" type="button" onClick={() => copyText(output)} disabled={!output}>
          <Copy size={16} aria-hidden="true" />
          Copy output
        </button>
      </div>
    </ToolFrame>
  );
}
