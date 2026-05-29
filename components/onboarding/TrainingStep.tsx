"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check } from "lucide-react";
import type {
  DaySession,
  SessionType,
  SubSession,
  TrainingWeek,
} from "@/lib/db";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SessionTag } from "@/components/shared/SessionTag";
import {
  TRAINING_PRESETS,
  SESSION_LABELS,
  SELECTABLE_SUB_SESSION_TYPES,
  newSubSession,
  reconcileDaySession,
  describeSub,
} from "@/lib/defaults";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

interface Props {
  value: TrainingWeek;
  onChange: (next: TrainingWeek) => void;
}

export function TrainingStep({ value, onChange }: Props) {
  function updateDay(idx: number, next: DaySession) {
    const sessions = value.sessions.map((s, i) => (i === idx ? next : s));
    onChange({ ...value, sessions });
  }

  function addSubSession(idx: number) {
    const day = value.sessions[idx];
    const existing = day.sessions ?? [];
    const defaultLabel =
      existing.length === 0
        ? undefined
        : existing.length === 1
          ? "PM"
          : undefined;
    let normalized = existing;
    if (existing.length === 1 && !existing[0].label) {
      normalized = [{ ...existing[0], label: "AM" }];
    }
    const nextSessions = [
      ...normalized,
      newSubSession({ label: defaultLabel, type: "easy" }),
    ];
    updateDay(idx, reconcileDaySession({ ...day, sessions: nextSessions }));
  }

  function updateSubSession(
    dayIdx: number,
    subId: string,
    patch: Partial<SubSession>,
  ) {
    const day = value.sessions[dayIdx];
    const sessions = (day.sessions ?? []).map((s) =>
      s.id === subId ? { ...s, ...patch } : s,
    );
    updateDay(dayIdx, reconcileDaySession({ ...day, sessions }));
  }

  function removeSubSession(dayIdx: number, subId: string) {
    const day = value.sessions[dayIdx];
    const sessions = (day.sessions ?? []).filter((s) => s.id !== subId);
    updateDay(dayIdx, reconcileDaySession({ ...day, sessions }));
  }

  function applyPreset(key: keyof typeof TRAINING_PRESETS) {
    onChange({ ...value, sessions: TRAINING_PRESETS[key] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          Quick presets
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => applyPreset("five_day_runner")}
        >
          5-day runner
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => applyPreset("marathon_block")}
        >
          Marathon block
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => applyPreset("rest_week")}
        >
          Rest week
        </Button>
      </div>

      <div className="space-y-3">
        {value.sessions.map((day, idx) => (
          <DayCard
            key={day.day}
            day={day}
            onAddSubSession={() => addSubSession(idx)}
            onUpdateSubSession={(subId, patch) =>
              updateSubSession(idx, subId, patch)
            }
            onRemoveSubSession={(subId) => removeSubSession(idx, subId)}
          />
        ))}
      </div>
    </div>
  );
}

