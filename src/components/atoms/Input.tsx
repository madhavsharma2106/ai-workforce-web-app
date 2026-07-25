import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

const baseFieldClasses =
  "w-full rounded-xl border-none bg-(--inset) p-3.5 text-[13px] text-(--body-strong) outline-none transition";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(baseFieldClasses, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseFieldClasses, className)} {...props} />
));
Textarea.displayName = "Textarea";
