/**
 * Airchatty — BATCH renderer.
 *
 * Reads a spreadsheet (CSV, e.g. exported from the "Airchatty" Google Sheet)
 * where each ROW is one message, and rows sharing the same `chat` value form one
 * video. Renders every chat to out/<chat>.mp4.
 *
 *   npm run batch                      # reads ./conversations.csv
 *   npm run batch -- path/to/file.csv  # reads a specific file
 *   DRY=1 npm run batch -- file.csv    # print the parsed conversations, no render
 *
 * COLUMNS (header row, any order; Italian or English names accepted):
 *   chat       groups rows into one video + becomes the file name (required)
 *   ospiti     number of guests 2–6 (first row of the chat; default 2)
 *   host       host display name (first row of the chat; default Lorenzo)
 *   foto_host  host photo: a file in public/ (e.g. faces/face1.jpg), an
 *              uploaded file name (→ public/uploads/<name>) or a URL (optional)
 *   da         who sends this message: Host / O1 / O2 / O3 … (default O1)
 *   testo      the message text (optional if there's only a photo)
 *   onesto     host only: the HONEST draft typed then deleted before `testo`
 *   foto       a photo bubble for this message — file name / public path / URL
 *   foto_pos   photo position relative to the text: "prima" or "dopo" (default)
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import {execSync} from 'child_process';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';
import {ChatProps, ChatItem, DEFAULT_PROPS} from '../src/schema';
import {makeParticipants, pickApartment, pickDate} from '../src/avatars';
import {findEmojis, emojiCode} from '../src/emoji';
import {IntroChatProps} from '../src/Intro';
import {lockScreenFor, WALLPAPERS} from '../src/lockscreen';
import {pickDisclaimer} from '../src/introDisclaimers';

/** Seconds into notify-intro.wav where the cue cuts from black to the lock screen. */
const INTRO_MARKER_SEC = 1.44;

/** Frames rendered in parallel. Auto-scales to the machine (leave 1 core for the
 *  encoder); override with CONCURRENCY=n when a host needs a different setting. */
const RENDER_CONCURRENCY =
  Number(process.env.CONCURRENCY) || Math.max(2, Math.min(4, os.cpus().length - 1));

/**
 * Brightness of the two wallpaper bands that drive the adaptive UI: behind the
 * CLOCK (top band → light/dark glass digits) and behind the NOTIFICATION
 * (mid band → light/dark text). One python call samples both bands at once,
 * and results persist in .cache/wallpaper-brightness.json so a wallpaper is
 * only ever analysed ONCE across all batch runs (before: 2 subprocesses ×
 * every wallpaper in the library × every run).
 */
type Bands = {clock: number; notif: number};
const BRIGHT_CACHE_FILE = () => path.join(ROOT, '.cache', 'wallpaper-brightness.json');
let brightCache: Record<string, Bands> | null = null;
function wallpaperBands(rel: string): Bands {
  if (brightCache == null) {
    try {
      brightCache = JSON.parse(fs.readFileSync(BRIGHT_CACHE_FILE(), 'utf8'));
    } catch {
      brightCache = {};
    }
  }
  const cache = brightCache as Record<string, Bands>;
  if (rel in cache) return cache[rel];
  let val: Bands = {clock: 255, notif: 255}; // on error assume light → dark text/glass
  try {
    const abs = path.join(ROOT, 'public', rel);
    const py =
      `from PIL import Image;im=Image.open(${JSON.stringify(abs)}).convert('L');w,h=im.size;` +
      `b=lambda y0,y1:(lambda c:sum(c.getdata())/(c.width*c.height))(im.crop((int(w*0.06),int(h*y0),int(w*0.94),int(h*y1))));` +
      `print(b(0.13,0.36),b(0.42,0.55))`;
    const [c, n] = execSync(`python3 -c ${JSON.stringify(py)}`, {encoding: 'utf8'}).trim().split(/\s+/).map(Number);
    val = {clock: c, notif: n};
  } catch {
    /* keep the light-image default */
  }
  cache[rel] = val;
  try {
    fs.mkdirSync(path.dirname(BRIGHT_CACHE_FILE()), {recursive: true});
    fs.writeFileSync(BRIGHT_CACHE_FILE(), JSON.stringify(cache, null, 1));
  } catch {
    /* cache write is best-effort */
  }
  return val;
}

