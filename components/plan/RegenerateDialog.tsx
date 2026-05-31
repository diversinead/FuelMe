"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { COACHING_CRITERIA } from "@/lib/coachingCriteria";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ease } from "@/lib/motion";
import { CoachingCriteriaChip } from "./CoachingCriteriaChip";

const FOCUS_MAX = 400;

/**
 * Regenerate dialog (tasks/RegenerateDialog.md). Multi-select coaching-criteria
 * chips drive both AI emphasis and the plan's coaching-rules footer. Selection
 * is ephemeral — it resets to empty every time the dialog opens.
 */
export function RegenerateDialog({
  open,
  generating,
  error,
  onGenerate,
  onClose,
}: {
  open: boolean;
  generating: boolean;
  error: string | null;
  onGenerate: (selectedIds: string[], focusNotes: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [focusNotes, setFocusNotes] = React.useState("");

  // Fresh selection + focus text every time the dialog opens — no persistence.
  React.useEffect(() => {
    if (open) {
      setSelected([]);
      setFocusNotes("");
    }
  }, [open]);

  function toggle(id: string) {
    if (generating) return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="regen-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={generating ? undefined : onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="regen-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.18, ease: ease.out }}
            className="relative w-full max-w-lg rounded-card bg-surface-1 border border-border p-6 shadow-elevated"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="regen-title"
                  className="font-display text-display-sm text-ink"
                >
                  What should we focus on this week?
                </h2>
                <p className="text-body-sm text-ink-secondary mt-1">
                  Optional — select any criteria to emphasise. The AI will apply
                  these rules and they&apos;ll be shown on your plan.
                </p>
              </div>
              {!generating && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="shrink-0 -mt-1 -mr-1 p-1 text-ink-tertiary hover:text-ink rounded"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {COACHING_CRITERIA.map((c) => (
                <CoachingCriteriaChip
                  key={c.id}
                  label={c.label}
                  selected={selected.includes(c.id)}
                  disabled={generating}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </div>

            <div className="mt-5">
              <Label htmlFor="regen-focus" className="text-ink-secondary">
                Things to focus on
              </Label>
              <Textarea
                id="regen-focus"
                value={focusNotes}
                onChange={(e) =>
                  setFocusNotes(e.target.value.slice(0, FOCUS_MAX))
                }
                disabled={generating}
                placeholder="Anything else for the AI — e.g. lighter dinners, more variety, batch-cook Sunday, easing back after illness."
                className="mt-1.5 min-h-[72px]"
              />
              <p className="mt-1 text-mono-sm text-ink-tertiary text-right">
                {focusNotes.length}/{FOCUS_MAX}
              </p>
            </div>

            {error && (
              <div
                className="mt-5 p-3 rounded-button"
                style={{
                  border:
                    "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                  background:
                    "color-mix(in srgb, var(--danger) 8%, transparent)",
                }}
              >
                <p className="text-body-sm text-danger leading-snug">{error}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={generating}>
                Cancel
              </Button>
              <Button
                onClick={() => onGenerate(selected, focusNotes.trim())}
                disabled={generating}
              >
                {generating
                  ? "Generating plan…"
                  : error
                    ? "Retry"
                    : "Generate"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
