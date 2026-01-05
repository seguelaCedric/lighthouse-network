"use client";

import * as React from "react";

interface FormFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, hint, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
        {hint && (
          <span className="ml-1 font-normal text-gray-500">({hint})</span>
        )}
      </label>
      {children}
    </div>
  );
}
