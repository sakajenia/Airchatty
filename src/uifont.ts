import {sfText400, sfText500, sfText600, sfText700} from './uifont-data';

/**
 * Apple SF Pro Text — the real iOS UI typeface — for the lock-screen chrome
 * (carrier, date/title, notification, status bar). Embedded (woff2 data URIs,
 * Latin + Italian subset) so the render never waits on a network fetch.
 */
export const uiFont = 'SFPro';

if (typeof document !== 'undefined') {
  const face = (b64: string, w: number) =>
    `@font-face{font-family:'SFPro';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${w};font-style:normal;font-display:block;}`;
  const style = document.createElement('style');
  style.textContent = face(sfText400, 400) + face(sfText500, 500) + face(sfText600, 600) + face(sfText700, 700);
  document.head.appendChild(style);
  if ('fonts' in document) {
    [400, 500, 600, 700].forEach((w) => document.fonts.load(`${w} 16px 'SFPro'`).catch(() => undefined));
  }
}
