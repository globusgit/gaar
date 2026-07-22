"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";

interface FormSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function FormSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select",
  required,
  error,
  className,
}: FormSelectProps) {
  const generatedId = React.useId();

  return (
    <FormField label={label} htmlFor={generatedId} required={required} error={error}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger 
          id={generatedId} 
          className={cn(
            "w-full", 
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.filter((option) => option.value).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
