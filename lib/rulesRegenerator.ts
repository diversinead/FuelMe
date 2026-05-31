// ============================================================================
//  Rules I/O + regeneration (Phase 7).
//
//  Reads/writes config/nutritionRules.json (the source of truth) and
//  regenerates NUTRITION_RULES.md from it. Server-only (uses fs).
//
//  The markdown template itself lives in lib/rulesMarkdown.mjs (pure JS, no
//  fs / no server-only) so a plain-Node script can regenerate the file
//  without a TS runner. This module adds the filesystem + validation layer.
//
//  The prompt builders in lib/prompts.ts call loadRulesConfig() at request
//  time, so a saved edit takes effect on the next AI generation without a
//  restart. NUTRITION_RULES.md is a human-readable artifact only.
// ============================================================================

import "server-only";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  type NutritionRulesConfig,
  validateNutritionRulesConfig,
} from "./nutritionRulesSchema";
import {
  regenerateNutritionRulesMarkdown,
  GENERATED_BANNER,
} from "./rulesMarkdown.mjs";

export { regenerateNutritionRulesMarkdown, GENERATED_BANNER };

const CONFIG_PATH = join(process.cwd(), "config", "nutritionRules.json");
const MD_PATH = join(process.cwd(), "NUTRITION_RULES.md");

/** Read + parse the config fresh from disk. Throws on missing/invalid JSON. */
export function loadRulesConfig(): NutritionRulesConfig {
  const raw = readFileSync(CONFIG_PATH, "utf8");
  return JSON.parse(raw) as NutritionRulesConfig;
}

/**
 * Validate, persist the config, and regenerate NUTRITION_RULES.md.
 * Returns validation errors without writing if invalid.
 */
export function writeRulesConfigAndRegenerate(
  config: NutritionRulesConfig,
): { ok: boolean; errors: string[] } {
  const errors = validateNutritionRulesConfig(config);
  if (errors.length > 0) return { ok: false, errors };
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
  writeFileSync(MD_PATH, regenerateNutritionRulesMarkdown(config), "utf8");
  return { ok: true, errors: [] };
}
