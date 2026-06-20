import {continueRender, delayRender} from 'remotion';
import {mulishBase64} from './font-data';

/**
 * Airbnb's brand face "Cereal" is proprietary. Mulish is the closest free,
 * geometric, low-contrast sans (double-story 'a', single-story 'g'). The font
 * is embedded as a data URI, so there is no network fetch at render time
 * (which previously caused delayRender timeouts under render concurrency).
 */
export const brandFont = 'Mulish';

if (typeof document !== 'undefined' && 'fonts' in document) {
  const handle = delayRender('load-mulish');
  // FontFace().load() on a data URI decodes locally (no network), so it
  // resolves reliably even when a render page is recycled mid-render.
  const font = new FontFace('Mulish', `url(data:font/ttf;base64,${mulishBase64})`, {
    weight: '200 900',
    style: 'normal',
  });
  font
    .load()
    .then(() => {
      document.fonts.add(font);
      continueRender(handle);
    })
    .catch(() => continueRender(handle));
}
