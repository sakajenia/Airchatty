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
  sender: string;
  text: string;
  photo?: string;
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
const buildKeystrokes = (
  text: string,
  charDur: number,
  draft?: string,
): {keystrokes: Keystroke[]; total: number} => {
  let seed = 7;
  const seedStr = (draft ?? '') + text;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
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

  const typeString = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (i >= 3 && /[a-zA-Z]/.test(c) && rand() < 0.05) {
        push({kind: 'type', char: keys[Math.floor(rand() * keys.length)]}, jitter(charDur, 0.3));
        push({kind: 'delete'}, jitter(charDur * 0.85, 0.3));
      }
      if (/[A-Z]/.test(c)) {
        let auto = i === 0;
        let j = i - 1;
        while (j >= 0 && s[j] === ' ') j--;
        if (j < 0 || isSentenceEnd(s[j])) auto = true;
        if (!auto) push({kind: 'shift'}, jitter(charDur * 0.7, 0.3));
      }
      let durAfter = jitter(charDur, 0.4);
      if (c === ' ' && rand() < 0.22) durAfter += charDur * (3 + rand() * 9);
      if (isSentenceEnd(c)) durAfter += charDur * (4 + rand() * 7);
      push({kind: 'type', char: c}, durAfter);
    }
  };

  // The "honest" draft: type it fully, hesitate, then delete it all (the delete
  // accelerates like holding the backspace key), then a beat before retyping.
  if (draft) {
    typeString(draft);
    at += charDur * 8; // the host re-reads it and thinks twice
    const delDur = Math.max(1.4, charDur * 0.55);
    for (let i = draft.length - 1; i >= 0; i--) {
      const accel = i < draft.length - 6 ? 0.7 : 1; // speeds up while held
      push({kind: 'delete'}, delDur * accel);
    }
    at += charDur * 4; // pause on the empty field before writing the polite reply
  }

  typeString(text);

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
    typingFor: 'host' | 'guest' | 'both' | 'none';
    keyboard?: boolean;
  },
): Timeline => {
  const {fps, speed, typingFor, keyboard = false} = opts;
  const sec = (s: number) => s * fps * speed;
  const charDur = Math.max(2, Math.round(3.4 / speed));

  const senderAt = (i: number): string | null =>
    items[i] && items[i].type === 'message'
      ? (items[i] as Extract<ChatItem, {type: 'message'}>).sender
      : null;

  const segments: Seg[] = [];
  let frame = sec(0.4);
  let messageCount = 0;

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

    const isHost = item.sender === 'host';
    const isYou = isHost;
    const chars = item.text.length;
    const isFirstOfGroup = senderAt(index - 1) !== item.sender;
    const isLastOfGroup = senderAt(index + 1) !== item.sender;
    const isFirstMessage = messageCount === 0;
    messageCount++;
    // The very first message is "already on screen" when recording starts — no
    // typing / no dots — unless explicitly overridden. Host always types.
    const animate = item.animate ?? !isFirstMessage;

    let typingStartFrame: number | null = null;
    let keyboardStartFrame: number | null = null;
    let keystrokes: Keystroke[] | null = null;

    if (keyboard && isHost) {
      // Host types on the keyboard — optionally typing an "honest" draft first
      // and deleting it — then sends.
      frame += sec(isFirstOfGroup ? 0.55 : 0.25); // pick the phone up / think
      keyboardStartFrame = Math.round(frame);
      const plan = buildKeystrokes(item.text, charDur, item.draft);
      keystrokes = plan.keystrokes;
      frame += plan.total;
      frame += sec(0.55); // re-read the finished message before sending
    } else if (keyboard ? !isHost && animate : typingFor === 'both' || typingFor === item.sender) {
      // Grey "…" dots (the other person), unless it's the instant first message.
      frame += sec(isFirstOfGroup ? 0.25 : 0.12);
      typingStartFrame = Math.round(frame);
      frame += item.photo ? sec(0.9) : sec(clamp(0.6 + chars * 0.02, 0.7, 2.3));
    } else {
      frame += sec(isFirstMessage ? 0.0 : clamp(0.35 + chars * 0.012, 0.35, 1.1));
    }

    const revealFrame = Math.round(frame);
    clock += 1;
    segments.push({
      kind: 'message',
      index,
      sender: item.sender,
      text: item.text,
      photo: item.photo,
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
