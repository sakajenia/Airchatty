import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {theme} from '../util';
import {LockScreenData} from '../lockscreen';
import {clockFont} from '../clockfont';
import {uiFont} from '../uifont';

/**
 * iOS 26 "Liquid Glass" lock screen used as the video intro. The clock is real
 * refractive glass (a backdrop-blurred, brightened copy of the wallpaper masked
 * to the digit shapes, with a bright bevelled edge on top). The Airbnb push
 * notification is a dark Liquid-Glass banner — but, per the brief, it sits just
 * BELOW the clock (not at the bottom like the OS default). It carries the
 * guest's photo, name, a subtitle and a preview of their first message.
 */

const SF = `${uiFont}, -apple-system, "SF Pro Display", ${theme.font}`;
/** The fixed brand label shown where the date normally sits. */
const TOP_LABEL = 'ProProManager';

/** The Airbnb "Bélo" mark (simple-icons path), white on the red app badge. */
const AirbnbBelo: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M22.515 17.991c-.107-.255-.22-.512-.327-.745l-.155-.342-.018-.018C20.488 13.299 18.36 9.18 16.1 5.15l-.085-.155c-.227-.412-.46-.838-.7-1.27a4.69 4.69 0 0 0-.92-1.213A3.638 3.638 0 0 0 11.99 1.5a3.65 3.65 0 0 0-2.403.997c-.342.32-.65.728-.92 1.214-.24.43-.474.857-.7 1.27l-.086.154C5.628 9.18 3.494 13.3 1.98 16.88l-.024.06c-.107.25-.22.506-.327.762a4.844 4.844 0 0 0-.398 2.49 3.815 3.815 0 0 0 2.324 3.04 4.108 4.108 0 0 0 1.601.32c.18 0 .404-.024.583-.048a5.394 5.394 0 0 0 1.812-.642c.768-.43 1.504-1.05 2.336-1.948.832.898 1.574 1.518 2.336 1.948a5.394 5.394 0 0 0 1.812.642c.179.024.402.048.583.048a4.108 4.108 0 0 0 1.601-.32 3.815 3.815 0 0 0 2.324-3.04 4.844 4.844 0 0 0-.398-2.49zM12 19.94c-1.024-1.287-1.688-2.49-1.915-3.51-.095-.43-.107-.815-.06-1.16.036-.305.144-.576.305-.815.376-.535.998-.869 1.762-.869.763 0 1.397.334 1.762.87.16.238.268.51.304.814.048.345.036.73-.06 1.16-.226 1.002-.89 2.205-1.914 3.51zm8.95-.83a2.474 2.474 0 0 1-1.51 1.972 2.766 2.766 0 0 1-1.453.179 4.04 4.04 0 0 1-1.346-.477c-.643-.357-1.281-.893-2.026-1.69 1.176-1.453 1.893-2.789 2.166-3.98.13-.56.154-1.07.094-1.54a3.11 3.11 0 0 0-.555-1.376c-.62-.893-1.682-1.42-2.872-1.42s-2.252.527-2.872 1.42a3.11 3.11 0 0 0-.555 1.376c-.06.47-.036.98.094 1.54.273 1.19.99 2.527 2.166 3.98-.745.797-1.383 1.333-2.026 1.69a4.04 4.04 0 0 1-1.346.477 2.766 2.766 0 0 1-1.453-.179 2.474 2.474 0 0 1-1.51-1.971 3.353 3.353 0 0 1 .287-1.78c.083-.226.19-.453.297-.71l.024-.06c1.51-3.569 3.638-7.675 5.886-11.681l.086-.155c.226-.405.46-.83.7-1.244.226-.405.476-.78.78-1.07a2.156 2.156 0 0 1 1.493-.62c.572 0 1.103.227 1.493.62.305.29.555.665.78 1.07.24.415.475.84.7 1.244l.087.155c2.236 3.99 4.365 8.107 5.886 11.7l.012.012c.107.25.214.49.297.728a3.353 3.353 0 0 1 .3 1.769z" />
  </svg>
);

