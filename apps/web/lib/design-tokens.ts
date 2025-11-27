/**
 * LIGHTHOUSE CREW NETWORK
 * Luxury Design Token System
 *
 * Single source of truth for all design tokens.
 * Import from this file instead of hardcoding values.
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  // Primary - Champagne Gold
  gold: {
    50: "#FDFBF7",
    100: "#F9F5EB",
    200: "#F0E6D0",
    300: "#E1D4B5",
    400: "#CBBA8E",
    500: "#B49A5E", // Primary brand color
    600: "#9A7F45",
    700: "#7D6636",
    800: "#5E4D29",
    900: "#3D3219",
  },

  // Primary - Midnight Navy
  navy: {
    50: "#F4F6F9",
    100: "#E4E9F0",
    200: "#C5CFE0",
    300: "#94A3C4",
    400: "#5E6F94",
    500: "#3D4F6F",
    600: "#2A3A54",
    700: "#1C2840",
    800: "#111827", // Sidebar background
    900: "#0A0F1A",
  },

  // Accent - Burgundy
  burgundy: {
    50: "#FDF5F6",
    100: "#F9E6E9",
    200: "#F0C5CC",
    300: "#E09AA6",
    400: "#C4697A",
    500: "#9E3B4D",
    600: "#7D2D3D",
    700: "#5E222E",
    800: "#3F1720",
    900: "#2A1015",
  },

  // Neutrals - Warm Grays
  gray: {
    50: "#FAFAF8", // Page background (warm white)
    100: "#F5F4F1",
    200: "#E8E6E1",
    300: "#D4D1CA", // Card borders base
    400: "#A8A49B",
    500: "#7D796F",
    600: "#5C5850",
    700: "#433F38",
    800: "#2A2722",
    900: "#1A1816",
  },

  // Semantic - Success (Emerald)
  success: {
    50: "#F0FAF6",
    100: "#D1F2E4",
    200: "#A7E4CD",
    300: "#6DD1AE",
    400: "#3AB889",
    500: "#1D9A6C", // Primary success
    600: "#167A55",
    700: "#115E42",
    800: "#0D4532",
    900: "#092E22",
  },

  // Semantic - Warning (Warm Amber)
  warning: {
    50: "#FFFBF5",
    100: "#FEF3E2",
    200: "#FDE4BD",
    300: "#FBCE8A",
    400: "#F7B355",
    500: "#E69A2E", // Primary warning
    600: "#C47F1A",
    700: "#9C6315",
    800: "#744A10",
    900: "#4D310B",
  },

  // Semantic - Error (Deep Rose)
  error: {
    50: "#FEF5F5",
    100: "#FCE8E8",
    200: "#F9CECE",
    300: "#F3A5A5",
    400: "#E97777",
    500: "#D64545", // Primary error
    600: "#B33636",
    700: "#8C2A2A",
    800: "#661F1F",
    900: "#441515",
  },

  // Surface colors
  surface: {
    white: "#FFFFFF",
    cream: "#FDFBF7",
    ivory: "#F9F7F2",
    overlayLight: "rgba(253, 251, 247, 0.95)",
    overlayDark: "rgba(17, 24, 39, 0.7)",
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  // Warm-tinted shadows using warm gray base
  xs: "0px 1px 2px rgba(26, 24, 22, 0.04)",
  sm: "0px 2px 4px rgba(26, 24, 22, 0.06), 0px 1px 2px rgba(26, 24, 22, 0.04)",
  md: "0px 4px 8px rgba(26, 24, 22, 0.08), 0px 2px 4px rgba(26, 24, 22, 0.04)",
  lg: "0px 8px 16px rgba(26, 24, 22, 0.1), 0px 4px 8px rgba(26, 24, 22, 0.04)",
  xl: "0px 16px 32px rgba(26, 24, 22, 0.12), 0px 8px 16px rgba(26, 24, 22, 0.06)",

  // Gold-tinted shadows for CTAs and highlights
  gold: {
    sm: "0px 2px 8px rgba(180, 154, 94, 0.3)",
    md: "0px 4px 12px rgba(180, 154, 94, 0.3)",
    lg: "0px 6px 16px rgba(180, 154, 94, 0.4)",
  },

  // Focus ring
  focusRing: "0 0 0 3px rgba(180, 154, 94, 0.15)",

  // Card hover states
  card: {
    default: "0px 2px 4px rgba(26, 24, 22, 0.06), 0px 1px 2px rgba(26, 24, 22, 0.04)",
    hover: "0px 8px 16px rgba(26, 24, 22, 0.1), 0px 4px 8px rgba(26, 24, 22, 0.04)",
  },
} as const;

// =============================================================================
// GRADIENTS
// =============================================================================

export const gradients = {
  // Gold gradient for primary CTAs
  gold: "linear-gradient(135deg, #CBBA8E 0%, #B49A5E 50%, #9A7F45 100%)",
  goldHover: "linear-gradient(135deg, #E1D4B5 0%, #CBBA8E 50%, #B49A5E 100%)",

  // Text gradient for special headings
  goldText: "linear-gradient(135deg, #B49A5E 0%, #9A7F45 100%)",

  // Navy gradient for dark sections
  navy: "linear-gradient(180deg, #1C2840 0%, #111827 100%)",

  // Subtle background gradients
  warmWhite: "linear-gradient(180deg, #FDFBF7 0%, #FAFAF8 100%)",
  cream: "linear-gradient(180deg, #FDFBF7 0%, #F9F5EB 100%)",
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: "0",
  xs: "2px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "24px",
  full: "9999px",
} as const;

// =============================================================================
// BORDERS
// =============================================================================

export const borders = {
  // Card border with warm gray
  card: "1px solid rgba(212, 209, 202, 0.6)",
  cardHover: "1px solid rgba(212, 209, 202, 0.8)",

  // Input borders
  input: {
    default: `1px solid ${colors.gray[300]}`,
    focus: `1px solid ${colors.gold[500]}`,
    error: `1px solid ${colors.error[500]}`,
  },

  // Dividers
  divider: `1px solid ${colors.gray[200]}`,
  dividerDark: "1px solid rgba(255, 255, 255, 0.1)",
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font families
  fonts: {
    serif: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", monospace',
  },

  // Font sizes with line heights
  sizes: {
    xs: { fontSize: "12px", lineHeight: "16px" },
    sm: { fontSize: "14px", lineHeight: "20px" },
    base: { fontSize: "16px", lineHeight: "24px" },
    lg: { fontSize: "18px", lineHeight: "28px" },
    xl: { fontSize: "20px", lineHeight: "28px" },
    "2xl": { fontSize: "24px", lineHeight: "32px" },
    "3xl": { fontSize: "30px", lineHeight: "38px" },
    "4xl": { fontSize: "36px", lineHeight: "44px" },
    "5xl": { fontSize: "48px", lineHeight: "56px" },
    "6xl": { fontSize: "60px", lineHeight: "68px" },
  },

  // Font weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Letter spacing
  letterSpacing: {
    tighter: "-0.02em",
    tight: "-0.01em",
    normal: "0",
    wide: "0.01em",
    wider: "0.02em",
    widest: "0.1em", // For uppercase labels
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: "0",
  px: "1px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  3.5: "14px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  9: "36px",
  10: "40px",
  11: "44px",
  12: "48px",
  14: "56px",
  16: "64px",
  20: "80px",
  24: "96px",
  28: "112px",
  32: "128px",
  36: "144px",
  40: "160px",
  44: "176px",
  48: "192px",
  52: "208px",
  56: "224px",
  60: "240px",
  64: "256px",
  72: "288px",
  80: "320px",
  96: "384px",
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  // Durations
  duration: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "400ms",
  },

  // Timing functions
  easing: {
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Common presets
  default: "all 200ms ease",
  colors: "color 200ms ease, background-color 200ms ease, border-color 200ms ease",
  transform: "transform 200ms ease",
  shadow: "box-shadow 200ms ease",
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// =============================================================================
// VERIFICATION TIERS
// =============================================================================

export const verificationTiers = {
  basic: {
    color: colors.gray[400],
    bgColor: colors.gray[100],
    label: "Basic",
  },
  identity: {
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    label: "Identity Verified",
  },
  verified: {
    color: colors.success[500],
    bgColor: colors.success[50],
    label: "Verified",
  },
  premium: {
    color: colors.gold[500],
    bgColor: colors.gold[50],
    label: "Premium",
  },
} as const;

// =============================================================================
// AVAILABILITY STATUS
// =============================================================================

export const availabilityStatus = {
  available: {
    color: colors.success[500],
    bgColor: colors.success[50],
    label: "Available",
  },
  looking: {
    color: colors.gold[600],
    bgColor: colors.gold[50],
    label: "Looking",
  },
  notice_period: {
    color: colors.warning[500],
    bgColor: colors.warning[50],
    label: "Notice Period",
  },
  employed: {
    color: colors.navy[500],
    bgColor: colors.navy[50],
    label: "Employed",
  },
  unavailable: {
    color: colors.gray[500],
    bgColor: colors.gray[100],
    label: "Unavailable",
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorScale = typeof colors.gold;
export type Color = keyof typeof colors;
export type GoldShade = keyof typeof colors.gold;
export type NavyShade = keyof typeof colors.navy;
export type GrayShade = keyof typeof colors.gray;
export type VerificationTier = keyof typeof verificationTiers;
export type AvailabilityStatus = keyof typeof availabilityStatus;
