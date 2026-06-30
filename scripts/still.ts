/**
 * Render a single still frame of any composition to a PNG, for design review.
 *
 *   npx ts-node scripts/still.ts <compositionId> <out.png> [propsJson] [frame]
 */
import path from 'path';

import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';

async function main() {
  const [, , id = 'LockScreen', out = 'out/lockscreen.png', propsJson, frameArg] = process.argv;
  const inputProps = propsJson ? JSON.parse(propsJson) : {};
  const frame = frameArg ? Number(frameArg) : 0;

  console.log(`Bundling…`);
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), 'src/Root.tsx'),
    onProgress: () => undefined,
  });

  const composition = await selectComposition({serveUrl, id, inputProps});
  const outPath = path.join(process.cwd(), out);
  console.log(`Rendering ${id} frame ${frame} → ${out}`);
  await renderStill({
    composition,
    serveUrl,
    output: outPath,
    inputProps,
    frame,
    chromiumOptions: {gl: 'angle'},
  });
  console.log(`✓ ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