/** Dark BEHIND the notification (mid-screen band) → notification uses light text. */
const notifIsDark = (rel: string) => wallpaperBands(rel).notif < 130;
/** Dark BEHIND the clock (top band, where the big digits sit) → light glass clock.
 *  Sampled separately from the notification: a wallpaper's sky can be bright while
 *  its mid-screen is dark (or vice-versa), and the clock must adapt to ITS region. */
const clockIsDark = (rel: string) => wallpaperBands(rel).clock < 138;

/**
 * Pick a lock-screen wallpaper for a video, deterministically from the seed
 * (each chat gets its own, and re-rendering the same chat gives the same one).
 * When the user's wallpaper library (public/wallpapers/) has images, ONLY
 * those are used; the built-in gradients are just the fallback for an empty
 * folder. Returns the value + whether it's dark (drives the notification text).
 */
function pickWallpaper(seed: string): {wallpaper: string; dark: boolean; clockDark: boolean} {
  let imgs: string[] = [];
  try {
    imgs = fs
      .readdirSync(path.join(ROOT, 'public', 'wallpapers'))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort()
      .map((f) => `wallpapers/${f}`);
  } catch {
    /* none yet */
  }
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // Pick the file FIRST by hash, then analyse brightness for that one only —
  // never the whole library.
  if (imgs.length) {
    const f = imgs[h % imgs.length];
    return {wallpaper: f, dark: notifIsDark(f), clockDark: clockIsDark(f)};
  }
  const w = WALLPAPERS[h % WALLPAPERS.length] ?? WALLPAPERS[0];
  return {wallpaper: w.css, dark: w.dark, clockDark: w.dark};
}

