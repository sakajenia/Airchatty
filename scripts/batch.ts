/**
 * Airchatty — BATCH renderer.
 *
 * Reads a spreadsheet (CSV, e.g. exported from Google Sheets) where each row is
 * one video, and renders every row to out/<name>.mp4 automatically.
 *
 *   npm run batch                      # reads ./conversations.csv
 *   npm run batch -- path/to/file.csv  # reads a specific file
 *
 * CSV columns (header row, any order — only `conversation` is required):
 *   name          short title used for the output file name (optional)
 *   guests        number of guests 2–6 (optional, default 2)
 *   host_name     your host display name (optional, default Lorenzo)
 *   conversation  the script — one message per line (see buildItems below)
 *
 * Inside the `conversation` cell, one message per line:
 *   G:  ...     a guest message (guest #1)
 *   G2: ...     a message from guest #2 (G3, G4… up to the guest count)
 *   HD: ...     the host's HONEST draft — typed then deleted (optional)
 *   H:  ...     the host's cordial message that actually gets sent
 *   +❤️         attaches a reaction to the previous message
 *   # Today     a centered date separator
 * An HD: line attaches its text as the draft of the next H: line.
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
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

/** Turn one `conversation` cell into structured chat items. */
function buildItems(cell: string, guestCount: number): ChatItem[] {
  const items: ChatItem[] = [{type: 'separator', label: 'Today'}];
  // Accept real newlines or " | " as line separators (Sheets-friendly).
  const lines = (cell.includes('\n') ? cell.split(/\r?\n/) : cell.split('|'));
  let pendingDraft: string | undefined;
  let firstMessage = true;

  const lastMessage = () => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].type === 'message') return items[i] as Extract<ChatItem, {type: 'message'}>;
    }
    return null;
  };
  const push = (sender: string, text: string, draft?: string) => {
    const item: ChatItem = {type: 'message', sender, text};
    if (draft) item.draft = draft;
    if (firstMessage) {
      item.animate = false; // first message is already on screen
      firstMessage = false;
    }
    items.push(item);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      const label = line.replace(/^#+\s*/, '').trim();
      if (label) items.push({type: 'separator', label});
      continue;
    }
    if (line.startsWith('+') && line.length <= 6) {
      const prev = lastMessage();
      if (prev) prev.reaction = line.slice(1).trim();
      continue;
    }

    const m = line.match(/^([A-Za-z]+\d*)\s*[:：]\s*(.*)$/);
    const tag = m ? m[1].toUpperCase() : '';
    const text = m ? m[2].trim() : line;
    if (!text && tag !== 'HD') continue;

    if (tag === 'HD') {
      pendingDraft = text;
    } else if (tag === 'H' || tag === 'HOST') {
      push('host', text, pendingDraft);
      pendingDraft = undefined;
    } else if (/^G\d*$/.test(tag)) {
      const n = tag.length > 1 ? parseInt(tag.slice(1), 10) - 1 : 0;
      push(`p${clamp(n, 0, guestCount - 1)}`, text);
    } else {
      // No recognised tag → treat as a guest #1 line.
      push('p0', text);
    }
  }
  return items;
}

async function main() {
  const csvPath = path.resolve(process.argv[2] ?? path.join(ROOT, 'conversations.csv'));
  if (!fs.existsSync(csvPath)) {
    console.error(`\n  ✗ File CSV non trovato: ${csvPath}`);
    console.error(`    Esporta il tuo Google Sheet come CSV e mettilo lì, oppure:`);
    console.error(`    npm run batch -- percorso/del/tuo-file.csv\n`);
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
  if (rows.length < 2) {
    console.error('  ✗ Il CSV non ha righe di dati (serve un\'intestazione + almeno una riga).');
    process.exit(1);
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
  const ci = {
    name: col('name', 'titolo', 'title'),
    guests: col('guests', 'guest', 'ospiti'),
    host: col('host_name', 'host', 'nome_host'),
    conv: col('conversation', 'conversazione', 'chat', 'script'),
  };
  if (ci.conv < 0) {
    console.error('  ✗ Manca la colonna "conversation" nell\'intestazione del CSV.');
    process.exit(1);
  }

  const dataRows = rows.slice(1);
  console.log(`\n  Trovate ${dataRows.length} conversazioni. Preparo il motore di render…`);
  const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'Root.tsx'), onProgress: () => undefined});
  const outDir = path.join(ROOT, 'out');
  fs.mkdirSync(outDir, {recursive: true});

  const used = new Set<string>();
  let done = 0;
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    const conv = row[ci.conv] ?? '';
    if (!conv.trim()) continue;

    const guests = clamp(parseInt(ci.guests >= 0 ? row[ci.guests] : '', 10) || 2, 2, 6);
    const hostName = (ci.host >= 0 && row[ci.host]?.trim()) || DEFAULT_PROPS.hostName;
    let base = (ci.name >= 0 && slug(row[ci.name] ?? '')) || `video-${r + 1}`;
    let outName = base;
    for (let k = 2; used.has(outName); k++) outName = `${base}-${k}`;
    used.add(outName);

    const seed = r + 1; // stable per row, different across rows
    const props: ChatProps = {
      ...DEFAULT_PROPS,
      items: buildItems(conv, guests),
      hostName,
      participants: makeParticipants(guests, seed),
      headerDate: pickDate(seed),
      headerApt: pickApartment(seed),
    };

    const composition = await selectComposition({serveUrl, id: 'ChatReel', inputProps: props});
    const outFile = path.join(outDir, `${outName}.mp4`);
    console.log(`  [${r + 1}/${dataRows.length}] render → out/${outName}.mp4`);
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outFile,
      inputProps: props,
      concurrency: 2,
      timeoutInMilliseconds: 120000,
    });
    done++;
  }
  console.log(`\n  ✓ Fatto! ${done} video pronti in: ${outDir}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
