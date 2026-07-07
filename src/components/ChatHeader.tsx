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
    {/* time — bare, exactly like the real status bar (no bell/DND glyph) */}
    <div style={{display: 'flex', alignItems: 'center', fontSize: 34, fontWeight: 600}}>
      <span>{time}</span>
    </div>

    {/* Dynamic Island — idle (front camera only, no activity dot).
        True HIG geometry: 126×37.33pt → ~354×105px at this canvas scale. */}
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 14,
        transform: 'translateX(-50%)',
        width: 354,
        height: 105,
        background: '#000',
        borderRadius: 53,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 34px',
      }}
    >
      <div style={{width: 24, height: 24, borderRadius: 12, background: '#0c0c0e'}} />
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
            background: '#f2f2f2', // sampled ~243-247 in the reference
          }}
        >
          Details
        </div>
      </div>

      {/* Name and subtitle read at COMPARABLE size in the real app — the
          contrast is almost all weight/colour, not scale (measured: both cap
          heights ≈ 20-21px @1080). */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: theme.ink,
          marginTop: 16,
          letterSpacing: -0.3,
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
          fontWeight: 400,
          color: theme.ash,
          marginTop: 14,
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
