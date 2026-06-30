/**
 * Data + deterministic randomisers for the iOS 26 "Liquid Glass" lock-screen
 * intro. Everything is seeded from a string (e.g. the chat id) so a given video
 * always renders the same lock screen, but different videos vary the time,
 * battery, carrier and wallpaper.
 */

/** A tiny deterministic PRNG seeded from a string (FNV-1a → mulberry32). */
export const seededRand = (seed: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Real Italian carriers, shown exactly as an iPhone renders them in the bar. */
export const IT_CARRIERS = [
  'TIM',
  'Vodafone',
  'WindTre',
  'iliad',
  'ho.',
  'Very',
  'Fastweb',
  'PosteMobile',
  'Kena',
  'CoopVoce',
  'Spusu',
  '1Mobile',
];

/**
 * Simple, smooth wallpapers (CSS gradients) for the glass to refract. Kept
 * deliberately clean — the user will supply a curated set later; until then we
 * pick one of these. Each is a full-frame CSS `background` value.
 */
export const WALLPAPERS: string[] = [
  // warm rose → deep teal (mirrors the reference screenshot)
  'radial-gradient(120% 90% at 18% 12%, #c0556e 0%, #7a2740 32%, #2b1622 58%, #0c1418 100%), linear-gradient(150deg, #b5536a 0%, #14333a 70%)',
  // dusk violet → indigo
  'radial-gradient(110% 90% at 80% 8%, #8b6ad0 0%, #5a3fa0 30%, #241a44 62%, #0b0a1a 100%)',
  // golden hour → dark
  'radial-gradient(120% 90% at 22% 14%, #e0a14a 0%, #b5612f 30%, #4a2a26 60%, #160f12 100%)',
  // ocean → night
  'radial-gradient(120% 95% at 78% 10%, #3aa6b9 0%, #1f6f8c 30%, #16384f 62%, #0a1018 100%)',
  // emerald → charcoal
  'radial-gradient(115% 90% at 20% 12%, #4fae7a 0%, #2e7c5a 30%, #1b3a32 60%, #0a130f 100%)',
  // magenta → plum
  'radial-gradient(120% 90% at 75% 10%, #c64f9a 0%, #8e2f6e 30%, #3c1a36 62%, #120a14 100%)',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Day-of-week (0=Sun) for a Gregorian date via a Sakamoto-style table. */
const dayOfWeek = (y: number, m: number, d: number): number => {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const yy = m < 3 ? y - 1 : y;
  return (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[m - 1] + d) % 7;
};

export type LockScreenData = {
  time: string; // "HH:MM"
  dateLabel: string; // "Mon 29 Jun"
  carrier: string;
  battery: number; // 1..100
  charging: boolean;
  wallpaper: string; // CSS background value
};

/**
 * Derive a full, varied lock-screen state from a seed. Hours lean toward the
 * evening/late-night (when these stories tend to happen) but the whole thing is
 * deterministic per seed.
 */
export const lockScreenFor = (seed: string): LockScreenData => {
  const r = seededRand('lock:' + seed);
  // Time — bias to 18:00–02:00 (late-day / night) but keep it varied.
  const hourPool = [19, 20, 21, 22, 22, 23, 23, 0, 1, 8, 9, 13, 14, 16, 18];
  const hh = hourPool[Math.floor(r() * hourPool.length)];
  const mm = Math.floor(r() * 60);
  const time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

  // Date — a real day in 2026 with the correct weekday.
  const year = 2026;
  const month = 1 + Math.floor(r() * 12);
  const day = 1 + Math.floor(r() * DAYS_IN_MONTH[month - 1]);
  const dateLabel = `${WEEKDAYS[dayOfWeek(year, month, day)]} ${day} ${MONTHS[month - 1]}`;

  const carrier = IT_CARRIERS[Math.floor(r() * IT_CARRIERS.length)];
  const battery = 1 + Math.floor(r() * 100);
  const charging = r() < 0.35;

  const wallpaper = WALLPAPERS[Math.floor(r() * WALLPAPERS.length)];

  return {time, dateLabel, carrier, battery, charging, wallpaper};
};