function DayCard({
  day,
  onAddSubSession,
  onUpdateSubSession,
  onRemoveSubSession,
}: {
  day: DaySession;
  onAddSubSession: () => void;
  onUpdateSubSession: (subId: string, patch: Partial<SubSession>) => void;
  onRemoveSubSession: (subId: string) => void;
}) {
  const sessions = day.sessions ?? [];

  return (
    <div className="rounded-card border border-border bg-surface-1 p-4 md:p-5">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary w-8">
            {day.day}
          </span>
          <SessionTag type={day.type} />
          <span className="font-mono text-mono-sm text-ink-tertiary">
            {[
              day.distanceKm != null ? `${day.distanceKm} km` : null,
              day.durationMin != null ? `${day.durationMin} min` : null,
            ]
              .filter(Boolean)
              .join(" · ") || null}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddSubSession}
          aria-label="Add session"
          title="Add session"
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-button border border-border text-ink-secondary hover:text-accent hover:border-accent transition-colors duration-150"
        >
          <Plus size={14} />
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          Rest day · no sessions
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {sessions.map((s, i) => (
              <SubSessionRow
                key={s.id}
                session={s}
                index={i}
                totalSessions={sessions.length}
                onUpdate={(patch) => onUpdateSubSession(s.id, patch)}
                onRemove={() => onRemoveSubSession(s.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function SubSessionRow({
  session,
  index,
  totalSessions,
  onUpdate,
  onRemove,
}: {
  session: SubSession;
  index: number;
  totalSessions: number;
  onUpdate: (patch: Partial<SubSession>) => void;
  onRemove: () => void;
}) {
  // A session is "pristine" if the user hasn't entered any data yet —
  // we open it in edit mode automatically. Once they fill in a value
  // and click ✓, it collapses to a chip.
  const initialEditing =
    session.distanceKm == null && session.durationMin == null;
  const [isEditing, setIsEditing] = React.useState(initialEditing);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.16, ease: ease.out }}
      className={cn(index > 0 && "pt-2 border-t border-border-subtle")}
    >
      {isEditing ? (
        <EditForm
          session={session}
          totalSessions={totalSessions}
          index={index}
          onUpdate={onUpdate}
          onDone={() => setIsEditing(false)}
          onRemove={onRemove}
        />
      ) : (
        <DisplayRow
          session={session}
          onClick={() => setIsEditing(true)}
          onRemove={onRemove}
        />
      )}
    </motion.li>
  );
}

function DisplayRow({
  session,
  onClick,
  onRemove,
}: {
  session: SubSession;
  onClick: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={onClick}
        title="Click to edit"
        className={cn(
          "flex-1 text-left px-3.5 py-2.5 rounded-button",
          "bg-surface-2 border border-border text-ink",
          "hover:bg-surface-3 hover:border-border-strong",
          "transition-colors duration-150",
          "font-mono text-body-sm",
        )}
      >
        {describeSub(session)}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove session"
        title="Remove session"
        className={cn(
          "shrink-0 inline-flex items-center justify-center w-10 rounded-button",
          "border border-border text-ink-secondary",
          "hover:text-danger hover:border-danger/40 transition-colors duration-150",
        )}
      >
        <Minus size={14} />
      </button>
    </div>
  );
}

function EditForm({
  session,
  totalSessions,
  index,
  onUpdate,
  onDone,
  onRemove,
}: {
  session: SubSession;
  totalSessions: number;
  index: number;
  onUpdate: (patch: Partial<SubSession>) => void;
  onDone: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Row 1: AM/PM (compact) + Type (free-text + preset suggestions) */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="shrink-0">
          <Label dense>When</Label>
          <AmPmToggle
            value={session.label}
            onChange={(label) => onUpdate({ label })}
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <Label dense>Type</Label>
          <TypeInput
            session={session}
            onUpdate={onUpdate}
          />
        </div>
      </div>

      {/* Row 2: Distance + Time + action buttons */}
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <Label dense>Distance</Label>
          <NumberInput
            min={0}
            max={200}
            step={0.5}
            value={session.distanceKm}
            onChange={(n) => onUpdate({ distanceKm: n })}
            placeholder="10"
            suffix="km"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Label dense>Time</Label>
          <NumberInput
            min={0}
            max={600}
            step={5}
            value={session.durationMin}
            onChange={(n) => onUpdate({ durationMin: n })}
            placeholder="60"
            suffix="min"
          />
        </div>
        <button
          type="button"
          onClick={onDone}
          aria-label="Done"
          title="Done"
          className={cn(
            "shrink-0 h-12 w-12 inline-flex items-center justify-center rounded-button",
            "bg-accent text-ink-inverse",
            "hover:bg-accent-hover transition-colors duration-150",
          )}
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove session"
          title="Remove session"
          className={cn(
            "shrink-0 h-12 w-12 inline-flex items-center justify-center rounded-button",
            "border border-border text-ink-secondary",
            "hover:text-danger hover:border-danger/40 transition-colors duration-150",
          )}
        >
          <Minus size={16} />
        </button>
      </div>
    </div>
  );
}

function AmPmToggle({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (label: string | undefined) => void;
}) {
  const chip =
    "px-2.5 inline-flex items-center justify-center rounded-[5px] " +
    "font-mono text-mono-sm uppercase tracking-widest transition-colors duration-150";
  const active = "bg-accent text-ink-inverse";
  const inactive = "text-ink-secondary hover:text-ink";

  function pick(next: "AM" | "PM") {
    onChange(value === next ? undefined : next);
  }

  return (
    <div className="inline-flex h-9 items-stretch rounded-button border border-border bg-surface-2 p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => pick("AM")}
        aria-pressed={value === "AM"}
        className={cn(chip, value === "AM" ? active : inactive)}
      >
        AM
      </button>
      <button
        type="button"
        onClick={() => pick("PM")}
        aria-pressed={value === "PM"}
        className={cn(chip, value === "PM" ? active : inactive)}
      >
        PM
      </button>
    </div>
  );
}

/**
 * Free-text type input with a datalist of preset session types.
 * Typing an exact preset label sets the underlying SessionType (driving
 * the chip colour). Typing anything else stores it as customType and
 * defaults the underlying type to "cross" for fuelling intensity.
 */
function TypeInput({
  session,
  onUpdate,
}: {
  session: SubSession;
  onUpdate: (patch: Partial<SubSession>) => void;
}) {
  const presetByLabel = React.useMemo(() => {
    const m = new Map<string, SessionType>();
    for (const t of SELECTABLE_SUB_SESSION_TYPES) {
      m.set(SESSION_LABELS[t].toLowerCase(), t);
    }
    return m;
  }, []);

  const external = session.customType ?? SESSION_LABELS[session.type];
  const [draft, setDraft] = React.useState(external);
  const focusedRef = React.useRef(false);

  // Sync from external state only when the field isn't being edited.
  React.useEffect(() => {
    if (!focusedRef.current) setDraft(external);
  }, [external]);

  function commit() {
    const value = draft.trim();
    if (!value) {
      // Fall back to "Easy" rather than letting the field go blank.
      onUpdate({ type: "easy", customType: undefined });
      setDraft(SESSION_LABELS["easy"]);
      return;
    }
    const preset = presetByLabel.get(value.toLowerCase());
    if (preset) {
      onUpdate({ type: preset, customType: undefined });
      setDraft(SESSION_LABELS[preset]);
    } else {
      onUpdate({ type: "cross", customType: value });
    }
  }

  const listId = React.useId();

  return (
    <>
      <input
        list={listId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => {
          focusedRef.current = true;
          e.currentTarget.select();
        }}
        onBlur={() => {
          focusedRef.current = false;
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="Easy, intervals, gym…"
        autoComplete="off"
        className={cn(
          "w-full h-9 bg-surface-2 text-ink placeholder:text-ink-tertiary",
          "border border-border rounded-button px-3 py-1.5",
          "text-body-sm focus:border-accent",
        )}
      />
      <datalist id={listId}>
        {SELECTABLE_SUB_SESSION_TYPES.map((t) => (
          <option key={t} value={SESSION_LABELS[t]} />
        ))}
      </datalist>
    </>
  );
}
