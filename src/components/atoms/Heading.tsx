import type { ElementType, HTMLAttributes } from "react";
import { cn } from "./cn";

type Size = "xl" | "lg" | "md" | "sm";

const sizeClasses: Record<Size, string> = {
  xl: "text-5xl leading-[1.1] sm:text-6xl",
  lg: "text-3xl",
  md: "text-2xl",
  sm: "text-lg",
};

type Props = HTMLAttributes<HTMLHeadingElement> & {
  as?: ElementType;
  size?: Size;
};

export function Heading({
  as: Component = "h2",
  size = "md",
  className,
  ...props
}: Props) {
  return (
    <Component
      className={cn(
        "font-semibold tracking-tight text-gray-900",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
