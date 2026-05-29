"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import {
  getDb,
  type CheckIn,
  type CompletionStatus,
  type Day,
  type MealSlot,
} from "@/lib/db";
import { formatWeekRange } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: "breakfast", label: "Breakfast" },
  { slot: "post_am", label: "Post-AM" },
  { slot: "lunch", label: "Lunch" },
  { slot: "afternoon", label: "Afternoon" },
  { slot: "dinner", label: "Dinner" },
];

const STATUSES: CompletionStatus[] = ["done", "partial", "missed", "swapped"];
const STATUS_LABEL: Record<CompletionStatus, string> = {
  done: "Done",
  partial: "Partial",
  missed: "Missed",
  swapped: "Swapped",
};

// Tailwind's `/opacity` modifier doesn't compute against hex-string CSS
// variables (silently drops the colour), so we generate tints via
// color-mix() inline. Keeps the visual feedback consistent across statuses.
const STATUS_VAR: Record<CompletionStatus, string> = {
  done: "var(--session-easy)",
  partial: "var(--warning)",
  missed: "var(--session-hard)",
  swapped: "var(--session-long)",
};
const statusStyle = (s: CompletionStatus): React.CSSProperties => {
  const v = STATUS_VAR[s];
  return {
    background: `color-mix(in srgb, ${v} 18%, transparent)`,
    color: v,
    borderColor: `color-mix(in srgb, ${v} 45%, transparent)`,
  };
};

