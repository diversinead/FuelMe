"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-surface-2 text-ink placeholder:text-ink-tertiary",
      "border border-border rounded-button px-3.5 py-3",
      "text-body focus:border-accent",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "min-h-[96px] resize-y leading-relaxed",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
