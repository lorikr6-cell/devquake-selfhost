// Class names of the shop's themed parts (ADR 0058). They read the CSS variables ShopFrame
// sets: the owner's design (theme.ts → themeVars) or, without one, defaults that follow the
// app's light and dark look (currentColor mixes). Arbitrary properties keep them explicit.

/** On the shop's root: the defaults, overridden by the theme's inline variables. */
export const SHOP_ROOT =
  '[--shop-page:var(--color-paper)] dark:[--shop-page:var(--color-ink)] [--shop-accent:var(--color-quake)] [--shop-on-accent:#ffffff] [--shop-muted:color-mix(in_srgb,currentColor_62%,transparent)] [--shop-line:color-mix(in_srgb,currentColor_14%,transparent)] [--shop-card-line:color-mix(in_srgb,currentColor_12%,transparent)] [--shop-surface:color-mix(in_srgb,currentColor_3%,transparent)] [--shop-radius:0.75rem] [--shop-button-radius:0.5rem] [--shop-shadow:none] [--shop-font:inherit] [--shop-heading:var(--font-display)] [font-family:var(--shop-font)]';

export const S = {
  muted: '[color:var(--shop-muted)]',
  accent: '[color:var(--shop-accent)]',
  line: '[border-color:var(--shop-line)]',
  heading: '[font-family:var(--shop-heading)]',
  radius: '[border-radius:var(--shop-radius)]',
  card: 'overflow-hidden border [border-radius:var(--shop-radius)] [border-color:var(--shop-card-line)] [background-color:var(--shop-surface)] [box-shadow:var(--shop-shadow)]',
  panel:
    'border p-5 [border-radius:var(--shop-radius)] [border-color:var(--shop-card-line)] [background-color:var(--shop-surface)] [box-shadow:var(--shop-shadow)]',
  hoverAccent: 'hover:[border-color:var(--shop-accent)] hover:[color:var(--shop-accent)]',
  button:
    'inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold [border-radius:var(--shop-button-radius)] [background-color:var(--shop-accent)] [color:var(--shop-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--shop-accent)]',
  buttonSecondary:
    'inline-flex min-h-11 items-center justify-center gap-2 border px-4 py-2 text-sm font-medium [border-radius:var(--shop-button-radius)] [border-color:var(--shop-line)] hover:[border-color:var(--shop-accent)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--shop-accent)]',
  chip: 'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-sm [border-color:var(--shop-line)] hover:[border-color:var(--shop-accent)]',
  chipActive:
    'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-sm font-semibold [border-color:var(--shop-accent)] [background-color:color-mix(in_srgb,var(--shop-accent)_12%,transparent)]',
  badge:
    'rounded-full px-2 py-0.5 text-xs font-semibold [background-color:var(--shop-accent)] [color:var(--shop-on-accent)]',
} as const;
