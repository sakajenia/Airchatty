import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {theme} from '../util';
import {LockScreenData} from '../lockscreen';
import {clockFont} from '../clockfont';
import {uiFont} from '../uifont';
import {StatusBarRight} from './StatusIcons';

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
 * Build the Liquid Glass clock artwork from the REAL clock font via canvas.
 * The layer recipe follows the iOS GlassKit surface stack (GlassStyle.swift of
 * the liquid-glass-ios-system reference), minus the drop shadow (per request):
 *   1. frosted body — ultraThinMaterial ≈ backdrop blur + light tint (masked)
 *   2. lens highlight — radial white ~14% → clear from top-leading, soft-light
 *   3. edge stroke  — 1px white ~18–70%, brighter on top (light direction)
 * Returns data-URLs: the digit `mask`, the `highlight` and `edge`.
 */
const buildClockGlass = (time: string): {mask: string; highlight: string; edge: string} => {
  if (typeof document === 'undefined') return {mask: '', highlight: '', edge: ''};
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

  // (1) the digit shapes (mask for the frosted body)
  const [shapeC, s] = make();
  setup(s);
  s.fillStyle = '#fff';
  s.fillText(time, W / 2, H / 2);
  const mask = shapeC.toDataURL();

  // (2) lens highlight: radial white → clear from the top-leading corner of
  // the text block, kept inside the glyphs (blended soft-light in CSS).
  const [hiC, hi] = make();
  setup(hi);
  const grad = hi.createRadialGradient(W * 0.22, H * 0.05, W * 0.02, W * 0.22, H * 0.05, W * 0.72);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  hi.fillStyle = grad;
  hi.fillText(time, W / 2, H / 2);
  const highlight = hiC.toDataURL();

  // (3) edge stroke: thin rim, brighter where the light comes from (top),
  // fading toward the bottom — no uniform neon glow.
  const [edC, ed] = make();
  setup(ed);
  const rim = ed.createLinearGradient(0, H * 0.12, 0, H * 0.88);
  rim.addColorStop(0, 'rgba(255,255,255,0.85)');
  rim.addColorStop(0.5, 'rgba(255,255,255,0.38)');
  rim.addColorStop(1, 'rgba(255,255,255,0.55)');
  ed.lineWidth = 2.6;
  ed.strokeStyle = rim;
  ed.strokeText(time, W / 2, H / 2);
  const edge = edC.toDataURL();

  return {mask, highlight, edge};
};

/**
 * The lock clock: one coherent Liquid Glass digit string — a refractive
 * frosted body clipped to the digits, a top-leading lens highlight
 * (soft-light) and a directional 1px rim. All from the same real font.
 */
const GlassClock: React.FC<{time: string}> = ({time}) => {
  const art = React.useMemo(() => buildClockGlass(time), [time]);
  const maskProps: React.CSSProperties = {
    WebkitMaskImage: `url(${art.mask})`,
    maskImage: `url(${art.mask})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };
  const layer: React.CSSProperties = {position: 'absolute', inset: 0};

  return (
    <div style={{width: CLOCK_W, height: CLOCK_H0, position: 'relative'}}>
      {/* 1 · frosted refractive body (ultraThinMaterial + displacement), masked
             to the digits — a LIGHT tint so the wallpaper shows through */}
      <div
        style={{
          ...layer,
          backdropFilter: 'blur(3px) url(#lg-filter) blur(11px) saturate(1.65) brightness(1.08)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.65) brightness(1.08)',
          background: 'rgba(255,255,255,0.10)',
          ...maskProps,
        }}
      />
      {/* 2 · lens highlight, soft-light so it reads as light on glass */}
      {art.highlight ? (
        <img src={art.highlight} width={CLOCK_W} height={CLOCK_H0} style={{...layer, mixBlendMode: 'soft-light', opacity: 0.95}} alt="" />
      ) : null}
      {/* 3 · directional 1px rim */}
      {art.edge ? <img src={art.edge} width={CLOCK_W} height={CLOCK_H0} style={layer} alt="" /> : null}
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
  // Notification text adapts to the wallpaper: light/white on a dark background,
  // dark on a light one — so it's always readable through the glass.
  const dark = data.darkWallpaper;
  const notif = {
    title: dark ? '#ffffff' : '#1b1b1f',
    body: dark ? 'rgba(255,255,255,0.92)' : 'rgba(28,28,34,0.82)',
    meta: dark ? 'rgba(255,255,255,0.6)' : 'rgba(40,40,50,0.5)',
    shadow: dark ? '0 1px 2px rgba(0,0,0,0.35)' : '0 1px 1px rgba(255,255,255,0.35)',
  };
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
        <StatusBarRight tone="light" bars={data.signal} battery={data.battery} charging={data.charging} />
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
            {guestPhoto ? (
              <img
                src={resolveSrc(guestPhoto)}
                style={{width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', display: 'block'}}
                alt=""
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: '#c9ccd1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 46,
                  fontWeight: 600,
                  fontFamily: SF,
                }}
              >
                {(guestName || '?').trim().charAt(0).toUpperCase()}
              </div>
            )}
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

          <div style={{flex: 1, minWidth: 0, color: notif.title}}>
            <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
              <span style={{fontFamily: SF, fontSize: 38, fontWeight: 700, letterSpacing: -0.3, textShadow: notif.shadow}}>{guestName}</span>
              <span style={{fontFamily: SF, fontSize: 30, fontWeight: 500, color: notif.meta, flexShrink: 0, marginLeft: 12}}>now</span>
            </div>
            <div style={{fontFamily: SF, fontSize: 36, fontWeight: 700, letterSpacing: -0.3, marginTop: 2, textShadow: notif.shadow}}>{guestSubtitle}</div>
            <div
              style={{
                fontFamily: SF,
                fontSize: 36,
                fontWeight: 400,
                color: notif.body,
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