export default function CheckInPage({
  params,
}: {
  params: { weekId: string };
}) {
  const { weekId } = params;

  const plan = useLiveQuery(
    async () => (await getDb().fuellingPlans.get(weekId)) ?? null,
    [weekId],
  );
  const existing = useLiveQuery(
    async () => (await getDb().checkIns.get(weekId)) ?? null,
    [weekId],
  );

  const [completions, setCompletions] = React.useState<
    Record<string, CompletionStatus>
  >({});
  const [energy, setEnergy] = React.useState<1 | 2 | 3 | 4 | 5>(3);
  const [sessionsCompleted, setSessionsCompleted] = React.useState(0);
  const [freeNotes, setFreeNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (existing) {
      const next: Record<string, CompletionStatus> = {};
      for (const c of existing.mealCompletions) {
        next[`${c.day}:${c.slot}`] = c.status;
      }
      setCompletions(next);
      setEnergy(existing.energyRating);
      setSessionsCompleted(existing.sessionsCompleted);
      setFreeNotes(existing.freeNotes ?? "");
    }
  }, [existing]);

  if (plan === undefined || existing === undefined) return <Loading />;

  async function submit() {
    setSubmitting(true);
    try {
      const checkIn: CheckIn = {
        id: weekId,
        weekId,
        submittedAt: new Date().toISOString(),
        mealCompletions: Object.entries(completions).map(([k, status]) => {
          const [day, slot] = k.split(":");
          return { day, slot, status };
        }),
        energyRating: energy,
        sessionsCompleted,
        freeNotes: freeNotes || undefined,
      };
      await getDb().checkIns.put(checkIn);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ease.out }}
      className="app-container py-8 md:py-12 max-w-5xl"
    >
      <BackLink />

      <header className="mt-6 mb-8">
        <CardLabel>Week of {weekId}</CardLabel>
        <h1 className="font-display text-display-lg text-ink mt-1 leading-none">
          Check-in
        </h1>
        <p className="text-body-lg text-ink-secondary mt-2">
          {formatWeekRange(weekId)} ·{" "}
          {plan ? "Plan loaded" : "No plan saved — log anyway"}
        </p>
      </header>

      {/* Meal completion grid */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            Meal completion
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
              Apply to all
            </span>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const next: Record<string, CompletionStatus> = {};
                  for (const d of DAYS) {
                    for (const row of SLOTS) {
                      next[`${d}:${row.slot}`] = s;
                    }
                  }
                  setCompletions(next);
                }}
                style={statusStyle(s)}
                className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-[5px] border"
                title={`Mark all 35 meals as ${STATUS_LABEL[s]}`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCompletions({})}
              className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-[5px] border border-border text-ink-tertiary hover:text-ink hover:border-border-strong"
              title="Clear all"
            >
              Clear
            </button>
          </div>
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="bg-surface-2 px-3 py-2.5 text-left"></th>
                  {DAYS.map((d) => (
                    <th
                      key={d}
                      className="bg-surface-2 text-left px-3 py-2.5 font-mono text-mono-sm uppercase tracking-widest text-ink-secondary"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((row, ri) => (
                  <tr
                    key={row.slot}
                    className={cn(ri > 0 && "border-t border-border-subtle")}
                  >
                    <td className="bg-surface-2/40 px-3 py-3 font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary border-r border-border-subtle">
                      {row.label}
                    </td>
                    {DAYS.map((d) => {
                      const key = `${d}:${row.slot}`;
                      const current = completions[key];
                      return (
                        <td
                          key={d}
                          className="px-2 py-2 border-l border-border-subtle"
                        >
                          <div className="flex flex-wrap gap-1">
                            {STATUSES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  setCompletions((c) => {
                                    const next = { ...c };
                                    if (next[key] === s) delete next[key];
                                    else next[key] = s;
                                    return next;
                                  })
                                }
                                style={current === s ? statusStyle(s) : undefined}
                                className={cn(
                                  "font-mono text-[9px] uppercase tracking-widest px-1.5 py-1 rounded-[5px] border transition-colors",
                                  current !== s &&
                                    "bg-transparent border-border text-ink-tertiary hover:border-border-strong hover:text-ink",
                                )}
                                title={STATUS_LABEL[s]}
                              >
                                {s[0]}
                              </button>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-body-sm text-ink-tertiary mt-2">
          D = done · P = partial · M = missed · S = swapped
        </p>
      </section>

      {/* Energy + sessions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card>
          <Label>Energy rating</Label>
          <div className="flex items-center gap-5">
            <div className="font-display text-display-xl text-accent leading-none font-mono tracking-tight">
              {energy}
              <span className="text-ink-tertiary text-display-md">/5</span>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex justify-between font-mono text-mono-sm text-ink-tertiary">
                <span>1</span>
                <span>5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEnergy(n as 1 | 2 | 3 | 4 | 5)}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-colors",
                      n <= energy ? "bg-accent" : "bg-surface-3 hover:bg-surface-4",
                    )}
                    aria-label={`Energy ${n}`}
                  />
                ))}
              </div>
              <div className="flex justify-between font-mono text-mono-sm text-ink-tertiary">
                <span>flat</span>
                <span>flying</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <Label htmlFor="sessions">Sessions completed</Label>
          <NumberInput
            id="sessions"
            min={0}
            max={14}
            step={1}
            value={sessionsCompleted}
            onChange={(n) => setSessionsCompleted(n ?? 0)}
            placeholder="0"
          />
        </Card>
      </section>

      {/* Free notes */}
      <section className="mb-10">
        <Label htmlFor="notes">Free notes</Label>
        <Textarea
          id="notes"
          value={freeNotes}
          onChange={(e) => setFreeNotes(e.target.value)}
          placeholder="What got in the way? What worked? Anything you want the coach to know."
        />
      </section>

      <div className="flex flex-wrap items-center gap-3 sticky bottom-0 bg-surface-0/95 backdrop-blur pt-4 pb-2 -mx-5 px-5 md:mx-0 md:px-0 border-t border-border-subtle">
        <Button onClick={submit} disabled={submitting} size="lg">
          {submitting
            ? "Saving…"
            : existing
              ? "Update check-in"
              : "Save check-in"}
        </Button>
        <Button variant="secondary" disabled>
          Get AI feedback (Phase 5)
        </Button>
        {existing && (
          <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary ml-auto">
            Saved {new Date(existing.submittedAt).toLocaleString()}
          </span>
        )}
      </div>
    </motion.main>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1 font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-ink"
    >
      <ArrowLeft size={12} /> Dashboard
    </Link>
  );
}

function Loading() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        Loading…
      </p>
    </main>
  );
}
