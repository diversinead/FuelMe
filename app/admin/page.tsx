"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ease } from "@/lib/motion";
import {
  RULE_SECTIONS,
  type RuleSection,
  type NutritionRulesConfig,
} from "@/lib/nutritionRulesSchema";
import { SECTION_LABELS, SectionEditor } from "@/components/admin/Sections";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const isProd = process.env.NODE_ENV === "production";

type Status = "loading" | "login" | "ready";
type Toast = { msg: string; type: "ok" | "err" } | null;

export default function AdminPage() {
  const [status, setStatus] = React.useState<Status>("loading");
  const [config, setConfig] = React.useState<NutritionRulesConfig | null>(null);
  const [section, setSection] = React.useState<RuleSection>("carbPeriodisation");
  const [draft, setDraft] = React.useState<unknown>(null);
  const [toast, setToast] = React.useState<Toast>(null);
  const [saving, setSaving] = React.useState(false);

  const flash = React.useCallback((msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadRules = React.useCallback(async () => {
    const res = await fetch("/api/admin/rules");
    if (res.status === 401) {
      setStatus("login");
      return;
    }
    if (!res.ok) {
      flash("Failed to load rules.", "err");
      setStatus("login");
      return;
    }
    const cfg = (await res.json()) as NutritionRulesConfig;
    setConfig(cfg);
    setDraft(clone(cfg[section]));
    setStatus("ready");
  }, [section, flash]);

  React.useEffect(() => {
    void loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectSection(s: RuleSection) {
    if (!config) return;
    setSection(s);
    setDraft(clone(config[s]));
  }

  const dirty =
    config !== null && JSON.stringify(draft) !== JSON.stringify(config[section]);

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, value: draft }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = (body as { error?: string }).error ?? "Save failed.";
        const details = (body as { details?: string[] }).details;
        flash(details?.length ? `${errMsg} — ${details.join("; ")}` : errMsg, "err");
        return;
      }
      const next = body as NutritionRulesConfig;
      setConfig(next);
      setDraft(clone(next[section]));
      flash(`Saved ${SECTION_LABELS[section]}. Rules regenerated.`, "ok");
    } catch {
      flash("Save failed (network).", "err");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setConfig(null);
    setStatus("login");
  }

  if (status === "loading") {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          Loading…
        </p>
      </main>
    );
  }

  if (status === "login") {
    return <LoginGate onSuccess={loadRules} flash={flash} toast={toast} />;
  }

  return (
    <main className="app-container py-8 md:py-12">
      <header className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            Nutrition rules
          </p>
          <h1 className="font-display text-display-lg text-ink mt-1 leading-none">
            Admin
          </h1>
          <p className="text-body-sm text-ink-secondary mt-2">
            Edits write <code>config/nutritionRules.json</code> and regenerate
            NUTRITION_RULES.md + the AI prompts.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>
          Log out
        </Button>
      </header>

      {isProd && (
        <div
          className="mb-6 p-3 rounded-button"
          style={{
            border: "1px solid color-mix(in srgb, var(--warning) 40%, transparent)",
            background: "color-mix(in srgb, var(--warning) 10%, transparent)",
          }}
        >
          <p className="text-body-sm text-ink leading-snug">
            <strong>Local-dev only.</strong> This is a production build — the
            filesystem is read-only, so saving is disabled. Edit{" "}
            <code>config/nutritionRules.json</code> locally, run{" "}
            <code>npm run regenerate:rules</code>, and redeploy.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        {/* Left nav */}
        <nav className="flex md:flex-col gap-1 flex-wrap md:sticky md:top-20 self-start">
          {RULE_SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => selectSection(s)}
              className={
                "text-left px-3 py-2 rounded-button text-body-sm transition-colors " +
                (s === section
                  ? "bg-surface-2 text-ink border border-border"
                  : "text-ink-secondary hover:text-ink hover:bg-surface-2 border border-transparent")
              }
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </nav>

        {/* Main pane */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-display-sm text-ink">
              {SECTION_LABELS[section]}
            </h2>
            <Button onClick={save} disabled={!dirty || saving || isProd} size="sm">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
          {draft !== null && (
            <SectionEditor
              key={section}
              section={section}
              value={draft}
              onChange={setDraft}
            />
          )}
        </section>
      </div>

      <ToastView toast={toast} />
    </main>
  );
}

function LoginGate({
  onSuccess,
  flash,
  toast,
}: {
  onSuccess: () => void | Promise<void>;
  flash: (msg: string, type: "ok" | "err") => void;
  toast: Toast;
}) {
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        await onSuccess();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Login failed.");
    } catch {
      setError("Login failed (network).");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-container py-16 max-w-sm">
      <h1 className="font-display text-display-md text-ink">Admin</h1>
      <p className="text-body-sm text-ink-secondary mt-2 mb-6">
        Enter the admin password to edit nutrition rules.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full bg-surface-2 text-ink placeholder:text-ink-tertiary border border-border rounded-button px-3 py-2.5 text-body focus:border-accent outline-none"
        />
        {error && <p className="text-body-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy || !password} className="w-full">
          {busy ? "Checking…" : "Log in"}
        </Button>
      </form>
      <ToastView toast={toast} />
    </main>
  );
}

function ToastView({ toast }: { toast: Toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18, ease: ease.out }}
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-button px-4 py-3 shadow-elevated"
          style={{
            background:
              toast.type === "ok"
                ? "color-mix(in srgb, var(--success) 14%, var(--surface-2))"
                : "color-mix(in srgb, var(--danger) 14%, var(--surface-2))",
            border: `1px solid color-mix(in srgb, var(--${toast.type === "ok" ? "success" : "danger"}) 40%, transparent)`,
          }}
        >
          <p className="text-body-sm text-ink leading-snug">{toast.msg}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
