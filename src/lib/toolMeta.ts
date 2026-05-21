import type { ToolBadge, ToolCategory, ToolDefinition, ToolMoreInfo, ToolSearchProfile } from "../types/tools";

export interface ToolMetaOverrides {
  shortDescription?: string;
  aliases?: string[];
  problemsSolved?: string[];
  exampleQueries?: string[];
  searchBoost?: number;
  moreInfo?: Partial<ToolMoreInfo>;
}

interface ToolMetaInput {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  badges?: ToolBadge[];
  status?: ToolDefinition["status"];
  requiresDesktop?: boolean;
}

const CATEGORY_EXAMPLES: Record<ToolCategory, string[]> = {
  Automation: ["auto click", "keep mouse moving", "type this for me"],
  "Clipboard & Text": ["i forgot what i copied", "clean pasted text", "fix line breaks"],
  "AI Tools": ["make this sound professional", "simplify this text", "rewrite this prompt"],
  "Security & Privacy": ["check if file is sus", "is this link safe", "find secrets in clipboard"],
  "Files & Media": ["save video offline", "find duplicate files", "check file metadata"],
  "Files & Storage": ["find duplicate files", "search folders locally", "rename files"],
  "Screenshots & Media": ["copy text from image", "save video offline", "pick colors from image"],
  "System & Device": ["my pc is slow", "who is on my wifi", "keep my laptop awake"],
  "Network & Web": ["clean a url", "inspect a website link", "parse this url"],
  Developer: ["format json", "decode jwt", "test regex"],
  Productivity: ["make a quick timer", "random decision", "write a note"],
  "Everyday Utilities": ["track warranty", "save a receipt", "compare products"],
  "Settings & Trust": ["change appearance", "read privacy info", "check updates"],
  Fun: ["flip a coin", "roll dice", "deal cards"]
};

const CATEGORY_PROBLEMS: Record<ToolCategory, string[]> = {
  Automation: ["repeat small actions", "move the cursor", "type or click the same thing again"],
  "Clipboard & Text": ["recover copied text", "clean formatting", "rewrite or compare text"],
  "AI Tools": ["shape text more clearly", "rewrite prompts", "simplify or improve wording"],
  "Security & Privacy": ["spot risky downloads", "inspect links", "protect secrets and private files"],
  "Files & Media": ["organize local files", "inspect metadata", "save or view allowed media"],
  "Files & Storage": ["organize local files", "inspect metadata", "clean up storage"],
  "Screenshots & Media": ["handle screenshots and images", "save allowed media", "inspect visual content"],
  "System & Device": ["check the state of your computer", "review device status", "keep the machine awake"],
  "Network & Web": ["inspect links and URLs", "review web details", "clean tracking from links"],
  Developer: ["format developer data", "check tokens or text patterns", "validate simple rules"],
  Productivity: ["track time", "capture notes", "make small work decisions"],
  "Everyday Utilities": ["track real-world details", "store reminders", "compare everyday choices"],
  "Settings & Trust": ["review privacy and trust information", "adjust app preferences", "check update readiness"],
  Fun: ["play a small offline game", "pick a random result", "animate a quick choice"]
};

const CATEGORY_STORE: Record<ToolCategory, string[]> = {
  Automation: ["Your automation setup and text snippets"],
  "Clipboard & Text": ["Your pasted text, snippets, and local clipboard items if history is enabled"],
  "AI Tools": ["The text you paste, the rewritten result, and optional OpenAI provider settings"],
  "Security & Privacy": ["Selected files, clipboard text, checked links, and local safety notes"],
  "Files & Media": ["Selected file names, metadata, tags, and saved local media"],
  "Files & Storage": ["Selected file names, metadata, folder details, and saved local records"],
  "Screenshots & Media": ["Selected images, screenshots, local media tags, and saved copies"],
  "System & Device": ["Local device readings, layout choices, and placeholder state for native integrations"],
  "Network & Web": ["The URL or network text you paste into the tool"],
  Developer: ["Code, tokens, hashes, or structured text you paste into the tool"],
  Productivity: ["Notes, timers, checklist items, and board state"],
  "Everyday Utilities": ["Your reminders, inventories, and comparison notes"],
  "Settings & Trust": ["Your local appearance, privacy, sound, and release preferences"],
  Fun: ["Game state, choices, and any saved preferences"],
};

