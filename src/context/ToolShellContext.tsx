import { createContext, useContext, type ReactNode } from "react";
import type { ToolDefinition } from "../types/tools";

interface ToolShellContextValue {
  tool: ToolDefinition;
  isPinned: boolean;
  onTogglePin: () => void;
  onOpenInfo: () => void;
  onClose: () => void;
}

const ToolShellContext = createContext<ToolShellContextValue | null>(null);

export function ToolShellProvider({
  tool,
  isPinned,
  onTogglePin,
  onOpenInfo,
  onClose,
  children
}: ToolShellContextValue & { children: ReactNode }) {
  return <ToolShellContext.Provider value={{ tool, isPinned, onTogglePin, onOpenInfo, onClose }}>{children}</ToolShellContext.Provider>;
}

export function useToolShell() {
  return useContext(ToolShellContext);
}
