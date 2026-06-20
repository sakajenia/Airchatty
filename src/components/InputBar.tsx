import React from 'react';
import {theme} from '../util';

/** Non-functional message composer that completes the Airbnb messaging look. */
export const InputBar: React.FC = () => (
  <div
    style={{
      borderTop: `1px solid ${theme.hairline}`,
      background: theme.white,
      padding: '20px 36px 44px',
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      fontFamily: theme.font,
    }}
  >
    {/* + in a circle */}
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        border: `1px solid ${theme.hairline}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.ink,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" stroke={theme.ink} strokeWidth="2" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </div>

    {/* quick-replies icon */}
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="13" rx="3" />
      <path d="M7 10h10M7 14h6" />
    </svg>

    <div style={{flex: 1, fontSize: 32, color: theme.mute}}>Write a message…</div>

    {/* send arrow (muted when empty) */}
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: theme.softCloud,
        border: `1px solid ${theme.hairline}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={theme.mute} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </div>
  </div>
);
