import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, useNaturalHeight} from '../util';

/**
 * The three-dot "is typing…" bubble that appears before an incoming reply.
 * Visible while `frame` is within [startFrame, endFrame).
 */
export const TypingIndicator: React.FC<{startFrame: number; isYou: boolean}> = ({
  startFrame,
  isYou,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [contentRef, naturalH] = useNaturalHeight();

  const local = frame - startFrame;
  const open = spring({frame: local, fps, config: {damping: 200, mass: 0.6}, durationInFrames: 6});
  const measured = naturalH != null;
  const wrapperHeight = measured ? naturalH * open : undefined;

  const Dot: React.FC<{i: number}> = ({i}) => {
    const t = (local - i * 4) % 18;
    const y = interpolate(t, [0, 6, 12], [0, -12, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const o = interpolate(t, [0, 6, 12], [0.4, 1, 0.4], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          background: theme.subtle,
          transform: `translateY(${y}px)`,
          opacity: o,
        }}
      />
    );
  };

  return (
    <div style={{height: wrapperHeight, overflow: 'hidden', flexShrink: 0}}>
      <div ref={contentRef} style={{paddingTop: 14}}>
        <div
          style={{
            display: 'flex',
            justifyContent: isYou ? 'flex-end' : 'flex-start',
            opacity: measured ? open : 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              padding: '28px 34px',
              borderRadius: 34,
              borderBottomLeftRadius: 10,
              background: theme.incomingBubble,
            }}
          >
            <Dot i={0} />
            <Dot i={1} />
            <Dot i={2} />
          </div>
        </div>
      </div>
    </div>
  );
};
