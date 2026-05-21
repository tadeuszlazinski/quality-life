import type { SearchScope, ToolDefinition } from "../types/tools";

export interface SmartSearchResult {
  tool: ToolDefinition;
  score: number;
  whyMatched: string;
  reasons: string[];
  relatedTools: ToolDefinition[];
  fallback: boolean;
}

export interface SmartSearchOptions {
  scope?: SearchScope;
  pinnedToolIds?: string[];
  recentToolIds?: string[];
  learnedBoosts?: Record<string, number>;
  limit?: number;
}

const TOKEN_SYNONYMS: Record<string, string[]> = {
  pc: ["computer", "laptop", "device", "system"],
  computer: ["pc", "laptop", "device", "system"],
  laptop: ["pc", "computer", "device"],
  slow: ["performance", "startup", "process", "lag"],
  lag: ["slow", "performance"],
  file: ["folder", "document", "media"],
  files: ["folder", "document", "media"],
  folder: ["file", "directory"],
  link: ["url", "website", "web"],
  url: ["link", "website", "web"],
  website: ["url", "link", "web"],
  clean: ["remove", "strip"],
  save: ["store", "download", "offline"],
  offline: ["local", "save"],
  copy: ["clipboard", "paste", "snippet"],
  copied: ["clipboard", "paste", "snippet"],
  clipboard: ["copy", "paste", "history"],
  image: ["screenshot", "photo", "picture"],
  picture: ["image", "screenshot"],
  screenshot: ["image", "screen", "ocr"],
  text: ["word", "note", "writing"],
  type: ["keyboard", "write"],
  awake: ["sleep", "keep awake"],
  sleep: ["awake", "keep awake"],
  qr: ["qrcode", "code"],
  ai: ["rewrite", "prompt", "writing"],
  prompt: ["ai", "rewrite", "writing"],
  error: ["issue", "fix", "problem"],
  steam: ["game", "launcher", "driver"],
  suspicious: ["risky", "unsafe", "malware", "sus"],
  sus: ["suspicious", "risky", "unsafe", "malware"],
  password: ["vault", "secret", "login"],
  wifi: ["network", "devices", "router"],
  network: ["wifi", "internet", "url"],
  volume: ["sound", "audio", "mute"],
  mute: ["volume", "sound", "audio"],
  note: ["notes", "scratchpad", "memo"],
  notes: ["note", "scratchpad", "memo"],
  color: ["palette", "picker", "hex"],
  card: ["cards", "deck", "blackjack", "poker"],
  cards: ["card", "deck", "blackjack", "poker"],
  dice: ["random", "roller", "bag"],
  regex: ["regexp", "pattern", "developer"],
  json: ["format", "developer", "data"],
  html: ["escape", "unescape"],
  uuid: ["id", "identifier"],
  history: ["recent", "clipboard", "search"],
  tracker: ["tracking", "url", "link"],
  trackerless: ["link", "url", "clean"],
  translate: ["language", "translator"],
  formal: ["professional", "business", "academic"],
  professional: ["formal", "business"],
  professionalize: ["formal", "business"],
  jiggler: ["mouse", "awake"],
  clicker: ["mouse", "automation"],
  macro: ["automation", "shortcut"],
  "my": [],
  "is": [],
  "to": [],
  "the": [],
  "a": [],
  "and": [],
  "for": [],
  "of": [],
  "this": []
};

const PHRASE_HINTS: Array<{ phrase: string; tokens: string[] }> = [
  { phrase: "my pc is slow", tokens: ["system", "startup", "process", "slow"] },
  { phrase: "computer is slow", tokens: ["system", "startup", "process", "slow"] },
  { phrase: "dont let laptop sleep", tokens: ["keep awake", "sleep", "awake"] },
  { phrase: "save video offline", tokens: ["video", "offline", "media"] },
  { phrase: "copy text from image", tokens: ["ocr", "screenshot", "clipboard"] },
  { phrase: "check if file is sus", tokens: ["security", "file", "scanner", "suspicious"] },
  { phrase: "fix steam error", tokens: ["error", "steam", "game"] },
  { phrase: "make qr", tokens: ["qr", "generator"] },
  { phrase: "clean link", tokens: ["url", "tracker", "clean"] },
  { phrase: "i forgot what i copied", tokens: ["clipboard", "history", "search"] },
  { phrase: "who is on my wifi", tokens: ["wifi", "network", "devices"] },
  { phrase: "make my text sound professional", tokens: ["formal", "rewrite", "professional"] },
  { phrase: "is this ai", tokens: ["writing", "heuristic", "ai"] }
];

