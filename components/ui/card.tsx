"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  hero?: boolean;
}

export function Card({ className, interactive, hero, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface-1 shadow-card",
        "p-5 md:p-6",
        hero && "hero-wash",
        interactive &&
          "transition-[transform,border-color,box-shadow] duration-200 ease-out hover:border-border-strong hover:-translate-y-px cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-block font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-display-md text-ink mt-1", className)}
      {...props}
    />
  );
}

export function CardSubtitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-body-sm text-ink-secondary mt-1", className)}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-5 pt-4 border-t border-border-subtle flex items-center justify-end gap-2",
        className,
      )}
      {...props}
    />
  );
}
