import React from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {clockFont} from '../clockfont';

/** Dev-only: verifies the embedded SFClock face — DOM text vs canvas text vs
 *  fonts.check(), plus measured advances — to pin down fallback issues. */
export const FontDebug: React.FC = () => {
  const [info, setInfo] = React.useState<string>('loading…');
  const [canvasUrl, setCanvasUrl] = React.useState('');
  React.useEffect(() => {
    const h = delayRender('font debug');
    const spec = `400 200px '${clockFont}'`;
    const run = async () => {
      const before = document.fonts.check(spec);
      let loaded: string[] = [];
      try {
        const faces = await document.fonts.load(spec, '0123456789:');
        loaded = faces.map((f) => `${f.family}/${f.status}`);
      } catch (e) {
        loaded = ['load threw: ' + (e as Error).message];
      }
      await document.fonts.ready;
      const after = document.fonts.check(spec);
      const c = document.createElement('canvas');
      c.width = 900;
      c.height = 500;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 900, 500);
      ctx.fillStyle = '#000';
      ctx.font = spec;
      const wClock = ctx.measureText('14:33').width;
      ctx.fillText('14:33', 20, 200);
      ctx.font = '400 200px sans-serif';
      const wSans = ctx.measureText('14:33').width;
      ctx.fillText('14:33', 20, 420);
      setCanvasUrl(c.toDataURL());
      setInfo(
        `check before=${before} after=${after} | loaded=[${loaded.join(',')}] | ` +
          `canvas width SFClock=${Math.round(wClock)} sans=${Math.round(wSans)} | faces=${document.fonts.size}`,
      );
      continueRender(h);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <AbsoluteFill style={{background: '#fff', color: '#000', padding: 40, fontSize: 30}}>
      <div style={{fontFamily: `'${clockFont}', serif`, fontSize: 200}}>14:33 (DOM)</div>
      <div style={{marginTop: 20, fontSize: 26, fontFamily: 'monospace', wordBreak: 'break-all'}}>{info}</div>
      {canvasUrl ? <img src={canvasUrl} width={900} height={500} /> : null}
    </AbsoluteFill>
  );
};
