import { cn } from "./cn";

type Tab<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  tabs: Tab<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  className?: string;
};

export function Tabs<T extends string>({ tabs, activeKey, onChange, className }: Props<T>) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex gap-1 rounded-md border border-(--border) bg-gray-50 p-1", className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeKey === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition",
            activeKey === tab.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