const CATEGORY_LIMITATIONS: Record<ToolCategory, string[]> = {
  Automation: ["Desktop automation only works when the app has the needed system access."],
  "Clipboard & Text": ["History only works if you leave it enabled."],
  "AI Tools": ["The local preview tools are rule-based unless you enable the optional OpenAI provider."],
  "Security & Privacy": ["The tool cannot guarantee whether something is truly safe; it only highlights risk patterns."],
  "Files & Media": ["Only selected files or allowed direct media links are used."],
  "Files & Storage": ["Only selected files or folders are used."],
  "Screenshots & Media": ["Only the image, screenshot, or allowed media you choose is used."],
  "System & Device": ["Some live system readings and window controls need native desktop access."],
  "Network & Web": ["Network lookups only run when you choose the web action."],
  Developer: ["It helps with structure and formatting, but it does not replace a full IDE or validator."],
  Productivity: ["It is designed for quick local notes and timers, not team collaboration."],
  "Everyday Utilities": ["It stores what you enter manually, so it depends on the information you provide."],
  "Settings & Trust": ["It focuses on trust, updates, appearance, and privacy controls rather than content creation."],
  Fun: ["It is for offline fun and not a gambling or real-money tool."]
};

export function buildToolProfile(input: ToolMetaInput, overrides: ToolMetaOverrides = {}): ToolSearchProfile {
  const shortDescription = overrides.shortDescription ?? input.description;
  const aliases = unique([
    ...generateAliases(input.name),
    ...generateAliases(input.description),
    ...(overrides.aliases ?? [])
  ]);
  const problemsSolved = unique([
    ...CATEGORY_PROBLEMS[input.category],
    ...generateProblemHints(input),
    ...(overrides.problemsSolved ?? [])
  ]);
  const exampleQueries = unique([
    ...CATEGORY_EXAMPLES[input.category],
    ...generateExampleQueries(input),
    ...(overrides.exampleQueries ?? [])
  ]);

  return {
    shortDescription,
    aliases,
    problemsSolved,
    exampleQueries,
    searchBoost: overrides.searchBoost ?? defaultSearchBoost(input)
  };
}

export function buildToolMoreInfo(input: ToolMetaInput, profile: ToolSearchProfile, overrides: ToolMetaOverrides = {}): ToolMoreInfo {
  const internetRequired = Boolean(input.badges?.includes("internet"));
  const localOnly = !internetRequired;
  const native = Boolean(input.requiresDesktop || input.status === "native-todo" || input.badges?.includes("native"));
  const permissions = unique([
    ...defaultPermissions(input, internetRequired, native),
    ...((overrides.moreInfo?.permissions ?? []) as string[])
  ]);
  const dataStored = unique([
    ...(overrides.moreInfo?.dataStored ?? []),
    ...defaultStoredData(input)
  ]);
  const dataSent = unique([
    ...(overrides.moreInfo?.dataSent ?? []),
    ...defaultSentData(input, internetRequired)
  ]);
  const limitations = unique([
    ...CATEGORY_LIMITATIONS[input.category],
    ...(input.status === "native-todo"
      ? ["This is a placeholder until the native desktop integration is connected."]
      : []),
    ...(input.badges?.includes("internet")
      ? ["It only uses the web after you explicitly start the internet-related action."]
      : []),
    ...(overrides.moreInfo?.limitations ?? [])
  ]);

  const defaultInfo: ToolMoreInfo = {
    whatItDoes: {
      simple: buildWhatSimple(input, profile),
      advanced: buildWhatAdvanced(input, profile)
    },
    whereItDoesIt: {
      simple: buildWhereSimple(input, internetRequired, native),
      advanced: buildWhereAdvanced(input, internetRequired, native)
    },
    detailedBehavior: {
      simple: buildDetailedSimple(input, profile, internetRequired, native),
      advanced: buildDetailedAdvanced(input, profile, internetRequired, native)
    },
    permissions,
    internetRequired,
    localOnly,
    dataStored,
    dataSent,
    limitations
  };

  return mergeMoreInfo(defaultInfo, overrides.moreInfo);
}

