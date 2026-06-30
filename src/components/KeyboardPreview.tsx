import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Keyboard, KbMode, suggestionsFor} from './Keyboard';

/** Stand-alone keyboard, anchored to the bottom over a chat-like white screen —
 *  used only to eyeball the rebuilt iOS 27 keyboard against the Figma. */
export const KeyboardPreview: React.FC<{mode: KbMode; pressedKey: string | null}> = ({mode, pressedKey}) => (
  <AbsoluteFill style={{background: '#fff', justifyContent: 'flex-end'}}>
    <Keyboard mode={mode} pressedKey={pressedKey} suggestions={suggestionsFor(mode === 'numbers' ? '15' : 'Ciao')} />
  </AbsoluteFill>
);
