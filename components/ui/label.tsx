import * as React from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Smaller / lighter variant for dense forms (e.g. inline session rows). */
  dense?: boolean;
}

export function Label({ className, dense, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block font-mono uppercase",
        dense
          ? "text-[10px] tracking-wider text-ink-tertiary mb-1"
          : "text-mono-sm tracking-widest text-ink-secondary mb-2",
        className,
      )}
      {...props}
    />
  );
}
