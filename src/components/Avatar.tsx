import React from 'react';
import {staticFile} from 'remotion';
import {theme, initialsFromName, avatarColor} from '../util';

/** Resolve an avatar value: data-URL/http used as-is, a public path via staticFile. */
const resolveSrc = (src: string) =>
  !src ? '' : src.startsWith('data:') || src.startsWith('http') ? src : staticFile(src);

/** Circular avatar — shows the photo if provided, else colored initials. */
export const Avatar: React.FC<{name: string; src: string; size: number}> = ({name, src, size}) => {
  const resolved = resolveSrc(src);
  if (resolved) {
    return (
      <img
        src={resolved}
        width={size}
        height={size}
        style={{borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0}}
      />
    );
  }
  const {bg, fg} = avatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: size * 0.4,
        fontFamily: theme.font,
        flexShrink: 0,
      }}
    >
      {initialsFromName(name)}
    </div>
  );
};
