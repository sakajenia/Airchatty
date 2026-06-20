import {mulishBase64} from './font-data';

/**
 * Airbnb's brand face "Cereal" is proprietary. Mulish is the closest free,
 * geometric, low-contrast sans (double-story 'a', single-story 'g'). The font
 * is embedded as a data URI and registered via an @font-face rule. Because the
 * data URI carries no network request, the browser has it available
 * immediately — so we do NOT gate rendering on a font promise (which could
 * hang and time out a render page).
 */
export const brandFont = 'Mulish';

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:'Mulish';src:url(data:font/ttf;base64,${mulishBase64}) format('truetype');font-weight:200 900;font-style:normal;font-display:block;}`;
  document.head.appendChild(style);
  if ('fonts' in document) {
    // Best-effort: kick off the load so it's ready as early as possible.
    document.fonts.load("500 16px 'Mulish'").catch(() => undefined);
  }
}

