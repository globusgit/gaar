"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  children,
  className,
}: FormFieldProps) {
  const generatedId = React.useId();
  const inputId = htmlFor || generatedId;

  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown>
  >;

  const errorClass = error ? "border-red-500 focus-visible:ring-red-500" : "";

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {React.cloneElement(child, {
        ...child.props,
        id: inputId,
        required,
        "aria-invalid": !!error,
        className: cn(
          (child.props as { className?: string }).className,
          errorClass,
        ),
      } as Record<string, unknown>)}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
