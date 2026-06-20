import {ChatItem} from './schema';

export type MessageSeg = {
  kind: 'message';
  index: number;
  sender: 'host' | 'guest';
  text: string;
  reaction?: string;
  isYou: boolean;
  revealFrame: number;
  /** Frame the grey "…" dots indicator appears (guest), else null. */
  typingStartFrame: number | null;
  /** Keyboard-mode: frame the host starts typing this message, else null. */
  keyboardStartFrame: number | null;
  /** Frames per character while typing on the keyboard. */
  charDur: number;
  timeLabel: string;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
};

export type SeparatorSeg = {
  kind: 'separator';
  index: number;
  label: string;
  revealFrame: number;
};

export type Seg = MessageSeg | SeparatorSeg;

export type Timeline = {
  segments: Seg[];
  fps: number;
  durationInFrames: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Convert chat items into a frame-accurate timeline.
 *
 * Keyboard (screen-recording) mode: the host types each message key-by-key on
 * the iPhone keyboard, then sends it (the bubble appears at `revealFrame`). The
 * guest is preceded by the grey "…" dots. Without keyboard mode it falls back
 * to the simpler dots/instant behaviour driven by `typingFor`.
 */
export const buildTimeline = (
  items: ChatItem[],
  opts: {
    fps: number;
    speed: number;
    youSide: 'guest' | 'host';
    typingFor: 'host' | 'guest' | 'both' | 'none';
    keyboard?: boolean;
  },
): Timeline => {
  const {fps, speed, youSide, typingFor, keyboard = false} = opts;
  const sec = (s: number) => s * fps * speed;
  const charDur = Math.max(2, Math.round(3.4 / speed));

  const senderAt = (i: number): 'host' | 'guest' | null =>
    items[i] && items[i].type === 'message'
      ? (items[i] as Extract<ChatItem, {type: 'message'}>).sender
      : null;

  const segments: Seg[] = [];
  let frame = sec(0.4);

  let clock = 14 * 60 + 32; // 14:32
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  items.forEach((item, index) => {
    if (item.type === 'separator') {
      segments.push({kind: 'separator', index, label: item.label, revealFrame: Math.round(frame)});
      frame += sec(0.7);
      return;
    }

    const isYou = item.sender === youSide;
    const isHost = item.sender === 'host';
    const chars = item.text.length;
    const isFirstOfGroup = senderAt(index - 1) !== item.sender;
    const isLastOfGroup = senderAt(index + 1) !== item.sender;

    let typingStartFrame: number | null = null;
    let keyboardStartFrame: number | null = null;

    if (keyboard && isHost) {
      // Host types the message out on the keyboard, then sends.
      frame += sec(isFirstOfGroup ? 0.45 : 0.2);
      keyboardStartFrame = Math.round(frame);
      frame += chars * charDur; // already in frames
      frame += sec(0.5); // brief pause on the finished text before sending
    } else if (keyboard ? !isHost : typingFor === 'both' || typingFor === item.sender) {
      // Grey "…" dots (the other person).
      frame += sec(isFirstOfGroup ? 0.25 : 0.12);
      typingStartFrame = Math.round(frame);
      frame += sec(clamp(0.6 + chars * 0.02, 0.7, 2.3));
    } else {
      frame += sec(clamp(0.35 + chars * 0.012, 0.35, 1.1));
    }

    const revealFrame = Math.round(frame);
    clock += 1;
    segments.push({
      kind: 'message',
      index,
      sender: item.sender,
      text: item.text,
      reaction: item.reaction,
      isYou,
      revealFrame,
      typingStartFrame,
      keyboardStartFrame,
      charDur,
      timeLabel: fmt(clock),
      isFirstOfGroup,
      isLastOfGroup,
    });

    frame += sec(clamp(0.85 + chars * 0.03, 1.0, 3.0) + (item.reaction ? 0.9 : 0));
  });

  const durationInFrames = Math.max(Math.round(frame + sec(1.2)), fps);
  return {segments, fps, durationInFrames};
};
