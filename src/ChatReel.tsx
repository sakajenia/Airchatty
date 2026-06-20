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
import {theme} from './util';
import {ChatHeader, StatusBar, Participant} from './components/ChatHeader';
import {InputBar} from './components/InputBar';
import {MessageBubble} from './components/MessageBubble';
import {TypingIndicator} from './components/TypingIndicator';
import {DateSeparator} from './components/DateSeparator';

export const ChatReel: React.FC<ChatProps> = (props) => {
  const {items, youSide, headerSubtitle, speed, sound} = props;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {segments} = buildTimeline(items, {fps, speed, youSide});

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

  return (
    <AbsoluteFill style={{background: theme.white, fontFamily: theme.font}}>
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <StatusBar />
        <ChatHeader title={other.name} subtitle={headerSubtitle} participants={participants} />

        {/* Chat area: bottom-anchored so new messages push older ones up. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            overflow: 'hidden',
            padding: '0 36px 14px',
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
            />
          )}
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
