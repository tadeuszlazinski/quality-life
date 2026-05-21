export type ShortcutActionType =
  | "app"
  | "website"
  | "file"
  | "folder"
  | "tool"
  | "chain";

export interface SpecialShortcut {
  id: string;
  name: string;
  hotkey: string;
  actionType: ShortcutActionType;
  target: string;
  enabled: boolean;
  createdAt: number;
}
