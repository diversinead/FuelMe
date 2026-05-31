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
  type CheckInStatus,
  type CompletionStatus,
  type Day,
  type FuellingPlan,
  type MealSlot,
  type PlannedMeal,
} from "@/lib/db";
import { formatWeekRange } from "@/lib/date";
import { LoadingState, ErrorBanner } from "@/components/shared/states";
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

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

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
  const [status, setStatus] = React.useState<CheckInStatus>("draft");
  const [feedback, setFeedback] = React.useState<AIFeedback | undefined>(
    undefined,
  );
  const [revised, setRevised] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);
  const [applyError, setApplyError] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState(false);

  // Refs that drive the autosave machinery without re-triggering effects.
  const hydratedRef = React.useRef(false);
  const statusRef = React.useRef<CheckInStatus>("draft");
  const baselineRef = React.useRef<string>("");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Latest draft not yet flushed to Dexie — used to flush on unmount so an edit
  // made within the debounce window isn't lost when navigating away.
  const pendingRef = React.useRef<CheckIn | null>(null);
  React.useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Flush any pending draft when leaving the page (client nav unmount).
  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (pendingRef.current) {
        void getDb().checkIns.put(pendingRef.current);
        pendingRef.current = null;
      }
    };
  }, []);

  // Serialise the form so the autosave effect can tell a real user edit from a
  // re-render (and skip writing an empty draft just from opening the page).
  function serializeForm(
    comp: Record<string, CompletionStatus>,
    en: number,
    ss: number,
    notes: string,
  ): string {
    const compKey = Object.keys(comp)
      .sort()
      .map((k) => `${k}=${comp[k]}`)
      .join("|");
    return JSON.stringify({ compKey, en, ss, notes });
  }

  // Hydrate the form from the saved record once. Guarded with a ref so autosave
  // writes (which update `existing` via the live query) don't re-hydrate.
  React.useEffect(() => {
    if (existing === undefined) return; // still loading
    if (hydratedRef.current) return;
    if (existing) {
      const next: Record<string, CompletionStatus> = {};
      for (const c of existing.mealCompletions) {
        next[`${c.day}:${c.slot}`] = c.status;
      }
      setCompletions(next);
      setEnergy(existing.energyRating);
      setSessionsCompleted(existing.sessionsCompleted);
      setFreeNotes(existing.freeNotes ?? "");
      setStatus(existing.status ?? "submitted");
      setFeedback(existing.aiFeedback);
      setLastSavedAt(new Date(existing.submittedAt));
      baselineRef.current = serializeForm(
        next,
        existing.energyRating,
        existing.sessionsCompleted,
        existing.freeNotes ?? "",
      );
    } else {
      baselineRef.current = serializeForm({}, 3, 0, "");
    }
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  // Debounced draft autosave (500ms). Only fires once the form differs from the
  // hydrated baseline, so opening the page never creates an empty draft.
  // Editing a submitted check-in reverts it to draft and drops the now-stale
  // AI feedback (re-submit to refresh).
  React.useEffect(() => {
    if (!hydratedRef.current) return;
    const cur = serializeForm(completions, energy, sessionsCompleted, freeNotes);
    if (cur === baselineRef.current) return; // no user change yet (or reverted)

    if (statusRef.current === "submitted") {
      setStatus("draft");
      setFeedback(undefined);
      setRevised(true);
    }

    const payload: CheckIn = {
      id: weekId,
      weekId,
      submittedAt: existing?.submittedAt ?? new Date().toISOString(),
      mealCompletions: Object.entries(completions).map(([k, s]) => {
        const [day, slot] = k.split(":");
        return { day, slot, status: s };
      }),
      energyRating: energy,
      sessionsCompleted,
      freeNotes: freeNotes || undefined,
      status: "draft",
    };

    pendingRef.current = payload;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await getDb().checkIns.put(payload);
      pendingRef.current = null;
      setLastSavedAt(new Date());
      setJustSaved(true);
      if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
      savedFlashTimer.current = setTimeout(() => setJustSaved(false), 1600);
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completions, energy, sessionsCompleted, freeNotes]);

  if (plan === undefined || existing === undefined) return <LoadingState />;

  // Submit (or re-submit) the check-in for AI feedback. Persists the latest
  // answers first, then flips status → 'submitted' with the returned feedback.
  async function submitForFeedback() {
    if (!plan) return;
    setSubmitting(true);
    setFeedbackError(null);
    // Cancel any pending draft autosave so it can't overwrite the submitted record.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pendingRef.current = null;
    try {
      const db = getDb();
      const [profile, foodPreferences] = await Promise.all([
        db.profile.get("me"),
        db.foodPreferences.get("me"),
      ]);
      if (!profile) throw new Error("Missing profile. Re-run onboarding.");

      const base: CheckIn = {
        id: weekId,
        weekId,
        submittedAt: new Date().toISOString(),
        mealCompletions: Object.entries(completions).map(([k, s]) => {
          const [day, slot] = k.split(":");
          return { day, slot, status: s };
        }),
        energyRating: energy,
        sessionsCompleted,
        freeNotes: freeNotes || undefined,
        status: "draft",
      };
      // Persist the latest answers first, so a failed AI call still saves them.
      await db.checkIns.put(base);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fuellingPlan: plan,
          checkIn: base,
          profile,
          foodPreferences,
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
      await db.checkIns.put({ ...base, status: "submitted", aiFeedback });
      setStatus("submitted");
      setFeedback(aiFeedback);
      setRevised(false);
      setLastSavedAt(new Date());
    } catch (e) {
      setFeedbackError(
        e instanceof Error ? e.message : "Feedback generation failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function applySuggestedEdits() {
    if (!plan || !feedback?.suggestedPlanEdits?.length) return;
    setApplying(true);
    setApplyError(null);
    setApplied(false);
    try {
      const edits = feedback.suggestedPlanEdits;
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

      {revised && (
        <div
          className="mb-4 p-3 rounded-button"
          style={{
            border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
            background: "color-mix(in srgb, var(--warning) 8%, transparent)",
          }}
        >
          <p className="text-body-sm text-ink leading-snug">
            This check-in has been edited — re-submit to refresh AI feedback.
          </p>
        </div>
      )}

      <div className="sticky bottom-0 bg-surface-0/95 backdrop-blur pt-4 pb-3 -mx-5 px-5 md:mx-0 md:px-0 border-t border-border-subtle">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={submitForFeedback}
            disabled={submitting || !plan}
            size="lg"
            title={!plan ? "Generate a plan for this week first" : undefined}
          >
            {submitting
              ? "Submitting…"
              : status === "submitted"
                ? "Refresh AI feedback"
                : "Submit for AI feedback"}
          </Button>
          <span
            aria-live="polite"
            className={cn(
              "font-mono text-mono-sm uppercase tracking-widest transition-colors duration-300",
              justSaved ? "text-accent" : "text-ink-tertiary",
            )}
          >
            {status === "submitted"
              ? lastSavedAt
                ? `Submitted · ${formatTime(lastSavedAt)}`
                : "Submitted"
              : lastSavedAt
                ? `Draft · saved ${formatTime(lastSavedAt)}`
                : "Draft"}
          </span>
          {!plan && (
            <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary ml-auto">
              No plan yet — drafts still save
            </span>
          )}
        </div>
        <p className="text-body-sm text-ink-tertiary mt-2">
          Your answers save automatically as you go — submit only when you want
          AI feedback.
        </p>
      </div>

      {feedbackError && (
        <ErrorBanner
          message={feedbackError}
          onRetry={submitForFeedback}
          className="mt-6"
        />
      )}

      {feedback && (
        <FeedbackPanel
          feedback={feedback}
          canApply={!!plan && !!feedback.suggestedPlanEdits?.length}
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
                    cells in this week&apos;s plan.
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
