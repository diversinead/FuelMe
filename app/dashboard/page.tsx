"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, CalendarDays, Flame, ListChecks, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardLabel,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SessionTag } from "@/components/shared/SessionTag";
import {
  getDb,
  clonePlan,
  type Day,
  type DaySession,
  type FuellingPlan,
} from "@/lib/db";
import { weekIdFor, nextWeekId, formatWeekRange } from "@/lib/date";
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
    const checkInForCurrent = await db.checkIns.get(currentWeekId);
    const lastCheckIn = (
      await db.checkIns.orderBy("submittedAt").reverse().limit(1).toArray()
    )[0];
    return {
      profile,
      trainingWeek,
      recentPlans,
      lastCheckIn,
      checkInForCurrent,
    };
  }, [currentWeekId]);

  // Phase 4.5 chooser state
  const [chooserOpen, setChooserOpen] = React.useState(false);
  type ChooserPath = "copy" | "adjust" | "fresh";
  const [chooserPath, setChooserPath] = React.useState<ChooserPath>("copy");
  const [chooserBusy, setChooserBusy] = React.useState(false);
  const [chooserError, setChooserError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (data && !data.profile) router.replace("/onboarding");
  }, [data, router]);

  if (!data) return <DashLoading />;
  if (!data.profile) return null;

  // Plan-for-current-week exists? Drives default chooser selection.
  const currentWeekPlan = data.recentPlans.find(
    (p) => p.weekId === currentWeekId,
  );
  const canCopy = !!currentWeekPlan;

  function openChooser() {
    setChooserPath(canCopy ? "copy" : "fresh");
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
          throw new Error(
            "No plan to copy. Choose Generate fresh instead.",
          );
        }
        router.push(`/plan/${nextWid}`);
        return;
      }

      if (chooserPath === "adjust") {
        if (!currentWeekPlan) {
          throw new Error(
            "No plan to adjust from. Choose Generate fresh instead.",
          );
        }

        // Clone the training as a scaffold for next week, then POST /api/plan
        // with mode: "adjust" + baselinePlan. The model preserves unchanged
        // days verbatim and only modifies meals affected by the training diff
        // or previousFeedback.
        await clonePlan(currentWeekId, nextWid);

        const db = getDb();
        const [profile, foodPrefs, trainingWeek] = await Promise.all([
          db.profile.get("me"),
          db.foodPreferences.get("me"),
          db.trainingWeeks.get(nextWid),
        ]);

        if (!profile || !foodPrefs) {
          throw new Error(
            "Missing profile or food preferences. Re-run onboarding first.",
          );
        }
        if (!trainingWeek) {
          throw new Error("No training week available to adjust from.");
        }

        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "adjust",
            profile,
            foodPreferences: foodPrefs,
            trainingWeek,
            baselinePlan: currentWeekPlan,
            previousFeedback:
              data?.lastCheckIn?.aiFeedback?.recommendations?.join("\n") ||
              undefined,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            (errBody as { error?: string }).error ??
              `Plan adjustment failed (HTTP ${response.status}).`,
          );
        }

        const apiPlan = (await response.json()) as Omit<
          FuellingPlan,
          "id" | "weekId" | "generatedAt"
        >;
        await db.fuellingPlans.put({
          ...apiPlan,
          id: nextWid,
          weekId: nextWid,
          generatedAt: new Date().toISOString(),
          manuallyEdited: false,
        });

        router.push(`/plan/${nextWid}`);
        return;
      }

      if (chooserPath === "fresh") {
        // Clone this week's training as a scaffold for next week (athlete
        // can edit in Settings if it should differ), then generate fresh.
        await clonePlan(currentWeekId, nextWid);

        const db = getDb();
        const [profile, foodPrefs, trainingWeek] = await Promise.all([
          db.profile.get("me"),
          db.foodPreferences.get("me"),
          db.trainingWeeks.get(nextWid),
        ]);

        if (!profile || !foodPrefs) {
          throw new Error(
            "Missing profile or food preferences. Re-run onboarding first.",
          );
        }
        if (!trainingWeek) {
          throw new Error(
            "No training week available to plan from. Add this week's training first.",
          );
        }

        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "fresh",
            profile,
            foodPreferences: foodPrefs,
            trainingWeek,
            previousFeedback:
              data?.lastCheckIn?.aiFeedback?.recommendations?.join("\n") ||
              undefined,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            (errBody as { error?: string }).error ??
              `Plan generation failed (HTTP ${response.status}).`,
          );
        }

        const apiPlan = (await response.json()) as Omit<
          FuellingPlan,
          "id" | "weekId" | "generatedAt"
        >;
        await db.fuellingPlans.put({
          ...apiPlan,
          id: nextWid,
          weekId: nextWid,
          generatedAt: new Date().toISOString(),
          manuallyEdited: false,
        });

        router.push(`/plan/${nextWid}`);
        return;
      }

      // Unreachable — all three chooserPath values handled above.
      throw new Error("Unknown chooser path.");
    } catch (e) {
      setChooserError(
        e instanceof Error ? e.message : "Something went wrong.",
      );
      setChooserBusy(false);
    }
  }

  const sessionsCount = data.trainingWeek
    ? data.trainingWeek.sessions.filter((s) => s.type !== "rest").length
    : 0;

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
        <CardLabel>{formatWeekRange(currentWeekId)}</CardLabel>
        <h1 className="font-display text-display-xl text-ink tracking-tight mt-1">
          {greeting}
        </h1>
      </div>

      {/* Hero + side column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hero "This Week" */}
        <Card hero className="lg:col-span-2">
          <SectionHeader trailing={<CardLabel>Week of</CardLabel>}>
            This week
          </SectionHeader>
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
                  href="/settings?tab=training"
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
          {/* Last week's wins */}
          {data.lastCheckIn?.aiFeedback && data.lastCheckIn.weekId !== currentWeekId ? (
            <Card>
              <SectionHeader>Last week&apos;s wins</SectionHeader>
              <ul className="space-y-2.5">
                {data.lastCheckIn.aiFeedback.wins.slice(0, 2).map((w, i) => (
                  <li key={i} className="flex gap-2 text-body-sm text-ink leading-snug">
                    <span className="text-accent font-mono text-mono-sm pt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Link
                  href={`/checkin/${data.lastCheckIn.weekId}`}
                  className="font-mono text-mono-sm uppercase tracking-widest text-accent hover:text-accent-hover"
                >
                  See full feedback →
                </Link>
              </div>
            </Card>
          ) : (
            <Card>
              <SectionHeader>Last week</SectionHeader>
              <p className="text-body-sm text-ink-secondary">
                No check-in yet. After a week of fuelling, log how it went to
                start the feedback loop.
              </p>
            </Card>
          )}

          {/* Up next CTA */}
          <Card hero>
            <SectionHeader>Up next</SectionHeader>
            <h3 className="font-display text-display-sm text-ink">
              {data.checkInForCurrent ? "Plan next week" : "Do this week’s check-in"}
            </h3>
            <p className="text-body-sm text-ink-secondary mt-1 mb-4">
              {data.checkInForCurrent
                ? `Build ${formatWeekRange(nextWid)} on the back of this week’s data.`
                : "Tell us what hit, what missed. Two minutes."}
            </p>
            <Button
              fullWidth
              onClick={() => {
                if (data.checkInForCurrent) {
                  openChooser();
                } else {
                  router.push(`/checkin/${currentWeekId}`);
                }
              }}
            >
              {data.checkInForCurrent ? "Plan next week" : "Do check-in"}
            </Button>
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
        />
        <StatCard
          icon={<Flame size={16} />}
          label="Energy"
          value={energyAvg == null ? "—" : `${energyAvg}/5`}
          sublabel={energyAvg == null ? "needs check-in" : "this week"}
        />
      </div>

      {/* History */}
      {data.recentPlans.length > 0 && (
        <section className="mt-12">
          <SectionHeader>History</SectionHeader>
          <Card className="p-0 md:p-0 overflow-hidden">
            <ul>
              {data.recentPlans.map((p, i) => (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between px-5 py-3.5",
                    i > 0 && "border-t border-border-subtle",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-mono text-ink-tertiary">
                      {p.weekId}
                    </span>
                    <span className="text-body-sm text-ink">
                      {formatWeekRange(p.weekId)}
                    </span>
                  </div>
                  <Link
                    href={`/plan/${p.weekId}`}
                    className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-accent inline-flex items-center gap-1"
                  >
                    Open <ArrowUpRight size={12} />
                  </Link>
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
                    {formatWeekRange(nextWid)}. How should we build it?
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
                      hint: "Duplicate this week's plan as a starting point. Edit any meal inline.",
                      disabled: !canCopy,
                      disabledReason:
                        "No plan to copy yet — generate one for this week first.",
                    },
                    {
                      value: "adjust",
                      title: "Adjust last week",
                      hint: "Carry forward last week's plan; the AI modifies only meals on days whose training changes or that feedback flagged.",
                      disabled: !canCopy,
                      disabledReason: canCopy
                        ? undefined
                        : "No plan to adjust from — generate one for this week first.",
                    },
                    {
                      value: "fresh",
                      title: "Generate fresh",
                      hint: "AI builds a brand new plan from your profile, prefs, and next week's training.",
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
            <SessionTag key={s.id} type={s.type} customLabel={s.customType} />
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
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sublabel: string;
}) {
  return (
    <Card>
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

function DashLoading() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        Loading…
      </p>
    </main>
  );
}
