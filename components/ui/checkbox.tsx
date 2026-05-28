"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  id,
  className,
  ...rest
}: CheckboxProps) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      animate={
        reduce
          ? undefined
          : checked
          ? { scale: [1, 1.15, 1] }
          : { scale: 1 }
      }
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "w-[18px] h-[18px] rounded-[5px] inline-flex items-center justify-center shrink-0",
        "border transition-colors duration-150",
        checked
          ? "bg-accent border-accent text-ink-inverse"
          : "bg-surface-2 border-border-strong text-transparent hover:border-accent/60",
        className,
      )}
      {...rest}
    >
      <Check size={12} strokeWidth={3} className={checked ? "" : "opacity-0"} />
    </motion.button>
  );
}
