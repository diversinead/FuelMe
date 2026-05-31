"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import type {
  NutritionRulesConfig,
  RuleSection,
  CarbAmount,
} from "@/lib/nutritionRulesSchema";
import {
  NumField,
  RangeField,
  TextField,
  StringList,
  Collapsible,
  FieldGroup,
  FieldLabel,
} from "./fields";

type Cfg = NutritionRulesConfig;

// Section labels for the nav + headings.
export const SECTION_LABELS: Record<RuleSection, string> = {
  corePrinciples: "Core principles",
  carbPeriodisation: "Carbs",
  protein: "Protein",
  hydration: "Hydration",
  timing: "Timing",
  sportOverlays: "Sport overlays",
  femaleAthlete: "Female athlete",
  dietaryPatterns: "Dietary patterns",
  raceDay: "Race day",
  specialSituations: "Special situations",
  hardConstraints: "Hard constraints",
  formattingRules: "Formatting",
};

// --- small helpers ----------------------------------------------------------

function RemoveRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-button border border-border text-ink-secondary hover:text-danger hover:border-danger/40 transition-colors"
    >
      <X size={14} />
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-body-sm text-accent hover:text-accent-hover"
    >
      <Plus size={14} /> {label}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface-1 p-4 space-y-3">
      {children}
    </div>
  );
}

// --- per-section editors ----------------------------------------------------

function CorePrinciplesEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return <StringList label="Principles" items={value} onChange={onChange} textarea />;
}

function HardConstraintsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return <StringList label="Constraints" items={value} onChange={onChange} textarea />;
}

function CarbsEditor({ value, onChange }: { value: Cfg["carbPeriodisation"]; onChange: (v: Cfg["carbPeriodisation"]) => void }) {
  const d = value.withinDayDistribution;
  const setDist = (k: keyof typeof d, v: [number, number]) =>
    onChange({ ...value, withinDayDistribution: { ...d, [k]: v } });
  return (
    <div className="space-y-6">
      <FieldGroup title="Day types (g/kg multiplier)">
        {value.dayTypes.map((dt, i) => (
          <Card key={dt.id}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-mono-sm uppercase tracking-widest text-ink">{dt.id}</span>
              <RemoveRow onClick={() => onChange({ ...value, dayTypes: value.dayTypes.filter((_, j) => j !== i) })} />
            </div>
            <TextField label="Label" value={dt.label} onChange={(label) => onChange({ ...value, dayTypes: value.dayTypes.map((x, j) => (j === i ? { ...x, label } : x)) })} />
            <TextField label="Description" value={dt.description} onChange={(description) => onChange({ ...value, dayTypes: value.dayTypes.map((x, j) => (j === i ? { ...x, description } : x)) })} />
            <RangeField label="Multiplier" value={[dt.multiplierMin, dt.multiplierMax]} onChange={([min, max]) => onChange({ ...value, dayTypes: value.dayTypes.map((x, j) => (j === i ? { ...x, multiplierMin: min, multiplierMax: max } : x)) })} />
          </Card>
        ))}
      </FieldGroup>

      <FieldGroup title="Rules">
        <RangeField label="Preload carbs (× W)" value={[value.preloadCarbsMin, value.preloadCarbsMax]} onChange={([min, max]) => onChange({ ...value, preloadCarbsMin: min, preloadCarbsMax: max })} />
        <NumField label="Minimum-variance multiplier (× W)" value={value.minimumVarianceMultiplier} onChange={(minimumVarianceMultiplier) => onChange({ ...value, minimumVarianceMultiplier })} />
      </FieldGroup>

      <FieldGroup title="Within-day distribution (% of daily carbs)">
        <RangeField label="Breakfast" value={d.breakfastPct} onChange={(v) => setDist("breakfastPct", v)} />
        <RangeField label="Post-AM refuel" value={d.postAmRefuelPct} onChange={(v) => setDist("postAmRefuelPct", v)} />
        <RangeField label="Lunch" value={d.lunchPct} onChange={(v) => setDist("lunchPct", v)} />
        <RangeField label="Afternoon" value={d.afternoonPct} onChange={(v) => setDist("afternoonPct", v)} />
        <RangeField label="Dinner" value={d.dinnerPct} onChange={(v) => setDist("dinnerPct", v)} />
        <RangeField label="Pre-bed" value={d.preBedPct} onChange={(v) => setDist("preBedPct", v)} />
      </FieldGroup>
    </div>
  );
}

