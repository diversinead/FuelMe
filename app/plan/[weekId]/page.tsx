"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Printer, RefreshCw, ShoppingBag } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getDb,
  type Day,
  type DayTag,
  type FuellingPlan,
  type MealSlot,
  type PlannedMeal,
} from "@/lib/db";
import { mockPlan } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: "breakfast", label: "Breakfast" },
  { slot: "post_am",   label: "Post-AM" },
  { slot: "lunch",     label: "Lunch" },
  { slot: "afternoon", label: "Afternoon" },
  { slot: "dinner",    label: "Dinner" },
];

type PillVariant = "neutral" | "hard" | "long";

function pillVariantFor(tag: DayTag | undefined): PillVariant {
  if (tag === "hard") return "hard";
  if (tag === "long") return "long";
  return "neutral"; // easy | easy+ | rest | undefined
}

function pillLabelFor(tag: DayTag | undefined): string {
  switch (tag) {
    case "easy":  return "Easy";
    case "easy+": return "Easy+";
    case "hard":  return "Hard";
    case "long":  return "Long";
    case "rest":  return "Rest";
    default:      return "Rest";
  }
}

export default function PlanPage({ params }: { params: { weekId: string } }) {
  const { weekId } = params;
  const plan = useLiveQuery(
    async () => (await getDb().fuellingPlans.get(weekId)) ?? null,
    [weekId],
  );
  const [seeding, setSeeding] = React.useState(false);

  if (plan === undefined) return <Loading />;

  if (plan === null) {
    return (
      <main className="app-container py-12 max-w-2xl">
        <BackLink />
        <h1 className="font-display text-display-lg text-ink mt-6">No plan yet</h1>
        <p className="text-body-lg text-ink-secondary mt-3 mb-6">
          AI plan generation lands in Phase 3. Seed a mock plan to click through.
        </p>
        <Button
          disabled={seeding}
          onClick={async () => {
            setSeeding(true);
            try {
              await getDb().fuellingPlans.put(mockPlan(weekId));
            } finally {
              setSeeding(false);
            }
          }}
        >
          {seeding ? "Seeding…" : "Seed mock plan"}
        </Button>
      </main>
    );
  }

  return <PlanView plan={plan} />;
}

