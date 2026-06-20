import React from 'react';
import {theme, initialsFromName, avatarColor} from '../util';

/** Circular avatar — shows the photo if provided, else colored initials. */
export const Avatar: React.FC<{name: string; src: string; size: number}> = ({
  name,
  src,
  size,
}) => {
  if (src) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        style={{borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0}}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColor(name),
        color: 'white',
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
