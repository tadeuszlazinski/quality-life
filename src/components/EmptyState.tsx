import { SearchX } from "lucide-react";

interface EmptyStateProps {
  query?: string;
  examples?: string[];
}

export function EmptyState({ query, examples = [] }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <SearchX size={24} aria-hidden="true" />
      <span>{query ? "No close match yet, but a few tools still fit" : "Nothing here yet"}</span>
      <p className="muted-line">
        {query
          ? "Try a simpler phrase, a typo, or the problem you want to solve instead of the exact tool name."
          : "Start from Home or use Smart Search to reach the right tool by what you want to do."}
      </p>
      {examples.length > 0 && (
        <div className="empty-examples">
          {examples.map((example) => (
            <span key={example} className="pill">
              {example}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
