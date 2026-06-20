/**
 * Generates the audio assets used by the reel, with zero network/binary deps:
 *   public/pop.wav   — a short message "pop"
 *   public/music.wav — a soft, seamlessly-looping ambient pad
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

// --- pop.wav: a quick, friendly blip with a slight downward pitch ---------
const makePop = (): number[] => {
  const dur = 0.13;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 38); // fast decay
    const freq = 920 - 220 * (t / dur); // gentle pitch drop
    out.push(0.6 * env * sine(freq, t));
  }
  return out;
};

// --- music.wav: 8s soft pad, integer Hz over integer seconds => seamless ---
const makeMusic = (): number[] => {
  const dur = 8; // seconds
  const n = SAMPLE_RATE * dur;
  const out: number[] = [];
  const chord = [196, 262, 330, 392]; // G3, C4, E4, G4 — warm and calm
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const lfo = 0.85 + 0.15 * sine(1, t); // 1 Hz tremolo (loops cleanly)
    let s = 0;
    for (const f of chord) s += sine(f, t);
    s = (s / chord.length) * 0.5 * lfo;
    // add a soft octave-down shimmer
    s += 0.12 * sine(98, t) * lfo;
    out.push(s);
  }
  return out;
};

fs.mkdirSync(PUBLIC, {recursive: true});
fs.writeFileSync(path.join(PUBLIC, 'pop.wav'), encodeWav(makePop()));
fs.writeFileSync(path.join(PUBLIC, 'music.wav'), encodeWav(makeMusic()));
console.log('Wrote public/pop.wav and public/music.wav');
