"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import {
  getDb,
  type FoodPreferences,
  type Profile,
} from "@/lib/db";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileStep } from "@/components/onboarding/ProfileStep";
import { FoodPrefsStep } from "@/components/onboarding/FoodPrefsStep";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export default function SettingsPage() {
  const data = useLiveQuery(async () => {
    const db = getDb();
    return {
      profile: await db.profile.get("me"),
      foodPrefs: await db.foodPreferences.get("me"),
    };
  }, []);

  const [tab, setTab] = React.useState<"profile" | "food">("profile");
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [foodPrefs, setFoodPrefs] = React.useState<FoodPreferences | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (data?.profile && !profile) setProfile(data.profile);
    if (data?.foodPrefs && !foodPrefs) setFoodPrefs(data.foodPrefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!data || !profile || !foodPrefs) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          Loading…
        </p>
      </main>
    );
  }

  async function save() {
    setSaving(true);
    try {
      const db = getDb();
      if (tab === "profile" && profile) await db.profile.put(profile);
      if (tab === "food" && foodPrefs) await db.foodPreferences.put(foodPrefs);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ease.out }}
      className="app-container py-8 md:py-12 max-w-3xl"
    >
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-ink"
      >
        <ArrowLeft size={12} /> Dashboard
      </Link>

      <header className="mt-6 mb-8">
        <CardLabel>You</CardLabel>
        <h1 className="font-display text-display-lg text-ink mt-1 leading-none">
          Settings
        </h1>
      </header>

      <div className="flex gap-1 mb-6 border-b border-border-subtle">
        {[
          { id: "profile" as const, label: "Profile" },
          { id: "food" as const, label: "Food preferences" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative font-mono text-mono uppercase tracking-widest px-3 py-2.5",
              tab === t.id
                ? "text-ink"
                : "text-ink-tertiary hover:text-ink",
            )}
          >
            {t.label}
            {tab === t.id && (
              <motion.span
                layoutId="settingsTabUnderline"
                className="absolute left-3 right-3 -bottom-px h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      <Card>
        {tab === "profile" && (
          <ProfileStep value={profile} onChange={setProfile} />
        )}
        {tab === "food" && (
          <FoodPrefsStep value={foodPrefs} onChange={setFoodPrefs} />
        )}
      </Card>

      <div className="flex items-center gap-3 mt-6">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {savedAt && (
          <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
    </motion.main>
  );
}
