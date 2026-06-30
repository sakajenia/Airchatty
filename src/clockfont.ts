import {sfCompressedMedium} from './clockfont-data';

/**
 * The lock clock uses Apple's San Francisco Pro **Compressed Medium** — the real
 * tall/narrow iOS clock face — instantiated from the variable SF Pro and embedded
 * (woff2 data URI) so the render never waits on a network fetch. Because it's
 * already compressed, it is rendered WITHOUT any vertical stretch.
 */
export const clockFont = 'SFClock';

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:'SFClock';src:url(data:font/woff2;base64,${sfCompressedMedium}) format('woff2');font-weight:400;font-style:normal;font-display:block;}`;
  document.head.appendChild(style);
  if ('fonts' in document) {
    document.fonts.load("400 16px 'SFClock'").catch(() => undefined);
  }
}
