import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, useNaturalHeight} from '../util';
import {Avatar} from './Avatar';

/**
 * The Airbnb "…" typing bubble. Rendered on the same side and colour as the
 * speaker it precedes (dark/right for "you", light/left with an avatar for the
 * other person). The three dots use Airbnb's staggered pulse-and-rise wave.
 */
export const TypingIndicator: React.FC<{
  startFrame: number;
  senderName: string;
  avatarSrc: string;
  isYou: boolean;
}> = ({startFrame, senderName, avatarSrc, isYou}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [contentRef, naturalH] = useNaturalHeight();

  const local = frame - startFrame;
  const open = spring({frame: local, fps, config: {damping: 200, mass: 0.6}, durationInFrames: 6});
  const measured = naturalH != null;
  const wrapperHeight = measured ? naturalH * open : undefined;

  const dotColor = isYou ? 'rgba(255,255,255,0.85)' : theme.mute;

  const Dot: React.FC<{i: number}> = ({i}) => {
    const period = fps * 1.1; // full cycle ~1.1s
    const stagger = fps * 0.16;
    const t = (((local - i * stagger) % period) + period) % period;
    const wave = Math.sin((t / period) * Math.PI); // 0 → 1 → 0 hump
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          background: dotColor,
          opacity: 0.4 + 0.6 * wave,
          transform: `translateY(${-7 * wave}px) scale(${0.72 + 0.34 * wave})`,
        }}
      />
    );
  };

  const dots = (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: '32px 38px',
        borderRadius: 42,
        ...(isYou ? {borderBottomRightRadius: 14} : {borderBottomLeftRadius: 14}),
        background: isYou ? theme.outgoingBubble : theme.incomingBubble,
      }}
    >
      <Dot i={0} />
      <Dot i={1} />
      <Dot i={2} />
    </div>
  );

  return (
    <div style={{height: wrapperHeight, overflow: 'hidden', flexShrink: 0}}>
      <div ref={contentRef} style={{paddingTop: 30, opacity: measured ? open : 0}}>
        {isYou ? (
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>{dots}</div>
        ) : (
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 16}}>
            <Avatar name={senderName} src={avatarSrc} size={56} />
            {dots}
          </div>
        )}
      </div>
    </div>
  );
};
