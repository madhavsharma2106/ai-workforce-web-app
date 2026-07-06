import type { ElementType, HTMLAttributes } from "react";
import { cn } from "./cn";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Tone = "default" | "muted" | "subtle" | "inverted";
type Weight = "normal" | "medium" | "semibold";

const sizeClasses: Record<Size, string> = {
  xs: "text-xs",
  sm: "text-sm leading-6",
  md: "text-base leading-6",
  lg: "text-lg leading-7",
  xl: "text-xl",
};

const toneClasses: Record<Tone, string> = {
  default: "text-gray-900",
  muted: "text-gray-500",
  subtle: "text-gray-600",
  inverted: "text-gray-300",
};

const weightClasses: Record<Weight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
};

type Props = HTMLAttributes<HTMLParagraphElement> & {
  as?: ElementType;
  size?: Size;
  tone?: Tone;
  weight?: Weight;
};

export function Text({
  as: Component = "p",
  size = "sm",
  tone = "default",
  weight = "normal",
  className,
  ...props
}: Props) {
  return (
    <Component
      className={cn(
        sizeClasses[size],
        toneClasses[tone],
        weightClasses[weight],
        className,
      )}
      {...props}
    />
  );
}
