"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getDb, type TrainingWeek } from "@/lib/db";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionTag } from "@/components/shared/SessionTag";
import { LoadingState } from "@/components/shared/states";
import { TrainingStep } from "@/components/onboarding/TrainingStep";
import { cloneWeekSessions, emptyWeekSessions } from "@/lib/defaults";
import { weekIdFor, formatWeekRange } from "@/lib/date";
import { ease } from "@/lib/motion";

/**
 * Edit (or, for past weeks, view) a single TrainingWeek. The week is fixed by
 * `weekId` — its date is shown read-only, never editable (fixes the
 * tasks/TrainingPage.md confusion where one form was hard-wired to the
 * current date). When the target week has no record yet and `seedFromWeekId`
 * is supplied, the editor pre-populates from that week's sessions (cloned with
 * fresh ids) as a starting point — only persisted on Save.
 */
export function TrainingWeekEditor({
  weekId,
  seedFromWeekId,
}: {
  weekId: string;
  seedFromWeekId?: string;
}) {
  const router = useRouter();
  // Past weeks are read-only ("view only — no edit", per the brief).
  const editable = weekId >= weekIdFor();

  const data = useLiveQuery(async () => {
    const db = getDb();
    return {
      target: await db.trainingWeeks.get(weekId),
      seed: seedFromWeekId
        ? await db.trainingWeeks.get(seedFromWeekId)
        : undefined,
    };
  }, [weekId, seedFromWeekId]);

  const [trainingWeek, setTrainingWeek] = React.useState<TrainingWeek | null>(
    null,
  );
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (!data || trainingWeek) return;
    if (data.target) {
      setTrainingWeek(data.target);
      return;
    }
    const sessions = data.seed
      ? cloneWeekSessions(data.seed.sessions)
      : emptyWeekSessions;
    setTrainingWeek({ id: weekId, weekStart: weekId, sessions });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!data || !trainingWeek) return <LoadingState />;

  async function save() {
    if (!trainingWeek) return;
    setSaving(true);
    try {
      await getDb().trainingWeeks.put(trainingWeek);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  // Persist the current sessions before heading to the plan, so the plan view
  // (and any inline generation) sees the latest training — no need to detour
  // back through the dashboard (tasks/TrainingPage.md follow-up).
  async function saveAndGoToPlan() {
    await save();
    router.push(`/plan/${weekId}`);
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ease.out }}
      className="app-container py-8 md:py-12 max-w-3xl"
    >
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-ink"
      >
        <ArrowLeft size={12} /> Dashboard
      </Link>

      <header className="mt-6 mb-8">
        <CardLabel>{editable ? "Training week" : "Past week — view only"}</CardLabel>
        <h1 className="font-display text-display-lg text-ink mt-1 leading-none">
          {formatWeekRange(weekId)}
        </h1>
        <p className="text-body-sm text-ink-tertiary mt-2">
          {editable
            ? "Add, edit, or remove sessions. The week itself is fixed — changes save when you hit “Save changes”."
            : "This week has passed. Sessions are shown for reference and can’t be edited."}
        </p>
      </header>

      {editable ? (
        <>
          <Card>
            <TrainingStep value={trainingWeek} onChange={setTrainingWeek} />
          </Card>
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              variant="secondary"
              onClick={saveAndGoToPlan}
              disabled={saving}
            >
              Save &amp; fuelling plan <ArrowUpRight size={16} />
            </Button>
            {savedAt && (
              <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                Saved {savedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </>
      ) : (
        <ReadOnlyWeek trainingWeek={trainingWeek} weekId={weekId} />
      )}
    </motion.main>
  );
}

function ReadOnlyWeek({
  trainingWeek,
  weekId,
}: {
  trainingWeek: TrainingWeek;
  weekId: string;
}) {
  return (
    <Card className="p-0 md:p-0 overflow-hidden">
      <ul>
        {trainingWeek.sessions.map((day, i) => {
          const subs = day.sessions ?? [];
          return (
            <li
              key={day.day}
              className={
                "flex items-start justify-between gap-4 px-5 py-3.5" +
                (i > 0 ? " border-t border-border-subtle" : "")
              }
            >
              <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary pt-1 w-10 shrink-0">
                {day.day}
              </span>
              {subs.length === 0 ? (
                <span className="flex-1">
                  <SessionTag type="rest" />
                </span>
              ) : (
                <div className="flex flex-1 flex-wrap items-center gap-1.5">
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
            </li>
          );
        })}
      </ul>
      <div className="px-5 py-3.5 border-t border-border-subtle">
        <Link
          href={`/plan/${weekId}`}
          className="font-mono text-mono-sm uppercase tracking-widest text-accent hover:text-accent-hover inline-flex items-center gap-1"
        >
          View this week’s plan <ArrowUpRight size={12} />
        </Link>
      </div>
    </Card>
  );
}
