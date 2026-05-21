import { Copy, Download, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { ToolFrame } from "../components/ToolFrame";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { copyText } from "../lib/clipboard";
import { upsertHistoryEntry } from "../lib/history";

export function QRGenerator({ toolId }: { toolId: string }) {
  const [text, setText] = useLocalStorage(`${toolId}:text`, "https://example.local");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(text || " ", {
      margin: 2,
      width: 420,
      color: {
        dark: "#f8fafc",
        light: "#00000000"
      }
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("QR generation failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  const copyQr = async () => {
    if (!qrDataUrl) {
      return;
    }

    upsertHistoryEntry(
      {
        kind: "toolbelt",
        source: "QR Generator",
        title: "Generated QR code",
        preview: text,
        text,
        toolId
      },
      `qr:${text}`
    );

    try {
      if ("ClipboardItem" in window) {
        const blob = await (await fetch(qrDataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setStatus("QR copied");
        return;
      }
    } catch {
      // Data URL fallback below.
    }

    setStatus((await copyText(qrDataUrl)) ? "QR data copied" : "Copy failed");
  };

  return (
    <ToolFrame
      footer={
        <div className="status-row">
          <span className="status-dot on" />
          <span>{status}</span>
        </div>
      }
    >
      <div className="qr-layout">
        <div className="qr-preview">
          {qrDataUrl ? <img alt="Generated QR code" src={qrDataUrl} /> : <QrCode size={96} aria-hidden="true" />}
        </div>
        <div className="stacked-actions">
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} />
          <div className="action-strip">
            <button className="primary-action" type="button" onClick={copyQr}>
              <Copy size={17} aria-hidden="true" />
              Copy QR
            </button>
            <a className="secondary-action link-button" href={qrDataUrl} download="quality-life-qr.png">
              <Download size={17} aria-hidden="true" />
              Save PNG
            </a>
          </div>
        </div>
      </div>
    </ToolFrame>
  );
}
