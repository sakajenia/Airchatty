import React from 'react';
import {theme} from '../util';

/** A non-functional message input bar to complete the messaging-app look. */
export const InputBar: React.FC = () => (
  <div
    style={{
      borderTop: `1px solid ${theme.hairline}`,
      background: theme.headerBg,
      padding: '20px 28px 40px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      fontFamily: theme.font,
    }}
  >
    <div style={{fontSize: 50, color: theme.subtle, lineHeight: 1}}>+</div>
    <div
      style={{
        flex: 1,
        height: 72,
        borderRadius: 36,
        border: `1px solid ${theme.hairline}`,
        background: '#F6F6F8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        color: theme.subtle,
        fontSize: 30,
      }}
    >
      Message…
    </div>
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        background: theme.rausch,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </div>
  </div>
);
