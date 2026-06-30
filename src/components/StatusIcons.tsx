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

type ToneSpec = {
  fg: string; // solid icon colour
  dim: number; // opacity for the inactive signal bars
  border: string; // battery outline
  empty: string; // battery body behind the fill
  fill: string; // battery charge bar (not charging)
  onFill: string; // the % number drawn over the fill
  nub: string; // battery terminal nub
};

const TONES: Record<StatusTone, ToneSpec> = {
  light: {
    fg: '#ffffff',
    dim: 0.4,
    border: 'rgba(255,255,255,0.55)',
    empty: 'rgba(255,255,255,0.16)',
    fill: '#ffffff',
    onFill: '#0b0b0d',
    nub: 'rgba(255,255,255,0.5)',
  },
  dark: {
    fg: '#000000',
    dim: 0.26,
    border: 'rgba(0,0,0,0.42)',
    empty: 'rgba(0,0,0,0.08)',
    fill: '#000000',
    onFill: '#ffffff',
    nub: 'rgba(0,0,0,0.35)',
  },
};

const SF =
  '"SFPro", -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

/** Official iOS 27 glyph (cellular / wi-fi), tinted via the tone colour. The icon
 *  heights track the battery (≈13pt native) so the cluster lines up exactly. */
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

/** The iOS charging bolt (solid white), as it sits inside the battery body. */
const ChargeBolt: React.FC = () => (
  <svg width="13" height="19" viewBox="0 0 10 15" style={{display: 'block', marginTop: -1}}>
    <path
      fill="#fff"
      d="M5.62.32 0.42 8.06c-.22.33.02.77.42.77h2.4l-1.02 5.49c-.1.52.58.82.9.4l5.06-8.2c.2-.33-.04-.74-.43-.74H5.18L6.5.74c.13-.5-.55-.83-.88-.42Z"
    />
  </svg>
);

/** The iOS 26 battery pill: solid green + bolt while charging, otherwise an
 *  outline with a proportional fill. The terminal nub sits on the right. */
const Battery: React.FC<{tone: StatusTone; level: number; charging: boolean}> = ({tone, level, charging}) => {
  const t = TONES[tone];
  const W = 60;
  const H = 28;
  const R = 9;
  const pad = 2.5;
  const fillW = Math.max(8, (Math.min(level, 100) / 100) * (W - pad * 2));
  return (
    <div style={{display: 'flex', alignItems: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: W,
          height: H,
          borderRadius: R,
          boxSizing: 'border-box',
          background: charging ? '#34c759' : t.empty,
          border: charging ? 'none' : `2px solid ${t.border}`,
        }}
      >
        {!charging && (
          <div
            style={{
              position: 'absolute',
              left: pad,
              top: pad,
              bottom: pad,
              width: fillW,
              borderRadius: R - 3.5,
              background: level <= 20 ? '#ff453a' : t.fill,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            fontFamily: SF,
            fontSize: level >= 100 ? 16 : 19.5,
            fontWeight: 700,
            letterSpacing: -1.2,
            color: charging ? '#fff' : t.onFill,
          }}
        >
          <span>{level}</span>
          {charging && <ChargeBolt />}
        </div>
      </div>
      <div style={{width: 3.5, height: 10, borderRadius: 2, background: t.nub, marginLeft: 2.5}} />
    </div>
  );
};

/** The full right-hand cluster: cellular · wi-fi · battery (official glyphs). The
 *  `bars` prop is accepted for compatibility but the official cellular icon is
 *  full-strength, as in the reference. */
export const StatusBarRight: React.FC<{
  tone: StatusTone;
  bars?: number;
  battery: number;
  charging: boolean;
}> = ({tone, battery, charging}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
    <Cellular tone={tone} />
    <Wifi tone={tone} />
    <Battery tone={tone} level={battery} charging={charging} />
  </div>
);
