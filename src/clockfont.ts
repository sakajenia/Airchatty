import {sfMedium, sfSemibold} from './clockfont-data';

/**
 * The Liquid-Glass lock clock uses Apple's actual San Francisco Pro Display
 * (the real iOS lock-clock typeface), subset to digits + colon and embedded as
 * woff2 data URIs so the render never waits on a network fetch. Weight 500
 * (Medium) / 600 (Semibold).
 */
export const clockFont = 'SFClock';

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent =
    `@font-face{font-family:'SFClock';src:url(data:font/woff2;base64,${sfMedium}) format('woff2');font-weight:500;font-style:normal;font-display:block;}` +
    `@font-face{font-family:'SFClock';src:url(data:font/woff2;base64,${sfSemibold}) format('woff2');font-weight:600;font-style:normal;font-display:block;}`;
  document.head.appendChild(style);
  if ('fonts' in document) {
    document.fonts.load("500 16px 'SFClock'").catch(() => undefined);
    document.fonts.load("600 16px 'SFClock'").catch(() => undefined);
  }
}
