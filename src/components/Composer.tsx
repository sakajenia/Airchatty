import React from 'react';
import {useCurrentFrame} from 'remotion';
import {theme} from '../util';

/**
 * The Airbnb message composer: a rounded hairline-bordered card holding the
 * text the host has typed (with a blinking black caret) and, beneath it, the
 * [+] [quick-reply] controls on the left and the send button on the right —
 * black/active when there's text. Matches the reference screen recording.
 */
export const Composer: React.FC<{
  text: string;
  active: boolean; // host is currently typing (show caret)
  sendActive: boolean;
}> = ({text, active, sendActive}) => {
  const frame = useCurrentFrame();
  const caretOn = active && Math.floor(frame / 16) % 2 === 0;

  return (
    <div
      style={{
        background: 'rgba(252,252,253,0.86)',
        backdropFilter: 'blur(30px) saturate(160%)',
        WebkitBackdropFilter: 'blur(30px) saturate(160%)',
        padding: '14px 24px 18px',
        fontFamily: theme.font,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          border: `1px solid ${theme.hairline}`,
          borderRadius: 34,
          padding: '26px 30px 22px',
          background: theme.white,
        }}
      >
        <div style={{fontSize: 32, lineHeight: 1.4, color: text ? theme.ink : theme.mute, minHeight: 44}}>
          {text ? (
            <span>
              {text}
              <span
                style={{
                  display: 'inline-block',
                  width: 3,
                  height: 38,
                  marginLeft: 2,
                  background: theme.ink,
                  transform: 'translateY(6px)',
                  opacity: caretOn ? 1 : 0,
                }}
              />
            </span>
          ) : (
            'Write a message…'
          )}
        </div>

        <div style={{display: 'flex', alignItems: 'center', marginTop: 20}}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: '50%',
              background: theme.softCloud,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 26,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" stroke={theme.ink} strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          {/* quick-replies: two overlapping speech bubbles */}
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4h8a1.6 1.6 0 0 1 1.6 1.6V11" opacity="0.9" />
            <path d="M4.5 7.5h9A1.6 1.6 0 0 1 15 9v5a1.6 1.6 0 0 1-1.6 1.6H8.2l-2.7 2.3v-2.3H4.5A1.6 1.6 0 0 1 3 14V9a1.6 1.6 0 0 1 1.5-1.5z" />
            <path d="M6 11h6M6 13.4h4" />
          </svg>

          <div style={{flex: 1}} />

          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: sendActive ? theme.ink : theme.softCloud,
              border: sendActive ? 'none' : `1px solid ${theme.hairline}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sendActive ? '#fff' : theme.mute} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
