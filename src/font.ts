import {brandFontBase64} from './font-data';

/**
 * Airbnb's brand face "Cereal VF" is proprietary (per the official design spec
 * its stack is 'Airbnb Cereal VF', Circular, …). DM Sans is the closest free
 * face to that Circular-derived skeleton: geometric, low-contrast, round dots,
 * double-story 'a', single-story 'g'. The variable font is embedded as a data
 * URI and registered via an @font-face rule. Because the data URI carries no
 * network request, the browser has it available immediately — so we do NOT
 * gate rendering on a font promise (which could hang and time out a render).
 */
export const brandFont = 'BrandSans';

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:'BrandSans';src:url(data:font/ttf;base64,${brandFontBase64}) format('truetype');font-weight:100 900;font-style:normal;font-display:block;}`;
  document.head.appendChild(style);
  if ('fonts' in document) {
    // Best-effort: kick off the load so it's ready as early as possible.
    document.fonts.load("500 16px 'BrandSans'").catch(() => undefined);
  }
}
