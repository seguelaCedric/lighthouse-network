import { cn } from "@/lib/utils";
import { forwardRef, type ElementType } from "react";

// Typography component props
interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}

// =====================================================
// DISPLAY STYLES (Cormorant Garamond - Elegant Serif)
// =====================================================

/**
 * Display Hero - 80px
 * Use for: Hero headlines, landing pages
 */
export const DisplayHero = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h1" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-cormorant text-[80px] font-semibold leading-[88px] tracking-[-0.02em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
DisplayHero.displayName = "DisplayHero";

/**
 * Display XL - 64px
 * Use for: Page titles, major section headers
 */
export const DisplayXL = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h1" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-cormorant text-[64px] font-semibold leading-[72px] tracking-[-0.02em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
DisplayXL.displayName = "DisplayXL";

/**
 * Display LG - 48px
 * Use for: Section titles
 */
export const DisplayLG = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h2" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-cormorant text-[48px] font-medium leading-[56px] tracking-[-0.01em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
DisplayLG.displayName = "DisplayLG";

// =====================================================
// HEADING STYLES (Mixed - Serif for H1-H2, Sans for H3+)
// =====================================================

/**
 * Heading H1 - 36px (Cormorant Garamond)
 * Use for: Page headers
 */
export const HeadingH1 = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h1" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-cormorant text-[36px] font-semibold leading-[44px] tracking-[-0.01em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
HeadingH1.displayName = "HeadingH1";

/**
 * Heading H2 - 30px (Cormorant Garamond)
 * Use for: Section headers
 */
export const HeadingH2 = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h2" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-cormorant text-[30px] font-medium leading-[38px] tracking-[0em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
HeadingH2.displayName = "HeadingH2";

/**
 * Heading H3 - 24px (Inter)
 * Use for: Card titles, subsections
 */
export const HeadingH3 = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h3" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[24px] font-semibold leading-[32px] tracking-[0em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
HeadingH3.displayName = "HeadingH3";

/**
 * Heading H4 - 20px (Inter)
 * Use for: Small section headers
 */
export const HeadingH4 = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h4" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[20px] font-medium leading-[28px] tracking-[0em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
HeadingH4.displayName = "HeadingH4";

/**
 * Heading H5 - 18px (Inter)
 * Use for: Labels, small headers
 */
export const HeadingH5 = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h5" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[18px] font-medium leading-[26px] tracking-[0.01em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
HeadingH5.displayName = "HeadingH5";

/**
 * Heading H6 - 16px (Inter)
 * Use for: Micro headers
 */
export const HeadingH6 = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ children, className, as: Component = "h6" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[16px] font-medium leading-[24px] tracking-[0.01em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
HeadingH6.displayName = "HeadingH6";

// =====================================================
// BODY STYLES (Inter - Clean Sans-Serif)
// =====================================================

/**
 * Body XL - 20px
 * Use for: Lead paragraphs, introductions
 */
export const BodyXL = forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className, as: Component = "p" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[20px] font-normal leading-[32px] text-gray-600",
        className
      )}
    >
      {children}
    </Component>
  )
);
BodyXL.displayName = "BodyXL";

/**
 * Body LG - 18px
 * Use for: Important body text
 */
export const BodyLG = forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className, as: Component = "p" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[18px] font-normal leading-[28px] text-gray-600",
        className
      )}
    >
      {children}
    </Component>
  )
);
BodyLG.displayName = "BodyLG";

/**
 * Body MD - 16px (Default)
 * Use for: Default body text
 */
export const BodyMD = forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className, as: Component = "p" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[16px] font-normal leading-[26px] text-gray-600",
        className
      )}
    >
      {children}
    </Component>
  )
);
BodyMD.displayName = "BodyMD";

/**
 * Body SM - 14px
 * Use for: Secondary text, captions
 */
export const BodySM = forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className, as: Component = "p" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[14px] font-normal leading-[22px] text-gray-500",
        className
      )}
    >
      {children}
    </Component>
  )
);
BodySM.displayName = "BodySM";

/**
 * Body XS - 12px
 * Use for: Fine print, timestamps
 */
export const BodyXS = forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ children, className, as: Component = "p" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[12px] font-normal leading-[18px] text-gray-400",
        className
      )}
    >
      {children}
    </Component>
  )
);
BodyXS.displayName = "BodyXS";

// =====================================================
// LABEL STYLES (Inter - Uppercase)
// =====================================================

/**
 * Label LG - 14px uppercase
 * Use for: Section labels, categories
 */
export const LabelLG = forwardRef<HTMLSpanElement, TypographyProps>(
  ({ children, className, as: Component = "span" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-xs uppercase tracking-wider font-medium text-gray-500",
        className
      )}
    >
      {children}
    </Component>
  )
);
LabelLG.displayName = "LabelLG";

/**
 * Label MD - 12px uppercase
 * Use for: Form labels, badges
 */
export const LabelMD = forwardRef<HTMLSpanElement, TypographyProps>(
  ({ children, className, as: Component = "span" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-xs uppercase tracking-wider font-medium text-gray-500",
        className
      )}
    >
      {children}
    </Component>
  )
);
LabelMD.displayName = "LabelMD";

/**
 * Label SM - 10px uppercase
 * Use for: Micro labels, status indicators
 */
export const LabelSM = forwardRef<HTMLSpanElement, TypographyProps>(
  ({ children, className, as: Component = "span" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "text-xs uppercase tracking-wider font-medium text-gray-500",
        className
      )}
    >
      {children}
    </Component>
  )
);
LabelSM.displayName = "LabelSM";

