"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
  className?: string;
}

const toastConfig: Record<ToastType, { icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string }> = {
  success: {
    icon: <CheckCircle2 className="size-5" />,
    bgColor: "bg-success-50",
    textColor: "text-success-700",
    borderColor: "border-success-200",
  },
  error: {
    icon: <AlertCircle className="size-5" />,
    bgColor: "bg-error-50",
    textColor: "text-error-700",
    borderColor: "border-error-200",
  },
  info: {
    icon: <Info className="size-5" />,
    bgColor: "bg-navy-50",
    textColor: "text-navy-700",
    borderColor: "border-navy-200",
  },
  warning: {
    icon: <AlertTriangle className="size-5" />,
    bgColor: "bg-warning-50",
    textColor: "text-warning-700",
    borderColor: "border-warning-200",
  },
};

export function Toast({ message, type = "info", onClose, duration = 5000, className }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = toastConfig[type];

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300",
        isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0",
        config.bgColor,
        config.borderColor,
        config.textColor,
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 rounded p-1 transition-colors hover:bg-black/10"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