export function smartSearchTools(
  tools: ToolDefinition[],
  query: string,
  options: SmartSearchOptions = {}
): SmartSearchResult[] {
  const normalized = normalize(query);
  const scope = options.scope ?? "All";
  const limit = options.limit ?? 24;
  const pinned = new Set(options.pinnedToolIds ?? []);
  const recent = new Set(options.recentToolIds ?? []);
  const learnedBoosts = options.learnedBoosts ?? {};
  const queryTokens = expandTokens(tokenize(normalized));
  const phraseHints = PHRASE_HINTS.filter((hint) => normalized.includes(hint.phrase));

  const results = tools
    .filter((tool) => matchesScope(tool, scope))
    .map((tool) => scoreTool(tool, normalized, queryTokens, phraseHints, pinned, recent, learnedBoosts))
    .filter((result) => normalized ? result.score > 0 : true)
    .sort((left, right) => right.score - left.score || left.tool.name.localeCompare(right.tool.name));

  if (normalized && results.length === 0) {
    const fallback = tools
      .filter((tool) => matchesScope(tool, scope))
      .map((tool) => scoreTool(tool, normalized, queryTokens, phraseHints, pinned, recent, learnedBoosts, true))
      .sort((left, right) => right.score - left.score || left.tool.name.localeCompare(right.tool.name))
      .slice(0, Math.min(limit, 8));
    return fallback.map((result, index) => ({
      ...result,
      relatedTools: index === 0 ? buildRelatedTools(result.tool, tools, queryTokens).slice(0, 4) : [],
      fallback: true,
      whyMatched: result.whyMatched || "No exact match, but this may help."
    }));
  }

  if (!normalized) {
    return results.slice(0, limit).map((result) => ({ ...result, fallback: false }));
  }

  const trimmed = results.slice(0, limit);
  if (trimmed.length > 0 && trimmed[0].score < 12) {
    return trimmed.map((result, index) => ({
      ...result,
      relatedTools: index === 0 ? buildRelatedTools(result.tool, tools, queryTokens).slice(0, 4) : [],
      fallback: true,
      whyMatched: result.whyMatched || "No exact match, but this may help."
    }));
  }
  return trimmed.map((result, index) => ({
    ...result,
    relatedTools: index === 0 ? buildRelatedTools(result.tool, tools, queryTokens).slice(0, 4) : [],
    fallback: false
  }));
}

export function searchTools(
  tools: ToolDefinition[],
  query: string,
  options: SmartSearchOptions = {}
) {
  return smartSearchTools(tools, query, options);
}

export function matchesTool(tool: ToolDefinition, query: string) {
  return smartSearchTools([tool], query).length > 0;
}

