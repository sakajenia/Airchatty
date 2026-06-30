import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ChatProps, personFor} from './schema';
import {buildTimeline, composerStateAt, MessageSeg, outroFrames} from './timeline';
import {theme, useClientHeight, useNaturalHeight} from './util';
import {ChatHeader, StatusBar, HeaderAvatar} from './components/ChatHeader';
import {InputBar} from './components/InputBar';
import {Composer} from './components/Composer';
import {Keyboard, keyForChar, suggestionsFor, KEYBOARD_HEIGHT} from './components/Keyboard';
import {MessageBubble} from './components/MessageBubble';
import {TypingIndicator} from './components/TypingIndicator';
import {DateSeparator} from './components/DateSeparator';
import {WeideOutro} from './components/WeideOutro';

export const ChatReel: React.FC<ChatProps> = (props) => {
  const {items, typingFor, keyboard, participants: people, headerDate, headerApt, speed, sound} = props;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {segments, durationInFrames: chatDur} = buildTimeline(items, {fps, speed, typingFor, keyboard});

  // Meme outro: extra frames at the end where the chat freezes and the credit
  // (+ music) fades in. Anchored to the chat's OWN length (not the composition
  // duration) so it stays correct when the chat is mounted at an offset — e.g.
  // inside the intro→chat composition, after the lock-screen unlock.
  const oFrames = outroFrames(props.outro, fps);
  const outroStart = chatDur;
  const outroProgress = oFrames > 0 ? Math.max(0, Math.min(1, (frame - outroStart) / oFrames)) : 0;

  // Header: the avatar cluster + names of the people you're chatting with, and
  // a "date · listing" subtitle that clips with an ellipsis when too long.
  const cluster: HeaderAvatar[] = people.map((p) => ({name: p.name, src: p.avatar}));
  const names = people.map((p) => p.name);
  const headerTitle =
    names.length <= 3 ? names.join(', ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`;
  const headerSubtitle = headerApt ? `${headerDate} • ${headerApt}` : headerDate;

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

  // Read receipt — conditional, like the real app: only the LATEST host message
  // shows it, and it reflects who has actually read it. A participant has read
  // the host's message once they start replying to it (after it); the text
  // grows "Read by X" → "Read by X, Y" → "Read by all". If nobody has replied
  // yet, after a beat one person passively reads it.
  const hostVisible = visible.filter(
    (s): s is MessageSeg => s.kind === 'message' && s.sender === 'host',
  );
  const lastHost = hostVisible[hostVisible.length - 1];
  let readIdx = -1;
  let readReceiptText = '';
  if (lastHost) {
    const readerIds: string[] = [];
    for (const s of segments) {
      if (s.kind !== 'message' || s.sender === 'host' || s.index <= lastHost.index) continue;
      const readAt = s.typingStartFrame ?? s.revealFrame;
      if (frame >= readAt && !readerIds.includes(s.sender)) readerIds.push(s.sender);
    }
    if (readerIds.length === 0 && frame >= lastHost.revealFrame + fps * 1.4 && people.length) {
      // Nobody has replied yet — passively credit the read to whoever actually
      // replies next (falling back to the first person if it's the last message).
      const nextReplier = segments.find(
        (s): s is MessageSeg => s.kind === 'message' && s.sender !== 'host' && s.index > lastHost.index,
      );
      readerIds.push(nextReplier ? nextReplier.sender : 'p0');
    }
    if (readerIds.length > 0) {
      readIdx = lastHost.index;
      const all = readerIds.length >= people.length;
      readReceiptText = all
        ? 'Read by all'
        : `Read by ${readerIds.map((id) => personFor(id, props).name).join(', ')}`;
    }
  }

  // Top-anchored chat that auto-scrolls up only once it overflows. In keyboard
  // mode the composer + glass keyboard are overlaid on the bottom (so the glass
  // can frost the chat behind it); a spacer keeps the latest bubble above them.
  const [areaRef, areaH] = useClientHeight();
  const [contentRef, contentH] = useNaturalHeight();
  const [overlayRef, overlayH] = useClientHeight();

  // Keyboard entrance: it's hidden while messages arrive and slides up from the
  // bottom (~0.25s, ease-out) just before the host first types — then stays up.
  const firstHostKbStart = segments.reduce<number | null>((min, s) => {
    if (s.kind !== 'message' || s.keyboardStartFrame == null) return min;
    return min == null ? s.keyboardStartFrame : Math.min(min, s.keyboardStartFrame);
  }, null);
  const slideFrames = Math.round(fps * 0.26);
  const kbAppearStart = firstHostKbStart == null ? null : firstHostKbStart - slideFrames - Math.round(fps * 0.12);
  const kbUp =
    kbAppearStart == null
      ? 0
      : interpolate(frame, [kbAppearStart, kbAppearStart + slideFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
  const kbHidden = (1 - kbUp) * KEYBOARD_HEIGHT; // how far the overlay sits below

  const bottomInset = keyboard ? Math.max(0, (overlayH ?? 0) - kbHidden) : 0;
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
              if (s.kind === 'interstitial') return null; // rendered full-frame below
              const p = personFor(s.sender, props);
              return (
                <MessageBubble
                  key={s.index}
                  text={s.text}
                  photo={s.photo ? (s.photo.startsWith('data:') || s.photo.startsWith('http') ? s.photo : staticFile(s.photo)) : undefined}
                  isYou={s.isYou}
                  revealFrame={s.revealFrame}
                  timeLabel={s.timeLabel}
                  reaction={s.reaction}
                  senderName={p.name}
                  senderRole={p.role}
                  avatarSrc={p.avatar}
                  isFirstOfGroup={s.isFirstOfGroup}
                  isLastOfGroup={s.isLastOfGroup}
                  readReceipt={s.index === readIdx ? readReceiptText : undefined}
                />
              );
            })}
            {/* keeps the newest bubble above the overlaid composer + keyboard */}
            <div style={{height: bottomInset}} />
          </div>
        </div>

        {!keyboard && <InputBar />}
      </div>

      {keyboard && (
        <div
          ref={overlayRef}
          style={{position: 'absolute', left: 0, right: 0, bottom: 0, transform: `translateY(${kbHidden}px)`}}
        >
          <Composer
            text={composerText}
            sendActive={sendActive}
            typingName={typing && typingPerson ? typingPerson.name : undefined}
            typingStartFrame={typing && typing.kind === 'message' ? typing.typingStartFrame ?? undefined : undefined}
          />
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

      {/* Mid-conversation interstitials (e.g. "A few moments later"): a full-frame
          clip with its audio, plus a notification "ding" near the cut back. */}
      {segments.flatMap((s) =>
        s.kind === 'interstitial'
          ? [
              <Sequence key={`int-${s.index}`} from={s.revealFrame} durationInFrames={s.durationInFrames} layout="none">
                <AbsoluteFill style={{background: '#000', zIndex: 900}}>
                  <OffthreadVideo src={staticFile(s.clip)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </AbsoluteFill>
              </Sequence>,
              ...(s.sound
                ? [
                    <Sequence
                      key={`int-snd-${s.index}`}
                      from={Math.max(0, s.revealFrame + s.durationInFrames - Math.round(fps * 0.55))}
                      durationInFrames={Math.ceil(fps * 1.3)}
                    >
                      <Audio src={staticFile(s.sound)} volume={0.95} />
                    </Sequence>,
                  ]
                : []),
            ]
          : [],
      )}

      {/* Meme outro: play the real clip (video + audio) full-frame, or fall back
          to the recreated credit text if no clip file is present. */}
      {oFrames > 0 && /\.(mp4|webm|mov)$/i.test(props.outro ?? '') ? (
        <Sequence from={outroStart} durationInFrames={oFrames} layout="none">
          <AbsoluteFill style={{background: '#000', zIndex: 999}}>
            <OffthreadVideo src={staticFile(props.outro as string)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
          </AbsoluteFill>
        </Sequence>
      ) : oFrames > 0 && props.outro === 'weide' && frame >= outroStart ? (
        <AbsoluteFill style={{zIndex: 999}}>
          <WeideOutro progress={outroProgress} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
