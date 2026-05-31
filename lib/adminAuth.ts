// ============================================================================
//  Admin session auth (Phase 7) — single-user, password-gated.
//
//  No DB, no new deps: an HMAC-signed cookie carrying only an expiry,
//  signed with a key derived from ADMIN_PASSWORD. Verified on every
//  /api/admin/* route. Server-only (uses node:crypto).
// ============================================================================

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "fuel_admin";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_MAX_AGE_S = SESSION_MS / 1000;

function secret(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error("ADMIN_PASSWORD is not set");
  return p;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

/** Constant-time check of a submitted password against ADMIN_PASSWORD. */
export function passwordMatches(input: string): boolean {
  const stored = process.env.ADMIN_PASSWORD;
  if (!stored) return false;
  // HMAC both with the same key → equal-length digests, compared in constant
  // time; equal iff input === stored, without leaking length.
  const a = createHmac("sha256", stored).update(input).digest();
  const b = createHmac("sha256", stored).update(stored).digest();
  return timingSafeEqual(a, b);
}

/** Mint a signed session token valid for 7 days. */
export function createSessionToken(): string {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS })).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verify a token's signature and expiry. */
export function isSessionValid(token: string | undefined): boolean {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body);
  const sb = Buffer.from(sig);
  const eb = Buffer.from(expected);
  if (sb.length !== eb.length || !timingSafeEqual(sb, eb)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as { exp?: unknown };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

/** True when the request carries a valid admin session cookie. */
export function requireAdmin(req: NextRequest): boolean {
  return isSessionValid(req.cookies.get(ADMIN_COOKIE)?.value);
}
