import { Copy, FileCode2, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useToast } from "../context/ToastContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyText } from "../lib/clipboard";

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function JWTDecoder({ toolId }: { toolId: string }) {
  const [token, setToken] = useLocalStorage(`${toolId}:token`, "");
  const { toast } = useToast();

  const decoded = useMemo(() => {
    try {
      const [headerPart, payloadPart, signaturePart] = token.split(".");
      if (!headerPart || !payloadPart) {
        return { error: "Paste a JWT with header.payload.signature", header: "", payload: "", signature: "" };
      }
      const payload = JSON.parse(decodeBase64Url(payloadPart)) as Record<string, unknown>;
      const exp = typeof payload.exp === "number" ? new Date(payload.exp * 1000) : null;
      return {
        error: "",
        header: prettyJson(JSON.parse(decodeBase64Url(headerPart))),
        payload: prettyJson(payload),
        signature: signaturePart ?? "",
        exp
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not decode token",
        header: "",
        payload: "",
        signature: ""
      };
    }
  }, [token]);

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className={`status-dot ${decoded.error ? "error" : "on"}`} />
          <span>{decoded.error || "Decoded locally"}</span>
          {"exp" in decoded && decoded.exp && <span className="pill">exp {decoded.exp.toLocaleString()}</span>}
        </div>
      }
    >
      <textarea value={token} onChange={(event) => setToken(event.target.value.trim())} rows={5} placeholder="eyJ..." />

      <div className="compact-panel">
        <ShieldAlert size={18} aria-hidden="true" />
        <span>This decodes only. It does not verify signatures or trust claims.</span>
      </div>

      <div className="jwt-grid">
        <section className="utility-card">
          <div className="utility-title">
            <FileCode2 size={17} aria-hidden="true" />
            <strong>Header</strong>
          </div>
          <pre>{decoded.header}</pre>
        </section>
        <section className="utility-card">
          <div className="utility-title">
            <FileCode2 size={17} aria-hidden="true" />
            <strong>Payload</strong>
          </div>
          <pre>{decoded.payload}</pre>
        </section>
      </div>

      <button
        className="secondary-action fit-action"
        type="button"
        onClick={async () => {
          await copyText(decoded.payload);
          toast("Payload copied", { tone: "success" });
        }}
        disabled={!decoded.payload}
      >
        <Copy size={16} aria-hidden="true" />
        Copy payload
      </button>
    </ToolFrame>
  );
}
