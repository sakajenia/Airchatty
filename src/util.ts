import {useLayoutEffect, useRef, useState} from 'react';

/** Shared look-and-feel tokens for the Airbnb-style chat UI. */
export const theme = {
  rausch: '#FF385C', // Airbnb's signature pink/red accent
  rauschDark: '#E61E4D',
  incomingBubble: '#EDEDF0',
  incomingText: '#1A1A1A',
  outgoingText: '#FFFFFF',
  screenBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  subtle: '#8E8E93',
  hairline: '#E8E8EA',
  online: '#34C759',
  font: `-apple-system, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
};

/**
 * Measure an element's natural height once it's in the DOM. Returns a ref to
 * attach and the measured height (null until measured). Used to smoothly
 * "grow open" each chat bubble so the stack pushes up without a jump.
 *
 * The setState happens in useLayoutEffect, so React re-commits synchronously
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

/** Initials for the fallback avatar, e.g. "Maria · Lisbon Host" -> "ML". */
export const initialsFromName = (name: string) => {
  const words = name.replace(/[·|–-].*$/, '').trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '');
  return letters.join('') || 'A';
};

/** A pleasant deterministic accent color derived from the host name. */
export const avatarColor = (name: string) => {
  const palette = ['#FF385C', '#1DA1F2', '#34C759', '#FF9500', '#AF52DE', '#FF2D55'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};
