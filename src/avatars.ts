import {Participant} from './schema';

/** AI faces shipped in public/faces (from thispersondoesnotexist.com). */
export const FACE_FILES = Array.from({length: 9}, (_, i) => `faces/face${i + 1}.jpg`);

export const ITALIAN_NAMES = [
  'Marco', 'Giulia', 'Francesco', 'Sofia', 'Alessandro', 'Chiara', 'Lorenzo',
  'Martina', 'Matteo', 'Aurora', 'Davide', 'Elena', 'Simone', 'Giorgia',
  'Luca', 'Bianca', 'Andrea', 'Sara', 'Riccardo', 'Alice',
];

/** Italian Airbnb-style listing names (intentionally long — they get clipped). */
export const APARTMENT_NAMES = [
  'Piccola Casa Rossa vicino Trastevere con giardino',
  'Appartamento Luminoso con Vista sui Tetti di Roma',
  'Villa di Prestigio Privata con Piscina e Suite',
  'Loft Moderno nel Cuore di Firenze a due passi dal Duomo',
  'Attico Panoramico sul Lungomare di Napoli',
  'Casa Vacanze Sole e Mare in Costiera Amalfitana',
  'Dimora Storica nel Centro di Bologna con terrazza',
  'Suite Elegante vicino Piazza San Marco a Venezia',
  'Rustico Toscano immerso nelle Colline del Chianti',
  'Monolocale Accogliente a due passi dal Colosseo',
];

export const DATE_RANGES = [
  '15–17 Jun', '23–29 Jun', '5–8 Jul', '12–16 Aug', '2–6 Sep',
  '19–22 Jun', '29 Jun – 6 Jul', '8–11 Aug', '14–18 Sep',
];

export const ROLES = ['Booker', 'Booker', 'Booker', 'Co-host'];

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const shuffle = <T>(arr: T[], rnd: () => number): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Deterministically build `count` chat participants: Italian names, mostly
 * "Booker" role, an AI face most of the time and just an initials avatar
 * otherwise (~1 in 4) — like real Airbnb group threads.
 */
export const makeParticipants = (count: number, seed = 1): Participant[] => {
  const rnd = mulberry(seed * 2654435761);
  const names = shuffle(ITALIAN_NAMES, rnd);
  const faces = shuffle(FACE_FILES, rnd);
  const out: Participant[] = [];
  for (let i = 0; i < count; i++) {
    const hasFace = rnd() > 0.25; // ~75% have a photo
    out.push({
      name: names[i],
      role: i === count - 1 && count > 2 ? 'Co-host' : 'Booker',
      avatar: hasFace ? faces[i % faces.length] : '',
    });
  }
  return out;
};

export const pickApartment = (seed = 1) => APARTMENT_NAMES[Math.floor(mulberry(seed * 7).call(null) * APARTMENT_NAMES.length)];
export const pickDate = (seed = 1) => DATE_RANGES[Math.floor(mulberry(seed * 13).call(null) * DATE_RANGES.length)];
