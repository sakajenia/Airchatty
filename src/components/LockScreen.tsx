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

// SF Pro COMPRESSED Medium is naturally tall & narrow, so NO stretch is used.
const CLOCK_FS = 630; // glyph size (fits the screen width with margins)
const CLOCK_LS = -8; // letter spacing
const CLOCK_WT = 400; // the embedded instance is already Medium
const CLOCK_H0 = 540; // box height (contains the tall glyphs)
const CLOCK_W = 1080;

/**
 * Build the glass artwork from the REAL clock font via canvas (so it matches the
 * font everywhere — the old data-URI SVG mask silently fell back to a different
 * font, which is what produced the overlapping "double" text). Returns:
 *  • `mask` — white digit shapes, used to clip the frosted backdrop fill;
 *  • `glow` — the inner white glow + 1px border (the provided glassmorphism
 *             `inset 0 0 28px 14px` + `border`), drawn on the SAME shape.
 */
const buildClockGlass = (time: string): {mask: string; glow: string} => {
  if (typeof document === 'undefined') return {mask: '', glow: ''};
  const W = CLOCK_W;
  const H = CLOCK_H0;
  const font = `${CLOCK_WT} ${CLOCK_FS}px '${clockFont}', sans-serif`;
  const setup = (ctx: CanvasRenderingContext2D) => {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // @ts-expect-error letterSpacing is supported in Chromium canvas
    ctx.letterSpacing = `${CLOCK_LS}px`;
  };
  const make = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return [c, c.getContext('2d') as CanvasRenderingContext2D] as const;
  };

  // (1) the digit shapes
  const [shapeC, s] = make();
  setup(s);
  s.fillStyle = '#fff';
  s.fillText(time, W / 2, H / 2);
  const mask = shapeC.toDataURL();

  // (2) inner glow: white everywhere EXCEPT the digits, blurred, then kept only
  // inside the digits → a glow that hugs the inner edges.
  const [outC, o] = make();
  o.fillStyle = '#fff';
  o.fillRect(0, 0, W, H);
  o.globalCompositeOperation = 'destination-out';
  o.drawImage(shapeC, 0, 0);

  const [glowC, g] = make();
  g.filter = 'blur(14px)';
  g.drawImage(outC, 0, 0);
  g.filter = 'none';
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(shapeC, 0, 0);
  // intensify the glow (the spec's 1.4 alpha is very strong)
  g.globalCompositeOperation = 'lighter';
  g.drawImage(glowC, 0, 0);
  // 1px glass border
  g.globalCompositeOperation = 'source-over';
  setup(g);
  g.lineWidth = 2.4;
  g.strokeStyle = 'rgba(255,255,255,0.5)';
  g.strokeText(time, W / 2, H / 2);
  const glow = glowC.toDataURL();

  return {mask, glow};
};

/**
 * The lock clock: one coherent glass digit string. A backdrop-blur + light
 * translucent fill clipped to the digit shapes, plus the inner glow + border —
 * all derived from the same real font. No stretch, no overlapping text.
 */
const GlassClock: React.FC<{time: string}> = ({time}) => {
  const {mask: maskUrl, glow: glowUrl} = React.useMemo(() => buildClockGlass(time), [time]);
  const maskProps: React.CSSProperties = {
    WebkitMaskImage: `url(${maskUrl})`,
    maskImage: `url(${maskUrl})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };

  return (
    <div style={{width: CLOCK_W, height: CLOCK_H0, position: 'relative'}}>
      {/* frosted translucent fill: backdrop blur(9px) + rgba(255,255,255,0.14),
          clipped to the digits (mask uses the real font, so no double text) */}
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
      {/* inner white glow + border, on the exact same shape */}
      {glowUrl ? <img src={glowUrl} width={CLOCK_W} height={CLOCK_H0} style={{position: 'absolute', inset: 0}} alt="" /> : null}
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
        <span style={{fontFamily: SF, fontSize: 40, fontWeight: 600, color: 'rgba(255,255,255,0.95)', letterSpacing: 0.3, marginBottom: 18}}>{TOP_LABEL}</span>
        <GlassClock time={data.time} />

        {/* the liquid-glass displacement filter for the notification */}
        <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
          <filter id="lg-filter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="2" seed="7" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="1.1" result="sm" />
            <feDisplacementMap in="SourceGraphic" in2="sm" scale="16" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {/* Airbnb push — Liquid Glass banner (provided spec), below the clock */}
        <div style={{width: 1080 - 72, marginTop: 40}}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 44,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(1px) url(#lg-filter) blur(2px) saturate(1.6) brightness(1.12) contrast(1.04)',
            WebkitBackdropFilter: 'blur(8px) saturate(1.8) brightness(1.15) contrast(1.05)',
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,0.15), inset 1.5px 1.5px 0 rgba(255,255,255,0.5), inset 0 0 12px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.2)',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 26,
          }}
        >
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

          <div style={{flex: 1, minWidth: 0, color: '#1b1b1f'}}>
            <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
              <span style={{fontFamily: SF, fontSize: 38, fontWeight: 700, letterSpacing: -0.3, textShadow: '0 1px 1px rgba(255,255,255,0.35)'}}>{guestName}</span>
              <span style={{fontFamily: SF, fontSize: 30, fontWeight: 500, color: 'rgba(40,40,50,0.5)', flexShrink: 0, marginLeft: 12}}>now</span>
            </div>
            <div style={{fontFamily: SF, fontSize: 36, fontWeight: 700, letterSpacing: -0.3, marginTop: 2, textShadow: '0 1px 1px rgba(255,255,255,0.35)'}}>{guestSubtitle}</div>
            <div
              style={{
                fontFamily: SF,
                fontSize: 36,
                fontWeight: 400,
                color: 'rgba(28,28,34,0.82)',
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
