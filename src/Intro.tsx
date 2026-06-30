import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ChatProps, personFor} from './schema';
import {ChatReel} from './ChatReel';
import {LockScreen} from './components/LockScreen';
import {LockScreenData} from './lockscreen';
import {buildTimeline, outroFrames, MessageSeg} from './timeline';
import {uiFont} from './uifont';

/**
 * Intro extras layered before the chat. The notification sound plays from frame
 * 0 over a black disclaimer card; at the audio's embedded marker the scene cuts
 * to the lock screen (with the Airbnb push); after a beat it "unlocks" — the
 * lock screen slides up and fades while the chat zooms in underneath.
 *
 * IMPORTANT: `lock.time` must equal the chat's time, so the clock the viewer
 * sees on the lock screen matches the timestamps in the conversation.
 */
export type IntroData = {
  disclaimer: string;
  lock: LockScreenData;
  guestName: string;
  guestSubtitle: string;
  guestPhoto: string;
  message: string;
  /** Seconds into the sound where the scene cuts to the lock screen. */
  markerSec: number;
};

export type IntroChatProps = ChatProps & {intro: IntroData};

/** How long (frames) each intro phase lasts, given fps + the audio marker. */
export const introTiming = (fps: number, markerSec: number) => {
  const marker = Math.round(markerSec * fps);
  const lockHold = Math.round(fps * 2.0); // dwell on the lock screen + notification
  const unlock = Math.round(fps * 0.62); // the unlock swipe-up
  const fade = Math.round(fps * 0.18); // black → lock crossfade
  const unlockStart = marker + lockHold;
  const chatStart = unlockStart; // chat is revealed by the unlock
  return {marker, lockHold, unlock, fade, unlockStart, chatStart};
};

export const IntroChat: React.FC<IntroChatProps> = (props) => {
  const {intro} = props;
  const {fps, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const {marker, unlock, unlockStart, chatStart} = introTiming(fps, intro.markerSec);

  // The disclaimer text gently fades in over the black. The cut to the lock
  // screen at the marker is HARD — no dissolve (per the brief).
  const textIn = interpolate(frame, [0, Math.round(fps * 0.4)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // unlock: lock screen slides up + fades; the chat zooms from 1.06 → 1.0 + fades in
  const up = interpolate(frame, [unlockStart, unlockStart + unlock], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const lockY = -up * height * 0.55;
  const lockOpacity = 1 - up;
  const chatScale = interpolate(up, [0, 1], [1.06, 1]);
  const chatOpacity = interpolate(frame, [unlockStart, unlockStart + Math.round(unlock * 0.7)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The first message has "already arrived" (it's the notification), so the chat
  // must be revealed with it already on screen — no entrance animation. We mount
  // the (hidden) chat early enough that, by the unlock, its first bubble has
  // appeared and settled. The pre-roll is invisible: it's behind the opaque lock
  // screen and under chatOpacity=0 until the unlock begins.
  const {segments} = buildTimeline(props.items, {
    fps,
    speed: props.speed,
    typingFor: props.typingFor,
    keyboard: props.keyboard,
  });
  const firstReveal = (segments.find((s) => s.kind === 'message') as MessageSeg | undefined)?.revealFrame ?? 0;
  const settle = Math.round(fps * 0.7);
  const chatSeqStart = Math.max(0, chatStart - firstReveal - settle);

  const showLock = frame >= marker && frame < unlockStart + unlock;
  const showBlack = frame < marker; // hard cut: black is gone the instant the lock appears

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('notify-intro.wav')} />

      {/* the chat — mounted early (hidden) so its first bubble is settled by the
          unlock, then revealed as the lock screen slides away */}
      <Sequence from={chatSeqStart} layout="none">
        <AbsoluteFill style={{transform: `scale(${chatScale})`, opacity: chatOpacity}}>
          <ChatReel {...props} />
        </AbsoluteFill>
      </Sequence>

      {/* lock screen, covering the chat from the marker until the unlock ends */}
      {showLock && (
        <AbsoluteFill style={{transform: `translateY(${lockY}px)`, opacity: lockOpacity}}>
          <LockScreen
            data={intro.lock}
            guestName={intro.guestName}
            guestSubtitle={intro.guestSubtitle}
            guestPhoto={intro.guestPhoto}
            message={intro.message}
          />
        </AbsoluteFill>
      )}

      {/* black disclaimer card on top, until the (hard) cut at the marker */}
      {showBlack && (
        <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center'}}>
          <div
            style={{
              maxWidth: 820,
              padding: '0 90px',
              textAlign: 'center',
              fontFamily: uiFont,
              fontSize: 50,
              fontWeight: 400,
              lineHeight: 1.55,
              letterSpacing: 0.2,
              color: 'rgba(255,255,255,0.92)',
              opacity: textIn,
            }}
          >
            {intro.disclaimer}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/** The first real message segment (the guest message the notification previews). */
const firstMessageSeg = (props: ChatProps, fps: number): MessageSeg | undefined => {
  const {segments} = buildTimeline(props.items, {
    fps,
    speed: props.speed,
    typingFor: props.typingFor,
    keyboard: props.keyboard,
  });
  return segments.find((s) => s.kind === 'message') as MessageSeg | undefined;
};

/**
 * Tie the intro to its chat so the two can never disagree:
 *  • the lock-screen clock is set to the chat's FIRST message time (the
 *    "mi raccomando" constraint — the clock the viewer sees while locked is the
 *    same time the conversation starts), and
 *  • the Airbnb push shows that first guest message — sender photo, name and a
 *    preview of the text — exactly what just "arrived".
 * Returns the props with a corrected `intro`, ready to render.
 */
export const prepareIntroChat = (props: IntroChatProps, fps: number): IntroChatProps => {
  const first = firstMessageSeg(props, fps);
  const lockTime = first?.timeLabel ?? props.intro.lock.time;
  // The first non-host message is the guest whose push we show on the lock screen.
  const guestSeg =
    (buildTimeline(props.items, {fps, speed: props.speed, typingFor: props.typingFor, keyboard: props.keyboard}).segments.find(
      (s) => s.kind === 'message' && (s as MessageSeg).sender !== 'host',
    ) as MessageSeg | undefined) ?? first;
  const person = guestSeg ? personFor(guestSeg.sender, props) : undefined;
  // Second line of the push = the listing it's about (kept to one line).
  const listing = props.headerApt.trim();
  const subtitle = listing.length > 30 ? listing.slice(0, 29).trimEnd() + '…' : listing;
  return {
    ...props,
    intro: {
      ...props.intro,
      lock: {...props.intro.lock, time: lockTime},
      guestName: person?.name ?? props.intro.guestName,
      guestSubtitle: subtitle || props.intro.guestSubtitle,
      guestPhoto: person?.avatar || props.intro.guestPhoto,
      message: guestSeg?.text || props.intro.message,
    },
  };
};

/** Total composition length: black + lock + unlock, then the whole chat (+ outro). */
export const introChatDuration = (props: IntroChatProps, fps: number): number => {
  const {chatStart} = introTiming(fps, props.intro.markerSec);
  const {durationInFrames} = buildTimeline(props.items, {
    fps,
    speed: props.speed,
    typingFor: props.typingFor,
    keyboard: props.keyboard,
  });
  return chatStart + durationInFrames + outroFrames(props.outro, fps);
};
