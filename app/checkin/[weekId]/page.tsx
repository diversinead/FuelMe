"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import {
  getDb,
  type AIFeedback,
  type CheckIn,
  type CompletionStatus,
  type Day,
  type FuellingPlan,
  type MealSlot,
  type PlannedMeal,
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
  const [feedbackLoading, setFeedbackLoading] = React.useState(false);
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);
  const [applyError, setApplyError] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState(false);

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

  function buildCheckInPayload(preserveFeedback: boolean): CheckIn {
    return {
      id: weekId,
      weekId,
      submittedAt: existing?.submittedAt ?? new Date().toISOString(),
      mealCompletions: Object.entries(completions).map(([k, status]) => {
        const [day, slot] = k.split(":");
        return { day, slot, status };
      }),
      energyRating: energy,
      sessionsCompleted,
      freeNotes: freeNotes || undefined,
      aiFeedback: preserveFeedback ? existing?.aiFeedback : undefined,
    };
  }

  async function submit() {
    setSubmitting(true);
    try {
      // Preserve existing aiFeedback across plain saves — users can refresh
      // it explicitly via "Get AI feedback".
      const checkIn = buildCheckInPayload(true);
      checkIn.submittedAt = new Date().toISOString();
      await getDb().checkIns.put(checkIn);
    } finally {
      setSubmitting(false);
    }
  }

  async function getFeedback() {
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      if (!plan) {
        throw new Error("No fuelling plan saved for this week.");
      }
      const db = getDb();
      const profile = await db.profile.get("me");
      if (!profile) {
        throw new Error("Missing profile. Re-run onboarding.");
      }

      // Save the current check-in state first so the API call sees the
      // freshest snapshot the athlete just keyed in.
      const checkInPayload = buildCheckInPayload(false);
      checkInPayload.submittedAt = new Date().toISOString();
      await db.checkIns.put(checkInPayload);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fuellingPlan: plan,
          checkIn: checkInPayload,
          profile,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: string }).error ??
            `Feedback generation failed (HTTP ${response.status}).`,
        );
      }

      const apiFeedback = (await response.json()) as Omit<
        AIFeedback,
        "generatedAt"
      >;
      const aiFeedback: AIFeedback = {
        ...apiFeedback,
        generatedAt: new Date().toISOString(),
      };
      await db.checkIns.put({ ...checkInPayload, aiFeedback });
    } catch (e) {
      setFeedbackError(
        e instanceof Error ? e.message : "Feedback generation failed.",
      );
    } finally {
      setFeedbackLoading(false);
    }
  }

  async function applySuggestedEdits() {
    if (!plan || !existing?.aiFeedback?.suggestedPlanEdits?.length) return;
    setApplying(true);
    setApplyError(null);
    setApplied(false);
    try {
      const edits = existing.aiFeedback.suggestedPlanEdits;
      // Merge each suggested edit into the matching meal by (day, slot).
      const meals: PlannedMeal[] = plan.meals.map((m) => {
        const patch = edits.find(
          (e) => e.day === m.day && e.slot === m.slot,
        );
        if (!patch) return m;
        return {
          ...m,
          food: patch.food ?? m.food,
          note: patch.note ?? m.note,
          carbsG: patch.carbsG ?? m.carbsG,
          proteinG: patch.proteinG ?? m.proteinG,
          isCritical:
            patch.isCritical !== undefined ? patch.isCritical : m.isCritical,
        };
      });

      // Recompute day totals for every day touched by an edit.
      const affectedDays = new Set<Day>(edits.map((e) => e.day));
      const dayTotals = plan.dayTotals.map((t) => {
        if (!affectedDays.has(t.day)) return t;
        const dayCarbs = meals
          .filter((m) => m.day === t.day)
          .reduce((s, m) => s + (m.carbsG ?? 0), 0);
        const dayProtein = meals
          .filter((m) => m.day === t.day)
          .reduce((s, m) => s + (m.proteinG ?? 0), 0);
        return { ...t, carbsG: dayCarbs, proteinG: dayProtein };
      });

      const next: FuellingPlan = {
        ...plan,
        meals,
        dayTotals,
        manuallyEdited: true,
      };
      await getDb().fuellingPlans.put(next);
      setApplied(true);
    } catch (e) {
      setApplyError(
        e instanceof Error ? e.message : "Couldn't apply the edits.",
      );
    } finally {
      setApplying(false);
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
        <Button
          variant="secondary"
          onClick={getFeedback}
          disabled={feedbackLoading || !plan}
          title={!plan ? "Generate a plan for this week first" : undefined}
        >
          {feedbackLoading
            ? "Generating…"
            : existing?.aiFeedback
              ? "Refresh AI feedback"
              : "Get AI feedback"}
        </Button>
        {existing && (
          <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary ml-auto">
            Saved {new Date(existing.submittedAt).toLocaleString()}
          </span>
        )}
      </div>

      {feedbackError && (
        <div
          className="mt-6 p-3 rounded-button"
          style={{
            border:
              "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
            background: "color-mix(in srgb, var(--danger) 8%, transparent)",
          }}
        >
          <p className="text-body-sm text-danger leading-snug">
            {feedbackError}
          </p>
        </div>
      )}

      {existing?.aiFeedback && (
        <FeedbackPanel
          feedback={existing.aiFeedback}
          canApply={
            !!plan && !!existing.aiFeedback.suggestedPlanEdits?.length
          }
          applying={applying}
          applied={applied}
          applyError={applyError}
          onApply={applySuggestedEdits}
        />
      )}
    </motion.main>
  );
}

