import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, useNaturalHeight} from '../util';
import {Avatar} from './Avatar';
import {EmojiText} from './EmojiText';

export type ChatBubbleProps = {
  text: string;
  photo?: string;
  isYou: boolean;
  revealFrame: number;
  timeLabel: string;
  reaction?: string;
  senderName: string;
  senderRole: string;
  avatarSrc: string;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
  /** Avatar shown on THIS bubble right now (it sits on the group's newest
   *  matured message and jumps as new ones arrive — like the real app). */
  showAvatar?: boolean;
  readReceipt?: string;
};

const AVATAR = 76; // measured from the reference recording (~90px @1320)

// Entrance timing measured frame-by-frame from the real Airbnb recording:
// the bubble appears instantly IN PLACE with its content "ghosted" (~32%
// opacity — light-grey text), holds ~0.2s, then the content fades to full and
// the avatar jumps onto it. No spring, no slide, no scale.
export const GHOST_HOLD = 0.2; // seconds at reduced opacity
export const GHOST_FADE = 0.13; // seconds fading to full
export const matureFrames = (fps: number) => Math.round((GHOST_HOLD + GHOST_FADE) * fps);

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
  const isHeart = /[❤\u{1F90D}-\u{1F90E}\u{1F498}-\u{1F49F}]/u.test(emoji);
  // Sits in the bubble's bottom corner (right for the other person, left for
  // you), in a light-grey circle — exactly like the Airbnb reference.
  return (
    <div style={{display: 'flex', justifyContent: isYou ? 'flex-start' : 'flex-end', marginTop: -28, zIndex: 3}}>
      <div style={{transform: `translateX(${isYou ? -16 : 16}px) scale(${pop})`, opacity: pop}}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: '#f4f4f4',
            border: '1px solid #e4e4e4',
            boxShadow: '0 3px 10px rgba(0,0,0,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 46,
          }}
        >
          {isHeart ? <GlossyHeart size={50} /> : emoji}
        </div>
      </div>
    </div>
  );
};

/** A glossy red heart (gradient + highlight) so it matches the iOS look on any
 *  render machine, instead of the flat fallback emoji. */
const GlossyHeart: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f5897c" />
        <stop offset="0.45" stopColor="#e2412f" />
        <stop offset="1" stopColor="#bf1c12" />
      </linearGradient>
    </defs>
    <path
      d="M12 21s-8.5-5.9-8.5-11.4C3.5 6.4 5.6 4.4 8 4.4c1.9 0 3.4 1.1 4 2.7.6-1.6 2.1-2.7 4-2.7 2.4 0 4.5 2 4.5 5.2C20.5 15.1 12 21 12 21Z"
      fill="url(#heartGrad)"
    />
    <ellipse cx="8.4" cy="8.2" rx="2.5" ry="1.7" fill="#fff" opacity="0.33" transform="rotate(-32 8.4 8.2)" />
  </svg>
);

export const MessageBubble: React.FC<ChatBubbleProps> = ({
  text,
  photo,
  isYou,
  revealFrame,
  timeLabel,
  reaction,
  senderName,
  senderRole,
  avatarSrc,
  isFirstOfGroup,
  isLastOfGroup,
  showAvatar = isLastOfGroup,
  readReceipt,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [contentRef, naturalH] = useNaturalHeight();

  const local = frame - revealFrame;
  // The list makes room almost instantly (the ghost is already in its final
  // position on the very next recording frame).
  const open = interpolate(local, [0, 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // Content: ghost (32%) → hold → fade to full. Sent messages skip the ghost
  // hold — your own message just fades in quickly.
  const hold = Math.round(GHOST_HOLD * fps);
  const fade = Math.round(GHOST_FADE * fps);
  const contentOpacity = isYou
    ? interpolate(local, [0, fade], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : interpolate(local, [0, 1, hold + 1, hold + fade], [0, 0.32, 0.32, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const measured = naturalH != null;
  const wrapperHeight = measured ? naturalH * open : undefined;

  const bubble = photo ? (
    <div
      style={{
        width: 470,
        borderRadius: 44,
        overflow: 'hidden',
        background: theme.incomingBubble,
        lineHeight: 0,
      }}
    >
      <img src={photo} style={{width: '100%', display: 'block', objectFit: 'cover'}} />
    </div>
  ) : (
    <div
      style={{
        maxWidth: 740,
        padding: '20px 30px',
        // uniform squircle-round corners, like the real app (no flattened corner)
        borderRadius: 50,
        background: isYou ? theme.outgoingBubble : theme.incomingBubble,
        color: isYou ? theme.outgoingText : theme.incomingText,
        fontSize: 42,
        lineHeight: 1.45,
        letterSpacing: -0.2,
        fontWeight: 500,
        fontFamily: theme.font,
        wordBreak: 'break-word',
      }}
    >
      <span style={{opacity: contentOpacity}}>
        <EmojiText text={text} />
      </span>
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
      {/* wrapper shrinks to the bubble so the reaction hugs its corner */}
      <div style={{maxWidth: 740}}>
        {bubble}
        {reaction && <ReactionBadge emoji={reaction} isYou={isYou} revealFrame={revealFrame} />}
      </div>
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
          paddingTop: isFirstOfGroup ? 30 : 18,
          opacity: measured ? 1 : 0,
        }}
      >
        {isYou ? (
          column
        ) : (
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 25}}>
            <div style={{width: AVATAR, flexShrink: 0}}>
              {showAvatar && <Avatar name={senderName} src={avatarSrc} size={AVATAR} />}
            </div>
            {column}
          </div>
        )}
      </div>
    </div>
  );
};
