"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, CalendarDays, Flame, ListChecks, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SessionTag } from "@/components/shared/SessionTag";
import { LoadingState } from "@/components/shared/states";
import {
  getDb,
  clonePlan,
  blankPlanRecord,
  type Day,
  type DaySession,
} from "@/lib/db";
import { cloneWeekSessions } from "@/lib/defaults";
import { weekIdFor, nextWeekId, formatWeekRange, daysIntoWeek } from "@/lib/date";
import { cn } from "@/lib/utils";
import { ease, staggerList, staggerItem } from "@/lib/motion";

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const router = useRouter();
  const currentWeekId = weekIdFor();
  const nextWid = nextWeekId(currentWeekId);

  const data = useLiveQuery(async () => {
    const db = getDb();
    const profile = await db.profile.get("me");
    const trainingWeek = await db.trainingWeeks.get(currentWeekId);
    const recentPlans = await db.fuellingPlans
      .orderBy("generatedAt")
      .reverse()
      .limit(8)
      .toArray();
    const allTrainingWeeks = await db.trainingWeeks
      .orderBy("weekStart")
      .reverse()
      .limit(12)
      .toArray();
    const allCheckIns = await db.checkIns.toArray();
    const checkInForCurrent = await db.checkIns.get(currentWeekId);
    return {
      profile,
      trainingWeek,
      recentPlans,
      allTrainingWeeks,
      allCheckIns,
      checkInForCurrent,
    };
  }, [currentWeekId]);

  // "Plan next week" chooser state. Both paths are non-AI — AI generation
  // happens on the fuelling page (Regenerate dialog, where focus is entered).
  const [chooserOpen, setChooserOpen] = React.useState(false);
  type ChooserPath = "copy" | "blank";
  const [chooserPath, setChooserPath] = React.useState<ChooserPath>("copy");
  const [chooserBusy, setChooserBusy] = React.useState(false);
  const [chooserError, setChooserError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (data && !data.profile) router.replace("/onboarding");
  }, [data, router]);

  if (!data) return <LoadingState />;
  if (!data.profile) return null;

  // Plan-for-current-week exists? Drives default chooser selection.
  const currentWeekPlan = data.recentPlans.find(
    (p) => p.weekId === currentWeekId,
  );
  const canCopy = !!currentWeekPlan;
  const nextWeekHasTraining = data.allTrainingWeeks.some(
    (t) => t.id === nextWid,
  );

  function openChooser() {
    setChooserPath(canCopy ? "copy" : "blank");
    setChooserError(null);
    setChooserOpen(true);
  }

  function closeChooser() {
    if (chooserBusy) return;
    setChooserOpen(false);
    setChooserError(null);
  }

  async function confirmChooser() {
    setChooserBusy(true);
    setChooserError(null);
    try {
      if (chooserPath === "copy") {
        const result = await clonePlan(currentWeekId, nextWid);
        if (!result.clonedPlan) {
          throw new Error("No plan to copy. Choose Blank template instead.");
        }
        router.push(`/plan/${nextWid}`);
        return;
      }

      // Blank template: clone this week's training as a scaffold (so the
      // fuelling page has training context to generate from) when next week
      // has none yet, write an empty plan, then land on the fuelling page with
      // the focus/generate dialog open. No AI call here.
      const db = getDb();
      const existingTraining = await db.trainingWeeks.get(nextWid);
      if (!existingTraining) {
        const current = await db.trainingWeeks.get(currentWeekId);
        if (current) {
          await db.trainingWeeks.put({
            ...current,
            id: nextWid,
            weekStart: nextWid,
            sessions: cloneWeekSessions(current.sessions),
          });
        }
      }
      await db.fuellingPlans.put(blankPlanRecord(nextWid));
      router.push(`/plan/${nextWid}?generate=1`);
    } catch (e) {
      setChooserError(e instanceof Error ? e.message : "Something went wrong.");
      setChooserBusy(false);
    }
  }

  const sessionsCount = data.trainingWeek
    ? data.trainingWeek.sessions.filter((s) => s.type !== "rest").length
    : 0;

  // A draft check-in exists but isn't finalised — only a 'submitted' one counts
  // as "this week is checked in" for the CTAs below. (The context-aware
  // check-in card that uses the draft state is the next queued item.)
  const isCheckedIn = data.checkInForCurrent?.status === "submitted";

  const completionPct = (() => {
    if (!data.checkInForCurrent) return null;
    const total = data.checkInForCurrent.mealCompletions.length;
    if (total === 0) return 0;
    const done = data.checkInForCurrent.mealCompletions.filter(
      (m) => m.status === "done" || m.status === "swapped",
    ).length;
    return Math.round((done / total) * 100);
  })();

  const energyAvg = (() => {
    if (!data.checkInForCurrent) return null;
    return data.checkInForCurrent.energyRating;
  })();

  // Context-aware "This week's check-in" card inputs.
  const TOTAL_MEALS = 35; // 5 slots × 7 days, matching the check-in grid
  const loggedCount = data.checkInForCurrent?.mealCompletions.length ?? 0;
  const dayIdx = daysIntoWeek(currentWeekId); // 0 = Mon … 6 = Sun
  const coaching =
    isCheckedIn && data.checkInForCurrent?.aiFeedback
      ? data.checkInForCurrent.aiFeedback
      : null;

  // Merged week history: union of training weeks + plans, keyed by weekId,
  // each row showing both training + plan status together (tasks/TrainingPage.md).
  const planWeekIds = new Set(data.recentPlans.map((p) => p.weekId));
  const trainingWeekIds = new Set(data.allTrainingWeeks.map((t) => t.id));
  const checkedInWeekIds = new Set(data.allCheckIns.map((c) => c.weekId));
  const historyWeeks = Array.from(
    new Set([...planWeekIds, ...trainingWeekIds]),
  )
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((weekId) => ({
      weekId,
      hasTraining: trainingWeekIds.has(weekId),
      hasPlan: planWeekIds.has(weekId),
      hasCheckIn: checkedInWeekIds.has(weekId),
    }));

  const greeting = data.profile.name
    ? `Hey, ${data.profile.name}.`
    : "Let's go.";

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ease.out }}
      className="app-container py-8 md:py-12"
    >
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-display-xl text-ink tracking-tight">
          {greeting}
        </h1>
      </div>

      {/* Hero + side column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hero "This Week" */}
        <Card hero className="lg:col-span-2">
          <SectionHeader>This week</SectionHeader>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-display-lg text-ink leading-none">
                {formatWeekRange(currentWeekId)}
              </h2>
              <p className="text-body-sm text-ink-secondary mt-2">
                {data.trainingWeek
                  ? `${sessionsCount} session${sessionsCount === 1 ? "" : "s"} planned`
                  : "No training entered yet"}
                {" · "}
                <Link
                  href={`/training/${currentWeekId}/edit`}
                  className="font-mono text-mono-sm uppercase tracking-widest text-accent hover:text-accent-hover"
                >
                  Edit training
                </Link>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => router.push(`/plan/${currentWeekId}`)}>
                View plan <ArrowUpRight size={16} />
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/grocery/${currentWeekId}`)}
              >
                Grocery list
              </Button>
            </div>
          </div>

          {data.trainingWeek && (
            <motion.div
              variants={staggerList}
              initial="hidden"
              animate="show"
              className="mt-6 grid grid-cols-7 gap-2"
            >
              {data.trainingWeek.sessions.map((s) => (
                <DayChip
                  key={s.day}
                  session={s}
                  onClick={() => router.push(`/plan/${currentWeekId}`)}
                />
              ))}
            </motion.div>
          )}
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Context-aware "This week's check-in" card */}
          {coaching ? (
            <Card hero>
              <SectionHeader>This week&apos;s coaching</SectionHeader>
              <ul className="space-y-2.5">
                {(coaching.wins.length
                  ? coaching.wins
                  : coaching.recommendations
                )
                  .slice(0, 2)
                  .map((w, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-body-sm text-ink leading-snug"
                    >
                      <span className="text-accent font-mono text-mono-sm pt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{w}</span>
                    </li>
                  ))}
              </ul>
              <div className="mt-4">
                <Link
                  href={`/checkin/${currentWeekId}`}
                  className="font-mono text-mono-sm uppercase tracking-widest text-accent hover:text-accent-hover"
                >
                  See full feedback →
                </Link>
              </div>
            </Card>
          ) : (
            <Card hero>
              <SectionHeader>This week&apos;s check-in</SectionHeader>
              {(() => {
                // Late week (Sat/Sun) → wrap up; mid (Wed–Fri) → keep going with
                // progress; early (Mon/Tue) → start.
                const late = dayIdx >= 5;
                const mid = dayIdx >= 2 && dayIdx <= 4;
                const heading = late
                  ? "Wrap up the week"
                  : mid
                    ? "Keep going"
                    : "Track as you go";
                const copy = late
                  ? "Finalise your check-in to get AI feedback that shapes next week’s plan."
                  : mid
                    ? `${loggedCount} of ${TOTAL_MEALS} meals logged so far. Keep marking them as you go.`
                    : "Start logging meals to capture how this week unfolds.";
                const cta = late
                  ? "Finalise check-in"
                  : mid
                    ? "Continue logging"
                    : "Start logging";
                return (
                  <>
                    <h3 className="font-display text-display-sm text-ink">
                      {heading}
                    </h3>
                    <p className="text-body-sm text-ink-secondary mt-1 mb-4">
                      {copy}
                    </p>
                    {mid && (
                      <div
                        className="h-1.5 rounded-full bg-surface-3 overflow-hidden mb-4"
                        role="progressbar"
                        aria-valuenow={loggedCount}
                        aria-valuemax={TOTAL_MEALS}
                      >
                        <div
                          className="h-full bg-accent rounded-full transition-[width] duration-300"
                          style={{
                            width: `${Math.min(100, Math.round((loggedCount / TOTAL_MEALS) * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                    <Button
                      fullWidth
                      onClick={() => router.push(`/checkin/${currentWeekId}`)}
                    >
                      {cta}
                    </Button>
                  </>
                );
              })()}
            </Card>
          )}

          {/* Up next — planning next week (always available) */}
          <Card hero>
            <SectionHeader>Up next</SectionHeader>
            <h3 className="font-display text-display-sm text-ink">
              Plan next week
            </h3>
            <p className="text-body-sm text-ink-secondary mt-1 mb-4">
              {isCheckedIn
                ? `Build ${formatWeekRange(nextWid)} on the back of this week’s data.`
                : `Get ahead on ${formatWeekRange(nextWid)} — set training, then fuelling.`}
            </p>
            <div className="flex gap-2">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => router.push("/training/next")}
              >
                Training
              </Button>
              <Button fullWidth onClick={openChooser}>
                Fuelling
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
        <StatCard
          icon={<CalendarDays size={16} />}
          label="Sessions this week"
          value={data.trainingWeek ? sessionsCount : "—"}
          sublabel={data.trainingWeek ? "scheduled" : "no plan"}
        />
        <StatCard
          icon={<ListChecks size={16} />}
          label="Plan completion"
          value={completionPct == null ? "—" : `${completionPct}%`}
          sublabel={completionPct == null ? "check in to track" : "of meals hit"}
          onClick={() => router.push(`/checkin/${currentWeekId}`)}
        />
        <StatCard
          icon={<Flame size={16} />}
          label="Energy"
          value={energyAvg == null ? "—" : `${energyAvg}/5`}
          sublabel={energyAvg == null ? "needs check-in" : "this week"}
        />
      </div>

      {/* History — training + plan status per week (tasks/TrainingPage.md) */}
      {historyWeeks.length > 0 && (
        <section className="mt-12">
          <SectionHeader>History</SectionHeader>
          <Card className="p-0 md:p-0 overflow-hidden">
            <ul>
              {historyWeeks.map((w, i) => (
                <li
                  key={w.weekId}
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-3.5",
                    i > 0 && "border-t border-border-subtle",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-mono text-ink-tertiary shrink-0">
                      {w.weekId}
                    </span>
                    <span className="text-body-sm text-ink truncate">
                      {formatWeekRange(w.weekId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {w.hasTraining && (
                      <Link
                        href={`/training/${w.weekId}/edit`}
                        className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-accent"
                      >
                        Training
                      </Link>
                    )}
                    {w.hasPlan && (
                      <Link
                        href={`/plan/${w.weekId}`}
                        className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-accent"
                      >
                        Plan
                      </Link>
                    )}
                    {w.hasCheckIn && (
                      <Link
                        href={`/checkin/${w.weekId}`}
                        className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-accent inline-flex items-center gap-1"
                      >
                        Check-in <ArrowUpRight size={12} />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Plan next week chooser (Phase 4.5 / SPEC §4.7) */}
      <AnimatePresence>
        {chooserOpen && (
          <motion.div
            key="chooser-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={closeChooser}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="chooser-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.18, ease: ease.out }}
              className="relative w-full max-w-md rounded-card bg-surface-1 border border-border p-6 shadow-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="chooser-title"
                    className="font-display text-display-sm text-ink"
                  >
                    Plan next week
                  </h2>
                  <p className="text-body-sm text-ink-secondary mt-1">
                    {formatWeekRange(nextWid)}. Pick a starting point — then
                    generate or edit on the fuelling page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeChooser}
                  disabled={chooserBusy}
                  aria-label="Close"
                  className="shrink-0 -mt-1 -mr-1 p-1 text-ink-tertiary hover:text-ink rounded"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {(
                  [
                    {
                      value: "copy",
                      title: "Copy last week",
                      hint: "Duplicate this week's plan as a starting point. Edit any meal inline, or regenerate on the fuelling page.",
                      disabled: !canCopy,
                      disabledReason:
                        "No plan to copy yet — use Blank template instead.",
                    },
                    {
                      value: "blank",
                      title: "Blank template",
                      hint: "Start with an empty plan. You'll land on the fuelling page to generate it (with your focus).",
                      disabled: false,
                      disabledReason: undefined as string | undefined,
                    },
                  ] as const
                ).map((opt) => {
                  const selected = chooserPath === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-button border transition-colors",
                        opt.disabled
                          ? "border-border bg-surface-2 opacity-50 cursor-not-allowed"
                          : selected
                            ? "border-accent bg-surface-2 cursor-pointer"
                            : "border-border bg-surface-2 hover:border-border-strong cursor-pointer",
                      )}
                    >
                      <input
                        type="radio"
                        name="chooser-path"
                        value={opt.value}
                        checked={selected}
                        disabled={opt.disabled}
                        onChange={() => setChooserPath(opt.value)}
                        className="mt-1 accent-accent"
                      />
                      <div className="flex-1">
                        <div className="text-body text-ink">{opt.title}</div>
                        <p className="text-body-sm text-ink-tertiary mt-1 leading-snug">
                          {opt.hint}
                        </p>
                        {opt.disabled && opt.disabledReason && (
                          <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary mt-1">
                            {opt.disabledReason}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {!nextWeekHasTraining && (
                <div
                  className="mt-4 p-3 rounded-button"
                  style={{
                    border:
                      "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
                    background:
                      "color-mix(in srgb, var(--warning) 8%, transparent)",
                  }}
                >
                  <p className="text-body-sm text-ink leading-snug">
                    No training set for next week yet.{" "}
                    <Link
                      href="/training/next"
                      className="font-mono text-mono-sm uppercase tracking-widest text-accent hover:text-accent-hover"
                    >
                      Set it up first
                    </Link>{" "}
                    for an accurate plan.
                  </p>
                </div>
              )}

              {chooserError && (
                <div
                  className="mt-4 p-3 rounded-button"
                  style={{
                    border:
                      "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                    background:
                      "color-mix(in srgb, var(--danger) 8%, transparent)",
                  }}
                >
                  <p className="text-body-sm text-danger leading-snug">
                    {chooserError}
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={closeChooser}
                  disabled={chooserBusy}
                >
                  Cancel
                </Button>
                <Button onClick={confirmChooser} disabled={chooserBusy}>
                  {chooserBusy
                    ? chooserPath === "copy"
                      ? "Copying…"
                      : "Generating…"
                    : "Confirm"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function DayChip({
  session,
  onClick,
}: {
  session: DaySession;
  onClick?: () => void;
}) {
  const subs = session.sessions ?? [];
  return (
    <motion.button
      variants={staggerItem}
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-button bg-surface-2 border border-border-subtle px-2 py-3 text-left",
        "hover:border-border-strong hover:bg-surface-3 transition-colors duration-150",
        "flex flex-col items-start gap-1.5",
      )}
    >
      <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        {session.day}
      </span>
      {subs.length === 0 ? (
        <SessionTag type="rest" />
      ) : (
        <div className="flex flex-col items-start gap-1">
          {subs.map((s) => (
            <SessionTag
              key={s.id}
              type={s.type}
              customLabel={s.customType}
              unset={s.typeUnset}
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sublabel: string;
  onClick?: () => void;
}) {
  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2 text-ink-tertiary mb-3">
        {icon}
        <span className="font-mono text-mono-sm uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="font-mono text-display-lg text-ink leading-none">
        {value}
      </div>
      <div className="text-body-sm text-ink-tertiary mt-2">{sublabel}</div>
    </Card>
  );
}

