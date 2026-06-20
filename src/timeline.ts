import {ChatItem} from './schema';

export type MessageSeg = {
  kind: 'message';
  index: number;
  sender: 'host' | 'guest';
  text: string;
  reaction?: string;
  isYou: boolean;
  revealFrame: number;
  /** Frame the typing "…" indicator appears (null for your own messages). */
  typingStartFrame: number | null;
  timeLabel: string;
  /** Grouping flags for avatar/label rendering. */
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
 * Convert chat items into a frame-accurate timeline that mimics a real
 * conversation: the OTHER person's messages are preceded by typing "…" dots
 * (length scales with the message), your OWN messages appear after a short
 * composing beat, and there's a read pause after each.
 */
export const buildTimeline = (
  items: ChatItem[],
  opts: {
    fps: number;
    speed: number;
    youSide: 'guest' | 'host';
    typingFor: 'host' | 'guest' | 'both' | 'none';
  },
): Timeline => {
  const {fps, speed, youSide, typingFor} = opts;
  const sec = (s: number) => s * fps * speed;
  const showsTyping = (sender: 'host' | 'guest') =>
    typingFor === 'both' || typingFor === sender;

  // Precompute grouping: a message is grouped with the previous if it shares
  // the same sender and isn't separated by a date divider.
  const senderAt = (i: number): 'host' | 'guest' | null =>
    items[i] && items[i].type === 'message' ? (items[i] as Extract<ChatItem, {type: 'message'}>).sender : null;

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
    const chars = item.text.length;
    const isFirstOfGroup = senderAt(index - 1) !== item.sender;
    const isLastOfGroup = senderAt(index + 1) !== item.sender;

    let typingStartFrame: number | null = null;
    if (showsTyping(item.sender)) {
      frame += sec(isFirstOfGroup ? 0.25 : 0.12);
      typingStartFrame = Math.round(frame);
      frame += sec(clamp(0.6 + chars * 0.02, 0.7, 2.3));
    } else {
      // No typing bubble — just a short composing beat before the message.
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
      timeLabel: fmt(clock),
      isFirstOfGroup,
      isLastOfGroup,
    });

    // Read pause (longer for longer messages, extra if a reaction lands).
    frame += sec(clamp(0.85 + chars * 0.03, 1.0, 3.2) + (item.reaction ? 0.9 : 0));
  });

  const durationInFrames = Math.max(Math.round(frame + sec(1.2)), fps);
  return {segments, fps, durationInFrames};
};
