import React from 'react';
import {SB_GLYPHS} from './statusGlyphs';

/**
 * The official iPhone status-bar glyphs (cellular, wi-fi, battery), shared by
 * BOTH the lock screen and the chat so the same phone reads identically across
 * the intro → chat cut.
 *
 * `tone` picks the official iOS variant:
 *  • 'light' — light CONTENT (white icons), for a dark background (lock screen
 *    over the wallpaper);
 *  • 'dark'  — dark CONTENT (near-black icons), for a light background (the chat).
 */
export type StatusTone = 'light' | 'dark';

// Icon colour: white over the wallpaper (lock screen), near-black over the chat.
const TONES: Record<StatusTone, {fg: string}> = {
  light: {fg: '#ffffff'},
  dark: {fg: '#000000'},
};

/** Official iOS 27 glyph, tinted via the tone colour. All three icons track the
 *  battery height (≈13pt native) so the cluster lines up exactly. */
const SCALE = 28 / 13; // battery body is 28px tall here; 13pt native
const SBIcon: React.FC<{name: keyof typeof SB_GLYPHS; tone: StatusTone}> = ({name, tone}) => {
  const g = SB_GLYPHS[name];
  return (
    <svg width={g.w * SCALE} height={g.h * SCALE} viewBox={g.viewBox} fill={TONES[tone].fg} style={{display: 'block'}}>
      <path d={g.d} />
    </svg>
  );
};

const Cellular: React.FC<{tone: StatusTone}> = ({tone}) => <SBIcon name="cellular" tone={tone} />;
const Wifi: React.FC<{tone: StatusTone}> = ({tone}) => <SBIcon name="wifi" tone={tone} />;
/** The official solid battery silhouette (rounded body + nub) — no border, no %. */
const Battery: React.FC<{tone: StatusTone}> = ({tone}) => <SBIcon name="battery" tone={tone} />;

/** The full right-hand cluster: cellular · wi-fi · battery — all official glyphs,
 *  tinted by tone (white on the lock screen, dark on the chat). `bars`/`battery`/
 *  `charging` are accepted for compatibility; the official icons are static. */
export const StatusBarRight: React.FC<{
  tone: StatusTone;
  bars?: number;
  battery?: number;
  charging?: boolean;
}> = ({tone}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
    <Cellular tone={tone} />
    <Wifi tone={tone} />
    <Battery tone={tone} />
  </div>
);
