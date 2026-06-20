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
import {buildTimeline, MessageSeg} from './timeline';
import {theme, useClientHeight, useNaturalHeight} from './util';
import {ChatHeader, StatusBar, Participant} from './components/ChatHeader';
import {InputBar} from './components/InputBar';
import {Composer} from './components/Composer';
import {Keyboard, keyForChar, suggestionsFor} from './components/Keyboard';
import {MessageBubble} from './components/MessageBubble';
import {TypingIndicator} from './components/TypingIndicator';
import {DateSeparator} from './components/DateSeparator';

export const ChatReel: React.FC<ChatProps> = (props) => {
  const {items, youSide, typingFor, keyboard, headerSubtitle, speed, sound} = props;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {segments} = buildTimeline(items, {fps, speed, youSide, typingFor, keyboard});

  // Header describes the OTHER person (the one you're chatting with).
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
  const typingPerson = typing && typing.kind === 'message' ? personFor(typing.sender, props) : null;

  // Keyboard mode: figure out what the host is currently typing into the field.
  let composerText = '';
  let pressedKey: string | null = null;
  let sendActive = false;
  if (keyboard) {
    const active = segments.find(
      (s): s is MessageSeg =>
        s.kind === 'message' &&
        s.keyboardStartFrame != null &&
        frame >= s.keyboardStartFrame &&
        frame < s.revealFrame,
    );
    if (active && active.keyboardStartFrame != null) {
      const elapsed = frame - active.keyboardStartFrame;
      const len = active.text.length;
      const k = Math.floor(elapsed / active.charDur);
      if (k >= len) {
        composerText = active.text; // finished, holding before send
      } else {
        composerText = active.text.slice(0, k + 1);
        const localInSlot = elapsed - k * active.charDur;
        if (localInSlot < active.charDur * 0.62) pressedKey = keyForChar(active.text[k]);
      }
      sendActive = composerText.length > 0;
    }
  }

  // Read receipt: only the latest delivered host message shows "Read by …",
  // a beat after it lands (the guest "reads" it).
  const hostVisible = visible.filter(
    (s): s is MessageSeg => s.kind === 'message' && s.sender === 'host',
  );
  const lastHost = hostVisible[hostVisible.length - 1];
  const readIdx =
    lastHost && frame >= lastHost.revealFrame + fps * 1 ? lastHost.index : -1;

  // Top-anchored chat that auto-scrolls up only once it overflows.
  const [areaRef, areaH] = useClientHeight();
  const [contentRef, contentH] = useNaturalHeight();
  const scroll = areaH && contentH ? Math.max(0, contentH + 28 - areaH) : 0;

  return (
    <AbsoluteFill style={{background: theme.white, fontFamily: theme.font}}>
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <StatusBar />
        <ChatHeader title={other.name} subtitle={headerSubtitle} participants={participants} />

        <div ref={areaRef} style={{flex: 1, overflow: 'hidden', position: 'relative'}}>
          <div
            ref={contentRef}
            style={{position: 'absolute', top: 0, left: 0, right: 0, padding: '8px 36px 0', transform: `translateY(${-scroll}px)`}}
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
                  readReceipt={s.index === readIdx ? `Read by ${other.name}` : undefined}
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

        {keyboard ? (
          <>
            <Composer text={composerText} active={!!composerText} sendActive={sendActive} />
            <Keyboard pressedKey={pressedKey} suggestions={suggestionsFor(composerText)} />
          </>
        ) : (
          <InputBar />
        )}
      </div>

      {/* Audio: a pop when each message is sent/received + a soft music bed. */}
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
