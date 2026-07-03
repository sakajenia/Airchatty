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

/** The black disclaimer holds EXACTLY this long, then hard-cuts to the lock. */
export const BLACK_SEC = 2.0;

/**
 * How long (frames) each intro phase lasts, given fps + the audio marker.
 * The notification sound starts a beat AFTER the video does, so that its
 * embedded marker lands exactly on the 2-second cut to the lock screen.
 */
export const introTiming = (fps: number, markerSec: number) => {
  const audioStart = Math.max(0, Math.round((BLACK_SEC - markerSec) * fps));
  const marker = audioStart + Math.round(markerSec * fps); // = the hard cut (~2s)
  const lockHold = Math.round(fps * 2.0); // dwell on the lock screen + notification
  const unlock = Math.round(fps * 0.72); // the unlock swipe-up + chat zoom-out
  const unlockStart = marker + lockHold;
  const chatStart = unlockStart; // chat is revealed by the unlock
  return {audioStart, marker, lockHold, unlock, unlockStart, chatStart};
};

export const IntroChat: React.FC<IntroChatProps> = (props) => {
  const {intro} = props;
  const {fps, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const {audioStart, marker, unlock, unlockStart, chatStart} = introTiming(fps, intro.markerSec);

  // Unlock = exactly the iPhone gesture: the lock-screen LAYER slides up and off
  // the top (with a light fade), and UNDERNEATH the chat is revealed ZOOMING OUT
  // — it starts noticeably enlarged (scale 1.16) and settles to 1.0. Everything
  // decelerates together (ease-out) so it reads as one springy iOS motion.
  const up = interpolate(frame, [unlockStart, unlockStart + unlock], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const lockY = -up * height * 0.72; // slides fully up and off the top
  const lockOpacity = 1 - Math.min(1, up * 1.35); // fades a touch faster than it slides
  const chatScale = interpolate(up, [0, 1], [1.16, 1]); // the visible zoom-OUT
  // The chat is essentially opaque for the whole unlock, so you actually WATCH it
  // shrink into place (a fade would hide the zoom). Just a very quick lead-in fade
  // over the first ~12% avoids a hard pop when the lock starts moving.
  const chatOpacity = interpolate(frame, [unlockStart, unlockStart + Math.round(unlock * 0.12)], [0, 1], {
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
      {/* the sound starts late so its marker lands exactly on the 2s cut */}
      <Sequence from={audioStart} layout="none">
        <Audio src={staticFile('notify-intro.wav')} />
      </Sequence>

      {/* the chat — mounted early (hidden) so its first bubble is settled by the
          unlock, then revealed as the lock screen slides away */}
      <Sequence from={chatSeqStart} layout="none">
        <AbsoluteFill style={{transform: `scale(${chatScale})`, opacity: chatOpacity}}>
          {/* same phone as the lock screen — battery/charge/signal carried over */}
          <ChatReel {...props} status={{battery: intro.lock.battery, charging: intro.lock.charging, signal: intro.lock.signal}} />
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

      {/* black disclaimer card on top — text fixed from frame 0 (NO dissolve
          anywhere), gone with a hard cut at the marker */}
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