function scoreTool(
  tool: ToolDefinition,
  normalizedQuery: string,
  queryTokens: string[],
  phraseHints: Array<{ phrase: string; tokens: string[] }>,
  pinned: Set<string>,
  recent: Set<string>,
  learnedBoosts: Record<string, number>,
  fallback = false
): SmartSearchResult {
  const reasons: string[] = [];
  let score = tool.searchBoost * 2;
  const learnedBoost = learnedBoosts[tool.id] ?? 0;
  if (learnedBoost !== 0) {
    score += learnedBoost;
    reasons.push(learnedBoost > 0 ? "Learns from your past picks" : "Older feedback lowered this match");
  }

  if (!normalizedQuery) {
    if (pinned.has(tool.id)) {
      score += 20;
      reasons.push("Pinned in favorites");
    }
    if (recent.has(tool.id)) {
      score += 12;
      reasons.push("Recently used");
    }
    return {
      tool,
      score,
      whyMatched: reasons[0] ?? "",
      reasons,
      relatedTools: [],
      fallback
    };
  }

  const index = getSearchIndex(tool);

  if (index.normalizedName.includes(normalizedQuery)) {
    score += 42;
    reasons.push(`Name matches "${normalizedQuery}"`);
  }
  if (index.normalizedShortDescription.includes(normalizedQuery) || index.normalizedDescription.includes(normalizedQuery)) {
    score += 28;
    reasons.push("Description matches your wording");
  }
  if (index.normalizedCategory.includes(normalizedQuery)) {
    score += 24;
    reasons.push(`Category match: ${tool.category}`);
  }
  if (matchesAny(index, "aliases", normalizedQuery)) {
    score += 28;
    reasons.push("Alias match");
  }
  if (matchesAny(index, "exampleQueries", normalizedQuery)) {
    score += 32;
    reasons.push("Matches a common example query");
  }
  if (matchesAny(index, "problemsSolved", normalizedQuery)) {
    score += 30;
    reasons.push("Solves the problem you described");
  }
  if (matchesAny(index, "keywords", normalizedQuery)) {
    score += 24;
    reasons.push("Keyword match");
  }

  for (const phraseHint of phraseHints) {
    if (scoreFromTokenList(tool, phraseHint.tokens) > 0) {
      score += 18;
      reasons.push(`Matches the intent behind "${phraseHint.phrase}"`);
      break;
    }
  }

  for (const token of queryTokens) {
    const tokenScore = scoreFromToken(tool, token);
    if (tokenScore > 0) {
      score += tokenScore;
      const label = matchLabel(tool, token);
      if (label) {
        reasons.push(label);
      }
    }
  }

  if (pinned.has(tool.id)) {
    score += 16;
    reasons.push("Pinned in favorites");
  }
  if (recent.has(tool.id)) {
    score += 10;
    reasons.push("Recently used");
  }
  if (tool.badges?.includes("internet") && /offline|local|save|download/.test(normalizedQuery)) {
    score += 6;
  }

  if (reasons.length === 0) {
    score += fallback ? 0 : 1;
    reasons.push("Closest local match");
  }

  const relatedTools = [] as ToolDefinition[];
  return {
    tool,
    score,
    whyMatched: reasons[0],
    reasons,
    relatedTools,
    fallback
  };
}

