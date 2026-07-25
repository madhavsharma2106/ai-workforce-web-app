import Avatar from "boring-avatars";
import { cn } from "./cn";

type Size = "sm" | "md" | "lg";

const PIXEL_SIZES: Record<Size, number> = { sm: 32, md: 40, lg: 56 };

// Small blob radius (roster-scale avatars) vs. the rounder "hero" blob used
// at the larger sizes — see docs/DESIGN.md's Shape section.
const BLOB_RADIUS: Record<Size, string> = {
  sm: "50% 40% 55% 45% / 45% 55% 40% 60%",
  md: "50% 40% 55% 45% / 45% 55% 40% 60%",
  lg: "58% 42% 53% 47% / 48% 55% 45% 52%",
};

// Greenhouse palette (src/app/globals.css) so generated avatars read as part
// of this system instead of the library's default rainbow.
const PALETTE = ["#2b3524", "#5b7a45", "#8ba36c", "#c9d2bd", "#eef1e8"];

type Props = {
  seed: string;
  size?: Size;
  className?: string;
};

export const EmployeeAvatar = ({ seed, size = "md", className }: Props) => {
  const px = PIXEL_SIZES[size];

  return (
    <div
      className={cn("shrink-0 overflow-hidden", className)}
      style={{ width: px, height: px, borderRadius: BLOB_RADIUS[size] }}
    >
      <Avatar name={seed} size={px} variant="beam" colors={PALETTE} square />
    </div>
  );
};