function FeedbackPanel({
  feedback,
  canApply,
  applying,
  applied,
  applyError,
  onApply,
}: {
  feedback: AIFeedback;
  canApply: boolean;
  applying: boolean;
  applied: boolean;
  applyError: string | null;
  onApply: () => void;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
        <h2 className="font-display text-display-sm text-ink">
          AI feedback
        </h2>
        <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          {new Date(feedback.generatedAt).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <FeedbackColumn
          label="Wins"
          color="var(--session-easy)"
          items={feedback.wins}
        />
        <FeedbackColumn
          label="Missed"
          color="var(--session-hard)"
          items={feedback.missed}
        />
        <FeedbackColumn
          label="Actions"
          color="var(--accent)"
          items={feedback.recommendations}
        />
      </div>

      {feedback.suggestedPlanEdits &&
        feedback.suggestedPlanEdits.length > 0 && (
          <div className="mt-6">
            <Card>
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                <div>
                  <CardLabel>Suggested plan edits</CardLabel>
                  <p className="text-body-sm text-ink-secondary mt-1">
                    The coach has flagged {feedback.suggestedPlanEdits.length}{" "}
                    meal slot{feedback.suggestedPlanEdits.length === 1 ? "" : "s"}
                    {" "}that would have worked better. Apply to overwrite those
                    cells in this week's plan.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={onApply}
                  disabled={!canApply || applying}
                >
                  {applying
                    ? "Applying…"
                    : applied
                      ? "Applied ✓"
                      : "Apply suggested edits"}
                </Button>
              </div>
              <ul className="space-y-2">
                {feedback.suggestedPlanEdits.map((e, i) => (
                  <li
                    key={`${e.day}:${e.slot}:${i}`}
                    className="flex flex-wrap gap-2 items-baseline text-body-sm"
                  >
                    <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary w-24 shrink-0">
                      {e.day} · {e.slot}
                    </span>
                    <span className="text-ink">{e.food}</span>
                    <span className="font-mono text-[11px] text-ink-tertiary tabular-nums">
                      C {e.carbsG} · P {e.proteinG}
                    </span>
                    {e.note && (
                      <span className="text-body-sm italic text-ink-tertiary">
                        — {e.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {applyError && (
                <p className="mt-3 text-body-sm text-danger leading-snug">
                  {applyError}
                </p>
              )}
            </Card>
          </div>
        )}
    </section>
  );
}

function FeedbackColumn({
  label,
  color,
  items,
}: {
  label: string;
  color: string;
  items: string[];
}) {
  return (
    <Card>
      <div className="inline-flex items-center gap-2 mb-3">
        <span
          aria-hidden
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: color }}
        />
        <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          {label}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-body-sm text-ink-tertiary italic leading-snug">
          Nothing flagged here.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex gap-2 text-body-sm text-ink leading-snug"
            >
              <span
                className="font-mono text-mono-sm pt-0.5 shrink-0"
                style={{ color }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
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
