import type { ToolDefinition, ToolMoreInfoSection } from "../types/tools";

export interface ToolInfoPanelCopy {
  does: string;
  where: string;
  details: string;
  whatIsNotCollected: string;
  risks: string;
}

export function buildToolInfo(tool: ToolDefinition, advanced = false): ToolInfoPanelCopy {
  const info = tool.moreInfo;
  return {
    does: pick(info.whatItDoes, advanced),
    where: pick(info.whereItDoesIt, advanced),
    details: pick(info.detailedBehavior, advanced),
    whatIsNotCollected: buildNotCollected(info),
    risks: buildRisks(info)
  };
}

function pick(section: ToolMoreInfoSection, advanced: boolean) {
  return advanced ? section.advanced : section.simple;
}

function buildNotCollected(info: ToolDefinition["moreInfo"]) {
  if (info.dataSent.length > 0) {
    return `It may send: ${info.dataSent.join("; ")}. Everything else stays on the device unless you choose to export or share it.`;
  }
  return "It does not send data by default. Local-only data stays on the device unless you copy, export, or share it yourself.";
}

function buildRisks(info: ToolDefinition["moreInfo"]) {
  const parts: string[] = [];
  if (info.internetRequired) {
    parts.push("Internet-connected actions only run after you choose them.");
  }
  if (!info.localOnly) {
    parts.push("Some parts depend on a public service or a native integration on your computer.");
  }
  if (info.limitations.length > 0) {
    parts.push(info.limitations.join(" "));
  }
  return parts.length > 0
    ? parts.join(" ")
    : "The main limitation is that it only works with the data you provide and the permissions you allow.";
}
