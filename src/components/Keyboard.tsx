import React from 'react';
import {theme} from '../util';
import {uiFont} from '../uifont';
import {KB_GLYPHS} from './kbGlyphs';

/**
 * iOS 27 on-screen keyboard, rebuilt to the official Figma kit (iOS/iPadOS 27
 * Community) at exact proportions. The iPhone screen is 402pt wide and our canvas
 * is 1080px, so every measurement is the Figma point value × (1080/402).
 *
 * Three layouts the chat actually uses: QWERTY letters, the "123" number/symbol
 * pad and the "#+=" symbols pad. Special keys (⇧ ⌫ ↵ 🌐 mic) use the exact glyph
 * vectors exported from the same file (see kbGlyphs.ts).
 */

const S = 1080 / 402; // pt → px
const px = (pt: number) => pt * S;

const KEY_H = px(43);
const KEY_R = px(8.5);
const ROW_GAP = px(11);
const KEY_GAP = px(6);
const KEYS_PAD = px(6.67);
const TOP_PAD = px(24);
const SUGG_H = px(25);
const ROW2_PAD = px(20); // inset that centres a–l under q–p
const SIDE_W = px(45); // shift / delete
const MODE_W = px(50); // #+= / 123 toggle on the symbol rows
const WIDE_W = px(92.667); // 123 / ABC
const RET_W = px(93); // return
const ROW3_GAP = px(13.333);
const LETTER_FS = px(25);
const FUNC_FS = px(17.5);

export const KEYBOARD_HEIGHT = Math.round(TOP_PAD + SUGG_H + (KEY_H * 4 + ROW_GAP * 3) + px(75.8));

export type KbMode = 'letters' | 'numbers' | 'symbols';

const LETTERS = [
  'qwertyuiop'.split(''),
  'asdfghjkl'.split(''),
  'zxcvbnm'.split(''),
];
const NUMBERS = [
  '1234567890'.split(''),
  ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  ['.', ',', '?', '!', "'"],
];
const SYMBOLS = [
  ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
  ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
  ['.', ',', '?', '!', "'"],
];

/** A glyph vector dropped into a key, sized by height, tinted with the key text. */
const Glyph: React.FC<{name: keyof typeof KB_GLYPHS; h: number}> = ({name, h}) => {
  const g = KB_GLYPHS[name];
  return (
    <svg width={(h * g.w) / g.h} height={h} viewBox={g.viewBox} fill="currentColor" style={{display: 'block'}}>
      <path d={g.d} />
    </svg>
  );
};

const KeyCap: React.FC<{
  label?: string;
  glyph?: keyof typeof KB_GLYPHS;
  glyphH?: number;
  pressed?: boolean;
  showPop?: boolean;
  flex?: number;
  width?: number;
  fontSize?: number;
  fontWeight?: number;
}> = ({label, glyph, glyphH, pressed, showPop, flex, width, fontSize = LETTER_FS, fontWeight = 400}) => (
  <div
    style={{
      flex: width ? undefined : flex ?? 1,
      width,
      minWidth: 0,
      height: KEY_H,
      background: pressed ? '#fff' : 'rgba(255,255,255,0.92)',
      borderRadius: KEY_R,
      boxShadow: '0 1px 0 rgba(0,0,0,0.28), 0 2px 5px rgba(0,0,0,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      fontWeight,
      color: theme.ink,
      fontFamily: uiFont,
      position: 'relative',
    }}
  >
    {glyph ? <Glyph name={glyph} h={glyphH ?? px(13)} /> : label}
    {showPop && pressed && label && (
      <div style={{position: 'absolute', bottom: -px(2), left: '50%', transform: 'translateX(-50%)', width: px(58), pointerEvents: 'none', zIndex: 30}}>
        <div
          style={{
            height: px(72),
            background: '#fff',
            borderRadius: px(13),
            boxShadow: '0 6px 16px rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: px(34),
            color: theme.ink,
          }}
        >
          {label}
        </div>
        {/* stem joining the balloon to the key */}
        <div style={{margin: '-2px auto 0', width: px(36), height: px(20), background: '#fff', borderRadius: px(6)}} />
      </div>
    )}
  </div>
);

const Row: React.FC<{children: React.ReactNode; pad?: number; gap?: number}> = ({children, pad = 0, gap = KEY_GAP}) => (
  <div style={{display: 'flex', gap, padding: `0 ${pad}px`, justifyContent: 'center', width: '100%'}}>{children}</div>
);

