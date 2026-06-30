import {sfMedium, sfSemibold, sfBold, sfHeavy} from './clockfont-data';

/**
 * The Liquid-Glass lock clock uses Apple's actual San Francisco Pro Display
 * (the real iOS lock-clock typeface), subset to digits + colon and embedded as
 * woff2 data URIs so the render never waits on a network fetch.
 * Weights: 500 Medium, 600 Semibold, 700 Bold, 900 Heavy.
 */
export const clockFont = 'SFClock';

if (typeof document !== 'undefined') {
  const face = (b64: string, w: number) =>
    `@font-face{font-family:'SFClock';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${w};font-style:normal;font-display:block;}`;
  const style = document.createElement('style');
  style.textContent = face(sfMedium, 500) + face(sfSemibold, 600) + face(sfBold, 700) + face(sfHeavy, 900);
  document.head.appendChild(style);
  if ('fonts' in document) {
    [500, 600, 700, 900].forEach((w) => document.fonts.load(`${w} 16px 'SFClock'`).catch(() => undefined));
  }
}
