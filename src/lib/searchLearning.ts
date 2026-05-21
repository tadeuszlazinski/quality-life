export type SearchLearningMap = Record<string, number>;

type SearchChoice = {
  tool: {
    id: string;
  };
};

export function applySearchFeedback(
  current: SearchLearningMap,
  results: SearchChoice[],
  selectedToolId: string
) {
  const next = { ...current };
  const selectedIndex = results.findIndex((result) => result.tool.id === selectedToolId);
  if (selectedIndex < 0) {
    return next;
  }

  const total = Math.max(1, results.length);
  const reward = clamp(1, 10, Math.round((total - selectedIndex) / total * 10) + 2);
  next[selectedToolId] = clamp(-6, 24, (next[selectedToolId] ?? 0) + reward);

  // If the user selected a lower-ranked match, gently demote the options that
  // were above it so future searches stop overvaluing those close-but-wrong guesses.
  for (let index = 0; index < selectedIndex; index += 1) {
    const candidateId = results[index].tool.id;
    const penalty = Math.max(1, Math.round(reward / 3));
    next[candidateId] = clamp(-8, 18, (next[candidateId] ?? 0) - penalty);
  }

  // Give a small nudge to the selected tool's neighbors so the search learns
  // broader context around the result the user actually wanted.
  results.slice(Math.max(0, selectedIndex - 2), Math.min(results.length, selectedIndex + 3)).forEach((result, index) => {
    if (result.tool.id === selectedToolId) {
      return;
    }
    const proximityPenalty = Math.max(0, 2 - Math.abs((selectedIndex - 2) + index - selectedIndex));
    if (proximityPenalty > 0) {
      next[result.tool.id] = clamp(-6, 16, (next[result.tool.id] ?? 0) - proximityPenalty);
    }
  });

  return next;
}

export function localSearchLearningSummary(map: SearchLearningMap) {
  return Object.entries(map)
    .filter(([, value]) => value !== 0)
    .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))
    .slice(0, 5)
    .map(([toolId, value]) => ({ toolId, value }));
}

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}
