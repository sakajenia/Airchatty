import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {uiFont} from '../uifont';

/**
 * The black opening card: a "based on true events" disclaimer (one of the 100
 * pooled Italian lines) on a pure-black screen, in clean white type. The text
 * fades in, holds, then fades out — leaving black before the lock-screen
 * notification sound + reveal.
 */
export const IntroDisclaimer: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // gentle fade in (0.6s) … hold … fade out (0.5s)
  const fadeIn = Math.round(fps * 0.6);
  const fadeOut = Math.round(fps * 0.5);
  const opacity = interpolate(
    frame,
    [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  // a barely-there upward drift as it appears
  const y = interpolate(frame, [0, fadeIn], [14, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          maxWidth: 820,
          padding: '0 90px',
          textAlign: 'center',
          fontFamily: uiFont,
          fontSize: 50,
          fontWeight: 400,
          lineHeight: 1.55,
          letterSpacing: 0.2,
          color: 'rgba(255,255,255,0.92)',
          opacity,
          transform: `translateY(${y}px)`,
          textWrap: 'balance',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
