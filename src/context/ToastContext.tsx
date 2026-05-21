import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useSettings } from "./SettingsContext";
import { playAppSound } from "../lib/sound";

type ToastTone = "success" | "info" | "error";

interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (title: string, options?: { message?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, options?: { message?: string; tone?: ToastTone }) => {
      const id = crypto.randomUUID();
      const nextToast: Toast = {
        id,
        title,
        tone: options?.tone ?? "info",
        message: options?.message
      };

      setToasts((current) => [nextToast, ...current].slice(0, 4));
      if (settings.soundsEnabled) {
        playAppSound(nextToast.tone === "success" ? "success" : nextToast.tone === "error" ? "error" : "notification");
      }
      window.setTimeout(() => dismiss(id), 2800);
    },
    [dismiss, settings.soundsEnabled]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((item) => {
          const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? XCircle : Info;
          return (
            <div className={`toast ${item.tone}`} key={item.id}>
              <Icon size={18} aria-hidden="true" />
              <div>
                <strong>{item.title}</strong>
                {item.message && <span>{item.message}</span>}
              </div>
              <button className="icon-button small" type="button" aria-label="Dismiss toast" onClick={() => dismiss(item.id)}>
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
