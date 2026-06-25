import React from 'react';
import {staticFile} from 'remotion';
import {splitEmoji} from '../emoji';

/**
 * Renders a string with its emoji drawn as Twemoji SVG images (always full
 * colour), so we don't depend on the OS emoji font — which renders some emoji
 * as flat black-and-white outlines under headless Chrome on Linux.
 *
 * The SVGs are tiny local files (downloaded into public/twemoji by the batch
 * step), so a plain <img> loads them instantly without gating the render.
 */
export const EmojiText: React.FC<{text: string}> = ({text}) => {
  const parts = splitEmoji(text);
  return (
    <>
      {parts.map((p, i) =>
        p.t === 'text' ? (
          <React.Fragment key={i}>{p.v}</React.Fragment>
        ) : (
          <img
            key={i}
            src={staticFile(`twemoji/${p.code}.svg`)}
            alt={p.v}
            draggable={false}
            style={{
              height: '1em',
              width: '1em',
              verticalAlign: '-0.16em',
              display: 'inline-block',
              margin: '0 0.04em',
              objectFit: 'contain',
            }}
          />
        ),
      )}
    </>
  );
};
