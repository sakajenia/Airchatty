/**
 * Render LockScreen stills across the hardest wallpapers for clock-legibility
 * review. Usage: npx ts-node scripts/clock-ab.ts <tag>
 * Outputs out/clock-<tag>-<wallpaper>.png
 */
import path from 'path';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
import {lockScreenFor} from '../src/lockscreen';

// lightest/busiest (hardest) + one dark control
const CASES: {wp: string; dark: boolean}[] = [
  {wp: 'wallpapers/roma-39.jpg', dark: false},
  {wp: 'wallpapers/roma-04.jpg', dark: false},
  {wp: 'wallpapers/roma-34.jpg', dark: false},
  {wp: 'wallpapers/roma-22.jpg', dark: true},
];

async function main() {
  const tag = process.argv[2] || 'new';
  const serveUrl = await bundle({entryPoint: path.join(process.cwd(), 'src/Root.tsx'), onProgress: () => undefined});
  for (const {wp, dark} of CASES) {
    const inputProps = {
      data: {...lockScreenFor('demo-' + wp), wallpaper: wp, darkWallpaper: dark},
      guestName: 'Giulia',
      guestSubtitle: 'Villa a Roma',
      guestPhoto: 'faces/face2.jpg',
      message: 'Ciao! A che ora possiamo fare il check-in?',
    };
    const composition = await selectComposition({serveUrl, id: 'LockScreen', inputProps});
    const name = wp.replace('wallpapers/', '').replace('.jpg', '');
    const out = path.join(process.cwd(), `out/clock-${tag}-${name}.png`);
    await renderStill({composition, serveUrl, output: out, inputProps, frame: 0, chromiumOptions: {gl: 'angle'}});
    console.log(`✓ out/clock-${tag}-${name}.png`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
