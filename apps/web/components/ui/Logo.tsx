import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Use dark variant for light backgrounds (default: false) */
  variant?: "light" | "dark";
}

// Height in pixels - width will auto-scale based on logo aspect ratio
const sizeMap = {
  xs: 28,   // Extra small - collapsed sidebar
  sm: 36,   // Small - footer
  md: 44,   // Medium - headers, navigation (default)
  lg: 52,   // Large - mobile menu header
  xl: 64,   // Extra large - login/auth pages
};

// Logo file paths - update these when transparent versions are available
// TODO: Replace with transparent logo file (PNG or SVG without embedded background)
const LOGO_PATH = "/logo.svg";

export function Logo({ size = "md", className, variant = "dark" }: LogoProps) {
  const height = sizeMap[size];

  // Use icon for xs size (collapsed sidebar), full logo otherwise
  const isIcon = size === "xs";
  const iconPath = "/icon.svg";

  // For icon: use square dimensions, for logo: use 4:1 aspect ratio
  const width = isIcon ? height : Math.round(height * 4);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src={isIcon ? iconPath : LOGO_PATH}
        alt="Lighthouse Careers"
        width={width}
        height={height}
        className={cn(
          "object-contain",
          variant === "light" && "brightness-0 invert"
        )}
        priority
      />
    </div>
  );
}