/** Status-bar right cluster: cellular bars, wi-fi, battery pill (with %). */
const StatusRight: React.FC<{battery: number; charging: boolean}> = ({battery, charging}) => {
  const fill = charging ? '#34c759' : battery <= 20 ? '#ff453a' : '#ffffff';
  const numColor = charging || battery > 20 ? (charging ? '#0a3d18' : '#000') : '#fff';
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      {/* cellular */}
      <svg width="40" height="28" viewBox="0 0 40 28">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 10} y={20 - i * 5} width="7" height={8 + i * 5} rx="2" fill="#fff" opacity={i < 2 ? 1 : 0.35} />
        ))}
      </svg>
      {/* wi-fi */}
      <svg width="38" height="28" viewBox="0 0 28 20" fill="#fff">
        <path d="M14 4.2c4 0 7.6 1.6 10.2 4.1l-2.2 2.3A11.3 11.3 0 0 0 14 7.4c-3.1 0-5.9 1.2-8 3.2L3.8 8.3A14.5 14.5 0 0 1 14 4.2z" />
        <path d="M14 10.1c2.3 0 4.4.9 6 2.4l-2.3 2.4A4.9 4.9 0 0 0 14 13.3c-1.4 0-2.7.6-3.7 1.6L8 12.5a8.1 8.1 0 0 1 6-2.4z" />
        <circle cx="14" cy="17.4" r="2.2" />
      </svg>
      {/* battery */}
      <div style={{display: 'flex', alignItems: 'center'}}>
        <div
          style={{
            position: 'relative',
            width: 68,
            height: 32,
            borderRadius: 9,
            border: '2.5px solid rgba(255,255,255,0.45)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            padding: 3,
          }}
        >
          <div style={{width: `${Math.max(8, battery)}%`, height: '100%', borderRadius: 5, background: fill}} />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: SF,
              fontSize: 22,
              fontWeight: 600,
              color: numColor,
              letterSpacing: -0.5,
            }}
          >
            {battery}
          </span>
          {charging && (
            <svg width="16" height="20" viewBox="0 0 12 16" style={{position: 'absolute', right: -2, top: 6}} fill="#fff">
              <path d="M7 0L1 9h4l-1 7 7-10H6z" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
            </svg>
          )}
        </div>
        {/* battery nub */}
        <div style={{width: 4, height: 12, borderRadius: 2, background: 'rgba(255,255,255,0.45)', marginLeft: 2}} />
      </div>
    </div>
  );
};

// ── Liquid-Glass clock ──────────────────────────────────────────────────────
// Real refraction, the way Apple does it (and the kube.io / dashersw technique):
// build a DISPLACEMENT MAP from the digit shapes — a normal map whose R/G channels
// encode how far to bend the light at each pixel (zero in the flat interior, max
// at the rounded edges, like a glass lip) — then feed it to an SVG
// <feDisplacementMap> applied as `backdrop-filter: url(#id)` so the wallpaper is
// physically warped *through* the glass. A thin bright rim + a soft specular
// highlight finish it. No fake bevel / text-shadow.

// The reference uses SF Pro COMPRESSED Medium (naturally tall + narrow), so the
// font is NOT stretched. Until that exact font file is available we render with
// SF Pro Display Medium un-stretched as a placeholder.
const CLOCK_FS = 380; // glyph size
const CLOCK_SY = 1.0; // NO stretch — the font itself is compressed
const CLOCK_LS = -4; // letter spacing
const CLOCK_WT = 500; // Medium
const CLOCK_H0 = 320; // box height (digit cap-height fits)
const CLOCK_W = 1080;

/**
 * The lock clock. Per the brief, a SIMPLE frosted glass: the digit shapes are a
 * mask over a high-opacity light fill plus a backdrop blur of the wallpaper —
 * no displacement, no specular, no rim. Just blurred glass with a light tint.
 */
