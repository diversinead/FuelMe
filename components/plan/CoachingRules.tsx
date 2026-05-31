import { criteriaForIds } from "@/lib/coachingCriteria";
import { cn } from "@/lib/utils";

/**
 * Coaching rules footer on the plan view. Renders one quiet block per
 * applied criterion (label + rule text), in the same stripped-back aesthetic
 * as the old Rule 01/02/03 footer — no card, no background.
 *
 * Renders nothing when no criteria are applied (undefined/empty), or when
 * none of the stored ids match the current COACHING_CRITERIA list.
 */
export function CoachingRules({ criteriaIds }: { criteriaIds?: string[] }) {
  const criteria = criteriaForIds(criteriaIds);
  if (criteria.length === 0) return null;

  const cols =
    criteria.length >= 3
      ? "md:grid-cols-3"
      : criteria.length === 2
        ? "md:grid-cols-2"
        : "grid-cols-1";

  return (
    <section className="mt-7 pt-7 border-t-[0.5px] border-border-default">
      <h2 className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary mb-4">
        Coaching rules
      </h2>
      <div className={cn("grid grid-cols-1 gap-8", cols)}>
        {criteria.map((c) => (
          <div key={c.id}>
            <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
              {c.label}
            </div>
            <p className="text-[12px] text-ink-secondary mt-2 leading-[1.5]">
              {c.rule}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
