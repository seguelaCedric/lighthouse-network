"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  /** Use uppercase tracking-wide styling for section labels */
  sectionLabel?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, helperText, error, options, placeholder, id, sectionLabel, ...props },
    ref
  ) => {
    const selectId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              "mb-1.5 block font-medium",
              sectionLabel
                ? "text-xs uppercase tracking-wide text-gray-500"
                : "text-sm text-gray-600"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              "flex h-11 w-full appearance-none rounded-md border bg-white px-4 py-3 pr-10 text-sm text-gray-800 transition-all duration-200",
              "focus:outline-none focus:border-2 focus:border-gold-500 focus:shadow-[0px_0px_0px_3px_rgba(180,154,94,0.2)]",
              "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
              error
                ? "border-error-500 focus:border-error-500 focus:shadow-[0px_0px_0px_3px_rgba(214,69,69,0.2)]"
                : "border-gray-300 hover:border-gray-400",
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-error-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// Shadcn-style compound Select components

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select compound components must be used within a Select");
  }
  return context;
}

interface CompoundSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function CompoundSelect({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
}: CompoundSelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  const value = controlledValue ?? internalValue;
  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handleClick = () => setOpen(false);
    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClick);
    };
  }, [open]);

  // Close on escape
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const { open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={open}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        setOpen(!open);
      }}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelectContext();
  return <span>{value || placeholder}</span>;
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function SelectContent({ className, children, ...props }: SelectContentProps) {
  const { open } = useSelectContext();

  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function SelectItem({ className, value, children, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
        isSelected && "bg-gray-100",
        className
      )}
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
}

export {
  Select,
  CompoundSelect as SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};

// Re-export CompoundSelect as an alternative Select for compound usage
export { CompoundSelect as SelectCompound };
