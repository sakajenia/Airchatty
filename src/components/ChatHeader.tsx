import React from 'react';
import {theme} from '../util';
import {Avatar} from './Avatar';
import {StatusBarRight} from './StatusIcons';

/**
 * iPhone status bar with the Dynamic Island. The icons use the SAME official
 * iOS 26 set as the lock screen (dark variant here, for the light chat), and
 * the time / battery / signal are threaded through so the chat reads as the
 * very same phone we just unlocked. The Dynamic Island is idle (no orange dot).
 */
export const StatusBar: React.FC<{
  time: string;
  battery: number;
  charging: boolean;
  signal: number;
}> = ({time, battery, charging, signal}) => (
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
      <span>{time}</span>
      <svg width="26" height="26" viewBox="0 0 24 24" fill={theme.ink}>
        <path d="M12 3a6 6 0 0 0-6 6v3.6l-1.5 2.4A1 1 0 0 0 5.3 17h13.4a1 1 0 0 0 .8-1.6L18 13V9a6 6 0 0 0-6-6zm0 17a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 20z" />
        <path d="M2 4l18 16" stroke={theme.ink} strokeWidth="1.6" />
      </svg>
    </div>

    {/* Dynamic Island — idle (front camera only, no activity dot) */}
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
        justifyContent: 'flex-end',
        padding: '0 26px',
      }}
    >
      <div style={{width: 18, height: 18, borderRadius: 9, background: '#0c0c0e'}} />
    </div>

    {/* cellular · wi-fi · battery — identical design to the lock screen */}
    <StatusBarRight tone="dark" bars={signal} battery={battery} charging={charging} />
  </div>
);

export type HeaderAvatar = {name: string; src: string};

// Airbnb group cluster, measured from the references: the avatars are SEPARATE
// floating circles — none of them touch. A photo sits lower-left, a second is
// up-and-right of it (with a clear gap), and a letter avatar floats bottom-right.
const CLUSTERS: Record<number, {size: number; x: number; y: number}[]> = {
  1: [{size: 94, x: 0, y: 14}],
  2: [{size: 88, x: 0, y: 20}, {size: 80, x: 96, y: 0}],
  3: [{size: 86, x: 0, y: 24}, {size: 78, x: 94, y: 0}, {size: 46, x: 118, y: 86}],
  4: [{size: 86, x: 0, y: 24}, {size: 78, x: 94, y: 0}, {size: 46, x: 118, y: 86}, {size: 46, x: 50, y: 90}],
  5: [{size: 78, x: 0, y: 26}, {size: 72, x: 86, y: 0}, {size: 46, x: 150, y: 56}, {size: 44, x: 38, y: 86}, {size: 42, x: 104, y: 92}],
  6: [{size: 74, x: 0, y: 24}, {size: 68, x: 80, y: 0}, {size: 50, x: 148, y: 34}, {size: 42, x: 30, y: 80}, {size: 42, x: 92, y: 90}, {size: 40, x: 152, y: 98}],
};

const AvatarCluster: React.FC<{participants: HeaderAvatar[]}> = ({participants}) => {
  const sorted = [...participants].sort((a, b) => (a.src ? 0 : 1) - (b.src ? 0 : 1));
  const n = Math.min(Math.max(sorted.length, 1), 6);
  const spec = CLUSTERS[n];
  const w = Math.max(...spec.map((s) => s.x + s.size));
  const h = Math.max(...spec.map((s) => s.y + s.size));
  return (
    <div style={{position: 'relative', width: w, height: h}}>
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
        padding: '22px 0 30px',
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
          minHeight: 144,
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
          maxWidth: 610, // measured from the references — always clips with "…"
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
