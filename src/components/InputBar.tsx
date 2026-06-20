import React from 'react';
import {theme} from '../util';

/** Static composer (non-keyboard mode) — matches the Airbnb message bar. */
export const InputBar: React.FC = () => (
  <div style={{background: theme.white, padding: '14px 24px 30px', fontFamily: theme.font, flexShrink: 0}}>
    <div style={{border: `1px solid ${theme.hairline}`, borderRadius: 34, padding: '26px 30px 22px'}}>
      <div style={{fontSize: 32, color: theme.mute, minHeight: 44}}>Write a message…</div>
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
            background: theme.softCloud,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.mute} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);
