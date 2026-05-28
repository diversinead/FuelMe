"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  id?: string;
  className?: string;
  /** Show a unit suffix inside the field, e.g. "kg" or "min". */
  suffix?: string;
  /** Disable the +/- stepper buttons (text-only field). */
  hideSteppers?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

function clamp(n: number, min?: number, max?: number) {
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  id,
  className,
  suffix,
  hideSteppers,
  disabled,
  ...rest
}: NumberInputProps) {
  const [draft, setDraft] = React.useState<string>(
    value === undefined ? "" : String(value),
  );
  const focusedRef = React.useRef(false);

  // Sync from external value only when the field isn't being edited.
  React.useEffect(() => {
    if (!focusedRef.current) {
      setDraft(value === undefined ? "" : String(value));
    }
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === "") {
      onChange(undefined);
      return;
    }
    const n = Number(trimmed);
    if (Number.isNaN(n)) {
      // revert to last known good value
      setDraft(value === undefined ? "" : String(value));
      return;
    }
    const clamped = clamp(n, min, max);
    onChange(clamped);
    if (clamped !== n) setDraft(String(clamped));
  }

  function stepBy(delta: number) {
    if (disabled) return;
    const base = value ?? (Number(draft) || min || 0);
    const next = clamp(base + delta, min, max);
    onChange(next);
    setDraft(String(next));
  }

  const baseInput =
    "w-full bg-surface-2 text-ink placeholder:text-ink-tertiary " +
    "border border-border text-body font-mono tracking-normal " +
    "focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed " +
    "text-center";

  const stepBtn =
    "shrink-0 inline-flex items-center justify-center w-10 h-12 bg-surface-2 " +
    "border border-border text-ink-secondary hover:text-ink hover:bg-surface-3 " +
    "active:scale-[0.97] transition-[transform,background,color] duration-120 " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-2 disabled:hover:text-ink-secondary";

  if (hideSteppers) {
    return (
      <div className={cn("relative", className)}>
        <input
          id={id}
          type="text"
          inputMode={step % 1 === 0 ? "numeric" : "decimal"}
          autoComplete="off"
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => (focusedRef.current = true)}
          onBlur={() => {
            focusedRef.current = false;
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              stepBy(step);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              stepBy(-step);
            }
          }}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          className={cn(
            baseInput,
            "h-12 rounded-button px-3.5 py-3 text-left",
            suffix && "pr-12",
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 inline-flex items-center font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            {suffix}
          </span>
        )}
      </div>
    );
  }

  const atMin = min !== undefined && (value ?? (Number(draft) || 0)) <= min;
  const atMax = max !== undefined && (value ?? (Number(draft) || 0)) >= max;

  return (
    <div className={cn("flex items-stretch", className)}>
      <button
        type="button"
        onClick={() => stepBy(-step)}
        disabled={disabled || atMin}
        aria-label="Decrease"
        className={cn(stepBtn, "rounded-l-button border-r-0")}
      >
        <Minus size={14} />
      </button>
      <div className="relative flex-1">
        <input
          id={id}
          type="text"
          inputMode={step % 1 === 0 ? "numeric" : "decimal"}
          autoComplete="off"
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => (focusedRef.current = true)}
          onBlur={() => {
            focusedRef.current = false;
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              stepBy(step);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              stepBy(-step);
            }
          }}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          className={cn(baseInput, "h-12 px-3", suffix && "pr-12")}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            {suffix}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => stepBy(step)}
        disabled={disabled || atMax}
        aria-label="Increase"
        className={cn(stepBtn, "rounded-r-button border-l-0")}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
