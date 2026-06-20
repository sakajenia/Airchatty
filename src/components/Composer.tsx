import React from 'react';
import {useCurrentFrame} from 'remotion';
import {theme} from '../util';

/**
 * The Airbnb message composer: a growing text field showing what the host has
 * typed so far (with a blinking caret), then a row of [+] [quick-reply] on the
 * left and the send button on the right — black/active when there's text.
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
        borderTop: `1px solid ${theme.hairline}`,
        background: theme.white,
        padding: '24px 36px 16px',
        fontFamily: theme.font,
        flexShrink: 0,
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
                background: '#007aff',
                transform: 'translateY(6px)',
                opacity: caretOn ? 1 : 0,
              }}
            />
          </span>
        ) : (
          'Write a message…'
        )}
      </div>

      <div style={{display: 'flex', alignItems: 'center', marginTop: 18}}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: `1px solid ${theme.hairline}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 22,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" stroke={theme.ink} strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="13" rx="3" />
          <path d="M7 10h10M7 14h6" />
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
  );
};
