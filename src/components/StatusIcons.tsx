import React from 'react';

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

/** Cellular strength — four rounded bars, `bars` of them bright, the rest dim. */
const Cellular: React.FC<{tone: StatusTone; bars: number}> = ({tone, bars}) => {
  const t = TONES[tone];
  return (
    <svg width="42" height="30" viewBox="0 0 42 30">
      {[0, 1, 2, 3].map((i) => {
        const h = 9 + i * 5.4;
        return <rect key={i} x={i * 11} y={28 - h} width="8" height={h} rx="3" fill={t.fg} opacity={i < bars ? 1 : t.dim} />;
      })}
    </svg>
  );
};

/** The solid wi-fi fan. */
const Wifi: React.FC<{tone: StatusTone}> = ({tone}) => {
  const t = TONES[tone];
  return (
    <svg width="40" height="29" viewBox="0 0 30 22" fill={t.fg}>
      <path d="M15 4.3c4.3 0 8.2 1.7 11 4.5a1.4 1.4 0 0 1 0 2l-.4.4a1.3 1.3 0 0 1-1.85.02A12.4 12.4 0 0 0 15 7.7 12.4 12.4 0 0 0 6.25 11.2 1.3 1.3 0 0 1 4.4 11.2L4 10.8a1.4 1.4 0 0 1 0-2A15.6 15.6 0 0 1 15 4.3z" />
      <path d="M15 10.4c2.6 0 5 1 6.8 2.8a1.35 1.35 0 0 1-.02 1.95l-.43.42a1.25 1.25 0 0 1-1.77-.02A6.45 6.45 0 0 0 15 13.7a6.45 6.45 0 0 0-4.58 1.85 1.25 1.25 0 0 1-1.77.02l-.43-.42A1.35 1.35 0 0 1 8.2 13.2 9.6 9.6 0 0 1 15 10.4z" />
      <path d="M15 16.1c1.05 0 2.02.42 2.72 1.12a1.3 1.3 0 0 1 .03 1.8l-1.78 1.86a1.32 1.32 0 0 1-1.94 0l-1.78-1.86a1.3 1.3 0 0 1 .03-1.8A3.83 3.83 0 0 1 15 16.1z" />
    </svg>
  );
};

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

/** The full right-hand cluster: cellular · wi-fi · battery. */
export const StatusBarRight: React.FC<{
  tone: StatusTone;
  bars?: number;
  battery: number;
  charging: boolean;
}> = ({tone, bars = 4, battery, charging}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
    <Cellular tone={tone} bars={bars} />
    <Wifi tone={tone} />
    <Battery tone={tone} level={battery} charging={charging} />
  </div>
);
