import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Padding = "none" | "sm" | "md" | "lg";

const paddingClasses: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  padding?: Padding;
  children: ReactNode;
};

export function Card({
  as: Component = "div",
  padding = "lg",
  className,
  children,
  ...props
}: Props) {
  return (
    <Component
      className={cn(
        "rounded-lg border border-(--border)",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
