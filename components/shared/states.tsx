"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared empty / loading / error state primitives (SPEC §7 Phase 6).
 * One consistent look for these states across every screen.
 */

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <main className={cn("min-h-[60vh] flex items-center justify-center", className)}>
      <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        {label}
      </p>
    </main>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-md", className)}>
      <h1 className="font-display text-display-lg text-ink">{title}</h1>
      {description && (
        <p className="text-body-lg text-ink-secondary mt-3">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Danger-tinted inline banner. Uses color-mix (not /opacity) per DESIGN §11. */
export function ErrorBanner({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("p-3 rounded-button", className)}
      style={{
        border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
        background: "color-mix(in srgb, var(--danger) 8%, transparent)",
      }}
    >
      <p className="text-body-sm text-danger leading-snug">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-body-sm text-danger underline hover:no-underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
