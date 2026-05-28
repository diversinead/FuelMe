"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProfileStep } from "@/components/onboarding/ProfileStep";
import { FoodPrefsStep } from "@/components/onboarding/FoodPrefsStep";
import { TrainingStep } from "@/components/onboarding/TrainingStep";
import {
  getDb,
  type FoodPreferences,
  type Profile,
  type TrainingWeek,
} from "@/lib/db";
import { weekIdFor } from "@/lib/date";
import { emptyWeekSessions } from "@/lib/defaults";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

const initialProfile: Profile = {
  id: "me",
  gender: "female",
  age: 30,
  weightKg: 60,
  goal: "performance",
};

const initialFoodPrefs: FoodPreferences = {
  id: "me",
  breakfastOptions: [],
  proteinSources: [],
  carbSources: [],
  fruits: [],
  vegetables: [],
  snacks: [],
  drinks: [],
  avoid: [],
  budget: "moderate",
  cookingTime: "some",
};

const STEPS = [
  { title: "About you", subtitle: "Body, goal, and anything we need to dodge." },
  { title: "Food preferences", subtitle: "What's actually in your kitchen on a Tuesday." },
  { title: "This week's training", subtitle: "What you're running. Eat for the work." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [submitting, setSubmitting] = React.useState(false);

  const [profile, setProfile] = React.useState<Profile>(initialProfile);
  const [foodPrefs, setFoodPrefs] =
    React.useState<FoodPreferences>(initialFoodPrefs);
  const [trainingWeek, setTrainingWeek] = React.useState<TrainingWeek>(() => {
    const wid = weekIdFor();
    return { id: wid, weekStart: wid, sessions: emptyWeekSessions };
  });

  React.useEffect(() => {
    (async () => {
      try {
        const existing = await getDb().profile.get("me");
        if (existing) router.replace("/dashboard");
      } catch {
        // fresh state
      }
    })();
  }, [router]);

  function next() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 2));
  }
  function back() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const db = getDb();
      await db.profile.put(profile);
      await db.foodPreferences.put(foodPrefs);
      await db.trainingWeeks.put(trainingWeek);
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance =
    step === 0 ? profile.age > 0 && profile.weightKg > 0 : true;

  return (
    <main className="min-h-[calc(100vh-64px)] app-container py-10 md:py-16 flex justify-center">
      <div className="w-full max-w-[560px]">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-accent" : "bg-surface-3",
              )}
            />
          ))}
          <span className="ml-2 font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            {step + 1} / 3
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.22, ease: ease.out }}
          >
            <h1 className="font-display text-display-lg text-ink">
              {STEPS[step].title}
            </h1>
            <p className="text-body-lg text-ink-secondary mt-2 mb-8">
              {STEPS[step].subtitle}
            </p>
            <div className="mb-10">
              {step === 0 && (
                <ProfileStep value={profile} onChange={setProfile} />
              )}
              {step === 1 && (
                <FoodPrefsStep value={foodPrefs} onChange={setFoodPrefs} />
              )}
              {step === 2 && (
                <TrainingStep value={trainingWeek} onChange={setTrainingWeek} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-surface-0 pt-4 pb-2 border-t border-border-subtle">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 0 || submitting}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button onClick={next} disabled={!canAdvance} fullWidth size="lg" className="max-w-[280px]">
              Continue
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} fullWidth size="lg" className="max-w-[280px]">
              {submitting ? "Saving…" : "Save & finish"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
