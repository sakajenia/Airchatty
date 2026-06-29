import React from 'react';
import {interpolate} from 'remotion';

/**
 * The "Directed by Robert B. Weide" meme ending: the last frame freezes, a soft
 * dark wash fades in and the white serif credit fades up bottom-left (the Curb
 * Your Enthusiasm outro look). The "Frolic" music is added separately as audio.
 */
export const WeideOutro: React.FC<{progress: number}> = ({progress}) => {
  const dim = interpolate(progress, [0, 0.3], [0, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(progress, [0.12, 0.55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(progress, [0.12, 0.55], [16, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${dim})`}} />
      <div
        style={{
          position: 'absolute',
          left: 84,
          bottom: 150,
          opacity: op,
          transform: `translateY(${rise}px)`,
          fontFamily: 'Georgia, "Times New Roman", Times, serif',
          color: '#fff',
          textShadow: '0 2px 10px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{fontSize: 44, fontStyle: 'italic', opacity: 0.95}}>Directed by</div>
        <div style={{fontSize: 78, fontWeight: 700, letterSpacing: 1.5, marginTop: 4}}>ROBERT B. WEIDE</div>
      </div>
    </div>
  );
};
