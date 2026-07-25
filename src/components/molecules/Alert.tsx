import type { HTMLAttributes } from "react";
import { cn } from "../atoms/cn";

type Variant = "info" | "error";

const variantClasses: Record<Variant, string> = {
  info: "bg-(--accent-soft) text-(--accent-soft-text)",
  error: "bg-red-50 text-red-700",
};

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
};

export function Alert({ variant = "info", className, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
