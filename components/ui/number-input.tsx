"use client";

import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  /** Hide the stacked stepper arrows (text-only field). */
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
    "border border-border rounded-button text-body font-mono tracking-normal " +
    "focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed";

  const inputEl = (
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
        "h-12 px-3.5 py-3 text-left",
        // Reserve right-side space for suffix and/or stepper column.
        hideSteppers && suffix && "pr-12",
        !hideSteppers && !suffix && "pr-10",
        !hideSteppers && suffix && "pr-[4.5rem]",
      )}
      {...rest}
    />
  );

  if (hideSteppers) {
    return (
      <div className={cn("relative", className)}>
        {inputEl}
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

  const arrowBtn =
    "flex-1 inline-flex items-center justify-center w-7 text-ink-secondary " +
    "hover:text-accent hover:bg-surface-3 transition-colors duration-120 " +
    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink-secondary";

  return (
    <div className={cn("relative", className)}>
      {inputEl}
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-10 inline-flex items-center font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          {suffix}
        </span>
      )}
      <div className="absolute inset-y-1 right-1 flex w-7 flex-col overflow-hidden rounded-[6px] border border-border-subtle bg-surface-2">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => stepBy(step)}
          disabled={disabled || atMax}
          aria-label="Increase"
          className={cn(arrowBtn, "border-b border-border-subtle")}
        >
          <ChevronUp size={12} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => stepBy(-step)}
          disabled={disabled || atMin}
          aria-label="Decrease"
          className={arrowBtn}
        >
          <ChevronDown size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
