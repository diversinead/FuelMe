"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import { getDb, type GroceryList } from "@/lib/db";
import { mockGrocery } from "@/lib/mock";
import { formatWeekRange } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export default function GroceryPage({ params }: { params: { weekId: string } }) {
  const { weekId } = params;
  const list = useLiveQuery(
    async () => (await getDb().groceryLists.get(weekId)) ?? null,
    [weekId],
  );
  const [seeding, setSeeding] = React.useState(false);

  if (list === undefined) return <Loading />;

  if (list === null) {
    return (
      <main className="app-container py-12 max-w-2xl">
        <BackLink />
        <h1 className="font-display text-display-lg text-ink mt-6">
          No grocery list yet
        </h1>
        <p className="text-body-lg text-ink-secondary mt-3 mb-6">
          AI grocery generation lands in Phase 4. Seed a mock list to click
          through.
        </p>
        <Button
          disabled={seeding}
          onClick={async () => {
            setSeeding(true);
            try {
              await getDb().groceryLists.put(mockGrocery(weekId));
            } finally {
              setSeeding(false);
            }
          }}
        >
          {seeding ? "Seeding…" : "Seed mock list"}
        </Button>
      </main>
    );
  }

  return <GroceryView list={list} />;
}

function GroceryView({ list }: { list: GroceryList }) {
  const db = getDb();

  const { totalItems, checkedItems } = React.useMemo(() => {
    let total = 0;
    let checked = 0;
    for (const c of list.categories) {
      for (const it of c.items) {
        total++;
        if (it.checked) checked++;
      }
    }
    return { totalItems: total, checkedItems: checked };
  }, [list]);

  async function toggleItem(catName: string, itemId: string) {
    const next: GroceryList = {
      ...list,
      categories: list.categories.map((c) =>
        c.name !== catName
          ? c
          : {
              ...c,
              items: c.items.map((it) =>
                it.id === itemId ? { ...it, checked: !it.checked } : it,
              ),
            },
      ),
    };
    await db.groceryLists.put(next);
  }

  async function resetAll() {
    const next: GroceryList = {
      ...list,
      categories: list.categories.map((c) => ({
        ...c,
        items: c.items.map((it) => ({ ...it, checked: false })),
      })),
    };
    await db.groceryLists.put(next);
  }

  const pct = totalItems === 0 ? 0 : (checkedItems / totalItems) * 100;

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ease.out }}
      className="app-container py-8 md:py-12 max-w-3xl"
    >
      <BackLink />

      <header className="flex items-end justify-between gap-4 mt-6 mb-6 flex-wrap">
        <div>
          <CardLabel>Week of {list.weekId}</CardLabel>
          <h1 className="font-display text-display-lg text-ink mt-1 leading-none">
            Groceries
          </h1>
          <p className="text-body-sm text-ink-secondary mt-2">
            {formatWeekRange(list.weekId)} ·{" "}
            {list.includeDinner ? "Includes dinner" : "Breakfast → afternoon only"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw size={14} /> Reset
          </Button>
          <Button variant="secondary" size="sm" disabled>
            <Printer size={14} /> Print (Phase 2)
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            Progress
          </span>
          <span className="font-mono text-mono text-ink">
            {checkedItems} of {totalItems}
          </span>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: ease.out }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {list.categories.map((cat) => (
          <section key={cat.name}>
            <div className="sticky top-16 z-10 bg-surface-2/95 backdrop-blur border-b border-border-subtle">
              <h2 className="px-4 py-2.5 font-mono text-mono-sm uppercase tracking-widest text-ink">
                {cat.name}
              </h2>
            </div>
            <Card className="p-0 rounded-card overflow-hidden">
              <ul>
                {cat.items.map((it, i) => (
                  <li
                    key={it.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3.5",
                      i > 0 && "border-t border-border-subtle",
                    )}
                  >
                    <div className="pt-0.5">
                      <Checkbox
                        checked={it.checked}
                        onCheckedChange={() => toggleItem(cat.name, it.id)}
                      />
                    </div>
                    <div
                      className={cn(
                        "flex-1 transition-opacity duration-200",
                        it.checked && "opacity-40",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span
                          className={cn(
                            "text-body text-ink",
                            it.checked && "line-through",
                          )}
                        >
                          {it.name}
                        </span>
                        <span className="font-mono text-mono text-accent shrink-0">
                          {it.qty}
                        </span>
                      </div>
                      {it.note && (
                        <p className="text-body-sm text-ink-tertiary mt-0.5">
                          {it.note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>

      {/* Macro check */}
      <section className="mt-10">
        <h2 className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary mb-3">
          Daily macro check
        </h2>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr>
                <th className="bg-surface-2 px-4 py-2.5 text-left font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                  Day
                </th>
                <th className="bg-surface-2 px-4 py-2.5 text-left font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                  Carbs
                </th>
                <th className="bg-surface-2 px-4 py-2.5 text-left font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                  Protein
                </th>
              </tr>
            </thead>
            <tbody>
              {list.macroCheck.map((m, i) => (
                <tr
                  key={m.day}
                  className={cn(i > 0 && "border-t border-border-subtle")}
                >
                  <td className="px-4 py-2.5 font-mono text-mono uppercase tracking-widest text-ink-secondary">
                    {m.day} · {m.tag}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-ink">~{m.carbsG} g</td>
                  <td className="px-4 py-2.5 font-mono text-accent">
                    ~{m.proteinG} g
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Notes */}
      <section className="mt-10 space-y-3">
        {list.notes.map((n) => (
          <div key={n.label} className="flex gap-3">
            <span className="font-mono text-mono-sm uppercase tracking-widest text-accent whitespace-nowrap pt-0.5">
              {n.label}
            </span>
            <span className="text-body-sm text-ink-secondary leading-relaxed">
              {n.text}
            </span>
          </div>
        ))}
      </section>
    </motion.main>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1 font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-ink"
    >
      <ArrowLeft size={12} /> Dashboard
    </Link>
  );
}

function Loading() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        Loading…
      </p>
    </main>
  );
}
