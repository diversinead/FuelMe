"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getDb } from "@/lib/db";
import { LoadingState } from "@/components/shared/states";

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

  return <LoadingState className="min-h-[calc(100vh-64px)]" />;
}
