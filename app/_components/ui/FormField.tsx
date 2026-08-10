"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  error,
  className,
  disabled,
}: FormFieldProps) {
  const showError = Boolean(error);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          showError && "border-red-500 focus-visible:ring-red-500",
        )}
      />
      {showError && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
