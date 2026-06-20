import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ChatProps, personFor} from './schema';
import {buildTimeline} from './timeline';
import {theme, useClientHeight, useNaturalHeight} from './util';
import {ChatHeader, StatusBar, Participant} from './components/ChatHeader';
import {InputBar} from './components/InputBar';
import {MessageBubble} from './components/MessageBubble';
import {TypingIndicator} from './components/TypingIndicator';
import {DateSeparator} from './components/DateSeparator';

export const ChatReel: React.FC<ChatProps> = (props) => {
  const {items, youSide, typingFor, headerSubtitle, speed, sound} = props;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {segments} = buildTimeline(items, {fps, speed, youSide, typingFor});

  // The header describes the OTHER person (the one you're chatting with).
  const otherSide = youSide === 'guest' ? 'host' : 'guest';
  const other = personFor(otherSide, props);
  const participants: Participant[] = [{name: other.name, src: other.avatar}];

  const visible = segments.filter((s) => frame >= s.revealFrame);
  const typing = segments.find(
    (s) =>
      s.kind === 'message' &&
      s.typingStartFrame != null &&
      frame >= s.typingStartFrame &&
      frame < s.revealFrame,
  );
  const typingPerson =
    typing && typing.kind === 'message' ? personFor(typing.sender, props) : null;

  // Top-anchored chat that auto-scrolls up only once it fills the viewport,
  // so the conversation reads from the top (better for reels).
  const [areaRef, areaH] = useClientHeight();
  const [contentRef, contentH] = useNaturalHeight();
  const BOTTOM_PAD = 28;
  const scroll = areaH && contentH ? Math.max(0, contentH + BOTTOM_PAD - areaH) : 0;

  return (
    <AbsoluteFill style={{background: theme.white, fontFamily: theme.font}}>
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <StatusBar />
        <ChatHeader title={other.name} subtitle={headerSubtitle} participants={participants} />

        {/* Chat area: top-anchored, scrolls up only after it overflows. */}
        <div ref={areaRef} style={{flex: 1, overflow: 'hidden', position: 'relative'}}>
          <div
            ref={contentRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '8px 36px 0',
              transform: `translateY(${-scroll}px)`,
            }}
          >
            {visible.map((s) => {
            if (s.kind === 'separator') {
              return <DateSeparator key={`sep-${s.index}`} label={s.label} revealFrame={s.revealFrame} />;
            }
            const p = personFor(s.sender, props);
            return (
              <MessageBubble
                key={s.index}
                text={s.text}
                isYou={s.isYou}
                revealFrame={s.revealFrame}
                timeLabel={s.timeLabel}
                reaction={s.reaction}
                senderName={p.name}
                senderRole={p.role}
                avatarSrc={p.avatar}
                isFirstOfGroup={s.isFirstOfGroup}
                isLastOfGroup={s.isLastOfGroup}
              />
            );
          })}
          {typing && typing.kind === 'message' && typing.typingStartFrame != null && typingPerson && (
            <TypingIndicator
              startFrame={typing.typingStartFrame}
              senderName={typingPerson.name}
              avatarSrc={typingPerson.avatar}
              isYou={typing.isYou}
            />
          )}
          </div>
        </div>

        <InputBar />
      </div>

      {/* Audio: a pop at each message reveal + a soft music bed. */}
      {sound &&
        segments
          .filter((s) => s.kind === 'message')
          .map((s) => (
            <Sequence key={`pop-${s.index}`} from={s.revealFrame} durationInFrames={Math.ceil(fps * 0.6)}>
              <Audio src={staticFile('pop.wav')} volume={0.5} />
            </Sequence>
          ))}
      {sound && <Audio src={staticFile('music.wav')} volume={0.09} loop />}
    </AbsoluteFill>
  );
};
