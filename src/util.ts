import {useLayoutEffect, useRef, useState} from 'react';

/**
 * Airbnb design tokens (from the official Airbnb design system) tuned to the
 * messaging screen seen in the reference screenshots. Sizes are scaled up for
 * a 1080-wide canvas.
 */
export const theme = {
  rausch: '#ff385c', // signature coral-pink — used sparingly (accents only)
  rauschDark: '#e00b41',
  ink: '#222222', // primary text (~90% of UI)
  charcoal: '#3f3f3f',
  ash: '#6a6a6a', // secondary labels, timestamps
  mute: '#929292',
  stone: '#c1c1c1',
  softCloud: '#f7f7f7',
  hairline: '#dddddd', // 1px row/section separators
  white: '#ffffff',
  online: '#34c759',

  // Chat-specific
  incomingBubble: '#f2f2f2', // light grey "Soft Cloud" bubble for the other person
  incomingText: '#222222',
  outgoingBubble: '#3a3a3a', // dark charcoal bubble for "you" (NOT pink)
  outgoingText: '#ffffff',

  // Cereal VF is proprietary; fall back through the documented stack.
  font: `"Airbnb Cereal", "Circular", -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
};

/**
 * Measure an element's natural height once it's in the DOM. Returns a ref to
 * attach and the measured height (null until measured). Used to smoothly
 * "grow open" each chat bubble so the stack pushes up without a jump.
 *
 * The setState runs in useLayoutEffect, so React re-commits synchronously
 * before paint — Remotion screenshots the settled layout with no flicker.
 */
export const useNaturalHeight = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = el.scrollHeight;
    if (next && next !== height) setHeight(next);
  });
  return [ref, height] as const;
};

/** Initials for the fallback avatar, e.g. "Sofia Martins" -> "SM". */
export const initialsFromName = (name: string) => {
  const words = name.replace(/[·|–-].*$/, '').trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '');
  return letters.join('') || 'A';
};

/** A pleasant deterministic avatar color derived from a name. */
export const avatarColor = (name: string) => {
  const palette = ['#FF385C', '#1DA1F2', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};