function ProteinEditor({ value, onChange }: { value: Cfg["protein"]; onChange: (v: Cfg["protein"]) => void }) {
  return (
    <div className="space-y-6">
      <FieldGroup title="Profiles (g/kg)">
        {value.profiles.map((p, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between gap-2">
              <TextField label="Label" value={p.label} onChange={(label) => onChange({ ...value, profiles: value.profiles.map((x, j) => (j === i ? { ...x, label } : x)) })} />
              <div className="mt-5"><RemoveRow onClick={() => onChange({ ...value, profiles: value.profiles.filter((_, j) => j !== i) })} /></div>
            </div>
            <TextField label="Id" value={p.id} onChange={(id) => onChange({ ...value, profiles: value.profiles.map((x, j) => (j === i ? { ...x, id } : x)) })} />
            <RangeField label="Multiplier" value={[p.multiplierMin, p.multiplierMax]} onChange={([min, max]) => onChange({ ...value, profiles: value.profiles.map((x, j) => (j === i ? { ...x, multiplierMin: min, multiplierMax: max } : x)) })} />
          </Card>
        ))}
        <AddButton label="Add profile" onClick={() => onChange({ ...value, profiles: [...value.profiles, { id: "new_profile", label: "New profile", multiplierMin: 1.6, multiplierMax: 1.8 }] })} />
      </FieldGroup>
      <FieldGroup title="Modifiers & dosing (× W)">
        <RangeField label="Masters addition (g/kg)" value={value.mastersAddition} onChange={(v) => onChange({ ...value, mastersAddition: v })} />
        <RangeField label="Luteal addition (g/kg)" value={value.lutealAddition} onChange={(v) => onChange({ ...value, lutealAddition: v })} />
        <RangeField label="Per-meal multiplier" value={[value.perMealMultiplierMin, value.perMealMultiplierMax]} onChange={([min, max]) => onChange({ ...value, perMealMultiplierMin: min, perMealMultiplierMax: max })} />
        <NumField label="Post-session multiplier" value={value.postSessionMultiplier} onChange={(postSessionMultiplier) => onChange({ ...value, postSessionMultiplier })} />
        <RangeField label="Pre-bed multiplier" value={[value.preBedMultiplierMin, value.preBedMultiplierMax]} onChange={([min, max]) => onChange({ ...value, preBedMultiplierMin: min, preBedMultiplierMax: max })} />
      </FieldGroup>
    </div>
  );
}

function HydrationEditor({ value, onChange }: { value: Cfg["hydration"]; onChange: (v: Cfg["hydration"]) => void }) {
  const set = (k: keyof Cfg["hydration"], n: number) => onChange({ ...value, [k]: n });
  return (
    <div className="space-y-3">
      <RangeField label="Baseline (ml/kg/day)" value={[value.baselineMlPerKgMin, value.baselineMlPerKgMax]} onChange={([a, b]) => onChange({ ...value, baselineMlPerKgMin: a, baselineMlPerKgMax: b })} />
      <RangeField label="During training (ml/hr)" value={[value.duringTrainingMlPerHrMin, value.duringTrainingMlPerHrMax]} onChange={([a, b]) => onChange({ ...value, duringTrainingMlPerHrMin: a, duringTrainingMlPerHrMax: b })} />
      <NumField label="Electrolyte threshold (min)" value={value.electrolyteThresholdMin} onChange={(n) => set("electrolyteThresholdMin", n)} />
      <RangeField label="Sodium (mg/litre)" value={[value.sodiumMgPerLitreMin, value.sodiumMgPerLitreMax]} onChange={([a, b]) => onChange({ ...value, sodiumMgPerLitreMin: a, sodiumMgPerLitreMax: b })} />
    </div>
  );
}

