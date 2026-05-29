"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getDb, type GroceryList } from "@/lib/db";
import { groceryPrintCss } from "@/styles/print-grocery";

export default function GroceryPrintPage({
  params,
}: {
  params: { weekId: string };
}) {
  const { weekId } = params;
  const searchParams = useSearchParams();
  const auto = searchParams?.get("auto") === "1";

  const list = useLiveQuery(
    async () => (await getDb().groceryLists.get(weekId)) ?? null,
    [weekId],
  );

  React.useEffect(() => {
    if (!auto || !list) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [auto, list]);

  if (list === undefined) return null;

  if (list === null) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: groceryPrintCss }} />
        <div className="sheet">
          <header>
            <div>
              <div className="meta">No list for {weekId}</div>
              <h1>Nothing to print yet</h1>
            </div>
          </header>
          <div className="screen-toolbar">
            <Link href={`/grocery/${weekId}`}>← Back to grocery list</Link>
            <span />
          </div>
        </div>
      </>
    );
  }

  return <GrocerySheet list={list} />;
}

function GrocerySheet({ list }: { list: GroceryList }) {
  const weekDate = format(parseISO(list.weekId), "EEE d MMM");
  const coverage = list.includeDinner
    ? "Breakfast → Dinner"
    : "Breakfast → Afternoon";

  const totalItems = list.categories.reduce(
    (sum, c) => sum + c.items.length,
    0,
  );
  const checkedItems = list.categories.reduce(
    (sum, c) => sum + c.items.filter((i) => i.checked).length,
    0,
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: groceryPrintCss }} />
      <div className="sheet">
        <header>
          <div>
            <div className="meta">Week of {weekDate}</div>
            <h1>Grocery list</h1>
          </div>
          <div className="summary">
            <div>
              <strong>Covers:</strong> {coverage}
            </div>
            <div>
              <strong>Items:</strong> {checkedItems} of {totalItems}
            </div>
          </div>
        </header>

        <div className="categories">
          {list.categories.map((cat) => (
            <section key={cat.name} className="category">
              <h2>{cat.name}</h2>
              <ul className="items">
                {cat.items.map((it) => (
                  <li key={it.id} className="item">
                    <span className={`check${it.checked ? " checked" : ""}`} />
                    <div className="item-info">
                      <div className="item-name">
                        <span className="name">{it.name}</span>
                        {it.qty && <span className="qty">{it.qty}</span>}
                      </div>
                      {it.note && <div className="item-note">{it.note}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {list.macroCheck.length > 0 && (
          <section className="macro-check">
            <h2>
              Daily macro check{" "}
              {list.includeDinner ? "(full day)" : "(pre-dinner)"}
            </h2>
            <table className="macro-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Carbs</th>
                  <th>Protein</th>
                  <th>Tag</th>
                </tr>
              </thead>
              <tbody>
                {list.macroCheck.map((m) => (
                  <tr key={m.day}>
                    <td className="day-name">{m.day}</td>
                    <td className="num carbs">~{m.carbsG} g</td>
                    <td className="num protein">~{m.proteinG} g</td>
                    <td className="tag">{m.tag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.includeDinner && (
              <p className="macro-footnote">
                Dinner adds ~70–90 g carbs and ~35–40 g protein on top of these
                numbers.
              </p>
            )}
          </section>
        )}

        {list.notes.length > 0 && (
          <section className="notes">
            <h2>Notes</h2>
            <div className="notes-list">
              {list.notes.map((n) => (
                <div key={n.label} className="note-row">
                  <span className="note-num">{n.label}</span>
                  <span
                    className="note-text"
                    dangerouslySetInnerHTML={{ __html: n.text }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="screen-toolbar">
          <Link href={`/grocery/${list.weekId}`}>← Back to grocery list</Link>
        </div>
      </div>
    </>
  );
}
