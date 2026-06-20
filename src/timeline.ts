import {ChatItem} from './schema';

export type Keystroke = {
  kind: 'type' | 'delete' | 'shift';
  char?: string;
  /** Start frame relative to keyboardStartFrame. */
  at: number;
};

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
 * Build the keystroke plan for a message with human, non-linear rhythm:
 * per-key jitter, short "thinking" pauses at word/sentence boundaries, an
 * occasional typo+backspace, and a shift press before non-auto-capitalised
 * capitals. Each keystroke carries its start frame (`at`) relative to the
 * start of typing. Returns the keystrokes and total typing duration in frames.
 * The net typed text equals `text`.
 */
const buildKeystrokes = (text: string, charDur: number): {keystrokes: Keystroke[]; total: number} => {
  let seed = 7;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const jitter = (base: number, amt: number) => base * (1 - amt + rand() * amt * 2);
  const keys = 'qwertyuiopasdfghjklzxcvbnm';
  const isSentenceEnd = (ch: string) => ch === '.' || ch === '!' || ch === '?';

  const ks: Keystroke[] = [];
  let at = 0;
  const push = (k: Omit<Keystroke, 'at'>, durAfter: number) => {
    ks.push({...k, at: Math.round(at)});
    at += durAfter;
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    // occasional typo: a wrong letter typed then backspaced
    if (i >= 3 && /[a-zA-Z]/.test(c) && rand() < 0.05) {
      push({kind: 'type', char: keys[Math.floor(rand() * keys.length)]}, jitter(charDur, 0.3));
      push({kind: 'delete'}, jitter(charDur * 0.85, 0.3));
    }

    // shift press before a capital that iOS wouldn't auto-capitalise
    if (/[A-Z]/.test(c)) {
      let auto = i === 0;
      let j = i - 1;
      while (j >= 0 && text[j] === ' ') j--;
      if (j < 0 || isSentenceEnd(text[j])) auto = true;
      if (!auto) push({kind: 'shift'}, jitter(charDur * 0.7, 0.3));
    }

    // the character itself, with a human gap after it
    let durAfter = jitter(charDur, 0.4);
    if (c === ' ' && rand() < 0.22) durAfter += charDur * (3 + rand() * 9); // mid-thought pause
    if (isSentenceEnd(c)) durAfter += charDur * (4 + rand() * 7); // pause after a sentence
    push({kind: 'type', char: c}, durAfter);
  }

  return {keystrokes: ks, total: Math.round(at)};
};

/** Composer text + currently-pressed character at a frame (host keyboard typing). */
export const composerStateAt = (
  seg: MessageSeg,
  frame: number,
): {text: string; pressedChar: string | null} => {
  if (!seg.keystrokes || seg.keyboardStartFrame == null) return {text: '', pressedChar: null};
  const elapsed = frame - seg.keyboardStartFrame;
  const ks = seg.keystrokes;
  let applied = 0;
  while (applied < ks.length && ks[applied].at <= elapsed) applied++;
  let buf = '';
  for (let i = 0; i < applied; i++) {
    const k = ks[i];
    if (k.kind === 'type') buf += k.char ?? '';
    else if (k.kind === 'delete') buf = buf.slice(0, -1);
  }
  let pressedChar: string | null = null;
  const cur = applied - 1;
  if (cur >= 0) {
    const k = ks[cur];
    const next = ks[cur + 1];
    const win = next ? next.at - k.at : seg.charDur;
    const local = elapsed - k.at;
    if (k.kind === 'type' && k.char && /\S/.test(k.char) && local < Math.min(win * 0.6, seg.charDur)) {
      pressedChar = k.char;
    }
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
      // Host types the message out on the keyboard (human rhythm + typos),
      // then sends.
      frame += sec(isFirstOfGroup ? 0.55 : 0.25); // pick the phone up / think
      keyboardStartFrame = Math.round(frame);
      const plan = buildKeystrokes(item.text, charDur);
      keystrokes = plan.keystrokes;
      frame += plan.total;
      frame += sec(0.55); // re-read the finished message before sending
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