function CarbAmountEditor({ value, onChange }: { value: CarbAmount; onChange: (v: CarbAmount) => void }) {
  return (
    <div>
      <FieldLabel>Carbs</FieldLabel>
      <div className="flex items-center gap-2">
        <select
          value={value.type}
          onChange={(e) =>
            onChange(
              e.target.value === "absolute"
                ? { type: "absolute", min: value.min, max: value.max, unit: "g" }
                : { type: "multiplier", min: value.min, max: value.max },
            )
          }
          className="bg-surface-2 border border-border rounded-button px-2 py-2 text-body-sm text-ink"
        >
          <option value="multiplier">× W (g/kg)</option>
          <option value="absolute">absolute (g)</option>
        </select>
        <input type="number" step="any" value={value.min} onChange={(e) => onChange({ ...value, min: Number(e.target.value) })} aria-label="carbs min" className="w-full bg-surface-2 border border-border rounded-button px-3 py-2 text-body-sm text-ink" />
        <span className="text-ink-tertiary text-body-sm">to</span>
        <input type="number" step="any" value={value.max} onChange={(e) => onChange({ ...value, max: Number(e.target.value) })} aria-label="carbs max" className="w-full bg-surface-2 border border-border rounded-button px-3 py-2 text-body-sm text-ink" />
      </div>
    </div>
  );
}

function TimingEditor({ value, onChange }: { value: Cfg["timing"]; onChange: (v: Cfg["timing"]) => void }) {
  const ps = value.preSession;
  const ds = value.duringSession;
  return (
    <div className="space-y-6">
      <FieldGroup title="Pre-session">
        {ps.map((s, i) => (
          <Card key={i}>
            <div className="flex justify-end"><RemoveRow onClick={() => onChange({ ...value, preSession: ps.filter((_, j) => j !== i) })} /></div>
            <RangeField label="Hours before" value={[s.hoursBeforeMin, s.hoursBeforeMax]} onChange={([a, b]) => onChange({ ...value, preSession: ps.map((x, j) => (j === i ? { ...x, hoursBeforeMin: a, hoursBeforeMax: b } : x)) })} />
            <CarbAmountEditor value={s.carbs} onChange={(carbs) => onChange({ ...value, preSession: ps.map((x, j) => (j === i ? { ...x, carbs } : x)) })} />
            <TextField label="Notes" value={s.notes} onChange={(notes) => onChange({ ...value, preSession: ps.map((x, j) => (j === i ? { ...x, notes } : x)) })} />
          </Card>
        ))}
        <AddButton label="Add pre-session row" onClick={() => onChange({ ...value, preSession: [...ps, { hoursBeforeMin: 0, hoursBeforeMax: 1, carbs: { type: "multiplier", min: 1, max: 2 }, notes: "" }] })} />
      </FieldGroup>

      <FieldGroup title="During session (g/hr)">
        {ds.map((s, i) => (
          <Card key={i}>
            <div className="flex items-center gap-2">
              <NumField label="Duration min" value={s.durationMin} onChange={(n) => onChange({ ...value, duringSession: ds.map((x, j) => (j === i ? { ...x, durationMin: n } : x)) })} />
              <NumField label="Duration max (0 = open)" value={s.durationMax ?? 0} onChange={(n) => onChange({ ...value, duringSession: ds.map((x, j) => (j === i ? { ...x, durationMax: n === 0 ? null : n } : x)) })} />
              <div className="mt-5"><RemoveRow onClick={() => onChange({ ...value, duringSession: ds.filter((_, j) => j !== i) })} /></div>
            </div>
            <RangeField label="Carbs per hour" value={[s.carbsPerHourMin, s.carbsPerHourMax]} onChange={([a, b]) => onChange({ ...value, duringSession: ds.map((x, j) => (j === i ? { ...x, carbsPerHourMin: a, carbsPerHourMax: b } : x)) })} />
          </Card>
        ))}
        <AddButton label="Add during-session row" onClick={() => onChange({ ...value, duringSession: [...ds, { durationMin: 0, durationMax: null, carbsPerHourMin: 0, carbsPerHourMax: 0 }] })} />
      </FieldGroup>

      <FieldGroup title="Post-session window">
        <NumField label="Window (minutes)" value={value.postSession.windowMinutes} onChange={(n) => onChange({ ...value, postSession: { ...value.postSession, windowMinutes: n } })} />
        <RangeField label="Carbs multiplier (× W)" value={[value.postSession.carbsMultiplierMin, value.postSession.carbsMultiplierMax]} onChange={([a, b]) => onChange({ ...value, postSession: { ...value.postSession, carbsMultiplierMin: a, carbsMultiplierMax: b } })} />
        <NumField label="Protein multiplier (× W)" value={value.postSession.proteinMultiplier} onChange={(n) => onChange({ ...value, postSession: { ...value.postSession, proteinMultiplier: n } })} />
        <RangeField label="Fluid (ml)" value={[value.postSession.fluidMlMin, value.postSession.fluidMlMax]} onChange={([a, b]) => onChange({ ...value, postSession: { ...value.postSession, fluidMlMin: a, fluidMlMax: b } })} />
      </FieldGroup>
    </div>
  );
}

