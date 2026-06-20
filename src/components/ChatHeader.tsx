import React from 'react';
import {theme} from '../util';
import {Avatar} from './Avatar';

/** iPhone status bar with the Dynamic Island. */
export const StatusBar: React.FC = () => (
  <div
    style={{
      height: 104,
      padding: '0 52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: theme.font,
      color: theme.ink,
      position: 'relative',
    }}
  >
    {/* time + silenced bell */}
    <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 34, fontWeight: 600}}>
      <span>13:37</span>
      <svg width="26" height="26" viewBox="0 0 24 24" fill={theme.ink}>
        <path d="M12 3a6 6 0 0 0-6 6v3.6l-1.5 2.4A1 1 0 0 0 5.3 17h13.4a1 1 0 0 0 .8-1.6L18 13V9a6 6 0 0 0-6-6zm0 17a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 20z" />
        <path d="M2 4l18 16" stroke={theme.ink} strokeWidth="1.6" />
      </svg>
    </div>

    {/* Dynamic Island */}
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 22,
        transform: 'translateX(-50%)',
        width: 264,
        height: 74,
        background: '#000',
        borderRadius: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <div style={{width: 26, height: 26, borderRadius: 13, background: '#f5a623'}} />
      <div style={{width: 18, height: 18, borderRadius: 9, background: '#1c1c1c'}} />
    </div>

    {/* signal · 5G · battery */}
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 5, height: 26}}>
        {[12, 17, 22, 26].map((h, i) => (
          <div key={i} style={{width: 7, height: h, background: theme.ink, borderRadius: 2}} />
        ))}
      </div>
      <span style={{fontSize: 30, fontWeight: 600}}>5G</span>
      <div
        style={{
          width: 50,
          height: 26,
          border: `2px solid ${theme.ink}`,
          borderRadius: 7,
          padding: 3,
          position: 'relative',
        }}
      >
        <div style={{width: '85%', height: '100%', background: theme.ink, borderRadius: 2}} />
        <div
          style={{position: 'absolute', right: -6, top: 8, width: 3, height: 10, background: theme.ink, borderRadius: 2}}
        />
      </div>
    </div>
  </div>
);

export type Participant = {name: string; src: string};

const AvatarCluster: React.FC<{participants: Participant[]}> = ({participants}) => {
  const size = 76;
  return (
    <div style={{display: 'flex', alignItems: 'center'}}>
      {participants.slice(0, 3).map((p, i) => (
        <div
          key={i}
          style={{
            marginLeft: i === 0 ? 0 : -22,
            borderRadius: '50%',
            border: `3px solid ${theme.white}`,
            zIndex: participants.length - i,
          }}
        >
          <Avatar name={p.name} src={p.src} size={size} />
        </div>
      ))}
    </div>
  );
};

export const ChatHeader: React.FC<{
  title: string;
  subtitle: string;
  participants: Participant[];
}> = ({title, subtitle, participants}) => {
  return (
    <div
      style={{
        background: theme.white,
        borderBottom: `1px solid ${theme.hairline}`,
        padding: '4px 0 26px',
        fontFamily: theme.font,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* back · avatar cluster · Details */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 84,
        }}
      >
        <svg
          style={{position: 'absolute', left: 44}}
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.ink}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>

        <AvatarCluster participants={participants} />

        <div
          style={{
            position: 'absolute',
            right: 44,
            border: `1px solid ${theme.hairline}`,
            borderRadius: 40,
            padding: '12px 30px',
            fontSize: 28,
            fontWeight: 600,
            color: theme.ink,
            background: theme.white,
          }}
        >
          Details
        </div>
      </div>

      <div style={{fontSize: 36, fontWeight: 700, color: theme.ink, marginTop: 14, letterSpacing: -0.3}}>
        {title}
      </div>
      <div style={{fontSize: 27, fontWeight: 500, color: theme.ash, marginTop: 7}}>{subtitle}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 9, color: theme.ash}}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.ash} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h7M7.5 5c0 4-2 7-5 8.5M5 9c0 2.5 2.5 4.5 5.5 5.5" />
          <path d="M13 19l4-9 4 9M14.5 16h5" />
        </svg>
        <span style={{fontSize: 24, fontWeight: 500}}>Translation on</span>
      </div>
    </div>
  );
};
