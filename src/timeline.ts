import {ChatItem} from './schema';

export type Keystroke = {kind: 'type' | 'delete'; char?: string};

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
  /** Frames per keystroke while typing on the keyboard. */
  charDur: number;
  /** Per-keystroke plan (host keyboard messages) incl. occasional typos. */
  keystrokes: Keystroke[] | null;
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
 * Build the keystroke plan for a message: mostly straight typing, but every so
 * often a deterministic "typo" — a wrong letter typed then backspaced — so the
 * delete sound is used and the typing feels human. The net result equals `text`.
 */
const buildKeystrokes = (text: string): Keystroke[] => {
  const ks: Keystroke[] = [];
  let seed = 7;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const keys = 'qwertyuiopasdfghjklzxcvbnm';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (i >= 3 && /[a-zA-Z]/.test(c) && rand() < 0.05) {
      ks.push({kind: 'type', char: keys[Math.floor(rand() * keys.length)]});
      ks.push({kind: 'delete'});
    }
    ks.push({kind: 'type', char: c});
  }
  return ks;
};

/** Composer text + currently-pressed character at a frame (host keyboard typing). */
export const composerStateAt = (
  seg: MessageSeg,
  frame: number,
): {text: string; pressedChar: string | null} => {
  if (!seg.keystrokes || seg.keyboardStartFrame == null) return {text: '', pressedChar: null};
  const elapsed = frame - seg.keyboardStartFrame;
  const total = seg.keystrokes.length;
  const applied = Math.max(0, Math.min(Math.floor(elapsed / seg.charDur) + 1, total));
  let buf = '';
  for (let i = 0; i < applied; i++) {
    const k = seg.keystrokes[i];
    if (k.kind === 'type') buf += k.char ?? '';
    else buf = buf.slice(0, -1);
  }
  let pressedChar: string | null = null;
  const curIdx = applied - 1;
  if (curIdx >= 0 && curIdx < total) {
    const localInSlot = elapsed - curIdx * seg.charDur;
    const k = seg.keystrokes[curIdx];
    if (k.kind === 'type' && localInSlot < seg.charDur * 0.62) pressedChar = k.char ?? null;
  }
  return {text: buf, pressedChar};
};

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
    let keystrokes: Keystroke[] | null = null;

    if (keyboard && isHost) {
      // Host types the message out on the keyboard (with occasional typos),
      // then sends.
      keystrokes = buildKeystrokes(item.text);
      frame += sec(isFirstOfGroup ? 0.45 : 0.2);
      keyboardStartFrame = Math.round(frame);
      frame += keystrokes.length * charDur;
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
      keystrokes,
      timeLabel: fmt(clock),
      isFirstOfGroup,
      isLastOfGroup,
    });

    frame += sec(clamp(0.85 + chars * 0.03, 1.0, 3.0) + (item.reaction ? 0.9 : 0));
  });

  const durationInFrames = Math.max(Math.round(frame + sec(1.2)), fps);
  return {segments, fps, durationInFrames};
};
