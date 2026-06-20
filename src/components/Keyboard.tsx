import React from 'react';
import {theme} from '../util';

/**
 * iOS 26 "Liquid Glass" keyboard, sized to match the reference: bright white
 * rounded keys on a frosted translucent panel with rounded top corners. The
 * pressed letter shows the pop-up preview balloon. `suggestions` fills the
 * predictive bar.
 */
const ROW1 = 'qwertyuiop'.split('');
const ROW2 = 'asdfghjkl'.split('');
const ROW3 = 'zxcvbnm'.split('');

const KEY = 'rgba(255,255,255,0.96)';
const KEY_SHADOW = '0 2px 5px rgba(0,0,0,0.16)';
const KEY_H = 116;

const KeyCap: React.FC<{
  label?: string;
  pressed?: boolean;
  flex?: number;
  width?: number;
  children?: React.ReactNode;
  fontSize?: number;
}> = ({label, pressed, flex, width, children, fontSize = 70}) => (
  <div
    style={{
      flex: width ? undefined : flex ?? 1,
      width,
      height: KEY_H,
      background: KEY,
      borderRadius: 14,
      boxShadow: KEY_SHADOW,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      fontWeight: 400,
      color: theme.ink,
      fontFamily: theme.font,
      position: 'relative',
    }}
  >
    {children ?? label}
    {pressed && label && (
      <div style={{position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', width: 158, height: 196, pointerEvents: 'none', zIndex: 20}}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 132,
            background: '#fff',
            borderRadius: 24,
            boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 92,
            color: theme.ink,
          }}
        >
          {label}
        </div>
        <div style={{position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 96, height: 100, background: '#fff', borderRadius: 16}} />
      </div>
    )}
  </div>
);

const Row: React.FC<{children: React.ReactNode; pad?: number}> = ({children, pad = 0}) => (
  <div style={{display: 'flex', gap: 17, padding: `0 ${pad}px`, justifyContent: 'center'}}>{children}</div>
);

export const KEYBOARD_HEIGHT = 716;

export const Keyboard: React.FC<{
  pressedKey: string | null;
  suggestions: [string, string, string];
}> = ({pressedKey, suggestions}) => {
  return (
    <div
      style={{
        height: KEYBOARD_HEIGHT,
        background: 'rgba(214,215,221,0.62)',
        backdropFilter: 'blur(40px) saturate(165%)',
        WebkitBackdropFilter: 'blur(40px) saturate(165%)',
        borderTopLeftRadius: 44,
        borderTopRightRadius: 44,
        borderTop: '1px solid rgba(255,255,255,0.55)',
        fontFamily: theme.font,
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 36,
        flexShrink: 0,
      }}
    >
      {/* predictive / autocomplete bar */}
      <div style={{height: 90, display: 'flex', alignItems: 'center'}}>
        {suggestions.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{width: 1, height: 48, background: 'rgba(0,0,0,0.18)'}} />}
            <div style={{flex: 1, textAlign: 'center', fontSize: 33, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden'}}>
              {s}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 34, padding: '24px 16px 0'}}>
        <Row>
          {ROW1.map((k) => (
            <KeyCap key={k} label={k} pressed={pressedKey === k} />
          ))}
        </Row>
        <Row pad={54}>
          {ROW2.map((k) => (
            <KeyCap key={k} label={k} pressed={pressedKey === k} />
          ))}
        </Row>
        <Row>
          <KeyCap width={118}>
            {/* outline shift ⇧ */}
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
              <path d="M12 4.5L19.5 12H15.5V18H8.5V12H4.5L12 4.5Z" />
            </svg>
          </KeyCap>
          {ROW3.map((k) => (
            <KeyCap key={k} label={k} pressed={pressedKey === k} />
          ))}
          <KeyCap width={118}>
            {/* outline delete ⌫ */}
            <svg width="54" height="44" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5.5h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9L2.5 12 9 5.5z" />
              <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
            </svg>
          </KeyCap>
        </Row>
        <Row>
          <KeyCap width={122} fontSize={34} label="123" />
          <KeyCap width={100}>
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" strokeLinecap="round" />
              <circle cx="9" cy="10" r="1.1" fill={theme.ink} stroke="none" />
              <circle cx="15" cy="10" r="1.1" fill={theme.ink} stroke="none" />
            </svg>
          </KeyCap>
          <KeyCap flex={1}>
            <div style={{width: '100%', textAlign: 'right', paddingRight: 28, fontSize: 28, color: 'rgba(0,0,0,0.36)'}}>EN IT</div>
          </KeyCap>
          <KeyCap width={230}>
            {/* outline return ↵ */}
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 8v3a3 3 0 0 1-3 3H7" />
              <path d="M11 11l-4 3 4 3" />
            </svg>
          </KeyCap>
        </Row>
      </div>
    </div>
  );
};

/** Map a typed character to the key that lights up (letters + space only). */
export const keyForChar = (ch: string | null): string | null => {
  if (!ch) return null;
  if (ch === ' ') return 'space';
  const lower = ch.toLowerCase();
  return /^[a-z]$/.test(lower) ? lower : null;
};

/** Lightweight, believable predictive-bar suggestions for the current word. */
export const suggestionsFor = (text: string): [string, string, string] => {
  const word = (text.split(/\s/).pop() ?? '').replace(/[^A-Za-z']/g, '');
  if (word.length < 2) return ['I', 'The', "I'm"];
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  return [`“${word}”`, cap, `${word}’s`];
};