function PlanView({ plan }: { plan: FuellingPlan }) {
  const [mobileDayIdx, setMobileDayIdx] = React.useState(0);
  const [reseeding, setReseeding] = React.useState(false);
  const mealLookup = new Map<string, PlannedMeal>();
  for (const m of plan.meals) mealLookup.set(`${m.day}:${m.slot}`, m);

  const weekDate = format(parseISO(plan.weekId), "EEE d MMM");

  // Dev convenience while mock data evolves: overwrite the stored plan with
  // a fresh copy of mockPlan() so updates to lib/mock.ts actually surface.
  // Will be replaced by the real /api/plan call in Phase 3.
  async function reseedMock() {
    setReseeding(true);
    try {
      await getDb().fuellingPlans.put(mockPlan(plan.weekId));
    } finally {
      setReseeding(false);
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ease.out }}
      className="app-container py-8 md:py-12"
    >
      {/* Top utility row: back link + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <BackLink />
        <div className="flex gap-2 flex-wrap">
          <Link href={`/plan/${plan.weekId}/print?auto=1`} target="_blank">
            <Button variant="secondary" size="sm">
              <Printer size={14} /> Print
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={reseedMock}
            disabled={reseeding}
            title="Overwrite the stored plan with the current mock data. Phase 3 replaces this with a real AI regenerate."
          >
            <RefreshCw size={14} /> {reseeding ? "Re-seeding…" : "Re-seed mock"}
          </Button>
          <Link href={`/grocery/${plan.weekId}`}>
            <Button size="sm">
              <ShoppingBag size={14} /> Grocery
            </Button>
          </Link>
        </div>
      </div>

      {/* Header strip — title left, macro legend right */}
      <header className="flex items-end justify-between gap-6 mt-8 pb-5 border-b-[0.5px] border-border-default flex-wrap">
        <div>
          <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            Week of {weekDate}
          </div>
          <h1 className="text-[20px] font-medium text-ink mt-1 leading-none">
            Fuelling plan
          </h1>
        </div>
        <div className="flex items-center gap-5 text-body-sm text-ink-secondary">
          <LegendDot color="var(--macro-carbs)">
            Carbs {plan.targets.carbsRangeG} g
          </LegendDot>
          <LegendDot color="var(--macro-protein)">
            Protein {plan.targets.proteinRangeG}
          </LegendDot>
        </div>
      </header>

      {/* Mobile: day-by-day */}
      <div className="md:hidden mt-7">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-5 px-5">
          {DAYS.map((d, i) => (
            <button
              key={d}
              onClick={() => setMobileDayIdx(i)}
              className={cn(
                "shrink-0 px-3 py-2 rounded-button font-mono text-mono-sm uppercase tracking-widest border transition-colors",
                i === mobileDayIdx
                  ? "bg-accent text-ink-inverse border-accent"
                  : "bg-surface-2 text-ink-secondary border-border hover:text-ink",
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {SLOTS.map((row) => (
            <MealCard
              key={row.slot}
              slotLabel={row.label}
              meal={mealLookup.get(`${DAYS[mobileDayIdx]}:${row.slot}`)}
            />
          ))}
          <DayTotalRow
            total={plan.dayTotals.find((t) => t.day === DAYS[mobileDayIdx])}
          />
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:block mt-7">
        <div
          className="grid"
          style={{ gridTemplateColumns: "88px repeat(7, minmax(0, 1fr))" }}
        >
          {/* corner */}
          <div className="border-b-[0.5px] border-border-default" />

          {/* day headers */}
          {DAYS.map((d) => {
            const total = plan.dayTotals.find((t) => t.day === d);
            return (
              <div
                key={d}
                className="px-3 pb-3 border-b-[0.5px] border-l-[0.5px] border-border-default"
              >
                <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                  {d.toUpperCase()}
                </div>
                <div className="mt-1.5">
                  <SessionPill variant={pillVariantFor(total?.tag)}>
                    {pillLabelFor(total?.tag)}
                  </SessionPill>
                </div>
              </div>
            );
          })}

          {/* meal rows */}
          {SLOTS.map((row) => (
            <React.Fragment key={row.slot}>
              <div className="px-2 py-4 border-b-[0.5px] border-border-default flex items-start">
                <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                  {row.label}
                </span>
              </div>
              {DAYS.map((d) => {
                const meal = mealLookup.get(`${d}:${row.slot}`);
                return (
                  <div
                    key={d}
                    className="px-3 py-4 border-b-[0.5px] border-l-[0.5px] border-border-default flex flex-col justify-between min-h-[88px]"
                  >
                    {meal ? (
                      <>
                        <div className="text-[13px] text-ink leading-[1.45]">
                          {meal.food}
                        </div>
                        <div className="flex justify-end gap-2.5 mt-3 text-[11px] font-mono">
                          <span style={{ color: "var(--macro-carbs)" }}>
                            {meal.carbsG}
                          </span>
                          <span style={{ color: "var(--macro-protein)" }}>
                            {meal.proteinG}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-body-sm text-ink-tertiary">—</span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* totals row */}
          <div className="px-2 py-4 flex items-center">
            <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
              Total
            </span>
          </div>
          {DAYS.map((d) => {
            const t = plan.dayTotals.find((x) => x.day === d);
            return (
              <div
                key={d}
                className="px-3 py-4 border-l-[0.5px] border-border-default flex justify-end items-center gap-2.5 text-[13px] font-medium font-mono"
              >
                <span style={{ color: "var(--macro-carbs)" }}>
                  {t?.carbsG ?? "—"}
                </span>
                <span style={{ color: "var(--macro-protein)" }}>
                  {t?.proteinG ?? "—"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rules footer */}
        {plan.rules.length > 0 && (
          <div className="mt-7 pt-7 border-t-[0.5px] border-border-default grid grid-cols-3 gap-8">
            {plan.rules.map((rule, i) => (
              <div key={i}>
                <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                  Rule {String(i + 1).padStart(2, "0")}
                </div>
                <p className="text-[12px] text-ink-secondary mt-2 leading-[1.5]">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.main>
  );
}

function LegendDot({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}

function SessionPill({
  variant,
  children,
}: {
  variant: PillVariant;
  children: React.ReactNode;
}) {
  const styles: Record<PillVariant, React.CSSProperties> = {
    neutral: {
      background: "var(--session-pill-neutral-bg)",
      color: "var(--session-pill-neutral-fg)",
    },
    hard: {
      background: "var(--session-pill-hard-bg)",
      color: "var(--session-pill-hard-fg)",
    },
    long: {
      background: "var(--session-pill-long-bg)",
      color: "var(--session-pill-long-fg)",
    },
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider"
      style={styles[variant]}
    >
      {children}
    </span>
  );
}

function MealCard({
  slotLabel,
  meal,
}: {
  slotLabel: string;
  meal: PlannedMeal | undefined;
}) {
  return (
    <Card className="py-4 px-4">
      <CardLabel>{slotLabel}</CardLabel>
      {meal ? (
        <>
          <p className="text-[14px] text-ink mt-2 leading-[1.45]">{meal.food}</p>
          <div className="flex justify-end gap-3 mt-3 text-[12px] font-mono">
            <span style={{ color: "var(--macro-carbs)" }}>{meal.carbsG}</span>
            <span style={{ color: "var(--macro-protein)" }}>{meal.proteinG}</span>
          </div>
        </>
      ) : (
        <p className="text-ink-tertiary mt-2">—</p>
      )}
    </Card>
  );
}

function DayTotalRow({
  total,
}: {
  total: { day: Day; carbsG: number; proteinG: number; tag: DayTag } | undefined;
}) {
  if (!total) return null;
  return (
    <Card className="bg-surface-2 py-3 px-4">
      <div className="flex items-center justify-between">
        <CardLabel>Total</CardLabel>
        <div className="flex gap-4 text-body font-mono font-medium">
          <span style={{ color: "var(--macro-carbs)" }}>{total.carbsG}</span>
          <span style={{ color: "var(--macro-protein)" }}>{total.proteinG}</span>
        </div>
      </div>
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
