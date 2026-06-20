import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, useNaturalHeight} from '../util';
import {Avatar} from './Avatar';

export type ChatBubbleProps = {
  text: string;
  isYou: boolean;
  revealFrame: number;
  timeLabel: string;
  reaction?: string;
  senderName: string;
  senderRole: string;
  avatarSrc: string;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
  readReceipt?: string;
};

const AVATAR = 56;

const ReactionBadge: React.FC<{emoji: string; isYou: boolean; revealFrame: number}> = ({
  emoji,
  isYou,
  revealFrame,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({
    frame: frame - (revealFrame + Math.round(fps * 0.7)),
    fps,
    config: {damping: 12, mass: 0.6},
  });
  return (
    <div
      style={{
        alignSelf: isYou ? 'flex-start' : 'flex-end',
        marginTop: -30,
        marginLeft: isYou ? 28 : 0,
        marginRight: isYou ? 0 : 28,
        zIndex: 3,
        transform: `scale(${pop})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: theme.white,
          border: `1px solid ${theme.hairline}`,
          boxShadow: 'rgba(0,0,0,0.12) 0 4px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}
      >
        {emoji}
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<ChatBubbleProps> = ({
  text,
  isYou,
  revealFrame,
  timeLabel,
  reaction,
  senderName,
  senderRole,
  avatarSrc,
  isFirstOfGroup,
  isLastOfGroup,
  readReceipt,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [contentRef, naturalH] = useNaturalHeight();

  const local = frame - revealFrame;
  const open = spring({frame: local, fps, config: {damping: 200, mass: 0.6}, durationInFrames: 8});
  const pop = spring({frame: local, fps, config: {damping: 14, mass: 0.7}});
  const measured = naturalH != null;
  const wrapperHeight = measured ? naturalH * open : undefined;

  const bubble = (
    <div
      style={{
        maxWidth: 740,
        padding: '24px 32px',
        borderRadius: 42,
        ...(isYou
          ? {borderBottomRightRadius: isLastOfGroup ? 14 : 42}
          : {borderBottomLeftRadius: isLastOfGroup ? 14 : 42}),
        background: isYou ? theme.outgoingBubble : theme.incomingBubble,
        color: isYou ? theme.outgoingText : theme.incomingText,
        fontSize: 38,
        lineHeight: 1.32,
        fontWeight: 500,
        fontFamily: theme.font,
        wordBreak: 'break-word',
      }}
    >
      {text}
    </div>
  );

  const column = (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: isYou ? 'flex-end' : 'flex-start', flex: 1}}>
      {isFirstOfGroup &&
        (isYou ? (
          <div style={{fontSize: 24, color: theme.ash, margin: '0 10px 8px 0', fontWeight: 500}}>
            {timeLabel}
          </div>
        ) : (
          <div style={{fontSize: 24, color: theme.ash, margin: '0 0 8px 12px', fontWeight: 500}}>
            <span style={{fontWeight: 600, color: theme.ink}}>{senderName}</span>
            {` · ${senderRole}  ${timeLabel}`}
          </div>
        ))}
      {bubble}
      {reaction && <ReactionBadge emoji={reaction} isYou={isYou} revealFrame={revealFrame} />}
      {readReceipt && (
        <div style={{fontSize: 22, color: theme.ash, margin: '8px 8px 0 0', fontWeight: 500}}>
          {readReceipt}
        </div>
      )}
    </div>
  );

  return (
    <div style={{height: wrapperHeight, overflow: 'hidden', flexShrink: 0}}>
      <div
        ref={contentRef}
        style={{
          paddingTop: isFirstOfGroup ? 30 : 8,
          opacity: measured ? 1 : 0,
          transform: `translateY(${(1 - pop) * 22}px) scale(${0.96 + pop * 0.04})`,
          transformOrigin: isYou ? 'bottom right' : 'bottom left',
        }}
      >
        {isYou ? (
          column
        ) : (
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 16}}>
            <div style={{width: AVATAR, flexShrink: 0}}>
              {isLastOfGroup && <Avatar name={senderName} src={avatarSrc} size={AVATAR} />}
            </div>
            {column}
          </div>
        )}
      </div>
    </div>
  );
};
