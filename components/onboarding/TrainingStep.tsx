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
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
      {/* Row 1: Label + Type */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 sm:col-span-4">
          <Label dense>Label</Label>
          <Input
            value={session.label ?? ""}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder={
              totalSessions > 1 ? (index === 0 ? "AM" : "PM") : "Optional"
            }
          />
        </div>
        <div className="col-span-12 sm:col-span-8">
          <Label dense>Type</Label>
          <Select
            value={session.type}
            onChange={(e) =>
              onUpdate({ type: e.target.value as SessionType })
            }
          >
            {SELECTABLE_SUB_SESSION_TYPES.map((t) => (
              <option key={t} value={t}>
                {SESSION_LABELS[t]}
              </option>
            ))}
          </Select>
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
            hideSteppers
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
            hideSteppers
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