/** Download the Twemoji SVG for every emoji used so they render in full colour. */
function ensureTwemoji(text: string) {
  const dir = path.join(ROOT, 'public', 'twemoji');
  fs.mkdirSync(dir, {recursive: true});
  const codes = [...new Set(findEmojis(text).map(emojiCode))];
  let fetched = 0;
  for (const code of codes) {
    const file = path.join(dir, `${code}.svg`);
    if (fs.existsSync(file) && fs.statSync(file).size > 0) continue;
    const url = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${code}.svg`;
    try {
      execSync(`curl -fsSL ${JSON.stringify(url)} -o ${JSON.stringify(file)}`, {stdio: 'ignore'});
      if (fs.existsSync(file) && fs.statSync(file).size > 0) fetched++;
      else fs.rmSync(file, {force: true});
    } catch {
      fs.rmSync(file, {force: true});
    }
  }
  if (codes.length) console.log(`  🎨 Twemoji: ${codes.length} emoji presenti (${fetched} scaricate ora).`);
}

const FFMPEG = path.join(__dirname, '..', 'node_modules', '@remotion', 'compositor-linux-x64-gnu', 'ffmpeg');
/** Probe a media file's duration in frames (best-effort; defaults to ~2s). */
function clipFrames(file: string, fps: number): number {
  try {
    const out = execSync(`${JSON.stringify(FFMPEG)} -i ${JSON.stringify(file)} 2>&1 || true`, {encoding: 'utf8'});
    const m = out.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m) return Math.round((Number(m[1]) * 3600 + Number(m[2]) * 60 + parseFloat(m[3])) * fps);
  } catch {
    /* ignore — fall back below */
  }
  return Math.round(2 * fps);
}

const ROOT = path.join(__dirname, '..');
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Minimal RFC-4180 CSV parser — handles quoted fields with commas/newlines. */
function parseCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Resolve a photo reference to something <Img>/staticFile can load. */
function resolvePhoto(v: string): string | undefined {
  const s = (v ?? '').trim();
  if (!s) return undefined;
  if (/^(https?:|data:)/i.test(s)) return s; // URL or data-URI
  if (s.includes('/')) return s; // explicit path under public/ (e.g. faces/x.jpg)
  return `uploads/${s}`; // bare file name → public/uploads/<name>
}

/** Map a `da` cell to a sender id ("host" or "p0".."p5"). */
function senderId(da: string, hostName: string, guestCount: number): string {
  const l = (da ?? '').trim().toLowerCase();
  const hostFirst = hostName.trim().toLowerCase().split(/\s+/)[0];
  if (!l) return 'p0';
  if (['host', 'h', 'owner', 'me', 'io'].includes(l) || (hostFirst && l === hostFirst)) return 'host';
  const m = l.match(/^(?:o|ospite|guest|g)?\s*(\d+)$/);
  if (m) return `p${clamp(parseInt(m[1], 10) - 1, 0, guestCount - 1)}`;
  return 'p0';
}

type Row = Record<string, string>;

/** Build one video's chat items from its ordered message rows. */
function buildItems(rows: Row[], hostName: string, guestCount: number, memeFrames: number): ChatItem[] {
  const items: ChatItem[] = [{type: 'separator', label: 'Today'}];
  let first = true;
  const push = (sender: string, text: string, opts: {drafts?: string[]; photo?: string; time?: string} = {}) => {
    const it: ChatItem = {type: 'message', sender, text};
    if (opts.drafts && opts.drafts.length) it.drafts = opts.drafts;
    if (opts.photo) it.photo = opts.photo;
    if (opts.time) it.time = opts.time;
    if (first) {
      it.animate = false; // the very first message is already on screen
      first = false;
    }
    items.push(it);
  };

  for (const r of rows) {
    const da = (r.da ?? '').trim().toLowerCase();
    if (memeFrames > 0 && ['meme', 'few', 'fewmoments', 'interstitial', 'stacco'].includes(da)) {
      items.push({type: 'interstitial', clip: 'fewmoments.mp4', sound: 'notify.mp3', durationInFrames: memeFrames});
      first = false; // an interstitial counts as content already on screen-flow
      continue;
    }
    const sender = senderId(r.da, hostName, guestCount);
    const text = (r.testo ?? '').trim();
    // The "onesto" cell may hold several cynical phrases (one typed+deleted after
    // another) separated by "|" or by line breaks — up to 5.
    const drafts = (r.onesto ?? '')
      .split(/\s*\|\s*|\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
    const photo = resolvePhoto(r.foto);
    const photoFirst = (r.foto_pos ?? '').trim().toLowerCase().startsWith('prima');
    const time = (r.ora ?? '').trim() || undefined;

    if (photo && photoFirst) push(sender, '', {photo, time});
    if (text || (drafts.length && sender === 'host')) push(sender, text, {drafts: sender === 'host' ? drafts : [], time});
    if (photo && !photoFirst) push(sender, '', {photo});
  }
  return items;
}

async function main() {
  const csvPath = path.resolve(process.argv[2] ?? path.join(ROOT, 'conversations.csv'));
  if (!fs.existsSync(csvPath)) {
    console.error(`\n  ✗ File CSV non trovato: ${csvPath}`);
    console.error(`    Esporta il Google Sheet "Airchatty" come CSV, oppure:`);
    console.error(`    npm run batch -- percorso/del/tuo-file.csv\n`);
    process.exit(1);
  }

  const grid = parseCSV(fs.readFileSync(csvPath, 'utf8'));
  if (grid.length < 2) {
    console.error('  ✗ Il CSV deve avere un\'intestazione + almeno una riga di dati.');
    process.exit(1);
  }
  const header = grid[0].map((h) => h.trim().toLowerCase());
  const idx = (...names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
  const cols = {
    chat: idx('chat', 'video', 'nome', 'name'),
    ospiti: idx('ospiti', 'guests', 'guest'),
    host: idx('host', 'host_name', 'nome_host'),
    foto_host: idx('foto_host', 'host_foto', 'host_photo', 'avatar_host'),
    da: idx('da', 'mittente', 'from', 'sender'),
    testo: idx('testo', 'messaggio', 'text', 'message'),
    onesto: idx('onesto', 'honest', 'draft', 'autentico'),
    foto: idx('foto', 'photo', 'immagine', 'image'),
    foto_pos: idx('foto_pos', 'posizione_foto', 'photo_pos', 'foto_posizione'),
    ora: idx('ora', 'orario', 'time', 'hour'),
    finale: idx('finale', 'meme', 'outro', 'ending'),
  };
  if (cols.chat < 0) {
    console.error('  ✗ Manca la colonna "chat" (raggruppa i messaggi in un video).');
    process.exit(1);
  }
  const cell = (row: string[], i: number) => (i >= 0 ? (row[i] ?? '').trim() : '');
  const rowObj = (row: string[]): Row => ({
    chat: cell(row, cols.chat),
    ospiti: cell(row, cols.ospiti),
    host: cell(row, cols.host),
    foto_host: cell(row, cols.foto_host),
    da: cell(row, cols.da),
    testo: cell(row, cols.testo),
    onesto: cell(row, cols.onesto),
    foto: cell(row, cols.foto),
    foto_pos: cell(row, cols.foto_pos),
    ora: cell(row, cols.ora),
    finale: cell(row, cols.finale),
  });

  // Group consecutive rows by `chat` (an empty chat inherits the previous one).
  const groups: {chat: string; rows: Row[]}[] = [];
  let cur = '';
  for (const raw of grid.slice(1)) {
    if (!raw.some((f) => f.trim() !== '')) continue; // blank line
    const r = rowObj(raw);
    const chat = r.chat || cur;
    if (!chat) continue; // no chat yet → skip stray row
    if (chat !== cur || groups.length === 0) {
      groups.push({chat, rows: []});
      cur = chat;
    }
    r.chat = chat;
    groups[groups.length - 1].rows.push(r);
  }
  if (groups.length === 0) {
    console.error('  ✗ Nessuna conversazione trovata (riempi almeno la colonna "chat" + "testo").');
    process.exit(1);
  }

  console.log(`\n  Trovate ${groups.length} conversazioni. Preparo il motore di render…`);
  ensureTwemoji(groups.flatMap((g) => g.rows.map((r) => `${r.testo} ${r.onesto} ${r.foto_pos}`)).join(' '));
  const memePath = path.join(ROOT, 'public', 'fewmoments.mp4');
  const memeFrames = fs.existsSync(memePath) ? clipFrames(memePath, 30) : 0;
  const serveUrl = process.env.DRY ? '' : await bundle({entryPoint: path.join(ROOT, 'src', 'Root.tsx'), onProgress: () => undefined});
  const outDir = path.join(ROOT, 'out');
  fs.mkdirSync(outDir, {recursive: true});

  const used = new Set<string>();
  let done = 0;
  const failed: string[] = [];
  for (let g = 0; g < groups.length; g++) {
    const {chat, rows} = groups[g];
    const firstWith = (k: keyof Row) => rows.find((r) => r[k])?.[k] ?? '';
    // Airbnb group threads are always host + at least TWO guests → min 2.
    const guests = clamp(parseInt(firstWith('ospiti'), 10) || 2, 2, 6);
    const hostName = firstWith('host') || DEFAULT_PROPS.hostName;
    const hostAvatar = resolvePhoto(firstWith('foto_host')) || DEFAULT_PROPS.hostAvatar;

    const items = buildItems(rows, hostName, guests, memeFrames);
    if (items.filter((i) => i.type === 'message').length === 0) continue;

    let base = slug(chat) || `video-${g + 1}`;
    let outName = base;
    for (let k = 2; used.has(outName); k++) outName = `${base}-${k}`;
    used.add(outName);

    if (process.env.DRY) {
      console.log(`\n=== ${outName} (ospiti:${guests}, host:${hostName}, foto_host:${hostAvatar}) ===`);
      for (const it of items) {
        if (it.type === 'separator') console.log(`  --- ${it.label} ---`);
        else if (it.type === 'interstitial')
          console.log(`  [MEME] ${it.clip} (${it.durationInFrames}f) + suono ${it.sound ?? '-'}`);
        else
          console.log(
            `  ${it.sender.padEnd(5)} ${it.drafts?.length ? `[onesto:${it.drafts.map((d) => `"${d}"`).join(' → ')}] ` : ''}${it.photo ? `🖼 ${it.photo} ` : ''}${it.text}${it.animate === false ? ' [già a schermo]' : ''}`,
          );
      }
      done++;
      continue;
    }

    // Meme outro: if the `finale` column is set, play the real clip when
    // public/outro.mp4 exists, otherwise fall back to the recreated credit.
    const finale = firstWith('finale').toLowerCase();
    const wantOutro = ['weide', 'curb', 'si', 'sì', 'yes', 'x', '1', 'true'].includes(finale);
    const hasClip = fs.existsSync(path.join(ROOT, 'public', 'outro.mp4'));
    const outro = wantOutro ? (hasClip ? 'outro.mp4' : 'weide') : '';

    const seed = g + 1;
    const props: ChatProps = {
      ...DEFAULT_PROPS,
      items,
      hostName,
      hostAvatar,
      participants: makeParticipants(guests, seed),
      headerDate: pickDate(seed),
      headerApt: pickApartment(seed),
      outro,
    };

    // Wrap the chat in the full intro → lock-screen → unlock animation. The
    // disclaimer + lock-screen state are deterministic per video (seeded by its
    // name), and calculateMetadata (prepareIntroChat) fills the lock-screen
    // clock + Airbnb push from the first guest message — so the lock-screen time
    // always matches the conversation.
    const wp = pickWallpaper(outName);
    const introProps: IntroChatProps = {
      ...props,
      intro: {
        disclaimer: pickDisclaimer(outName),
        lock: {...lockScreenFor(outName), wallpaper: wp.wallpaper, darkWallpaper: wp.dark, darkClock: wp.clockDark},
        guestName: '',
        guestSubtitle: '',
        guestPhoto: '',
        message: '',
        markerSec: INTRO_MARKER_SEC,
      },
    };

    const outFile = path.join(outDir, `${outName}.mp4`);
    console.log(`  [${g + 1}/${groups.length}] render → out/${outName}.mp4`);
    // Render with retries and continue past failures — Remotion's headless
    // Chrome occasionally drops a page ("Target closed"); a retry fixes it, and
    // one flaky video must never abort the whole batch.
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const composition = await selectComposition({serveUrl, id: 'IntroChat', inputProps: introProps});
        await renderMedia({
          composition,
          serveUrl,
          codec: 'h264',
          // Standard broadcast color tagging (limited-range BT.709). Without it
          // the encode comes out yuvj420p FULL range + BT.601, which many
          // players (phones, hardware decoders) misinterpret: everything above
          // ~235 clips to pure white and the #f5f5f5 bubbles disappear.
          colorSpace: 'bt709',
          outputLocation: outFile,
          inputProps: introProps,
          concurrency: RENDER_CONCURRENCY,
          timeoutInMilliseconds: 180000,
        });
        ok = true;
      } catch (err) {
        console.error(`    ⚠ tentativo ${attempt}/3 fallito: ${(err as Error).message.split('\n')[0]}`);
      }
    }
    if (ok) done++;
    else {
      failed.push(outName);
      console.error(`    ✗ ${outName} saltato dopo 3 tentativi.`);
    }
  }
  if (failed.length) console.log(`\n  ⚠ Falliti: ${failed.join(', ')}`);
  console.log(`\n  ✓ Fatto! ${done} ${process.env.DRY ? 'conversazioni lette' : `video pronti in: ${outDir}`}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
