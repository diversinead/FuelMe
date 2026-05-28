"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-display font-semibold rounded-button " +
  "transition-[transform,background,color,border-color,box-shadow] duration-150 ease-out " +
  "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 " +
  "tracking-[-0.01em] whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink-inverse hover:bg-accent-hover hover:scale-[1.01] " +
    "shadow-card",
  secondary:
    "bg-transparent text-ink border border-border-strong hover:bg-surface-2 hover:border-border-strong",
  ghost:
    "bg-transparent text-ink-secondary hover:text-ink hover:bg-surface-2",
  destructive:
    "bg-transparent text-danger border border-danger/30 hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-body-sm",
  md: "h-10 px-5 text-[14px]",
  lg: "h-12 px-6 text-body-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