function SportOverlaysEditor({ value, onChange }: { value: Cfg["sportOverlays"]; onChange: (v: Cfg["sportOverlays"]) => void }) {
  const [newKey, setNewKey] = React.useState("");
  return (
    <div className="space-y-4">
      {Object.entries(value).map(([key, o]) => (
        <Collapsible key={key} title={o.label || key}>
          <div className="flex justify-end">
            <RemoveRow onClick={() => { const n = { ...value }; delete n[key]; onChange(n); }} />
          </div>
          <TextField label="Label" value={o.label} onChange={(label) => onChange({ ...value, [key]: { ...o, label } })} />
          <StringList label="Rules" items={o.rules} onChange={(rules) => onChange({ ...value, [key]: { ...o, rules } })} textarea />
        </Collapsible>
      ))}
      <div className="flex items-end gap-2">
        <TextField label="New sport key" value={newKey} onChange={setNewKey} />
        <button type="button" disabled={!newKey.trim() || !!value[newKey.trim()]} onClick={() => { onChange({ ...value, [newKey.trim()]: { label: newKey.trim(), rules: [] } }); setNewKey(""); }} className="shrink-0 inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-body-sm text-accent disabled:opacity-40">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

function DietaryPatternsEditor({ value, onChange }: { value: Cfg["dietaryPatterns"]; onChange: (v: Cfg["dietaryPatterns"]) => void }) {
  const [newKey, setNewKey] = React.useState("");
  return (
    <div className="space-y-4">
      {Object.entries(value).map(([key, p]) => (
        <Collapsible key={key} title={p.label || key}>
          <div className="flex justify-end">
            <RemoveRow onClick={() => { const n = { ...value }; delete n[key]; onChange(n); }} />
          </div>
          <TextField label="Label" value={p.label} onChange={(label) => onChange({ ...value, [key]: { ...p, label } })} />
          <StringList label="Allowed foods" items={p.allowedFoods ?? []} onChange={(allowedFoods) => onChange({ ...value, [key]: { ...p, allowedFoods } })} />
          <StringList label="Avoid foods" items={p.avoidFoods} onChange={(avoidFoods) => onChange({ ...value, [key]: { ...p, avoidFoods } })} />
          <StringList label="Special notes" items={p.specialNotes} onChange={(specialNotes) => onChange({ ...value, [key]: { ...p, specialNotes } })} textarea />
        </Collapsible>
      ))}
      <div className="flex items-end gap-2">
        <TextField label="New pattern key" value={newKey} onChange={setNewKey} />
        <button type="button" disabled={!newKey.trim() || !!value[newKey.trim()]} onClick={() => { onChange({ ...value, [newKey.trim()]: { label: newKey.trim(), avoidFoods: [], specialNotes: [] } }); setNewKey(""); }} className="shrink-0 inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-body-sm text-accent disabled:opacity-40">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

function SpecialSituationsEditor({ value, onChange }: { value: Cfg["specialSituations"]; onChange: (v: Cfg["specialSituations"]) => void }) {
  const [newKey, setNewKey] = React.useState("");
  return (
    <div className="space-y-4">
      {Object.entries(value).map(([key, s]) => (
        <Collapsible key={key} title={s.label || key}>
          <div className="flex justify-end">
            <RemoveRow onClick={() => { const n = { ...value }; delete n[key]; onChange(n); }} />
          </div>
          <TextField label="Label" value={s.label} onChange={(label) => onChange({ ...value, [key]: { ...s, label } })} />
          <StringList label="Notes" items={s.notes} onChange={(notes) => onChange({ ...value, [key]: { ...s, notes } })} textarea />
        </Collapsible>
      ))}
      <div className="flex items-end gap-2">
        <TextField label="New situation key" value={newKey} onChange={setNewKey} />
        <button type="button" disabled={!newKey.trim() || !!value[newKey.trim()]} onClick={() => { onChange({ ...value, [newKey.trim()]: { label: newKey.trim(), notes: [] } }); setNewKey(""); }} className="shrink-0 inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-body-sm text-accent disabled:opacity-40">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

function FemaleAthleteEditor({ value, onChange }: { value: Cfg["femaleAthlete"]; onChange: (v: Cfg["femaleAthlete"]) => void }) {
  const fa = value;
  return (
    <div className="space-y-6">
      <FieldGroup title="Follicular phase">
        <StringList label="Notes" items={fa.follicularPhase.notes} onChange={(notes) => onChange({ ...fa, follicularPhase: { notes } })} textarea />
      </FieldGroup>
      <FieldGroup title="Luteal phase">
        <RangeField label="Carbs increase (%)" value={fa.lutealPhase.carbsIncreasePct} onChange={(carbsIncreasePct) => onChange({ ...fa, lutealPhase: { ...fa.lutealPhase, carbsIncreasePct } })} />
        <RangeField label="Protein addition (g/kg)" value={fa.lutealPhase.proteinAdditionGPerKg} onChange={(proteinAdditionGPerKg) => onChange({ ...fa, lutealPhase: { ...fa.lutealPhase, proteinAdditionGPerKg } })} />
        <StringList label="Notes" items={fa.lutealPhase.notes} onChange={(notes) => onChange({ ...fa, lutealPhase: { ...fa.lutealPhase, notes } })} textarea />
      </FieldGroup>
      <FieldGroup title="Menstruation">
        <StringList label="Notes" items={fa.menstruation.notes} onChange={(notes) => onChange({ ...fa, menstruation: { notes } })} textarea />
      </FieldGroup>
      <FieldGroup title="Iron & thresholds">
        <NumField label="LEA threshold (kcal/kg FFM)" value={fa.leaThresholdKcalPerKgFfm} onChange={(leaThresholdKcalPerKgFfm) => onChange({ ...fa, leaThresholdKcalPerKgFfm })} />
        <StringList label="Iron foods" items={fa.ironFocus.foods} onChange={(foods) => onChange({ ...fa, ironFocus: { ...fa.ironFocus, foods } })} />
        <StringList label="Iron pairings" items={fa.ironFocus.pairings} onChange={(pairings) => onChange({ ...fa, ironFocus: { ...fa.ironFocus, pairings } })} />
        <StringList label="Avoid within 1 hr" items={fa.ironFocus.avoidWithin1Hr} onChange={(avoidWithin1Hr) => onChange({ ...fa, ironFocus: { ...fa.ironFocus, avoidWithin1Hr } })} />
      </FieldGroup>
      <FieldGroup title="Bone health">
        <RangeField label="Calcium (mg/day)" value={[fa.boneHealth.calciumMgPerDayMin, fa.boneHealth.calciumMgPerDayMax]} onChange={([a, b]) => onChange({ ...fa, boneHealth: { ...fa.boneHealth, calciumMgPerDayMin: a, calciumMgPerDayMax: b } })} />
        <RangeField label="Vitamin D (IU)" value={[fa.boneHealth.vitDIuMin, fa.boneHealth.vitDIuMax]} onChange={([a, b]) => onChange({ ...fa, boneHealth: { ...fa.boneHealth, vitDIuMin: a, vitDIuMax: b } })} />
      </FieldGroup>
    </div>
  );
}

function RaceDayEditor({ value, onChange }: { value: Cfg["raceDay"]; onChange: (v: Cfg["raceDay"]) => void }) {
  const dr = value.duringRace;
  return (
    <div className="space-y-6">
      <FieldGroup title="Carb loading">
        <RangeField label="Days out" value={value.carbLoadingDaysOut} onChange={(carbLoadingDaysOut) => onChange({ ...value, carbLoadingDaysOut })} />
        <RangeField label="Multiplier (g/kg)" value={[value.carbLoadingMultiplierMin, value.carbLoadingMultiplierMax]} onChange={([a, b]) => onChange({ ...value, carbLoadingMultiplierMin: a, carbLoadingMultiplierMax: b })} />
        <RangeField label="Race morning (hours out)" value={value.raceMorningHoursOut} onChange={(raceMorningHoursOut) => onChange({ ...value, raceMorningHoursOut })} />
      </FieldGroup>
      <FieldGroup title="During race (g/hr)">
        {dr.map((s, i) => (
          <Card key={i}>
            <div className="flex items-center gap-2">
              <NumField label="Duration min" value={s.durationMin} onChange={(n) => onChange({ ...value, duringRace: dr.map((x, j) => (j === i ? { ...x, durationMin: n } : x)) })} />
              <NumField label="Duration max (0 = open)" value={s.durationMax ?? 0} onChange={(n) => onChange({ ...value, duringRace: dr.map((x, j) => (j === i ? { ...x, durationMax: n === 0 ? null : n } : x)) })} />
              <div className="mt-5"><RemoveRow onClick={() => onChange({ ...value, duringRace: dr.filter((_, j) => j !== i) })} /></div>
            </div>
            <RangeField label="Carbs per hour" value={[s.carbsPerHourMin, s.carbsPerHourMax]} onChange={([a, b]) => onChange({ ...value, duringRace: dr.map((x, j) => (j === i ? { ...x, carbsPerHourMin: a, carbsPerHourMax: b } : x)) })} />
            <TextField label="Notes" value={s.notes} onChange={(notes) => onChange({ ...value, duringRace: dr.map((x, j) => (j === i ? { ...x, notes } : x)) })} />
          </Card>
        ))}
        <AddButton label="Add race row" onClick={() => onChange({ ...value, duringRace: [...dr, { durationMin: 0, durationMax: null, carbsPerHourMin: 0, carbsPerHourMax: 0, notes: "" }] })} />
      </FieldGroup>
    </div>
  );
}

function FormattingEditor({ value, onChange }: { value: Cfg["formattingRules"]; onChange: (v: Cfg["formattingRules"]) => void }) {
  const ex = value.examples;
  return (
    <div className="space-y-4">
      <TextField label="Ingredient separator" value={value.ingredientSeparator} onChange={(ingredientSeparator) => onChange({ ...value, ingredientSeparator })} />
      <TextField label="Quantity format" value={value.quantityFormat} onChange={(quantityFormat) => onChange({ ...value, quantityFormat })} />
      <TextField label="Substitution format" value={value.substitutionFormat} onChange={(substitutionFormat) => onChange({ ...value, substitutionFormat })} />
      <TextField label="Case style" value={value.caseStyle} onChange={(caseStyle) => onChange({ ...value, caseStyle })} />
      <NumField label="Max food string length" value={value.maxFoodStringLength} onChange={(maxFoodStringLength) => onChange({ ...value, maxFoodStringLength })} />
      <FieldGroup title="Examples">
        {ex.map((e, i) => (
          <div key={i} className="flex items-end gap-2">
            <TextField label="Slot" value={e.slot} onChange={(slot) => onChange({ ...value, examples: ex.map((x, j) => (j === i ? { ...x, slot } : x)) })} />
            <TextField label="Example" value={e.example} onChange={(example) => onChange({ ...value, examples: ex.map((x, j) => (j === i ? { ...x, example } : x)) })} />
            <div className="mb-0.5"><RemoveRow onClick={() => onChange({ ...value, examples: ex.filter((_, j) => j !== i) })} /></div>
          </div>
        ))}
        <AddButton label="Add example" onClick={() => onChange({ ...value, examples: [...ex, { slot: "", example: "" }] })} />
      </FieldGroup>
    </div>
  );
}

// --- dispatcher -------------------------------------------------------------

export function SectionEditor({
  section,
  value,
  onChange,
}: {
  section: RuleSection;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const oc = onChange as (v: unknown) => void;
  switch (section) {
    case "corePrinciples":
      return <CorePrinciplesEditor value={value as string[]} onChange={oc as (v: string[]) => void} />;
    case "hardConstraints":
      return <HardConstraintsEditor value={value as string[]} onChange={oc as (v: string[]) => void} />;
    case "carbPeriodisation":
      return <CarbsEditor value={value as Cfg["carbPeriodisation"]} onChange={oc as (v: Cfg["carbPeriodisation"]) => void} />;
    case "protein":
      return <ProteinEditor value={value as Cfg["protein"]} onChange={oc as (v: Cfg["protein"]) => void} />;
    case "hydration":
      return <HydrationEditor value={value as Cfg["hydration"]} onChange={oc as (v: Cfg["hydration"]) => void} />;
    case "timing":
      return <TimingEditor value={value as Cfg["timing"]} onChange={oc as (v: Cfg["timing"]) => void} />;
    case "sportOverlays":
      return <SportOverlaysEditor value={value as Cfg["sportOverlays"]} onChange={oc as (v: Cfg["sportOverlays"]) => void} />;
    case "femaleAthlete":
      return <FemaleAthleteEditor value={value as Cfg["femaleAthlete"]} onChange={oc as (v: Cfg["femaleAthlete"]) => void} />;
    case "dietaryPatterns":
      return <DietaryPatternsEditor value={value as Cfg["dietaryPatterns"]} onChange={oc as (v: Cfg["dietaryPatterns"]) => void} />;
    case "raceDay":
      return <RaceDayEditor value={value as Cfg["raceDay"]} onChange={oc as (v: Cfg["raceDay"]) => void} />;
    case "specialSituations":
      return <SpecialSituationsEditor value={value as Cfg["specialSituations"]} onChange={oc as (v: Cfg["specialSituations"]) => void} />;
    case "formattingRules":
      return <FormattingEditor value={value as Cfg["formattingRules"]} onChange={oc as (v: Cfg["formattingRules"]) => void} />;
    default:
      return null;
  }
}
