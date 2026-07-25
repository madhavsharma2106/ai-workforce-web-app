import { cn } from "./cn";

type Tab<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  tabs: Tab<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  className?: string;
};

export function Tabs<T extends string>({
  tabs,
  activeKey,
  onChange,
  className,
}: Props<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex gap-1 rounded-full bg-(--secondary-bg) p-1",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeKey === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "rounded-full px-4 py-1.5 text-[13px] font-bold transition",
            activeKey === tab.key
              ? "bg-(--surface) text-(--heading)"
              : "text-(--muted-faint-3) hover:text-(--heading)",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
