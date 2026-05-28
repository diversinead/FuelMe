"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CtxValue {
  name: string;
  value: string;
  onValueChange: (v: string) => void;
}
const Ctx = React.createContext<CtxValue | null>(null);

interface RadioGroupProps {
  name: string;
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function RadioGroup({
  name,
  value,
  onValueChange,
  className,
  children,
}: RadioGroupProps) {
  return (
    <Ctx.Provider value={{ name, value, onValueChange }}>
      <div className={cn("flex flex-wrap gap-2", className)} role="radiogroup">
        {children}
      </div>
    </Ctx.Provider>
  );
}

interface RadioItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function RadioItem({ value, children, className }: RadioItemProps) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("RadioItem must be inside RadioGroup");
  const checked = ctx.value === value;
  return (
    <label
      className={cn(
        "cursor-pointer inline-flex items-center px-3.5 py-2 rounded-button text-body-sm font-medium transition-colors duration-150",
        checked
          ? "bg-accent text-ink-inverse"
          : "bg-surface-2 text-ink-secondary border border-border hover:text-ink hover:border-border-strong",
        className,
      )}
    >
      <input
        type="radio"
        name={ctx.name}
        value={value}
        checked={checked}
        onChange={() => ctx.onValueChange(value)}
        className="sr-only"
      />
      {children}
    </label>
  );
}
