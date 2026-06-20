import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, useNaturalHeight} from '../util';

export type BubbleProps = {
  text: string;
  isYou: boolean;
  revealFrame: number;
  timeLabel: string;
  /** Receipt shown under "you" messages. Only the latest one shows a label. */
  receipt: 'none' | 'delivered' | 'read';
};

export const MessageBubble: React.FC<BubbleProps> = ({
  text,
  isYou,
  revealFrame,
  timeLabel,
  receipt,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [contentRef, naturalH] = useNaturalHeight();

  const local = frame - revealFrame;

  // Smoothly grow the bubble's reserved height so the whole stack pushes up
  // without a visible jump. Height is unknown for the first commit -> render
  // at auto height (but invisible) so it can be measured.
  const open = spring({frame: local, fps, config: {damping: 200, mass: 0.6}, durationInFrames: 8});
  const pop = spring({frame: local, fps, config: {damping: 14, mass: 0.7}});

  const measured = naturalH != null;
  const wrapperHeight = measured ? naturalH * open : undefined;

  const bubbleRadius = 34;
  const tail = isYou
    ? {borderBottomRightRadius: 10}
    : {borderBottomLeftRadius: 10};

  return (
    <div style={{height: wrapperHeight, overflow: 'hidden', flexShrink: 0}}>
      <div ref={contentRef} style={{paddingTop: 14}}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isYou ? 'flex-end' : 'flex-start',
            opacity: measured ? open : 0,
            transform: `translateY(${(1 - pop) * 26}px) scale(${0.9 + pop * 0.1})`,
            transformOrigin: isYou ? 'bottom right' : 'bottom left',
          }}
        >
          <div
            style={{
              maxWidth: '74%',
              padding: '22px 30px',
              borderRadius: bubbleRadius,
              ...tail,
              background: isYou
                ? `linear-gradient(135deg, ${theme.rausch}, ${theme.rauschDark})`
                : theme.incomingBubble,
              color: isYou ? theme.outgoingText : theme.incomingText,
              fontSize: 38,
              lineHeight: 1.32,
              fontFamily: theme.font,
              fontWeight: 400,
              boxShadow: isYou
                ? '0 6px 18px rgba(230,30,77,0.25)'
                : '0 4px 12px rgba(0,0,0,0.05)',
              wordBreak: 'break-word',
            }}
          >
            {text}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              margin: '10px 12px 0',
              fontSize: 24,
              color: theme.subtle,
              fontFamily: theme.font,
            }}
          >
            <span>{timeLabel}</span>
            {isYou && receipt !== 'none' && (
              <span style={{color: receipt === 'read' ? theme.rausch : theme.subtle, fontWeight: 600}}>
                {receipt === 'read' ? 'Read ✓✓' : 'Delivered'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