export function isDesktopOnlyTool(input: Pick<ToolMetaInput, "requiresDesktop" | "status" | "badges">) {
  return Boolean(input.requiresDesktop || input.status === "native-todo" || input.badges?.includes("native"));
}

function buildWhatSimple(input: ToolMetaInput, profile: ToolSearchProfile) {
  const opener = categoryOpener(input.category);
  const description = sentenceFromDescription(input.description);
  const example = profile.exampleQueries[0];
  const problem = profile.problemsSolved[0];

  return [opener, description, example ? `It is especially handy when you want to ${example}.` : problem ? `It helps when you need to ${problem}.` : ""]
    .filter(Boolean)
    .join(" ");
}

function buildWhatAdvanced(input: ToolMetaInput, profile: ToolSearchProfile) {
  const examples = profile.exampleQueries.slice(0, 3).join(", ") || "small local tasks";
  const problems = profile.problemsSolved.slice(0, 3).join(", ") || "quick everyday problems";
  const description = sentenceFromDescription(input.description);
  return [
    `${input.name} is a ${input.category.toLowerCase()} tool that ${description.toLowerCase()}.`,
    `Primary use cases: ${examples}.`,
    `It is optimized for ${problems}.`,
    "The interface keeps the workflow inside Quality life until you choose to export, copy, or invoke a native desktop action."
  ].join(" ");
}

function buildWhereSimple(input: ToolMetaInput, internetRequired: boolean, native: boolean) {
  if (input.category === "Files & Media" || input.category === "Files & Storage") {
    return "It works on the files, folders, or media you choose.";
  }
  if (input.category === "Screenshots & Media") {
    return "It works on screenshots, images, or allowed media you choose.";
  }
  if (input.category === "Security & Privacy") {
    return "It runs on the text, file, or link you paste or select.";
  }
  if (input.category === "System & Device") {
    return native ? "It uses desktop integration where the app can access system features." : "It stays inside the app until native access is available.";
  }
  if (input.category === "Clipboard & Text") {
    return "It works on the text you paste, copy, or select.";
  }
  if (input.category === "AI Tools") {
    return internetRequired ? "It sends only the text you choose after you confirm the web request." : "It works inside the app using local rules.";
  }
  return native ? "It uses local app features and desktop integration where needed." : "It works inside Quality life on the data you provide.";
}

function buildWhereAdvanced(input: ToolMetaInput, internetRequired: boolean, native: boolean) {
  const base =
    input.category === "Security & Privacy"
      ? "The tool stays on-device while it inspects the file, link, clipboard text, or local notes you selected."
      : input.category === "Files & Media" || input.category === "Files & Storage"
        ? "The tool stays on-device and only reads the file, folder, or media link you intentionally give it."
        : input.category === "Screenshots & Media"
          ? "The tool stays on-device and only reads the screenshot, image, or media file you intentionally give it."
        : input.category === "Clipboard & Text"
          ? "The tool stays inside Quality life and only reads the text or clipboard content you paste or copy into it."
          : input.category === "AI Tools"
            ? internetRequired
              ? "The tool keeps your text local until you approve a web request, then only the chosen text leaves the device."
              : "The tool stays inside Quality life and rewrites text with local rules."
            : input.category === "System & Device"
              ? native
                ? "The tool uses native desktop integration for system readings, notifications, or window control, but still keeps the app state local."
                : "The tool stays in the app until the native desktop API is connected."
              : "The tool stays inside Quality life and works on the data you enter.";

  return `${base} It does not wander through unrelated apps or files on its own.`;
}

