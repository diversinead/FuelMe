"use client";

import { TrainingWeekEditor } from "@/components/training/TrainingWeekEditor";
import { weekIdFor, nextWeekId } from "@/lib/date";

/**
 * Plan next week's training. Renders the editor for next Monday's week,
 * seeded from this week's sessions when no record exists yet. Distinct from
 * the fuelling "Plan next week" chooser (SPEC §4.7) — this only sets up the
 * training; the plan is generated separately.
 */
export default function PlanNextTrainingPage() {
  const currentWeekId = weekIdFor();
  const nextWid = nextWeekId(currentWeekId);
  return (
    <TrainingWeekEditor weekId={nextWid} seedFromWeekId={currentWeekId} />
  );
}
