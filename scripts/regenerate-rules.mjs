// Regenerate NUTRITION_RULES.md from config/nutritionRules.json.
// Run: npm run regenerate:rules
//
// The /admin PUT route does the same thing in-app via lib/rulesRegenerator.ts;
// this CLI is for local/CI regeneration without the running server.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { regenerateNutritionRulesMarkdown } from "../lib/rulesMarkdown.mjs";

const root = process.cwd();
const config = JSON.parse(
  readFileSync(join(root, "config", "nutritionRules.json"), "utf8"),
);
writeFileSync(
  join(root, "NUTRITION_RULES.md"),
  regenerateNutritionRulesMarkdown(config),
  "utf8",
);
console.log("✓ Regenerated NUTRITION_RULES.md from config/nutritionRules.json");
