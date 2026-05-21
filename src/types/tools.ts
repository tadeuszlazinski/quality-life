import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";

export type ToolCategory =
  | "Automation"
  | "Clipboard & Text"
  | "AI Tools"
  | "Security & Privacy"
  | "Files & Media"
  | "Files & Storage"
  | "Screenshots & Media"
  | "System & Device"
  | "Network & Web"
  | "Developer"
  | "Productivity"
  | "Everyday Utilities"
  | "Settings & Trust"
  | "Fun";

export type ToolBadge = "offline" | "local" | "internet" | "native";
export type SearchScope = "All" | "Tools" | "Settings" | "History" | "Files" | "AI" | "Security";

export interface ToolMoreInfoSection {
  simple: string;
  advanced: string;
}

export interface ToolMoreInfo {
  whatItDoes: ToolMoreInfoSection;
  whereItDoesIt: ToolMoreInfoSection;
  detailedBehavior: ToolMoreInfoSection;
  permissions: string[];
  internetRequired: boolean;
  localOnly: boolean;
  dataStored: string[];
  dataSent: string[];
  limitations: string[];
}

export interface ToolSearchProfile {
  shortDescription: string;
  aliases: string[];
  problemsSolved: string[];
  exampleQueries: string[];
  searchBoost: number;
}

export interface ToolProps {
  toolId: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  keywords: string[];
  aliases: string[];
  problemsSolved: string[];
  exampleQueries: string[];
  searchBoost: number;
  icon: LucideIcon;
  component: LazyExoticComponent<ComponentType<ToolProps>>;
  category: ToolCategory;
  accent: string;
  moreInfo: ToolMoreInfo;
  shortcut?: string;
  status?: "ready" | "native-todo";
  requiresDesktop?: boolean;
  badges?: ToolBadge[];
}
