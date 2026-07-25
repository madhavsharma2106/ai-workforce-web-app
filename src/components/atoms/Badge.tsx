import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";
type Tone = BadgeTone;
type Size = "xs" | "sm" | "md";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-(--inset) text-(--muted-faint)",
  accent: "bg-(--accent-soft) text-(--accent-soft-text)",
  success: "bg-(--accent-soft) text-(--accent-soft-text)",
  warning: "bg-(--accent-soft-2) text-(--accent-soft-2-text)",
  danger: "bg-red-50 text-red-600",
};

const sizeClasses: Record<Size, string> = {
  xs: "px-3 py-1 text-[11px]",
  sm: "px-3.5 py-1.5 text-[11.5px]",
  md: "px-4 py-[7px] text-[11.5px]",
};

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  size?: Size;
};

export function Badge({
  tone = "neutral",
  size = "xs",
  className,
  ...props
}: Props) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full font-bold",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
