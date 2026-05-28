"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

export function ChipInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  className,
}: ChipInputProps) {
  const [draft, setDraft] = React.useState("");

  function add(item: string) {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setDraft("");
  }

  function remove(item: string) {
    onChange(value.filter((v) => v !== item));
  }

  const unused = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
  );
  const canAdd = draft.trim().length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence initial={false}>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: ease.out }}
            className="flex flex-wrap gap-1.5 overflow-hidden"
          >
            {value.map((v) => (
              <motion.button
                key={v}
                type="button"
                onClick={() => remove(v)}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.14, ease: ease.out }}
                className={cn(
                  "group inline-flex items-center gap-1.5 font-mono text-[11px]",
                  "px-2.5 py-1 rounded-[6px] bg-surface-3 text-ink",
                  "hover:bg-accent hover:text-ink-inverse transition-colors duration-150",
                )}
              >
                {v}
                <X
                  size={10}
                  className="opacity-50 group-hover:opacity-100"
                />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder ?? "Type to add an item"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => add(draft)}
          disabled={!canAdd}
          className="shrink-0"
        >
          <Plus size={14} /> Add
        </Button>
      </div>

      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            Suggest
          </span>
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={cn(
                "inline-flex items-center gap-1 font-mono text-[11px]",
                "px-2 py-1 rounded-[6px] border border-border text-ink-secondary",
                "hover:border-accent/60 hover:text-ink transition-colors duration-150",
              )}
            >
              <Plus size={10} /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
