import React from 'react';
import {useCurrentFrame} from 'remotion';
import {theme} from '../util';
import {EmojiText} from './EmojiText';

/**
 * The Airbnb message composer: a rounded hairline-bordered white card holding the
 * text the host has typed (blinking caret) and the [+] / quick-reply / send
 * controls. When a guest is typing, a separate light-grey pill — "… {name} sta
 * scrivendo" with bobbing dots — slides up from BEHIND the card and reserves
 * its own space (the chat above is pushed up, never overlapped). Colours and
 * sizes measured pixel-by-pixel from the reference (strip #f6f6f6, text #767676,
 * dots #000, dot ⌀7px, ~7px bob, ~1.1s loop; pill ≈ card width, ~92px exposed).
 */
export const Composer: React.FC<{
  text: string;
  sendActive: boolean;
  typingName?: string;
  /** Frame the guest's typing started — drives the strip's slide-up entrance. */
  typingStartFrame?: number;
}> = ({text, sendActive, typingName, typingStartFrame}) => {
  const frame = useCurrentFrame();

  // Typing dots: small solid-black dots, staggered vertical travelling wave.
  const PERIOD = 33; // ~1.1s loop at 30fps
  const AMP = 3.5; // 7px peak-to-peak
  const STAGGER = 1.2; // radians between adjacent dots (dot 0 leads)
  const dotY = (i: number) => -AMP * Math.sin((frame / PERIOD) * 2 * Math.PI - i * STAGGER);

  // Entrance: the pill slides up from behind the card over ~0.33s (ease-out).
  const ENTER = 10;
  const eP = typingStartFrame == null ? 1 : Math.max(0, Math.min(1, (frame - typingStartFrame) / ENTER));
  const eEase = 1 - Math.pow(1 - eP, 3);

  // Geometry measured pixel-by-pixel from the reference (scaled by card-width
  // ratio 0.787 from the 1320px crop to this 1080px canvas):
  //  • the pill is ~the full card width, inset only ~8px each side;
  //  • ~92px of it shows above the white card, the rest tucks behind it;
  //  • the text sits centred in that exposed band.
  // Crucially the pill lives in NORMAL FLOW (a spacer of its exposed height),
  // so the whole composer grows and the chat above is pushed up — it never
  // overlaps the timestamps / read-receipts.
  const EXPOSED = 88; // visible band height above the input row (~30px @384)
  const TUCK = 40; // px hidden behind the input row (≥ radius, so bottom corners vanish)
  const PILL_H = EXPOSED + TUCK;
  const PILL_R = 40; // top-corner radius (matches the composer card)

  // The "sta scrivendo" strip is a FULL-WIDTH band, edge to edge (measured from
  // the reference: it spans the whole screen width, x=0 → the right edge), light
  // grey with gently rounded top corners — NOT an inset pill.
  const typingArea = typingName ? (
    <div style={{height: EXPOSED * eEase, position: 'relative'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: PILL_H,
          boxSizing: 'border-box',
          paddingBottom: TUCK, // centres the content in the EXPOSED band, not the whole pill
          background: '#f4f4f4',
          borderTopLeftRadius: PILL_R,
          borderTopRightRadius: PILL_R,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          zIndex: 0,
          transform: `translateY(${(1 - eEase) * PILL_H}px)`, // rises from behind the input row
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 5, height: 16}}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{width: 7, height: 7, borderRadius: '50%', background: '#000', transform: `translateY(${dotY(i)}px)`}}
            />
          ))}
        </div>
        <span style={{fontSize: 32, fontWeight: 500, color: '#767676'}}>{typingName} sta scrivendo…</span>
      </div>
    </div>
  ) : null;

  // The field is always focused while the keyboard is up, so the caret blinks.
  const caretOn = Math.floor(frame / 16) % 2 === 0;
  const caret = (
    <span
      style={{
        display: 'inline-block',
        width: 4,
        height: 52,
        background: theme.ink,
        transform: 'translateY(10px)',
        opacity: caretOn ? 1 : 0,
      }}
    />
  );

  return (
    // ONE white panel: rounded TOP corners only, its bottom FLUSH against the
    // keyboard (no gap, no divider). A faint upward shadow defines the top edge
    // and the rounded corners — there are no side lines.
    <div
      style={{
        background: theme.white,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.045)',
        // no horizontal padding on the card itself, so the full-width typing
        // band can reach the screen edges; the input row carries its own inset
        fontFamily: theme.font,
        flexShrink: 0,
      }}
    >
      <div style={{position: 'relative'}}>
        {typingArea}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '40px 34px 30px',
            background: theme.white,
          }}
        >
          <div style={{fontSize: 44, lineHeight: 1.35, color: theme.ink, minHeight: 56}}>
            {text ? (
              <span>
                <EmojiText text={text} />
                {caret}
              </span>
            ) : (
              <span>
                {caret}
                <span style={{color: '#727272'}}>Write a message…</span>
              </span>
            )}
          </div>

          <div style={{display: 'flex', alignItems: 'center', marginTop: 20}}>
            <div
              style={{
                width: 86,
                height: 86,
                borderRadius: '50%',
                background: '#f4f4f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 40,
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" stroke="#444444" strokeWidth="2.1" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            {/* quick-replies / saved messages: two overlapping speech bubbles —
                near-black but THIN strokes, ~55px wide (measured from reference) */}
            <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8.7" y="3.5" width="11.8" height="9" rx="2.6" fill={theme.white} />
              <path
                d="M5.6 7h7.5a2.6 2.6 0 0 1 2.6 2.6v3.8a2.6 2.6 0 0 1-2.6 2.6h-2.5l-1.5 2.1-1.5-2.1H5.6A2.6 2.6 0 0 1 3 13.4V9.6A2.6 2.6 0 0 1 5.6 7z"
                fill={theme.white}
              />
              <path d="M6 10.4h6M6 12.9h3.8" />
            </svg>

            <div style={{flex: 1}} />

            <div
              style={{
                width: 86,
                height: 86,
                borderRadius: '50%',
                // empty → very light grey (no border); with text → solid dark
                background: sendActive ? theme.ink : '#f4f4f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={sendActive ? '#fff' : '#dcdcdc'} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
