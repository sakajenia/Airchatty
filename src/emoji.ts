import emojiRegex from 'emoji-regex';

/** Convert an emoji string to its Twemoji code-point file name (e.g. "1f624"). */
const toCodePoint = (s: string): string => {
  const r: string[] = [];
  let p = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (p) {
      r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      p = 0;
    } else if (c >= 0xd800 && c <= 0xdbff) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join('-');
};

const ZWJ = '‍';
const VS16 = /️/g;

/** Twemoji strips the U+FE0F variation selector unless the sequence has a ZWJ. */
export const emojiCode = (emoji: string): string =>
  toCodePoint(emoji.includes(ZWJ) ? emoji : emoji.replace(VS16, ''));

/** All distinct emoji found in a string. */
export const findEmojis = (text: string): string[] => {
  const re = emojiRegex();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0]);
  return out;
};

export type EmojiPart = {t: 'text'; v: string} | {t: 'emoji'; v: string; code: string};

/** Split a string into text runs and emoji (each with its Twemoji code). */
export const splitEmoji = (text: string): EmojiPart[] => {
  const re = emojiRegex();
  const parts: EmojiPart[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({t: 'text', v: text.slice(last, m.index)});
    parts.push({t: 'emoji', v: m[0], code: emojiCode(m[0])});
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({t: 'text', v: text.slice(last)});
  return parts;
};
