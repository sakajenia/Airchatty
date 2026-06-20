import {Message} from './schema';

export type Segment = {
  message: Message;
  index: number;
  /** True when this message is on the "you" (right, accent) side. */
  isYou: boolean;
  /** Frame at which the bubble pops in (and the pop sound plays). */
  revealFrame: number;
  /** Frame at which the typing "…" indicator appears (null for your own msgs). */
  typingStartFrame: number | null;
  /** Wall-clock label shown with the bubble, e.g. "14:32". */
  timeLabel: string;
};

export type Timeline = {
  segments: Segment[];
  fps: number;
  durationInFrames: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Convert messages into a frame-accurate timeline.
 *
 * The pacing mimics a real conversation:
 *  - Messages from the OTHER person are preceded by a typing "…" indicator
 *    whose length grows with the message length.
 *  - Your OWN messages appear after a short "composing" beat (no dots — you
 *    don't watch your own typing indicator).
 *  - After each message there's a read pause so the viewer can follow along.
 */
export const buildTimeline = (
  messages: Message[],
  opts: {fps: number; speed: number; youSide: 'guest' | 'host'},
): Timeline => {
  const {fps, speed, youSide} = opts;
  const sec = (s: number) => s * fps * speed;

  const segments: Segment[] = [];
  let frame = sec(0.5); // small lead-in

  // Fake clock that ticks forward a little each message.
  let clock = 14 * 60 + 32; // minutes since midnight => 14:32
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  messages.forEach((message, index) => {
    const isYou = message.sender === youSide;
    const chars = message.text.length;
    let typingStartFrame: number | null = null;

    if (isYou) {
      // You composing — a short beat, no visible dots.
      frame += sec(clamp(0.35 + chars * 0.012, 0.35, 1.1));
    } else {
      // The other person: brief pause, then typing dots scaled by length.
      frame += sec(0.25);
      typingStartFrame = Math.round(frame);
      frame += sec(clamp(0.6 + chars * 0.02, 0.7, 2.3));
    }

    const revealFrame = Math.round(frame);
    clock += 1; // advance the on-screen clock by a minute-ish
    segments.push({
      message,
      index,
      isYou,
      revealFrame,
      typingStartFrame,
      timeLabel: fmt(clock),
    });

    // Read pause before the next turn (longer for longer messages).
    frame += sec(clamp(0.9 + chars * 0.03, 1.1, 3.4));
  });

  const durationInFrames = Math.max(Math.round(frame + sec(1.2)), fps);
  return {segments, fps, durationInFrames};
};
