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
// Each wallpaper places a LARGE bright orb right behind the clock (~58% 33%),
// a secondary colour blob low, and a dark base. The bright orb is what the
// glass clock refracts — you see it through the digits, like the reference.
export const WALLPAPERS: string[] = [
  // rose + teal with a cool blue orb (mirrors the reference)
  'radial-gradient(56% 40% at 58% 32%, rgba(150,200,225,0.9) 0%, rgba(120,175,205,0.32) 46%, rgba(120,175,205,0) 72%), radial-gradient(105% 92% at 86% 82%, #14525f 0%, #0c2e3a 50%, rgba(10,18,24,0) 86%), radial-gradient(112% 96% at 6% 3%, #b85572 0%, #5d2438 48%, #160d14 100%)',
  // violet dusk with a lilac orb
  'radial-gradient(56% 40% at 56% 33%, rgba(206,196,240,0.88) 0%, rgba(170,150,225,0.30) 46%, rgba(170,150,225,0) 72%), radial-gradient(105% 92% at 16% 82%, #3a2a72 0%, #211848 50%, rgba(11,10,26,0) 86%), radial-gradient(112% 96% at 84% 4%, #8b6ad0 0%, #4b3496 48%, #0b0a1a 100%)',
  // golden hour with a warm cream orb
  'radial-gradient(56% 40% at 60% 33%, rgba(255,232,195,0.9) 0%, rgba(245,200,150,0.30) 46%, rgba(245,200,150,0) 72%), radial-gradient(105% 92% at 84% 82%, #7a3a26 0%, #3a1e1a 50%, rgba(22,15,18,0) 86%), radial-gradient(112% 96% at 8% 4%, #e0a14a 0%, #9c4f2a 48%, #160f12 100%)',
  // ocean with a pale aqua orb
  'radial-gradient(56% 40% at 44% 33%, rgba(200,232,242,0.9) 0%, rgba(150,210,228,0.32) 46%, rgba(150,210,228,0) 72%), radial-gradient(105% 92% at 84% 82%, #0f4a5e 0%, #0a2c3c 50%, rgba(10,16,24,0) 86%), radial-gradient(112% 96% at 80% 4%, #3aa6b9 0%, #1c5f78 48%, #0a1018 100%)',
  // emerald with a mint orb
  'radial-gradient(56% 40% at 58% 33%, rgba(206,240,218,0.88) 0%, rgba(150,215,180,0.30) 46%, rgba(150,215,180,0) 72%), radial-gradient(105% 92% at 16% 82%, #1f5a44 0%, #123026 50%, rgba(10,19,15,0) 86%), radial-gradient(112% 96% at 84% 4%, #4fae7a 0%, #2b6f50 48%, #0a130f 100%)',
  // magenta/plum with a pink orb
  'radial-gradient(56% 40% at 56% 33%, rgba(248,210,235,0.88) 0%, rgba(225,150,200,0.30) 46%, rgba(225,150,200,0) 72%), radial-gradient(105% 92% at 84% 82%, #5a2350 0%, #2e1230 50%, rgba(18,10,20,0) 86%), radial-gradient(112% 96% at 14% 4%, #c64f9a 0%, #7e2c66 48%, #120a14 100%)',
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
