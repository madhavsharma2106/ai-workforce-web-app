import type { HTMLAttributes } from "react";
import { cn } from "../atoms/cn";

type Variant = "info" | "error";

const variantClasses: Record<Variant, string> = {
  info: "border-indigo-100 bg-(--accent-soft) text-(--accent-hover)",
  error: "border-red-100 bg-red-50 text-red-700",
};

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
};

export function Alert({ variant = "info", className, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
