"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return context;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const handleOpenChange = onOpenChange ?? setInternalOpen;

  // Close on escape
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleOpenChange]);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handleClick = () => handleOpenChange(false);
    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClick);
    };
  }, [open, handleOpenChange]);

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function DropdownMenuTrigger({ className, asChild, children, ...props }: DropdownMenuTriggerProps) {
  const { open, onOpenChange } = useDropdownMenu();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenChange(!open);
      },
    });
  }

  return (
    <button
      type="button"
      aria-expanded={open}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onOpenChange(!open);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  const { open } = useDropdownMenu();

  if (!open) return null;

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md animate-in fade-in-0 zoom-in-95",
        alignmentClasses[align],
        className
      )}
      style={{ marginTop: sideOffset }}
      onClick={(e) => e.stopPropagation()}
      {...props}
    />
  );
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  asChild?: boolean;
}

function DropdownMenuItem({ className, inset, asChild, children, ...props }: DropdownMenuItemProps) {
  const { onOpenChange } = useDropdownMenu();

  const itemClasses = cn(
    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 disabled:pointer-events-none disabled:opacity-50",
    inset && "pl-8",
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string; onClick?: () => void }>, {
      className: itemClasses,
      onClick: () => onOpenChange(false),
    });
  }

  return (
    <div
      role="menuitem"
      className={itemClasses}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
      {...props}
    />
  );
}

function DropdownMenuLabel({ className, inset, ...props }: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
