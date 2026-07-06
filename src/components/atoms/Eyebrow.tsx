import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "accent" | "accent-faint" | "muted";
type Tracking = "wide" | "widest";

const toneClasses: Record<Tone, string> = {
  accent: "text-(--accent)",
  "accent-faint": "text-indigo-300",
  muted: "text-gray-400",
};

const trackingClasses: Record<Tracking, string> = {
  wide: "tracking-wide",
  widest: "tracking-widest",
};

type Props = HTMLAttributes<HTMLParagraphElement> & {
  tone?: Tone;
  tracking?: Tracking;
};

export function Eyebrow({
  tone = "accent",
  tracking = "widest",
  className,
  ...props
}: Props) {
  return (
    <p
      className={cn(
        "text-xs font-medium uppercase",
        trackingClasses[tracking],
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