function buildRelatedTools(tool: ToolDefinition, tools: ToolDefinition[], queryTokens: string[]) {
  return tools
    .filter((candidate) => candidate.id !== tool.id)
    .map((candidate) => {
      const candidateIndex = getSearchIndex(candidate);
      let score = 0;
      if (candidate.category === tool.category) {
        score += 8;
      }
      if (candidate.badges?.includes("internet") === tool.badges?.includes("internet")) {
        score += 2;
      }
      for (const token of queryTokens) {
        if (scoreFromToken(candidate, token) > 0) {
          score += 3;
        }
      }
      if (sharesTerms(candidateIndex, tool.aliases) || sharesTerms(candidateIndex, tool.problemsSolved) || sharesTerms(candidateIndex, tool.exampleQueries)) {
        score += 5;
      }
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.candidate.name.localeCompare(right.candidate.name))
    .map((entry) => entry.candidate);
}

function matchesScope(tool: ToolDefinition, scope: SearchScope) {
  switch (scope) {
    case "All":
      return true;
    case "Tools":
      return tool.category !== "Settings & Trust";
    case "Settings":
      return tool.category === "Settings & Trust";
    case "History":
      return (
        tool.id.includes("history") ||
        tool.keywords.some((keyword) => keyword.includes("history") || keyword.includes("clipboard") || keyword.includes("note")) ||
        tool.category === "Clipboard & Text" ||
        tool.category === "Productivity" ||
        tool.category === "Everyday Utilities"
      );
    case "Files":
      return tool.category === "Files & Media" || tool.category === "Files & Storage" || tool.category === "Screenshots & Media";
    case "AI":
      return tool.category === "AI Tools";
    case "Security":
      return tool.category === "Security & Privacy";
    default:
      return true;
  }
}

interface SearchIndex {
  haystack: string;
  normalizedName: string;
  normalizedShortDescription: string;
  normalizedDescription: string;
  normalizedCategory: string;
  keywords: string[];
  aliases: string[];
  problemsSolved: string[];
  exampleQueries: string[];
}

const SEARCH_INDEX_CACHE = new WeakMap<ToolDefinition, SearchIndex>();

function matchesAny(index: SearchIndex, values: "aliases" | "exampleQueries" | "problemsSolved" | "keywords", normalizedQuery: string) {
  return index[values].some((value) => value.includes(normalizedQuery));
}

function sharesTerms(candidate: SearchIndex, values: string[]) {
  return values.some((value) => candidate.haystack.includes(normalize(value)));
}

function scoreFromToken(tool: ToolDefinition, token: string) {
  const index = getSearchIndex(tool);
  let score = 0;
  const fields = [
    index.normalizedName,
    index.normalizedShortDescription,
    index.normalizedDescription,
    index.normalizedCategory,
    ...index.keywords,
    ...index.aliases,
    ...index.problemsSolved,
    ...index.exampleQueries
  ];

  for (const field of fields) {
    if (!field) {
      continue;
    }
    if (field === token) {
      score = Math.max(score, 12);
    } else if (field.includes(token)) {
      score = Math.max(score, 8);
    } else if (token.length >= 3 && field.split(" ").some((part) => part.startsWith(token))) {
      score = Math.max(score, 6);
    } else if (token.length >= 3 && field.split(" ").some((part) => levenshtein(part, token) <= 1)) {
      score = Math.max(score, 4);
    }
  }

  const synonyms = TOKEN_SYNONYMS[token] ?? [];
  for (const synonym of synonyms) {
    if (index.haystack.includes(synonym)) {
      score = Math.max(score, 5);
    }
  }
  return score;
}

function scoreFromTokenList(tool: ToolDefinition, tokens: string[]) {
  return tokens.reduce((highest, token) => Math.max(highest, scoreFromToken(tool, token)), 0);
}

function matchLabel(tool: ToolDefinition, token: string) {
  const index = getSearchIndex(tool);

  if (index.normalizedName.includes(token)) {
    return `Name contains "${token}"`;
  }
  if (index.normalizedCategory.includes(token)) {
    return `Category: ${tool.category}`;
  }
  if (index.normalizedShortDescription.includes(token)) {
    return "Description includes your words";
  }
  if (index.aliases.some((alias) => alias.includes(token))) {
    return "Alias match";
  }
  if (index.problemsSolved.some((problem) => problem.includes(token))) {
    return "Problem match";
  }
  if (index.exampleQueries.some((example) => example.includes(token))) {
    return "Example query match";
  }
  return "";
}

function getSearchIndex(tool: ToolDefinition): SearchIndex {
  const cached = SEARCH_INDEX_CACHE.get(tool);
  if (cached) {
    return cached;
  }

  const index: SearchIndex = {
    haystack: normalize(
      [
        tool.name,
        tool.shortDescription,
        tool.description,
        tool.category,
        ...tool.keywords,
        ...tool.aliases,
        ...tool.problemsSolved,
        ...tool.exampleQueries
      ].join(" ")
    ),
    normalizedName: normalize(tool.name),
    normalizedShortDescription: normalize(tool.shortDescription),
    normalizedDescription: normalize(tool.description),
    normalizedCategory: normalize(tool.category),
    keywords: tool.keywords.map((keyword) => normalize(keyword)),
    aliases: tool.aliases.map((alias) => normalize(alias)),
    problemsSolved: tool.problemsSolved.map((problem) => normalize(problem)),
    exampleQueries: tool.exampleQueries.map((example) => normalize(example))
  };
  SEARCH_INDEX_CACHE.set(tool, index);
  return index;
}

function tokenize(text: string) {
  return text.split(/\s+/).map((part) => part.trim()).filter(Boolean);
}

function expandTokens(tokens: string[]) {
  const expanded = new Set<string>();
  for (const token of tokens) {
    if (!token) {
      continue;
    }
    expanded.add(token);
    const synonymList = TOKEN_SYNONYMS[token] ?? [];
    for (const synonym of synonymList) {
      expanded.add(synonym);
    }
  }
  for (const hint of PHRASE_HINTS) {
    if (tokens.includes(hint.phrase)) {
      hint.tokens.forEach((token) => expanded.add(token));
    }
  }
  return [...expanded].filter(Boolean);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  const previous = new Array(b.length + 1).fill(0).map((_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const insert = current[j - 1] + 1;
      const remove = previous[j] + 1;
      const replace = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min(insert, remove, replace));
    }
    for (let j = 0; j < previous.length; j += 1) {
      previous[j] = current[j];
    }
  }
  return previous[b.length];
}
