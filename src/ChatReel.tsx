import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ChatProps} from './schema';
import {buildTimeline} from './timeline';
import {theme} from './util';
import {ChatHeader, StatusBar} from './components/ChatHeader';
import {InputBar} from './components/InputBar';
import {MessageBubble} from './components/MessageBubble';
import {TypingIndicator} from './components/TypingIndicator';

export const ChatReel: React.FC<ChatProps> = ({
  messages,
  hostName,
  hostAvatar,
  youSide,
  speed,
  sound,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {segments} = buildTimeline(messages, {fps, speed, youSide});

  const visible = segments.filter((s) => frame >= s.revealFrame);

  // The single active typing indicator (if the other person is "typing" now).
  const typing = segments.find(
    (s) => s.typingStartFrame != null && frame >= s.typingStartFrame && frame < s.revealFrame,
  );

  // Receipt: only the most recent revealed "you" message shows a label.
  // It flips to "Read" once the other side has replied afterwards.
  const youVisible = visible.filter((s) => s.isYou);
  const lastYou = youVisible.length ? youVisible[youVisible.length - 1] : null;
  const otherRepliedAfterLastYou =
    lastYou != null &&
    visible.some((s) => !s.isYou && s.index > lastYou.index);

  return (
    <AbsoluteFill style={{background: theme.screenBg, fontFamily: theme.font}}>
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <StatusBar />
        <ChatHeader name={hostName} avatar={hostAvatar} />

        {/* Chat area: bottom-anchored so new messages push older ones up. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            overflow: 'hidden',
            padding: '0 28px 18px',
          }}
        >
          {visible.map((s) => (
            <MessageBubble
              key={s.index}
              text={s.message.text}
              isYou={s.isYou}
              revealFrame={s.revealFrame}
              timeLabel={s.timeLabel}
              receipt={
                lastYou && s.index === lastYou.index
                  ? otherRepliedAfterLastYou
                    ? 'read'
                    : 'delivered'
                  : 'none'
              }
            />
          ))}
          {typing && typing.typingStartFrame != null && (
            <TypingIndicator startFrame={typing.typingStartFrame} isYou={typing.isYou} />
          )}
        </div>

        <InputBar />
      </div>

      {/* Audio: a pop at each message reveal + a soft music bed. */}
      {sound &&
        segments.map((s) => (
          <Sequence
            key={`pop-${s.index}`}
            from={s.revealFrame}
            durationInFrames={Math.ceil(fps * 0.6)}
          >
            <Audio src={staticFile('pop.wav')} volume={0.55} />
          </Sequence>
        ))}
      {sound && <Audio src={staticFile('music.wav')} volume={0.1} loop />}
    </AbsoluteFill>
  );
};
