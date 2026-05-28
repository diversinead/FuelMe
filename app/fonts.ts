// Fonts are loaded via <link> tags in layout.tsx rather than next/font/google.
// next/font/google fetches at compile time, which hangs the dev server when
// fonts.gstatic.com is slow/unreachable. Browser-side loading is async with
// system-font fallbacks so the page never blocks.

export const FONT_FAMILIES = {
  display: "'Manrope', system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
  body: "'Inter', system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  fraunces: "'Fraunces', Georgia, 'Times New Roman', serif",
} as const;