function buildDetailedSimple(input: ToolMetaInput, profile: ToolSearchProfile, internetRequired: boolean, native: boolean) {
  const stored = CATEGORY_STORE[input.category][0] ?? "The data you give it";
  const permissionText = defaultPermissions(input, internetRequired, native).join(", ") || "no special permissions";
  const limitation = CATEGORY_LIMITATIONS[input.category][0] ?? "It only works with the information you provide.";
  return `${input.name} keeps its work on the device when it can. It stores ${stored.toLowerCase()} locally when needed, uses ${permissionText}, and keeps the workflow simple by design. ${limitation}`;
}

function buildDetailedAdvanced(input: ToolMetaInput, profile: ToolSearchProfile, internetRequired: boolean, native: boolean) {
  const stored = CATEGORY_STORE[input.category].join("; ").toLowerCase();
  const sent = defaultSentData(input, internetRequired).join("; ").toLowerCase() || "nothing by default";
  const permissions = defaultPermissions(input, internetRequired, native).join("; ").toLowerCase() || "no special permissions";
  const extra = profile.problemsSolved.slice(0, 2).join(", ");
  return [
    `${input.name} is built for ${extra || "small local tasks"}.`,
    "The React UI gathers the user's input, the tool component handles the visible workflow, and the app's local storage helpers keep preferences or history on the device when that feature is enabled.",
    `Data stored locally: ${stored}.`,
    `Data sent externally: ${sent}.`,
    `Permissions: ${permissions}.`,
    `Limitations: ${CATEGORY_LIMITATIONS[input.category].join(" ")}`
  ].join(" ");
}

function defaultSearchBoost(input: ToolMetaInput) {
  if (input.status === "native-todo") {
    return 4;
  }
  if (input.badges?.includes("internet")) {
    return 10;
  }
  if (input.requiresDesktop) {
    return 8;
  }
  if (input.category === "Security & Privacy" || input.category === "Settings & Trust" || input.category === "AI Tools") {
    return 12;
  }
  return 6;
}

function defaultPermissions(input: ToolMetaInput, internetRequired: boolean, native: boolean) {
  const permissions = new Set<string>();
  if (internetRequired) {
    permissions.add("Internet");
  }
  if (native || input.requiresDesktop) {
    permissions.add("Native integration");
  }
  if (input.category === "Clipboard & Text" || input.keywords.some((keyword) => keyword.includes("clipboard"))) {
    permissions.add("Clipboard");
  }
  if (
    input.category === "Files & Media" ||
    input.category === "Files & Storage" ||
    input.category === "Screenshots & Media" ||
    input.keywords.some((keyword) => keyword.includes("file") || keyword.includes("media"))
  ) {
    permissions.add("File access");
  }
  if (input.category === "System & Device" || input.category === "Settings & Trust") {
    permissions.add("System access");
  }
  if (input.id.includes("mic") || input.id.includes("audio")) {
    permissions.add("Microphone or audio device");
  }
  if (input.id.includes("screenshot") || input.id.includes("screen")) {
    permissions.add("Screen capture");
  }
  if (input.category === "Screenshots & Media") {
    permissions.add("Image access");
  }
  if (input.category === "Productivity" || input.category === "Everyday Utilities") {
    permissions.add("Local storage");
  }
  return [...permissions];
}

function defaultStoredData(input: ToolMetaInput) {
  const stored = new Set<string>();
  if (input.category === "Clipboard & Text") {
    stored.add("Clipboard text and snippets you choose to keep");
  }
  if (input.category === "AI Tools") {
    stored.add("The text you paste and any local rewrite history you keep");
  }
  if (input.category === "Security & Privacy") {
    stored.add("Selected links, files, notes, or clipboard text used for the check");
  }
  if (input.category === "Files & Media" || input.category === "Files & Storage") {
    stored.add("Local file names, metadata, and optional saved copies");
  }
  if (input.category === "Screenshots & Media") {
    stored.add("Image or screenshot data you choose to work with");
  }
  if (input.category === "System & Device") {
    stored.add("Local settings and device readings needed for the tool");
  }
  if (input.category === "Productivity" || input.category === "Everyday Utilities") {
    stored.add("Your notes, timers, lists, or manual records");
  }
  if (input.category === "Fun") {
    stored.add("Game state and saved preferences if you keep them");
  }
  if (input.category === "Automation") {
    stored.add("Your automation presets, shortcuts, or snippets");
  }
  if (input.category === "Network & Web") {
    stored.add("The URL or network text you paste into the tool");
  }
  if (stored.size === 0) {
    stored.add("Only the data you provide in the tool");
  }
  return [...stored];
}

