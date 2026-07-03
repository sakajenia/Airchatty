/**
 * Render a full composition to an MP4 (preview / one-off), with progress.
 *
 *   npx ts-node scripts/clip.ts <compositionId> <out.mp4> [propsJson|@file] [range]
 *
 * `range` is an optional "start-end" frame window (e.g. "0-210") for a fast
 * partial preview; omit it to render the whole composition.
 */
import path from 'path';

import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';

async function main() {
  const [, , id = 'IntroChat', out = 'out/introchat.mp4', propsArg, rangeArg] = process.argv;
  const propsText =
    propsArg && propsArg.startsWith('@') ? require('fs').readFileSync(propsArg.slice(1), 'utf8') : propsArg;
  const inputProps = propsText ? JSON.parse(propsText) : {};
  const frameRange: [number, number] | undefined = rangeArg
    ? (rangeArg.split('-').map(Number) as [number, number])
    : undefined;

  console.log('Bundling…');
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), 'src/Root.tsx'),
    onProgress: () => undefined,
  });

  const composition = await selectComposition({serveUrl, id, inputProps});
  const outPath = path.join(process.cwd(), out);
  console.log(`Rendering ${id} (${composition.durationInFrames}f @ ${composition.fps}fps) → ${out}`);
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    colorSpace: 'bt709', // limited-range BT.709 — safe on every player (see batch.ts)
    outputLocation: outPath,
    inputProps,
    concurrency: 1,
    timeoutInMilliseconds: 240000,
    chromiumOptions: {gl: 'angle'},
    frameRange,
    onProgress: ({progress}) => {
      const pct = Math.round(progress * 100);
      if (pct !== last && pct % 5 === 0) {
        last = pct;
        console.log(`  ${pct}%`);
      }
    },
  });
  console.log(`✓ ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
