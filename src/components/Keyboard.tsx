import React from 'react';
import {theme} from '../util';

/**
 * iOS-style light keyboard. `pressedKey` is the lowercase letter (or "space")
 * currently held down; the matching letter key shows the pop-up preview balloon
 * just like a real iPhone. `suggestions` fills the predictive bar.
 */
const ROW1 = 'qwertyuiop'.split('');
const ROW2 = 'asdfghjkl'.split('');
const ROW3 = 'zxcvbnm'.split('');

// iOS 26 "Liquid Glass": all keys are bright white, the panel is a frosted
// translucent layer with rounded top corners.
const KEY = 'rgba(255,255,255,0.95)';
const KEY_GREY = 'rgba(255,255,255,0.95)';
const KEY_SHADOW = '0 2px 5px rgba(0,0,0,0.16)';

const KeyCap: React.FC<{
  label?: string;
  pressed?: boolean;
  grey?: boolean;
  flex?: number;
  width?: number;
  children?: React.ReactNode;
  fontSize?: number;
}> = ({label, pressed, grey, flex, width, children, fontSize = 52}) => (
  <div
    style={{
      flex: width ? undefined : flex ?? 1,
      width,
      height: 114,
      background: grey ? KEY_GREY : KEY,
      borderRadius: 16,
      boxShadow: KEY_SHADOW,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      color: theme.ink,
      fontFamily: theme.font,
      position: 'relative',
    }}
  >
    {children ?? label}
    {pressed && label && (
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 150,
          height: 188,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        {/* balloon head */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 128,
            background: KEY,
            borderRadius: 22,
            boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 86,
            color: theme.ink,
          }}
        >
          {label}
        </div>
        {/* neck down to the key */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 92,
            height: 96,
            background: KEY,
            borderRadius: 14,
          }}
        />
      </div>
    )}
  </div>
);

const Row: React.FC<{children: React.ReactNode; pad?: number}> = ({children, pad = 0}) => (
  <div style={{display: 'flex', gap: 12, padding: `0 ${pad}px`, justifyContent: 'center'}}>
    {children}
  </div>
);

export const KEYBOARD_HEIGHT = 690;

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
        borderTopLeftRadius: 46,
        borderTopRightRadius: 46,
        borderTop: '1px solid rgba(255,255,255,0.55)',
        fontFamily: theme.font,
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 8,
        flexShrink: 0,
      }}
    >
      {/* predictive / autocomplete bar */}
      <div style={{height: 92, display: 'flex', alignItems: 'center'}}>
        {suggestions.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{width: 1, height: 44, background: 'rgba(0,0,0,0.18)'}} />}
            <div
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 32,
                color: theme.ink,
                fontWeight: i === 1 ? 400 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {s}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 22, padding: '4px 8px 0'}}>
        <Row>
          {ROW1.map((k) => (
            <KeyCap key={k} label={k} pressed={pressedKey === k} />
          ))}
        </Row>
        <Row pad={48}>
          {ROW2.map((k) => (
            <KeyCap key={k} label={k} pressed={pressedKey === k} />
          ))}
        </Row>
        <Row>
          <KeyCap grey width={132} fontSize={40}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill={theme.ink}>
              <path d="M12 4l7 7h-4v6H9v-6H5l7-7z" />
            </svg>
          </KeyCap>
          {ROW3.map((k) => (
            <KeyCap key={k} label={k} pressed={pressedKey === k} />
          ))}
          <KeyCap grey width={132} fontSize={40}>
            <svg width="46" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.8">
              <path d="M21 6H8L3 12l5 6h13a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z" />
              <path d="M11 10l5 4M16 10l-5 4" strokeLinecap="round" />
            </svg>
          </KeyCap>
        </Row>
        <Row>
          <KeyCap grey width={150} fontSize={30} label="123" />
          <KeyCap grey width={104} fontSize={40}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" strokeLinecap="round" />
              <circle cx="9" cy="10" r="1.1" fill={theme.ink} stroke="none" />
              <circle cx="15" cy="10" r="1.1" fill={theme.ink} stroke="none" />
            </svg>
          </KeyCap>
          <KeyCap grey flex={1}>
            <div style={{width: '100%', textAlign: 'right', paddingRight: 26, fontSize: 26, color: 'rgba(0,0,0,0.38)'}}>
              EN IT
            </div>
          </KeyCap>
          <KeyCap grey width={196} fontSize={32} label="return" />
        </Row>
      </div>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 30px 0'}}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
        </svg>
        <svg width="40" height="40" viewBox="0 0 24 24" fill={theme.ink}>
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke={theme.ink} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
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
