import {poppinsMediumBase64} from './clockfont-data';

/**
 * The Liquid-Glass lock clock uses a geometric, near-monoline face (Poppins),
 * stretched vertically, to mirror the iOS 26 lock-screen clock. Embedded as a
 * data URI (like the brand font) so the render never waits on a network fetch.
 */
export const clockFont = 'PoppinsClock';

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:'PoppinsClock';src:url(data:font/ttf;base64,${poppinsMediumBase64}) format('truetype');font-weight:400 600;font-style:normal;font-display:block;}`;
  document.head.appendChild(style);
  if ('fonts' in document) {
    document.fonts.load("500 16px 'PoppinsClock'").catch(() => undefined);
  }
}
