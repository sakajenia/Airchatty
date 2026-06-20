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
