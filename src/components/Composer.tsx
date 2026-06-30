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
  const EXPOSED = 92; // visible pill height above the card
  const TUCK = 38; // px hidden behind the card (≥ radius, so bottom corners vanish)
  const PILL_H = EXPOSED + TUCK;
  const PILL_R = 36; // top-corner radius
  const PILL_INSET = 8; // each side, relative to the card edges

  const typingArea = typingName ? (
    <div style={{height: EXPOSED * eEase, position: 'relative'}}>
      <div
        style={{
          position: 'absolute',
          left: PILL_INSET,
          right: PILL_INSET,
          top: 0,
          height: PILL_H,
          boxSizing: 'border-box',
          paddingBottom: TUCK, // centres the content in the EXPOSED band, not the whole pill
          background: '#f6f6f6',
          borderRadius: PILL_R,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          zIndex: 0,
          transform: `translateY(${(1 - eEase) * PILL_H}px)`, // rises from behind the card
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
    <div
      style={{
        background: theme.white,
        padding: '8px 22px 16px',
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
            // light, subtle rounded border (no hard divider toward the keyboard)
            border: '1px solid #ececec',
            borderRadius: 34,
            padding: '22px 32px 18px',
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
                <span style={{color: theme.mute}}>Write a message…</span>
              </span>
            )}
          </div>

          <div style={{display: 'flex', alignItems: 'center', marginTop: 20}}>
            <div
              style={{
                width: 86,
                height: 86,
                borderRadius: '50%',
                background: theme.softCloud,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 40,
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" stroke={theme.ink} strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            {/* quick-replies / saved messages: two overlapping speech bubbles —
                thin, grey strokes (not heavy black), per the reference */}
            <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
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
                background: sendActive ? theme.ink : '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={sendActive ? '#fff' : '#c4c4c8'} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
