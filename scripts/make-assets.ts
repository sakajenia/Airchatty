/**
 * Generates the keyboard audio used by the reel, with zero network/binary deps.
 * These are original synthesized recreations of an iPhone-style keyboard — a
 * crisp letter "click" and a duller "delete" tock — not Apple's copyrighted
 * sound files.
 *
 *   public/keytype.wav    — letter / character key press
 *   public/keydelete.wav  — delete / backspace key press
 *
 * Run with:  npm run make-assets
 */
import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;
const PUBLIC = path.join(__dirname, '..', 'public');

/** Encode mono float samples (-1..1) into a 16-bit PCM WAV buffer. */
const encodeWav = (samples: number[]): Buffer => {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
};

const sine = (freq: number, t: number) => Math.sin(2 * Math.PI * freq * t);

/**
 * A short percussive "tock": a tiny noise transient (the tap) plus a couple of
 * fast-decaying resonances (the tonal body). Brighter/higher = the type click,
 * lower/duller = the delete sound.
 */
const makeClick = (opts: {dur: number; freqs: number[]; decay: number; bright: number}): number[] => {
  const {dur, freqs, decay, bright} = opts;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out: number[] = [];
  let seed = 22571;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff) * 2 - 1;
  };
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const transient = Math.exp(-t * 1500); // the sharp tap
    const body = Math.exp(-t * decay); // the resonant tock
    let tonal = 0;
    for (const f of freqs) tonal += sine(f, t);
    tonal /= freqs.length;
    let s = bright * 0.5 * noise() * transient + 0.8 * tonal * body;
    // a short overall fade so the tail never clicks
    s *= Math.min(1, (n - i) / (SAMPLE_RATE * 0.005));
    out.push(s * 0.72);
  }
  return out;
};

const keytype = makeClick({dur: 0.05, freqs: [1850, 2650], decay: 135, bright: 0.95});
const keydelete = makeClick({dur: 0.06, freqs: [1050, 1500], decay: 100, bright: 0.6});

// A gentle "message sent" pip (placeholder until the real Airbnb sound is in).
const makeSent = (): number[] => {
  const dur = 0.28;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 16) * Math.min(1, t / 0.006);
    const freq = 660 + 360 * (t / dur); // gentle upward swish
    out.push(0.42 * env * (sine(freq, t) + 0.4 * sine(freq * 2, t)));
  }
  return out;
};

fs.mkdirSync(PUBLIC, {recursive: true});
// Only write the synthesized fallbacks if real sounds aren't already in place,
// so this never clobbers the trimmed iPhone recordings.
const write = (name: string, samples: number[]) => {
  const p = path.join(PUBLIC, name);
  if (fs.existsSync(p)) {
    console.log(`Keeping existing ${name}`);
    return;
  }
  fs.writeFileSync(p, encodeWav(samples));
  console.log(`Wrote ${name}`);
};
write('keytype.wav', keytype);
write('keydelete.wav', keydelete);
write('sent.wav', makeSent());
// Remove the old sounds (no longer used).
for (const f of ['pop.wav', 'music.wav']) {
  const p = path.join(PUBLIC, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
