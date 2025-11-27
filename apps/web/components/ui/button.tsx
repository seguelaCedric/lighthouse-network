"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gold-gradient text-gray-900 shadow-gold hover:bg-gold-gradient-hover hover:shadow-[0px_6px_16px_rgba(180,154,94,0.4)] hover:-translate-y-px active:bg-gold-700 active:translate-y-0 active:shadow-none disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:pointer-events-none focus-visible:ring-gold-500",
        secondary:
          "border-[1.5px] border-navy-800 text-navy-800 bg-transparent hover:bg-navy-50 active:bg-navy-100 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-navy-600",
        tertiary:
          "text-navy-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-navy-600",
        ghost:
          "text-navy-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-navy-600",
        danger:
          "bg-error-500 text-white shadow-sm hover:bg-error-600 hover:shadow-md active:bg-error-700 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-error-500",
        link: "text-gold-600 underline-offset-4 hover:underline disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-gold-500",
      },
      size: {
        // Mobile-first: min 44px touch targets, smaller on desktop
        sm: "h-11 sm:h-8 px-4 py-2 text-sm [&_svg]:size-4",
        md: "h-12 sm:h-10 px-6 py-3 text-sm [&_svg]:size-4",
        lg: "h-14 sm:h-12 px-8 py-4 text-base [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
