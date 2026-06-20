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
import {buildTimeline, composerStateAt, MessageSeg} from './timeline';
import {theme, useClientHeight, useNaturalHeight} from './util';
import {ChatHeader, StatusBar, HeaderAvatar} from './components/ChatHeader';
import {InputBar} from './components/InputBar';
import {Composer} from './components/Composer';
import {Keyboard, keyForChar, suggestionsFor} from './components/Keyboard';
import {MessageBubble} from './components/MessageBubble';
import {TypingIndicator} from './components/TypingIndicator';
import {DateSeparator} from './components/DateSeparator';

export const ChatReel: React.FC<ChatProps> = (props) => {
  const {items, typingFor, keyboard, participants: people, headerDate, headerApt, speed, sound} = props;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {segments} = buildTimeline(items, {fps, speed, typingFor, keyboard});

  // Header: the avatar cluster + names of the people you're chatting with, and
  // a "date · listing" subtitle that clips with an ellipsis when too long.
  const cluster: HeaderAvatar[] = people.map((p) => ({name: p.name, src: p.avatar}));
  const names = people.map((p) => p.name);
  const headerTitle =
    names.length <= 3 ? names.join(', ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`;
  const headerSubtitle = headerApt ? `${headerDate} • ${headerApt}` : headerDate;
  const readerName = people[people.length - 1]?.name ?? 'them';

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
    if (active) {
      const state = composerStateAt(active, frame);
      composerText = state.text;
      pressedKey = keyForChar(state.pressedChar);
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

  // Top-anchored chat that auto-scrolls up only once it overflows. In keyboard
  // mode the composer + glass keyboard are overlaid on the bottom (so the glass
  // can frost the chat behind it); a spacer keeps the latest bubble above them.
  const [areaRef, areaH] = useClientHeight();
  const [contentRef, contentH] = useNaturalHeight();
  const [overlayRef, overlayH] = useClientHeight();
  const bottomInset = keyboard ? overlayH ?? 0 : 0;
  const scroll = areaH && contentH ? Math.max(0, contentH + 12 - areaH) : 0;

  return (
    <AbsoluteFill style={{background: theme.white, fontFamily: theme.font}}>
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <StatusBar />
        <ChatHeader title={headerTitle} subtitle={headerSubtitle} participants={cluster} />

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
                  readReceipt={s.index === readIdx ? `Read by ${readerName}` : undefined}
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
            {/* keeps the newest bubble above the overlaid composer + keyboard */}
            <div style={{height: bottomInset}} />
          </div>
        </div>

        {!keyboard && <InputBar />}
      </div>

      {keyboard && (
        <div ref={overlayRef} style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
          <Composer text={composerText} sendActive={sendActive} />
          <Keyboard pressedKey={pressedKey} suggestions={suggestionsFor(composerText)} />
        </div>
      )}

      {/* Audio: the keyboard only — the iPhone "type" click on letters, and the
          iPhone "erase" sound on delete, space and shift (the modifier sound) —
          plus the Airbnb "message sent" sound when the host sends. */}
      {sound &&
        keyboard &&
        segments.flatMap((s) => {
          if (s.kind !== 'message') return [];
          const audios: React.ReactNode[] = [];
          if (s.keystrokes && s.keyboardStartFrame != null) {
            for (let i = 0; i < s.keystrokes.length; i++) {
              const k = s.keystrokes[i];
              const erase = k.kind === 'delete' || k.kind === 'shift' || k.char === ' ';
              audios.push(
                <Sequence key={`k-${s.index}-${i}`} from={s.keyboardStartFrame + k.at} durationInFrames={Math.ceil(fps * 0.12)}>
                  <Audio src={staticFile(erase ? 'keydelete.wav' : 'keytype.wav')} volume={0.7} />
                </Sequence>,
              );
            }
          }
          // "message sent" sound when the host's message lands
          if (s.sender === 'host') {
            audios.push(
              <Sequence key={`sent-${s.index}`} from={s.revealFrame} durationInFrames={Math.ceil(fps * 0.8)}>
                <Audio src={staticFile('sent.wav')} volume={0.55} />
              </Sequence>,
            );
          }
          return audios;
        })}
    </AbsoluteFill>
  );
};
