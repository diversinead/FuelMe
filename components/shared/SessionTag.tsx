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

export function SessionTag({
  type,
  className,
}: {
  type: SessionType;
  className?: string;
}) {
  return (
    <span className={cn("session-tag", VARIANT[type], className)}>
      {LABEL[type]}
    </span>
  );
}
