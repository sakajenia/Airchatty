import React from 'react';
import {theme} from '../util';

/** Static composer (non-keyboard mode) — matches the Airbnb message bar. */
export const InputBar: React.FC = () => (
  <div style={{background: theme.white, padding: '10px 22px 28px', fontFamily: theme.font, flexShrink: 0}}>
    <div style={{border: `1px solid ${theme.hairline}`, borderRadius: 38, padding: '22px 32px 18px'}}>
      <div style={{fontSize: 44, color: theme.mute, minHeight: 56}}>Write a message…</div>
      <div style={{display: 'flex', alignItems: 'center', marginTop: 20}}>
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: theme.softCloud,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 32,
          }}
        >
          <svg width="46" height="46" viewBox="0 0 24 24" stroke={theme.ink} strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4.5h7.5A1.7 1.7 0 0 1 20.2 6.2V11.5" />
          <path d="M4.6 7.5h8.8A1.7 1.7 0 0 1 15.1 9.2v4.6a1.7 1.7 0 0 1-1.7 1.7H8l-2.6 2.2v-2.2h-.8A1.7 1.7 0 0 1 2.9 13.8V9.2A1.7 1.7 0 0 1 4.6 7.5z" />
          <path d="M5.8 11h6.4M5.8 13.2h4.2" />
        </svg>
        <div style={{flex: 1}} />
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: theme.softCloud,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={theme.mute} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);
