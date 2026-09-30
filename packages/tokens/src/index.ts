/**
 * SLSWCA design tokens — single source of truth for web (Tailwind) and mobile (Expo).
 * Keep `tokens.css` in sync with this file; `tokens.test.ts` in @slswca/core enforces it.
 */
export const colors = {
  bg: "#131210", // page background (warm black)
  surface: "#1C1A17", // alternate section / card
  line: "#2A2722", // hairline borders / dividers
  lineStrong: "#3A362F", // outline button border
  text: "#F5F1E8", // primary text (bone)
  muted: "#A39E93", // secondary text / inactive nav
  faint: "#8A8478", // tertiary text (AA on bg)
  gold: "#F0A83B", // accent: CTAs, eyebrows, highlights
  maroon: "#8D2A45", // feature bands, badges
  danger: "#E5484D",
} as const;

export const fonts = {
  display: "Anton", // always uppercase
  body: "Archivo", // 400/500/600/700
} as const;

export const radius = 0;

export const space = [0, 4, 8, 12, 18, 24, 32, 40, 48, 56, 72, 88] as const;

export const layout = {
  maxWidth: 1280,
  gutter: 40,
  gutterMobile: 24,
  breakpoint: 900,
  menuBreakpoint: 1120,
  minHitTarget: 44,
} as const;

export const motion = {
  revealMs: 700,
  staggerMs: 90,
  countUpMs: 1400,
  marqueeS: 22,
  easeOut: "cubic-bezier(.22,1,.36,1)",
} as const;

export type ColorToken = keyof typeof colors;
