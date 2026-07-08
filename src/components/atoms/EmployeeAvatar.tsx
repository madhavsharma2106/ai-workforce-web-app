import Avatar from "boring-avatars";
import { cn } from "./cn";

type Size = "sm" | "md" | "lg";

const PIXEL_SIZES: Record<Size, number> = { sm: 32, md: 40, lg: 48 };

// Grays + accent from src/app/globals.css, so generated avatars read as
// part of the same minimal system instead of the library's default rainbow.
const PALETTE = ["#111827", "#374151", "#4f46e5", "#6366f1", "#e5e7eb"];

type Props = {
  seed: string;
  size?: Size;
  className?: string;
};

export const EmployeeAvatar = ({ seed, size = "md", className }: Props) => (
  <Avatar
    name={seed}
    size={PIXEL_SIZES[size]}
    variant="beam"
    colors={PALETTE}
    square
    className={cn("rounded-md", className)}
  />
);
