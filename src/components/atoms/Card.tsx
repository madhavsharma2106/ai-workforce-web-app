import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Padding = "none" | "sm" | "md" | "lg";

const paddingClasses: Record<Padding, string> = {
  none: "",
  sm: "p-5",
  md: "p-6",
  lg: "p-7",
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
        "rounded-[20px] bg-(--surface)",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
