"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getDb } from "@/lib/db";

export default function HomePage() {
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      try {
        const profile = await getDb().profile.get("me");
        router.replace(profile ? "/dashboard" : "/onboarding");
      } catch {
        router.replace("/onboarding");
      }
    })();
  }, [router]);

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        Loading…
      </p>
    </main>
  );
}
