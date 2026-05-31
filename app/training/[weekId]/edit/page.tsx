"use client";

import { TrainingWeekEditor } from "@/components/training/TrainingWeekEditor";

export default function TrainingEditPage({
  params,
}: {
  params: { weekId: string };
}) {
  return <TrainingWeekEditor weekId={params.weekId} />;
}
