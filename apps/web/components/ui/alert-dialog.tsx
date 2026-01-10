"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface AlertDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface AlertDialogCancelProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const AlertDialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

function useAlertDialogContext() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error(
      "AlertDialog components must be used within an AlertDialog"
    );
  }
  return context;
}

function AlertDialog({ open: controlledOpen, onOpenChange: controlledOnOpenChange, children }: AlertDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

  // Handle escape key
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

function AlertDialogTrigger({ children, asChild }: AlertDialogTriggerProps) {
  const { onOpenChange } = useAlertDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(true),
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogContent({ children, className }: AlertDialogContentProps) {
  const { open } = useAlertDialogContext();

  if (!open) return null;

  return (
    <>
      <AlertDialogOverlay />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
}

function AlertDialogHeader({ children, className }: AlertDialogHeaderProps) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    >
      {children}
    </div>
  );
}

function AlertDialogTitle({ children, className }: AlertDialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold text-navy-900", className)}>
      {children}
    </h2>
  );
}

function AlertDialogDescription({
  children,
  className,
}: AlertDialogDescriptionProps) {
  return <p className={cn("text-sm text-gray-500", className)}>{children}</p>;
}

function AlertDialogFooter({ children, className }: AlertDialogFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-6",
        className
      )}
    >
      {children}
    </div>
  );
}

function AlertDialogAction({
  children,
  className,
  onClick,
  ...props
}: AlertDialogActionProps) {
  const { onOpenChange } = useAlertDialogContext();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white ring-offset-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function AlertDialogCancel({
  children,
  className,
  onClick,
  ...props
}: AlertDialogCancelProps) {
  const { onOpenChange } = useAlertDialogContext();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-offset-white transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};
