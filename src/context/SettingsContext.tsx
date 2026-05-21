import { createContext, useContext, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { defaultSettings, type QualityLifeSettings } from "../types/settings";

interface SettingsContextValue {
  settings: QualityLifeSettings;
  updateSettings: (patch: Partial<QualityLifeSettings>) => void;
  replaceSettings: (settings: QualityLifeSettings) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings, resetSettings] = useLocalStorage<QualityLifeSettings>(
    "quality-life:settings",
    defaultSettings
  );

  useEffect(() => {
    document.body.classList.toggle("theme-light", settings.themeMode === "light");
    document.body.classList.toggle("theme-dark", settings.themeMode !== "light");
    return () => {
      document.body.classList.remove("theme-light", "theme-dark");
    };
  }, [settings.themeMode]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
      replaceSettings: (nextSettings) => setSettings({ ...defaultSettings, ...nextSettings }),
      resetSettings
    }),
    [resetSettings, setSettings, settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      <div
        className={[
          "settings-scope",
          `theme-${settings.themeMode}`,
          settings.calmMode ? "calm-mode" : "",
          settings.minimalMode ? "minimal-mode" : "",
          settings.reducedAnimations ? "reduced-animations" : "",
          `sidebar-${settings.sidebarStyle}`,
          `card-size-${settings.cardSize}`,
          settings.dyslexicFriendlyFont ? "dyslexic-font" : "",
          settings.beginnerFriendlyMode ? "beginner-mode" : ""
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          {
            "--ui-font-scale": "0.9"
          } as CSSProperties
        }
      >
        {children}
      </div>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
