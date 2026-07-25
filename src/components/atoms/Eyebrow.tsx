import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "accent" | "accent-faint" | "muted" | "inverted";
type Tracking = "wide" | "widest";

const toneClasses: Record<Tone, string> = {
  accent: "text-(--muted-faint)",
  "accent-faint": "text-(--muted-faint-2)",
  muted: "text-(--muted-faint)",
  inverted: "text-white/70",
};

const trackingClasses: Record<Tracking, string> = {
  wide: "tracking-[.06em]",
  widest: "tracking-[.08em]",
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
        "text-[11px] font-normal uppercase",
        trackingClasses[tracking],
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
