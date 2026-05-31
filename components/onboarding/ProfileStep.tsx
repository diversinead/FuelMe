"use client";

import * as React from "react";
import type { Profile } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  value: Profile;
  onChange: (next: Profile) => void;
}

export function ProfileStep({ value, onChange }: Props) {
  function set<K extends keyof Profile>(key: K, v: Profile[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            value={value.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Sinead"
          />
        </div>
        <div>
          <Label htmlFor="age">Age</Label>
          <NumberInput
            id="age"
            min={10}
            max={100}
            step={1}
            value={value.age || undefined}
            onChange={(n) => set("age", n ?? 0)}
            placeholder="30"
          />
        </div>
        <div>
          <Label htmlFor="weight">Weight</Label>
          <NumberInput
            id="weight"
            min={30}
            max={200}
            step={0.5}
            value={value.weightKg || undefined}
            onChange={(n) => set("weightKg", n ?? 0)}
            placeholder="60"
            suffix="kg"
          />
        </div>
        <div>
          <Label htmlFor="height">Height (optional)</Label>
          <NumberInput
            id="height"
            min={100}
            max={250}
            step={1}
            value={value.heightCm}
            onChange={(n) => set("heightCm", n)}
            placeholder="170"
            suffix="cm"
          />
        </div>
      </div>

      <div>
        <Label>Gender</Label>
        <RadioGroup
          name="gender"
          value={value.gender}
          onValueChange={(v) => set("gender", v as Profile["gender"])}
        >
          <RadioItem value="female">Female</RadioItem>
          <RadioItem value="male">Male</RadioItem>
          <RadioItem value="other">Other</RadioItem>
          <RadioItem value="prefer_not">Prefer not</RadioItem>
        </RadioGroup>
      </div>

      <div>
        <Label>Primary goal</Label>
        <RadioGroup
          name="goal"
          value={value.goal}
          onValueChange={(v) => set("goal", v as Profile["goal"])}
        >
          <RadioItem value="performance">Performance</RadioItem>
          <RadioItem value="maintenance">Maintenance</RadioItem>
          <RadioItem value="lean_out">Lean out</RadioItem>
          <RadioItem value="gain">Gain muscle</RadioItem>
        </RadioGroup>
      </div>

      {value.gender === "female" && (
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={!!value.cycleTracking}
            onCheckedChange={(c) => set("cycleTracking", c)}
          />
          <span className="text-body-sm text-ink">
            Cycle-aware fuelling
            <span className="block text-body-sm text-ink-tertiary mt-0.5">
              Surface luteal-phase notes (slightly higher carbs, supports sleep) in plans.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
