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

/** The iOS charging bolt (solid white), as it sits inside the battery body. */
const ChargeBolt: React.FC = () => (
  <svg width="13" height="19" viewBox="0 0 10 15" style={{display: 'block', marginTop: -1}}>
    <path
      fill="#fff"
      d="M5.62.32 0.42 8.06c-.22.33.02.77.42.77h2.4l-1.02 5.49c-.1.52.58.82.9.4l5.06-8.2c.2-.33-.04-.74-.43-.74H5.18L6.5.74c.13-.5-.55-.83-.88-.42Z"
    />
  </svg>
);

/**
 * Status-bar right cluster, redrawn to match the iOS 26 reference exactly:
 *  • cellular — four rounded bars, the strength shown by the two bright ones
 *    (the rest dimmed);
 *  • wi-fi — the solid white fan;
 *  • battery — the iOS 26 pill: a SOLID green body with the % and the charging
 *    bolt in white when charging, otherwise a translucent body with a white
 *    fill bar and a dark %, finished with the little terminal nub.
 */
const StatusRight: React.FC<{battery: number; charging: boolean}> = ({battery, charging}) => {
  const W = 60;
  const H = 28;
  const R = 9;
  const pad = 2.5;
  const fillW = Math.max(8, (Math.min(battery, 100) / 100) * (W - pad * 2));
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      {/* cellular — 2 bright bars + 2 dimmed (signal strength) */}
      <svg width="42" height="30" viewBox="0 0 42 30">
        {[0, 1, 2, 3].map((i) => {
          const h = 9 + i * 5.4;
          return <rect key={i} x={i * 11} y={28 - h} width="8" height={h} rx="3" fill="#fff" opacity={i < 2 ? 1 : 0.4} />;
        })}
      </svg>
      {/* wi-fi — solid fan */}
      <svg width="40" height="29" viewBox="0 0 30 22" fill="#fff">
        <path d="M15 4.3c4.3 0 8.2 1.7 11 4.5a1.4 1.4 0 0 1 0 2l-.4.4a1.3 1.3 0 0 1-1.85.02A12.4 12.4 0 0 0 15 7.7 12.4 12.4 0 0 0 6.25 11.2 1.3 1.3 0 0 1 4.4 11.2L4 10.8a1.4 1.4 0 0 1 0-2A15.6 15.6 0 0 1 15 4.3z" />
        <path d="M15 10.4c2.6 0 5 1 6.8 2.8a1.35 1.35 0 0 1-.02 1.95l-.43.42a1.25 1.25 0 0 1-1.77-.02A6.45 6.45 0 0 0 15 13.7a6.45 6.45 0 0 0-4.58 1.85 1.25 1.25 0 0 1-1.77.02l-.43-.42A1.35 1.35 0 0 1 8.2 13.2 9.6 9.6 0 0 1 15 10.4z" />
        <path d="M15 16.1c1.05 0 2.02.42 2.72 1.12a1.3 1.3 0 0 1 .03 1.8l-1.78 1.86a1.32 1.32 0 0 1-1.94 0l-1.78-1.86a1.3 1.3 0 0 1 .03-1.8A3.83 3.83 0 0 1 15 16.1z" />
      </svg>
      {/* battery */}
      <div style={{display: 'flex', alignItems: 'center'}}>
        <div
          style={{
            position: 'relative',
            width: W,
            height: H,
            borderRadius: R,
            boxSizing: 'border-box',
            background: charging ? '#34c759' : 'rgba(255,255,255,0.16)',
            border: charging ? 'none' : '2px solid rgba(255,255,255,0.55)',
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
                background: battery <= 20 ? '#ff453a' : '#fff',
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
              fontSize: battery >= 100 ? 16 : 19.5,
              fontWeight: 700,
              letterSpacing: -1.2,
              color: charging ? '#fff' : '#0b0b0d',
            }}
          >
            <span>{battery}</span>
            {charging && <ChargeBolt />}
          </div>
        </div>
        {/* terminal nub */}
        <div style={{width: 3.5, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.5)', marginLeft: 2.5}} />
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
      {/* same liquid-glass style as the notification: displacement (#lg-filter)
          + blur + saturate/brightness/contrast, on a light translucent tint,
          clipped to the digits (mask uses the real font, so no double text) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(2px) url(#lg-filter) blur(5px) saturate(1.7) brightness(1.12) contrast(1.04)',
          WebkitBackdropFilter: 'blur(9px) saturate(1.8) brightness(1.15) contrast(1.05)',
          background: 'rgba(255,255,255,0.12)',
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
            borderRadius: 34,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(3px) url(#lg-filter) blur(18px) saturate(1.7) brightness(1.12) contrast(1.04)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.8) brightness(1.15) contrast(1.05)',
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
            {/* the real Airbnb app tile (vectorlogo.zone), 46×46 */}
            <svg
              width={46}
              height={46}
              viewBox="0 0 512 512"
              style={{position: 'absolute', left: -6, bottom: -4, borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.35)'}}
            >
              <rect width="512" height="512" rx="15%" fill="#ff5a5f" />
              <path
                fill="none"
                stroke="#fff"
                strokeWidth="23"
                strokeLinejoin="round"
                d="m255 83.7c-29 .1-40.6 23.9-40.6 23.9-36.2 66.5-70 134.2-101.2 203.2-17.2 38-4.6 68.2 14.8 84.5 36.8 31 82 13.4 126.5-38.7 34.3-40 49.8-73.2 48.3-100.6-1.3-23.9-15.8-43.7-47.9-43.7-47.3-.2-48.3 44.6-48.5 43.7 0 46.6 42.8 93.5 56 108.6 13.3 15.1 70.8 73.4 121.5 30 37.7-32.1 13.1-83.8 13.1-83.8-30.6-67.6-51-111.5-99.9-203.2 0 0-10.6-24-42.2-24v.1z"
              />
            </svg>
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
