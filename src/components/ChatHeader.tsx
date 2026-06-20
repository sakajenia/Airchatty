import React from 'react';
import {theme, initialsFromName, avatarColor} from '../util';

const Avatar: React.FC<{name: string; src: string; size: number}> = ({name, src, size}) => {
  if (src) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        style={{borderRadius: size, objectFit: 'cover', display: 'block'}}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: avatarColor(name),
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.4,
        fontFamily: theme.font,
      }}
    >
      {initialsFromName(name)}
    </div>
  );
};

/** iOS-style status bar (time, signal, wifi, battery). */
export const StatusBar: React.FC = () => (
  <div
    style={{
      height: 64,
      padding: '0 44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: theme.font,
      color: '#000',
      fontSize: 30,
      fontWeight: 600,
    }}
  >
    <span>9:41</span>
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
      {/* signal */}
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 4, height: 22}}>
        {[10, 14, 18, 22].map((h, i) => (
          <div key={i} style={{width: 6, height: h, background: '#000', borderRadius: 2}} />
        ))}
      </div>
      {/* wifi */}
      <svg width="34" height="24" viewBox="0 0 34 24" fill="#000">
        <path d="M17 4C10.5 4 5 7 1 11l3 3c3.5-3.4 8-5.5 13-5.5s9.5 2.1 13 5.5l3-3C29 7 23.5 4 17 4z" opacity="0.9" />
        <path d="M17 12c-3.3 0-6.3 1.4-8.5 3.6L11 18c1.6-1.6 3.7-2.5 6-2.5s4.4.9 6 2.5l2.5-2.4C23.3 13.4 20.3 12 17 12z" />
        <circle cx="17" cy="20.5" r="2.5" />
      </svg>
      {/* battery */}
      <div
        style={{
          width: 46,
          height: 24,
          border: '2px solid #000',
          borderRadius: 6,
          padding: 2,
          position: 'relative',
        }}
      >
        <div style={{width: '80%', height: '100%', background: '#000', borderRadius: 2}} />
        <div
          style={{
            position: 'absolute',
            right: -5,
            top: 7,
            width: 3,
            height: 10,
            background: '#000',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  </div>
);

export const ChatHeader: React.FC<{name: string; avatar: string}> = ({name, avatar}) => {
  // Split a label like "Maria · Lisbon Host" into a name + subtitle.
  const [primary, ...rest] = name.split(/\s*[·|]\s*/);
  const subtitle = rest.join(' · ');
  return (
    <div
      style={{
        background: theme.headerBg,
        borderBottom: `1px solid ${theme.hairline}`,
        padding: '10px 28px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        fontFamily: theme.font,
      }}
    >
      {/* back chevron + Airbnb accent */}
      <div style={{fontSize: 48, color: theme.rausch, fontWeight: 300, lineHeight: 1}}>‹</div>
      <Avatar name={name} src={avatar} size={88} />
      <div style={{display: 'flex', flexDirection: 'column', flex: 1, gap: 4}}>
        <div style={{fontSize: 38, fontWeight: 700, color: '#1A1A1A'}}>{primary}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <div style={{width: 16, height: 16, borderRadius: 8, background: theme.online}} />
          <span style={{fontSize: 26, color: theme.subtle}}>
            {subtitle ? `${subtitle} · Active now` : 'Active now'}
          </span>
        </div>
      </div>
      {/* Airbnb-style call/video icon */}
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={theme.rausch} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="13" height="12" rx="3" />
        <path d="M15 10l6-3.5v11L15 14" />
      </svg>
    </div>
  );
};
