"use client";

import * as React from "react";
import type { FoodPreferences } from "@/lib/db";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { ChipInput } from "./ChipInput";
import { FOOD_SUGGESTIONS } from "@/lib/defaults";

interface Props {
  value: FoodPreferences;
  onChange: (next: FoodPreferences) => void;
}

const CHIP_FIELDS: Array<{
  key: keyof Pick<
    FoodPreferences,
    | "breakfastOptions"
    | "proteinSources"
    | "carbSources"
    | "fruits"
    | "vegetables"
    | "snacks"
    | "drinks"
    | "avoid"
  >;
  label: string;
}> = [
  { key: "breakfastOptions", label: "Breakfast staples" },
  { key: "proteinSources", label: "Protein sources" },
  { key: "carbSources", label: "Carb sources" },
  { key: "fruits", label: "Fruits" },
  { key: "vegetables", label: "Vegetables" },
  { key: "snacks", label: "Snacks" },
  { key: "drinks", label: "Drinks (incl. recovery)" },
  { key: "avoid", label: "Foods to avoid" },
];

export function FoodPrefsStep({ value, onChange }: Props) {
  function set<K extends keyof FoodPreferences>(key: K, v: FoodPreferences[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        {CHIP_FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <ChipInput
              value={value[f.key]}
              onChange={(next) => set(f.key, next)}
              suggestions={
                (FOOD_SUGGESTIONS as Record<string, string[]>)[f.key] ?? []
              }
            />
          </div>
        ))}
      </div>

      <div>
        <Label>Budget</Label>
        <RadioGroup
          name="budget"
          value={value.budget}
          onValueChange={(v) => set("budget", v as FoodPreferences["budget"])}
        >
          <RadioItem value="tight">Tight</RadioItem>
          <RadioItem value="moderate">Moderate</RadioItem>
          <RadioItem value="generous">Generous</RadioItem>
        </RadioGroup>
      </div>

      <div>
        <Label>Cooking time</Label>
        <RadioGroup
          name="cookingTime"
          value={value.cookingTime}
          onValueChange={(v) =>
            set("cookingTime", v as FoodPreferences["cookingTime"])
          }
        >
          <RadioItem value="minimal">Minimal</RadioItem>
          <RadioItem value="some">Some</RadioItem>
          <RadioItem value="enjoy">I enjoy cooking</RadioItem>
        </RadioGroup>
      </div>
    </div>
  );
}
