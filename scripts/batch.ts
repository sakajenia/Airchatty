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
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';
import {ChatProps, ChatItem, DEFAULT_PROPS} from '../src/schema';
import {makeParticipants, pickApartment, pickDate} from '../src/avatars';

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
function buildItems(rows: Row[], hostName: string, guestCount: number): ChatItem[] {
  const items: ChatItem[] = [{type: 'separator', label: 'Today'}];
  let first = true;
  const push = (sender: string, text: string, opts: {draft?: string; photo?: string} = {}) => {
    const it: ChatItem = {type: 'message', sender, text};
    if (opts.draft) it.draft = opts.draft;
    if (opts.photo) it.photo = opts.photo;
    if (first) {
      it.animate = false; // the very first message is already on screen
      first = false;
    }
    items.push(it);
  };

  for (const r of rows) {
    const sender = senderId(r.da, hostName, guestCount);
    const text = (r.testo ?? '').trim();
    const draft = (r.onesto ?? '').trim() || undefined;
    const photo = resolvePhoto(r.foto);
    const photoFirst = (r.foto_pos ?? '').trim().toLowerCase().startsWith('prima');

    if (photo && photoFirst) push(sender, '', {photo});
    if (text || draft) push(sender, text, {draft});
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
  const serveUrl = process.env.DRY ? '' : await bundle({entryPoint: path.join(ROOT, 'src', 'Root.tsx'), onProgress: () => undefined});
  const outDir = path.join(ROOT, 'out');
  fs.mkdirSync(outDir, {recursive: true});

  const used = new Set<string>();
  let done = 0;
  const failed: string[] = [];
  for (let g = 0; g < groups.length; g++) {
    const {chat, rows} = groups[g];
    const firstWith = (k: keyof Row) => rows.find((r) => r[k])?.[k] ?? '';
    const guests = clamp(parseInt(firstWith('ospiti'), 10) || 2, 2, 6);
    const hostName = firstWith('host') || DEFAULT_PROPS.hostName;
    const hostAvatar = resolvePhoto(firstWith('foto_host')) || DEFAULT_PROPS.hostAvatar;

    const items = buildItems(rows, hostName, guests);
    if (items.filter((i) => i.type === 'message').length === 0) continue;

    let base = slug(chat) || `video-${g + 1}`;
    let outName = base;
    for (let k = 2; used.has(outName); k++) outName = `${base}-${k}`;
    used.add(outName);

    if (process.env.DRY) {
      console.log(`\n=== ${outName} (ospiti:${guests}, host:${hostName}, foto_host:${hostAvatar}) ===`);
      for (const it of items) {
        if (it.type === 'separator') console.log(`  --- ${it.label} ---`);
        else
          console.log(
            `  ${it.sender.padEnd(5)} ${it.draft ? `[onesto:"${it.draft}"] ` : ''}${it.photo ? `🖼 ${it.photo} ` : ''}${it.text}${it.animate === false ? ' [già a schermo]' : ''}`,
          );
      }
      done++;
      continue;
    }

    const seed = g + 1;
    const props: ChatProps = {
      ...DEFAULT_PROPS,
      items,
      hostName,
      hostAvatar,
      participants: makeParticipants(guests, seed),
      headerDate: pickDate(seed),
      headerApt: pickApartment(seed),
    };

    const outFile = path.join(outDir, `${outName}.mp4`);
    console.log(`  [${g + 1}/${groups.length}] render → out/${outName}.mp4`);
    // Render with retries and continue past failures — Remotion's headless
    // Chrome occasionally drops a page ("Target closed"); a retry fixes it, and
    // one flaky video must never abort the whole batch.
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const composition = await selectComposition({serveUrl, id: 'ChatReel', inputProps: props});
        await renderMedia({
          composition,
          serveUrl,
          codec: 'h264',
          outputLocation: outFile,
          inputProps: props,
          concurrency: 1, // most stable on small/limited hosts
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