function defaultSentData(input: ToolMetaInput, internetRequired: boolean) {
  if (!internetRequired) {
    return [];
  }

  const sent = new Set<string>();
  if (input.id === "ai-translator") {
    sent.add("Only the text you choose to translate");
  } else if (input.id === "private-information-exposure-search") {
    sent.add("Only the email, username, phone number, or name you choose to search");
  } else if (input.category === "Files & Media" || input.category === "Files & Storage") {
    sent.add("Only a direct media link or article URL you explicitly ask to fetch");
  } else if (input.category === "Screenshots & Media") {
    sent.add("Only the image or media file you explicitly choose");
  } else {
    sent.add("Only the text or link you explicitly choose to send");
  }
  return [...sent];
}

function generateAliases(text: string) {
  const lower = normalize(text);
  const tokens = lower.split(" ").filter(Boolean);
  const filtered = tokens.filter((token) => !["tool", "tools", "manager", "viewer", "studio", "helper", "generator", "checker", "search", "dashboard", "assistant", "counter", "preview", "mode"].includes(token));
  const aliases = new Set<string>([lower]);
  if (filtered.length > 1) {
    aliases.add(filtered.join(" "));
  }
  if (filtered.length > 0) {
    aliases.add(filtered.slice(-2).join(" "));
  }
  return [...aliases];
}

function generateProblemHints(input: ToolMetaInput) {
  const hints = new Set<string>();
  const text = normalize([input.name, input.description, ...input.keywords].join(" "));
  if (text.includes("clipboard")) {
    hints.add("recover copied text");
    hints.add("search what i copied");
  }
  if (text.includes("file") || text.includes("folder")) {
    hints.add("find file problems");
  }
  if (text.includes("link") || text.includes("url")) {
    hints.add("clean or inspect a link");
  }
  if (text.includes("password")) {
    hints.add("store passwords locally");
  }
  if (text.includes("timer") || text.includes("awake") || text.includes("sleep")) {
    hints.add("keep the computer awake");
  }
  if (text.includes("translate")) {
    hints.add("translate text");
  }
  if (text.includes("regex") || text.includes("sql") || text.includes("json")) {
    hints.add("format developer text");
  }
  if (text.includes("note")) {
    hints.add("save quick notes");
  }
  if (text.includes("color") || text.includes("palette")) {
    hints.add("pick or copy a color");
  }
  if (text.includes("video") || text.includes("media")) {
    hints.add("save media for offline viewing");
  }
  if (text.includes("wifi") || text.includes("network")) {
    hints.add("inspect network details");
  }
  return [...hints];
}

