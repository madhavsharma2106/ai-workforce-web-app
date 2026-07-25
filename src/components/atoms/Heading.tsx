import type { ElementType, HTMLAttributes } from "react";
import { cn } from "./cn";

type Size = "xl" | "lg" | "md" | "sm";

const sizeClasses: Record<Size, string> = {
  xl: "text-[28px] leading-[1.2] sm:text-[34px]",
  lg: "text-2xl",
  md: "text-[19px]",
  sm: "text-[17px]",
};

type Props = HTMLAttributes<HTMLHeadingElement> & {
  as?: ElementType;
  size?: Size;
  /** The Emma-voice greeting/headline treatment — italic serif, reserved for an employee speaking first-person about their own work. */
  italic?: boolean;
};

export function Heading({
  as: Component = "h2",
  size = "md",
  italic = false,
  className,
  ...props
}: Props) {
  return (
    <Component
      className={cn(
        "font-serif text-(--heading)",
        italic && "italic",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
