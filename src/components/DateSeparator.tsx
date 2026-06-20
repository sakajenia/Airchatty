import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme, useNaturalHeight} from '../util';

/** A centered date divider, e.g. "Today", "Wednesday", "26 May". */
export const DateSeparator: React.FC<{label: string; revealFrame: number}> = ({
  label,
  revealFrame,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [contentRef, naturalH] = useNaturalHeight();
  const open = spring({frame: frame - revealFrame, fps, config: {damping: 200}, durationInFrames: 6});
  const measured = naturalH != null;

  return (
    <div style={{height: measured ? naturalH * open : undefined, overflow: 'hidden', flexShrink: 0}}>
      <div
        ref={contentRef}
        style={{
          padding: '26px 0 14px',
          textAlign: 'center',
          opacity: measured ? open : 0,
        }}
      >
        <span style={{fontSize: 26, fontWeight: 600, color: theme.ash, fontFamily: theme.font}}>
          {label}
        </span>
      </div>
    </div>
  );
};
