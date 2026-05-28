"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", mono, ...props }, ref) => {
    const isNumeric = type === "number" || type === "date" || type === "time" || mono;
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full bg-surface-2 text-ink placeholder:text-ink-tertiary",
          "border border-border rounded-button px-3.5 py-3",
          "text-body focus:border-accent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isNumeric && "font-mono tracking-normal",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
