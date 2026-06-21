import {useLayoutEffect, useRef, useState} from 'react';
import {brandFont} from './font';

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
  incomingBubble: '#e8e8e8', // slightly darker grey bubble for the other people
  incomingText: '#222222',
  outgoingBubble: '#3a3a3a', // dark charcoal bubble for "you" (NOT pink)
  outgoingText: '#ffffff',

  // Cereal VF is proprietary; Mulish (loaded via Google Fonts) is the closest
  // free match. Falls back through the documented stack.
  font: `${brandFont}, "Circular", -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`,
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

/**
 * Measure an element's visible (client) height. Re-runs every render so it
 * stays correct, but the value is stable for a fixed-size container. Used to
 * know the chat viewport height for top-anchored auto-scroll.
 */
export const useClientHeight = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = el.clientHeight;
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

/** A soft pastel background + matching letter colour for initials avatars,
 *  derived from the name (like the light-blue "M" placeholders in Airbnb). */
export const avatarColor = (name: string): {bg: string; fg: string} => {
  const palette = [
    {bg: '#dce9fb', fg: '#3d7dd8'}, // blue
    {bg: '#e7e1fb', fg: '#7a5cd0'}, // purple
    {bg: '#d8efe0', fg: '#2e9c5e'}, // green
    {bg: '#fbe4dc', fg: '#d8673f'}, // orange
    {bg: '#fbe0ea', fg: '#d24b80'}, // pink
    {bg: '#def0f4', fg: '#2f93ad'}, // teal
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};