// =====================================================
// SPECIAL STYLES
// =====================================================

/**
 * Quote - 24px Cormorant Garamond Italic
 * Use for: Testimonials, pull quotes
 */
export const Quote = forwardRef<HTMLQuoteElement, TypographyProps>(
  ({ children, className, as: Component = "blockquote" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-cormorant text-[24px] font-normal italic leading-[36px] text-navy-600",
        className
      )}
    >
      {children}
    </Component>
  )
);
Quote.displayName = "Quote";

/**
 * Stat Number - 48px Inter Bold
 * Use for: Dashboard statistics
 */
export const StatNumber = forwardRef<HTMLSpanElement, TypographyProps>(
  ({ children, className, as: Component = "span" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[48px] font-bold leading-none tracking-[-0.02em] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
StatNumber.displayName = "StatNumber";

/**
 * Price - 24px Inter SemiBold
 * Use for: Salary figures, pricing
 */
export const Price = forwardRef<HTMLSpanElement, TypographyProps>(
  ({ children, className, as: Component = "span" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-inter text-[24px] font-semibold leading-[1.2] text-navy-800",
        className
      )}
    >
      {children}
    </Component>
  )
);
Price.displayName = "Price";

/**
 * Code - JetBrains Mono
 * Use for: Code snippets, IDs
 */
export const Code = forwardRef<HTMLElement, TypographyProps>(
  ({ children, className, as: Component = "code" }, ref) => (
    <Component
      ref={ref}
      className={cn(
        "font-mono text-[14px] font-normal leading-[22px] text-navy-700 bg-gray-100 px-1.5 py-0.5 rounded",
        className
      )}
    >
      {children}
    </Component>
  )
);
Code.displayName = "Code";

/**
 * Link - Gold colored link
 * Use for: Interactive text links
 */
export const TextLink = forwardRef<HTMLAnchorElement, TypographyProps & { href?: string }>(
  ({ children, className, href = "#", ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(
        "font-inter text-gold-600 hover:text-gold-700 underline underline-offset-2 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
);
TextLink.displayName = "TextLink";

// =====================================================
// TYPOGRAPHY UTILITY COMPONENT
// =====================================================

type TypographyVariant =
  | "display-hero"
  | "display-xl"
  | "display-lg"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "body-xl"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "body-xs"
  | "label-lg"
  | "label-md"
  | "label-sm"
  | "quote"
  | "stat"
  | "price"
  | "code";

interface TextProps extends TypographyProps {
  variant?: TypographyVariant;
}

const variantStyles: Record<TypographyVariant, string> = {
  "display-hero": "font-cormorant text-[80px] font-semibold leading-[88px] tracking-[-0.02em] text-navy-800",
  "display-xl": "font-cormorant text-[64px] font-semibold leading-[72px] tracking-[-0.02em] text-navy-800",
  "display-lg": "font-cormorant text-[48px] font-medium leading-[56px] tracking-[-0.01em] text-navy-800",
  "h1": "font-cormorant text-[36px] font-semibold leading-[44px] tracking-[-0.01em] text-navy-800",
  "h2": "font-cormorant text-[30px] font-medium leading-[38px] tracking-[0em] text-navy-800",
  "h3": "font-inter text-[24px] font-semibold leading-[32px] tracking-[0em] text-navy-800",
  "h4": "font-inter text-[20px] font-medium leading-[28px] tracking-[0em] text-navy-800",
  "h5": "font-inter text-[18px] font-medium leading-[26px] tracking-[0.01em] text-navy-800",
  "h6": "font-inter text-[16px] font-medium leading-[24px] tracking-[0.01em] text-navy-800",
  "body-xl": "font-inter text-[20px] font-normal leading-[32px] text-gray-600",
  "body-lg": "font-inter text-[18px] font-normal leading-[28px] text-gray-600",
  "body-md": "font-inter text-[16px] font-normal leading-[26px] text-gray-600",
  "body-sm": "font-inter text-[14px] font-normal leading-[22px] text-gray-500",
  "body-xs": "font-inter text-[12px] font-normal leading-[18px] text-gray-400",
  "label-lg": "text-xs uppercase tracking-wider font-medium text-gray-500",
  "label-md": "text-xs uppercase tracking-wider font-medium text-gray-500",
  "label-sm": "text-xs uppercase tracking-wider font-medium text-gray-500",
  "quote": "font-cormorant text-[24px] font-normal italic leading-[36px] text-navy-600",
  "stat": "font-inter text-[48px] font-bold leading-none tracking-[-0.02em] text-navy-800",
  "price": "font-inter text-[24px] font-semibold leading-[1.2] text-navy-800",
  "code": "font-mono text-[14px] font-normal leading-[22px] text-navy-700",
};

const variantElements: Record<TypographyVariant, ElementType> = {
  "display-hero": "h1",
  "display-xl": "h1",
  "display-lg": "h2",
  "h1": "h1",
  "h2": "h2",
  "h3": "h3",
  "h4": "h4",
  "h5": "h5",
  "h6": "h6",
  "body-xl": "p",
  "body-lg": "p",
  "body-md": "p",
  "body-sm": "p",
  "body-xs": "p",
  "label-lg": "span",
  "label-md": "span",
  "label-sm": "span",
  "quote": "blockquote",
  "stat": "span",
  "price": "span",
  "code": "code",
};

/**
 * Unified Text component with variant prop
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  ({ children, className, variant = "body-md", as, ...props }, ref) => {
    const Component = as || variantElements[variant];

    return (
      <Component
        ref={ref as any}
        className={cn(variantStyles[variant], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Text.displayName = "Text";
