import { Search, Settings } from "lucide-react";

interface CommandBarProps {
  value: string;
  resultCount: number;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onOpenSettings: () => void;
}

export function CommandBar({
  value,
  resultCount,
  onChange,
  onSubmit,
  onOpenSettings
}: CommandBarProps) {
  return (
    <div className="command-bar">
      <Search size={18} aria-hidden="true" />
      <input
        aria-label="Search what you want to do"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSubmit();
          }
        }}
        placeholder="Search what you want to do..."
      />
      <button className="command-k" type="button" onClick={onOpenSettings}>
        <Settings size={15} aria-hidden="true" />
        <span>Settings</span>
      </button>
      <span className="command-count pill">{resultCount} tools</span>
    </div>
  );
}
