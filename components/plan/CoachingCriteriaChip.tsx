"use client";

import { cn } from "@/lib/utils";

/**
 * A single multi-select chip in the Regenerate dialog. Selected → solid accent
 * fill with white text; unselected → quiet surface with a thin border.
 */
export function CoachingCriteriaChip({
  label,
  selected,
  disabled,
  onToggle,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "text-left rounded-full px-3.5 py-2 text-body-sm border transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "bg-accent border-accent text-white"
          : "bg-surface-2 border-border text-ink hover:border-border-strong",
      )}
    >
      {label}
    </button>
  );
}
