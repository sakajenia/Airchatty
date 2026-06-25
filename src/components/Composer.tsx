import React from 'react';
import {useCurrentFrame} from 'remotion';
import {theme} from '../util';
import {EmojiText} from './EmojiText';

/**
 * The Airbnb message composer: a rounded hairline-bordered card holding the
 * text the host has typed (with a blinking black caret) and, beneath it, the
 * [+] [quick-reply] controls on the left and the send button on the right —
 * black/active when there's text. Matches the reference screen recording.
 */
export const Composer: React.FC<{
  text: string;
  sendActive: boolean;
}> = ({text, sendActive}) => {
  const frame = useCurrentFrame();
  // The field is always focused while the keyboard is up, so the caret blinks
  // even when empty (at the start, before the placeholder) — like the app.
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
        background: 'rgba(252,252,253,0.86)',
        backdropFilter: 'blur(30px) saturate(160%)',
        WebkitBackdropFilter: 'blur(30px) saturate(160%)',
        padding: '10px 22px 12px',
        fontFamily: theme.font,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          border: `1px solid ${theme.hairline}`,
          borderRadius: 38,
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
          {/* quick-replies / saved messages: two overlapping speech bubbles */}
          <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
              background: sendActive ? theme.ink : theme.softCloud,
              border: sendActive ? 'none' : `1px solid ${theme.hairline}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={sendActive ? '#fff' : theme.mute} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
