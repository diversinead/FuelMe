"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

export function AppBar() {
  const pathname = usePathname() ?? "";
  const onOnboarding = pathname.startsWith("/onboarding");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-16 bg-surface-0/90 backdrop-blur",
        "border-b border-border-subtle",
      )}
    >
      <div className="app-container h-full flex items-center justify-between">
        <Link
          href={onOnboarding ? "/onboarding" : "/dashboard"}
          className="font-display text-[18px] font-extrabold tracking-tight text-ink"
        >
          Fuel<span className="text-accent">.</span>
        </Link>

        {!onOnboarding && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 font-mono text-mono-sm uppercase tracking-widest",
                    active ? "text-ink" : "text-ink-tertiary hover:text-ink",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