const GlassClock: React.FC<{time: string}> = ({time}) => {
  const H = Math.round(CLOCK_H0 * CLOCK_SY);

  // digit mask (clips the frosted glass to the digit shapes)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${CLOCK_W}' height='${CLOCK_H0}'><text x='${
    CLOCK_W / 2
  }' y='${CLOCK_H0 / 2 + 4}' font-family='${clockFont}' font-weight='${CLOCK_WT}' font-size='${CLOCK_FS}' letter-spacing='${CLOCK_LS}' text-anchor='middle' dominant-baseline='central'>${time}</text></svg>`;
  const mask = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  const maskProps: React.CSSProperties = {
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  };

  const fid = `clk_${time.replace(/\D/g, '')}`;
  return (
    <div style={{width: CLOCK_W, height: H, position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scaleY(${CLOCK_SY})`, transformOrigin: 'center top'}}>
        <div style={{position: 'relative', width: CLOCK_W, height: CLOCK_H0}}>
          {/* Glassmorphism per the provided card spec, adapted to the digits:
              backdrop-filter blur(9px) + background rgba(255,255,255,0.14). */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(9px)',
              WebkitBackdropFilter: 'blur(9px)',
              background: 'rgba(255,255,255,0.14)',
              ...maskProps,
            }}
          />
          {/* border (1px rgba(255,255,255,0.3)) + the strong inner white glow
              (inset 0 0 28px 14px rgba(255,255,255,1.4)) + top/bottom inset edges */}
          <svg width={CLOCK_W} height={CLOCK_H0} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <defs>
              <filter id={fid} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
                <feFlood floodColor="#ffffff" floodOpacity="1" result="w" />
                <feComposite in="w" in2="SourceAlpha" operator="out" result="outside" />
                <feGaussianBlur in="outside" stdDeviation="13" result="b" />
                <feComposite in="b" in2="SourceAlpha" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="glow" />
                </feMerge>
              </filter>
            </defs>
            {/* the bright inner glow, clipped to the digits */}
            <text
              x={CLOCK_W / 2}
              y={CLOCK_H0 / 2 + 4}
              fontFamily={clockFont}
              fontWeight={CLOCK_WT}
              fontSize={CLOCK_FS}
              letterSpacing={CLOCK_LS}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              filter={`url(#${fid})`}
            >
              {time}
            </text>
            {/* the 1px white border (glass edge) */}
            <text
              x={CLOCK_W / 2}
              y={CLOCK_H0 / 2 + 4}
              fontFamily={clockFont}
              fontWeight={CLOCK_WT}
              fontSize={CLOCK_FS}
              letterSpacing={CLOCK_LS}
              textAnchor="middle"
              dominantBaseline="central"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.4"
            >
              {time}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export type LockScreenProps = {
  data: LockScreenData;
  guestName: string;
  guestSubtitle: string;
  guestPhoto: string;
  message: string;
};

const resolveSrc = (s: string) => (s.startsWith('data:') || s.startsWith('http') ? s : staticFile(s));

/** Wallpaper can be a CSS gradient string OR an image file (public/) path. */
const wallpaperStyle = (w: string): React.CSSProperties =>
  /\.(jpe?g|png|webp)$/i.test(w)
    ? {backgroundImage: `url(${resolveSrc(w)})`, backgroundSize: 'cover', backgroundPosition: 'center'}
    : {background: w};

export const LockScreen: React.FC<LockScreenProps> = ({data, guestName, guestSubtitle, guestPhoto, message}) => {
  return (
    <AbsoluteFill style={{...wallpaperStyle(data.wallpaper), fontFamily: SF, overflow: 'hidden'}}>
      {/* status bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 132,
          padding: '0 56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
        }}
      >
        <span style={{fontFamily: SF, fontSize: 34, fontWeight: 600, letterSpacing: 0.2}}>{data.carrier}</span>
        <StatusRight battery={data.battery} charging={data.charging} />
      </div>

      {/* date + glass clock + notification, stacked from the top */}
      <div style={{position: 'absolute', top: 196, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <span style={{fontFamily: SF, fontSize: 40, fontWeight: 600, color: 'rgba(255,255,255,0.95)', letterSpacing: 0.3, marginBottom: 2}}>{TOP_LABEL}</span>
        <GlassClock time={data.time} />

        {/* Airbnb push — Liquid Glass banner, placed just BELOW the clock */}
        <div style={{width: 1080 - 72, marginTop: 40}}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 50,
            background: 'rgba(28,30,38,0.40)',
            backdropFilter: 'blur(60px) saturate(1.9) brightness(1.05)',
            WebkitBackdropFilter: 'blur(60px) saturate(1.9) brightness(1.05)',
            border: '1px solid rgba(255,255,255,0.28)',
            boxShadow:
              '0 24px 70px rgba(0,0,0,0.30), inset 0 1.5px 1px rgba(255,255,255,0.40), inset 0 -2px 3px rgba(255,255,255,0.06)',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 26,
          }}
        >
          {/* glassmorphism sheen — a soft diagonal highlight over the panel */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 50,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0) 56%, rgba(255,255,255,0.04) 100%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{position: 'relative', flexShrink: 0, width: 96, height: 96}}>
            <img
              src={resolveSrc(guestPhoto)}
              style={{width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', display: 'block'}}
              alt=""
            />
            <div
              style={{
                position: 'absolute',
                left: -6,
                bottom: -4,
                width: 46,
                height: 46,
                borderRadius: 12,
                background: '#FF385C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              }}
            >
              <AirbnbBelo size={30} />
            </div>
          </div>

          <div style={{flex: 1, minWidth: 0, color: '#fff'}}>
            <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
              <span style={{fontFamily: SF, fontSize: 38, fontWeight: 700, letterSpacing: -0.3}}>{guestName}</span>
              <span style={{fontFamily: SF, fontSize: 30, fontWeight: 500, color: 'rgba(235,235,240,0.55)', flexShrink: 0, marginLeft: 12}}>now</span>
            </div>
            <div style={{fontFamily: SF, fontSize: 36, fontWeight: 700, letterSpacing: -0.3, marginTop: 2}}>{guestSubtitle}</div>
            <div
              style={{
                fontFamily: SF,
                fontSize: 36,
                fontWeight: 400,
                color: 'rgba(238,238,242,0.92)',
                marginTop: 4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {message}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* bottom: flashlight + camera glass buttons, home indicator */}
      <div style={{position: 'absolute', bottom: 96, left: 72, right: 72, display: 'flex', justifyContent: 'space-between'}}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: 'rgba(40,42,48,0.45)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i === 0 ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
                <path d="M9 2h6l-1 4h-4L9 2zm1 5h4l-.4 13.2a1.6 1.6 0 0 1-3.2 0L10 7z" />
              </svg>
            ) : (
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', width: 360, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.85)'}} />
    </AbsoluteFill>
  );
};
