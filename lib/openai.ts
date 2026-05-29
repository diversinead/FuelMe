// Server-only OpenAI client factory.
//
// `import "server-only"` causes a hard build error if any client component
// imports this file — that's the guardrail keeping OPENAI_API_KEY out of
// the browser bundle.
//
// Future BYO-key migration (per SPEC §5): each route reads
// `Authorization: Bearer <key>` from the request and falls back to
// process.env.OPENAI_API_KEY. The client factory below will move into
// a per-request `getOpenAIClient(req)` helper at that point.

import "server-only";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // We don't throw at module load — that breaks `npm run build` in CI
  // when the env isn't set. Routes that use this should detect a missing
  // client and return a clear 5xx instead.
  // eslint-disable-next-line no-console
  console.warn(
    "[openai] OPENAI_API_KEY is not set. /api routes that call OpenAI will fail.",
  );
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_MODEL = "gpt-4o-mini" as const;
export const OPENAI_TEMPERATURE = 0.2;