function generateExampleQueries(input: ToolMetaInput) {
  const examples = new Set<string>();
  const loweredName = normalize(input.name);
  const reducedName = loweredName
    .replace(/ [^ ]+$/g, "")
    .replace(/ (tool|tools|viewer|manager|helper|generator|checker|search|studio|dashboard|counter|preview)$/g, "")
    .trim();

  if (reducedName) {
    examples.add(reducedName);
  }
  if (input.description) {
    examples.add(normalize(input.description).split(" ").slice(0, 4).join(" "));
  }

  if (input.id === "screenshot-ocr") {
    examples.add("copy text from image");
    examples.add("extract text from screenshot");
  }
  if (input.id === "keep-awake") {
    examples.add("dont let laptop sleep");
  }
  if (input.id === "link-tracker-remover" || input.id === "url-cleaner" || input.id === "security-link-tracker-remover") {
    examples.add("clean link");
    examples.add("remove tracking from url");
  }
  if (input.id === "clipboard-manager" || input.id === "clipboard-search") {
    examples.add("i forgot what i copied");
  }
  if (input.id === "instant-file-search") {
    examples.add("find file by name");
    examples.add("search folders locally");
  }
  if (input.id === "video-save-offline-viewer") {
    examples.add("save video offline");
  }
  if (input.id === "system-device-information-dashboard") {
    examples.add("my pc is slow");
  }
  if (input.id === "startup-risk-viewer" || input.id === "process-risk-viewer") {
    examples.add("my pc is slow");
  }
  if (input.id === "popular-error-resolver") {
    examples.add("fix steam error");
  }
  if (input.id === "ai-writing-heuristic") {
    examples.add("is this ai");
  }
  if (input.id === "qr-generator" || input.id === "quick-qr-generator") {
    examples.add("make qr");
  }
  return [...examples];
}

function mergeMoreInfo(base: ToolMoreInfo, overrides?: Partial<ToolMoreInfo>): ToolMoreInfo {
  if (!overrides) {
    return base;
  }

  return {
    whatItDoes: {
      simple: overrides.whatItDoes?.simple ?? base.whatItDoes.simple,
      advanced: overrides.whatItDoes?.advanced ?? base.whatItDoes.advanced
    },
    whereItDoesIt: {
      simple: overrides.whereItDoesIt?.simple ?? base.whereItDoesIt.simple,
      advanced: overrides.whereItDoesIt?.advanced ?? base.whereItDoesIt.advanced
    },
    detailedBehavior: {
      simple: overrides.detailedBehavior?.simple ?? base.detailedBehavior.simple,
      advanced: overrides.detailedBehavior?.advanced ?? base.detailedBehavior.advanced
    },
    permissions: overrides.permissions ?? base.permissions,
    internetRequired: overrides.internetRequired ?? base.internetRequired,
    localOnly: overrides.localOnly ?? base.localOnly,
    dataStored: overrides.dataStored ?? base.dataStored,
    dataSent: overrides.dataSent ?? base.dataSent,
    limitations: overrides.limitations ?? base.limitations
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function categoryOpener(category: ToolCategory) {
  switch (category) {
    case "Automation":
      return "This tool helps you repeat small actions without having to do them by hand every time.";
    case "Clipboard & Text":
      return "This tool helps you clean up, recover, or reshape text that you already copied or pasted.";
    case "AI Tools":
      return "This tool helps you rewrite or understand text without turning the app into a chatbot.";
    case "Security & Privacy":
      return "This tool helps you review files, links, passwords, and clipboard content with a calmer safety check.";
    case "Files & Media":
      return "This tool helps you organize, inspect, or work with files and media you already chose.";
    case "Files & Storage":
      return "This tool helps you sort, search, rename, and size-check files without making the process noisy.";
    case "Screenshots & Media":
      return "This tool helps you work with screenshots, images, and allowed media in a direct visual way.";
    case "System & Device":
      return "This tool helps you understand what your computer is doing and gives you a few gentle controls.";
    case "Network & Web":
      return "This tool helps you inspect links and network details before you trust them.";
    case "Developer":
      return "This tool helps you format, decode, or check developer-style text quickly.";
    case "Productivity":
      return "This tool helps you keep track of small tasks, notes, and time without a heavy workflow.";
    case "Everyday Utilities":
      return "This tool helps you store useful everyday information in one easy place.";
    case "Settings & Trust":
      return "This tool helps you manage privacy, appearance, updates, and trust-related app settings.";
    case "Fun":
      return "This tool helps you take a small break with an offline game or a random picker.";
  }
}

function sentenceFromDescription(description: string) {
  const cleaned = description
    .trim()
    .replace(/^a tool that\s+/i, "")
    .replace(/^a simple tool that\s+/i, "")
    .replace(/^a calm tool for\s+/i, "")
    .replace(/^a\s+/i, "");
  const sentence = cleaned.endsWith(".") ? cleaned : `${cleaned}.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
