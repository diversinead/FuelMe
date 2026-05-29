"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Flame, ListChecks } from "lucide-react";
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
import { getDb, type Day, type DaySession } from "@/lib/db";
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

  React.useEffect(() => {
    if (data && !data.profile) router.replace("/onboarding");
  }, [data, router]);

  if (!data) return <DashLoading />;
  if (!data.profile) return null;

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
              onClick={() =>
                router.push(
                  data.checkInForCurrent
                    ? `/plan/${nextWid}`
                    : `/checkin/${currentWeekId}`,
                )
              }
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
      <SessionTag type={session.type} />
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
