import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";
type Tone = BadgeTone;
type Size = "xs" | "sm" | "md";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-600",
  accent: "bg-(--accent-soft) text-(--accent-hover)",
  success: "bg-green-50 text-green-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
};

const sizeClasses: Record<Size, string> = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-1.5 text-sm",
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
        "shrink-0 rounded-full font-medium",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