export const Keyboard: React.FC<{
  pressedKey: string | null;
  suggestions: [string, string, string];
  mode?: KbMode;
}> = ({pressedKey, suggestions, mode = 'letters'}) => {
  const isLetters = mode === 'letters';
  const rows = mode === 'numbers' ? NUMBERS : mode === 'symbols' ? SYMBOLS : LETTERS;
  // row-3 left key: shift (letters) · #+= (numbers) · 123 (symbols)
  const r3Left = isLetters
    ? <KeyCap key="shift" glyph="shift" glyphH={px(15)} width={SIDE_W} />
    : <KeyCap key="mode2" label={mode === 'numbers' ? '#+=' : '123'} width={MODE_W} fontSize={px(15.5)} />;
  // row-4 left key: 123 (letters) · ABC (otherwise)
  const r4Left = <KeyCap key="mode" label={isLetters ? '123' : 'ABC'} width={WIDE_W} fontSize={FUNC_FS} />;

  return (
    <div
      style={{
        height: KEYBOARD_HEIGHT,
        background: 'rgba(209,212,219,0.82)',
        backdropFilter: 'blur(50px) saturate(150%)',
        WebkitBackdropFilter: 'blur(50px) saturate(150%)',
        // Airbnb's chat keeps the keyboard top edge straight (only the message
        // field above is rounded) — so no top corner radius here.
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.05)',
        fontFamily: uiFont,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: TOP_PAD,
        flexShrink: 0,
      }}
    >
      {/* predictive / autocorrection bar */}
      <div style={{height: SUGG_H, display: 'flex', alignItems: 'center', padding: `0 ${px(8.5)}px`}}>
        {suggestions.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{width: 1, height: px(20), background: 'rgba(0,0,0,0.12)'}} />}
            <div style={{flex: 1, textAlign: 'center', fontSize: px(17), color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: `0 ${px(8)}px`}}>
              {s}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: ROW_GAP, padding: `${px(3)}px ${KEYS_PAD}px 0`}}>
        {/* Row 1 — 10 keys full width */}
        <Row>
          {rows[0].map((k) => (
            <KeyCap key={k} label={k} pressed={pressedKey === k} showPop={isLetters} />
          ))}
        </Row>
        {/* Row 2 — letters inset; symbols full width */}
        <Row pad={isLetters ? ROW2_PAD : 0}>
          {rows[1].map((k) => (
            <KeyCap key={k} label={k} pressed={pressedKey === k} showPop={isLetters} />
          ))}
        </Row>
        {/* Row 3 — mode/shift + middle keys + delete */}
        <Row gap={isLetters ? ROW3_GAP : KEY_GAP}>
          {r3Left}
          <div style={{display: 'flex', flex: 1, gap: KEY_GAP, padding: isLetters ? 0 : `0 ${px(8)}px`}}>
            {rows[2].map((k) => (
              <KeyCap key={k} label={k} pressed={pressedKey === k} showPop={isLetters} />
            ))}
          </div>
          <KeyCap glyph="delete" glyphH={px(13.5)} width={SIDE_W} />
        </Row>
        {/* Row 4 — mode + space + return */}
        <Row>
          {r4Left}
          <KeyCap flex={1} pressed={pressedKey === 'space'} />
          <KeyCap glyph="return" glyphH={px(13)} width={RET_W} />
        </Row>
      </div>

      {/* bottom strip — emoji/globe (left) + dictation mic (right) */}
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${px(32)}px`}}>
        <div style={{color: theme.ink, height: px(26.8)}}>
          <Glyph name="emoji" h={px(26.8)} />
        </div>
        <div style={{color: theme.ink, height: px(24)}}>
          <Glyph name="mic" h={px(24)} />
        </div>
      </div>
    </div>
  );
};

const SYM_SET = new Set([...NUMBERS.flat(), ...SYMBOLS.flat()]);

/**
 * Which layout the keyboard shows for the given character. Only digits flip it
 * to the "123" pad (then it returns to letters) — punctuation stays on letters
 * so the keyboard doesn't flicker mid-sentence.
 */
export const layoutForChar = (ch: string | null): KbMode => (ch && /[0-9]/.test(ch) ? 'numbers' : 'letters');

/** Map a typed character to the key that lights up. */
export const keyForChar = (ch: string | null): string | null => {
  if (!ch) return null;
  if (ch === ' ') return 'space';
  const lower = ch.toLowerCase();
  if (/^[a-z]$/.test(lower)) return lower;
  if (/[0-9]/.test(ch) || SYM_SET.has(ch)) return ch;
  return null;
};

/** Lightweight, believable predictive-bar suggestions for the current word. */
export const suggestionsFor = (text: string): [string, string, string] => {
  const word = (text.split(/\s/).pop() ?? '').replace(/[^A-Za-z']/g, '');
  if (word.length < 2) return ['I', 'The', "I'm"];
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  return [`“${word}”`, cap, `${word}’s`];
};
