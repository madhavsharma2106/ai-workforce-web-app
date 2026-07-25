import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-(--accent) text-white hover:bg-(--accent-hover)",
  secondary:
    "bg-(--secondary-bg) text-(--muted-faint-3) hover:bg-(--secondary-hover)",
  danger: "bg-(--secondary-bg) text-red-600 hover:bg-red-50",
  accent: "bg-(--accent) text-white hover:bg-(--accent-hover)",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-[22px] py-[11px] text-[13.5px]",
  lg: "px-6 py-3 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      className,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "rounded-full font-bold transition disabled:bg-(--disabled-bg) disabled:text-(--disabled-text) disabled:hover:bg-(--disabled-bg)",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
