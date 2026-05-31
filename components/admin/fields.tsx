"use client";

import * as React from "react";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full bg-surface-2 text-ink placeholder:text-ink-tertiary border border-border " +
  "rounded-button px-3 py-2 text-body-sm focus:border-accent outline-none";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary mb-1">
      {children}
    </span>
  );
}

export function NumField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        type="number"
        step="any"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className={inputCls}
      />
    </label>
  );
}

export function RangeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={Number.isFinite(value[0]) ? value[0] : ""}
          onChange={(e) => onChange([e.target.value === "" ? 0 : Number(e.target.value), value[1]])}
          aria-label={`${label} min`}
          className={inputCls}
        />
        <span className="text-ink-tertiary text-body-sm">to</span>
        <input
          type="number"
          step="any"
          value={Number.isFinite(value[1]) ? value[1] : ""}
          onChange={(e) => onChange([value[0], e.target.value === "" ? 0 : Number(e.target.value)])}
          aria-label={`${label} max`}
          className={inputCls}
        />
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <label className="block">
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

export function StringList({
  label,
  items,
  onChange,
  textarea,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  /** Use multi-line textareas for long prose (rules, notes). */
  textarea?: boolean;
}) {
  function update(i: number, v: string) {
    const next = items.slice();
    next[i] = v;
    onChange(next);
  }
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2">
            {textarea ? (
              <textarea
                value={it}
                rows={2}
                onChange={(e) => update(i, e.target.value)}
                className={cn(inputCls, "min-h-[44px] resize-y")}
              />
            ) : (
              <input
                type="text"
                value={it}
                onChange={(e) => update(i, e.target.value)}
                className={inputCls}
              />
            )}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Remove"
              className="shrink-0 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-button border border-border text-ink-secondary hover:text-danger hover:border-danger/40 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="mt-2 inline-flex items-center gap-1.5 text-body-sm text-accent hover:text-accent-hover"
      >
        <Plus size={14} /> Add
      </button>
    </div>
  );
}

export function Collapsible({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div className="rounded-card border border-border bg-surface-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="font-display text-body text-ink">{title}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

export function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-mono text-mono-sm uppercase tracking-widest text-ink-secondary">
        {title}
      </h3>
      {children}
    </div>
  );
}
