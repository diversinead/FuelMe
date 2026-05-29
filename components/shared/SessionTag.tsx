import type { SessionType } from "@/lib/db";
import { cn } from "@/lib/utils";

const VARIANT: Record<SessionType, "easy" | "hard" | "long" | "rest"> = {
  rest: "rest",
  easy: "easy",
  easy_double: "easy",
  intervals: "hard",
  threshold: "hard",
  tempo: "hard",
  long: "long",
  race: "hard",
  cross: "easy",
};

const LABEL: Record<SessionType, string> = {
  rest: "Rest",
  easy: "Easy",
  easy_double: "Easy Double",
  intervals: "Intervals",
  threshold: "Threshold",
  tempo: "Tempo",
  long: "Long Run",
  race: "Race",
  cross: "Cross",
};

/**
 * Coloured pill summarising one session. When `customLabel` is set
 * (e.g. "Gym", "Pilates", a free-text customType from SubSession),
 * the tag renders in the orange `custom` variant with the supplied
 * text instead of the preset label. Otherwise it picks colour + label
 * from the underlying SessionType.
 */
export function SessionTag({
  type,
  customLabel,
  className,
}: {
  type: SessionType;
  customLabel?: string;
  className?: string;
}) {
  const label = customLabel?.trim();
  if (label) {
    return (
      <span className={cn("session-tag custom", className)}>{label}</span>
    );
  }
  return (
    <span className={cn("session-tag", VARIANT[type], className)}>
      {LABEL[type]}
    </span>
  );
}
