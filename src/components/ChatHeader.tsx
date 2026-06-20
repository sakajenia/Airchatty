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

export type HeaderAvatar = {name: string; src: string};

// Airbnb group cluster, measured from the reference: the photos sit side by
// side and just *touch* (the right one raised), each fully visible — they do
// NOT cover one another. A letter avatar tucks into the bottom-right.
const CLUSTERS: Record<number, {size: number; x: number; y: number}[]> = {
  1: [{size: 96, x: 33, y: 14}],
  2: [{size: 90, x: 0, y: 20}, {size: 80, x: 84, y: 0}],
  3: [{size: 90, x: 0, y: 23}, {size: 78, x: 84, y: 0}, {size: 47, x: 106, y: 76}],
  4: [{size: 90, x: 0, y: 23}, {size: 78, x: 84, y: 0}, {size: 47, x: 106, y: 76}, {size: 47, x: 48, y: 80}],
};

const AvatarCluster: React.FC<{participants: HeaderAvatar[]}> = ({participants}) => {
  const sorted = [...participants].sort((a, b) => (a.src ? 0 : 1) - (b.src ? 0 : 1));
  const n = Math.min(Math.max(sorted.length, 1), 4);
  const spec = CLUSTERS[n];
  return (
    <div style={{position: 'relative', width: 162, height: 130}}>
      {sorted.slice(0, 4).map((p, i) => {
        const s = spec[i] ?? spec[spec.length - 1];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              zIndex: i + 1,
              borderRadius: '50%',
              border: `3px solid ${theme.white}`,
              background: theme.white,
              lineHeight: 0,
            }}
          >
            <Avatar name={p.name} src={p.src} size={s.size} />
          </div>
        );
      })}
    </div>
  );
};

export const ChatHeader: React.FC<{
  title: string;
  subtitle: string;
  participants: HeaderAvatar[];
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
          minHeight: 126,
        }}
      >
        <svg
          style={{position: 'absolute', left: 44}}
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.ink}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 12H5M11 6l-6 6 6 6" />
        </svg>

        <AvatarCluster participants={participants} />

        <div
          style={{
            position: 'absolute',
            right: 44,
            borderRadius: 40,
            padding: '15px 32px',
            fontSize: 28,
            fontWeight: 600,
            color: theme.ink,
            background: '#ebebeb',
          }}
        >
          Details
        </div>
      </div>

      <div
        style={{
          fontSize: 46,
          fontWeight: 700,
          color: theme.ink,
          marginTop: 16,
          letterSpacing: -0.4,
          maxWidth: 900,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 500,
          color: theme.ash,
          marginTop: 10,
          maxWidth: 880,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};
