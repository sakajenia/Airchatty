/**
 * Airchatty — BATCH renderer.
 *
 * Reads a spreadsheet (CSV, e.g. exported from Google Sheets) where each ROW is
 * one video, and renders every row to out/<nome>.mp4 automatically.
 *
 *   npm run batch                      # reads ./conversations.csv
 *   npm run batch -- path/to/file.csv  # reads a specific file
 *
 * COLUMNS (header row, any order; Italian or English names accepted):
 *   nome        output file name for the video (optional → video-1, video-2…)
 *   ospiti      number of guests in the chat, 2–6 (optional, default 2)
 *   host        your host display name (optional, default Lorenzo)
 *   domanda     the guest message(s) BEFORE the host replies — one per line
 *   onesto      the host's HONEST draft(s) — typed then deleted (optional)
 *   cordiale    the host's cordial message(s) that get sent — one per line
 *   risposta    the guest message(s) AFTER the host replies (optional)
 *
 * Inside a cell, put ONE MESSAGE PER LINE (Alt+Enter in Google Sheets, or use
 * " | " as a separator). In the guest cells (domanda / risposta) start a line
 * with "O2:" (or "O3:"…) to make a different guest speak — this is what makes
 * the read receipt grow from "Read by X" to "Read by all". A bare "+❤️" line
 * adds a reaction to the previous message.
 *
 * onesto ↔ cordiale are paired by line: the 1st honest draft attaches to the
 * 1st cordial message (typed, deleted, then the polite one is sent), and so on.
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

/** Split a cell into individual messages (newline- or "|"-separated). */
const splitLines = (cell: string): string[] =>
  (cell ?? '')
    .split(cell?.includes('\n') ? /\r?\n/ : '|')
    .map((l) => l.trim())
    .filter(Boolean);

/** Resolve a guest line to a sender id + text, honouring an "O2:" style prefix. */
function guestLine(line: string, guestCount: number): {sender: string; text: string} {
  const num = line.match(/^(?:o|ospite|guest|g)\s*(\d+)\s*[:：]\s*(.*)$/i);
  if (num) return {sender: `p${clamp(parseInt(num[1], 10) - 1, 0, guestCount - 1)}`, text: num[2].trim()};
  const bare = line.match(/^(?:o|ospite|guest|g)\s*[:：]\s*(.*)$/i);
  if (bare) return {sender: 'p0', text: bare[1].trim()};
  return {sender: 'p0', text: line};
}

/** Build one video's chat items from a single spreadsheet row. */
function buildItems(
  cells: {domanda: string; onesto: string; cordiale: string; risposta: string},
  guestCount: number,
): ChatItem[] {
  const items: ChatItem[] = [{type: 'separator', label: 'Today'}];
  let first = true;
  const lastMessage = () => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].type === 'message') return items[i] as Extract<ChatItem, {type: 'message'}>;
    }
    return null;
  };
  const push = (sender: string, text: string, draft?: string) => {
    if (!text) return;
    const it: ChatItem = {type: 'message', sender, text};
    if (draft) it.draft = draft;
    if (first) {
      it.animate = false; // the very first message is already on screen
      first = false;
    }
    items.push(it);
  };
  const guests = (cell: string) => {
    for (const line of splitLines(cell)) {
      if (line.startsWith('+') && line.length <= 6) {
        const prev = lastMessage();
        if (prev) prev.reaction = line.slice(1).trim();
        continue;
      }
      const {sender, text} = guestLine(line, guestCount);
      push(sender, text);
    }
  };

  guests(cells.domanda); // 1) the guest question(s)

  // 2) the host turn: honest draft(s) deleted, cordial message(s) sent (paired).
  const onesto = splitLines(cells.onesto);
  const cordiale = splitLines(cells.cordiale);
  for (let i = 0; i < cordiale.length; i++) {
    if (cordiale[i].startsWith('+') && cordiale[i].length <= 6) {
      const prev = lastMessage();
      if (prev) prev.reaction = cordiale[i].slice(1).trim();
      continue;
    }
    push('host', cordiale[i], onesto[i]);
  }

  guests(cells.risposta); // 3) the guest reply/reaction(s) → drives "Read by all"
  return items;
}

async function main() {
  const csvPath = path.resolve(process.argv[2] ?? path.join(ROOT, 'conversations.csv'));
  if (!fs.existsSync(csvPath)) {
    console.error(`\n  ✗ File CSV non trovato: ${csvPath}`);
    console.error(`    Esporta il tuo Google Sheet come CSV, oppure:`);
    console.error(`    npm run batch -- percorso/del/tuo-file.csv\n`);
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
  if (rows.length < 2) {
    console.error('  ✗ Il CSV deve avere un\'intestazione + almeno una riga di dati.');
    process.exit(1);
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
  const ci = {
    nome: col('nome', 'name', 'titolo', 'title'),
    ospiti: col('ospiti', 'guests', 'guest', 'n_ospiti'),
    host: col('host', 'host_name', 'nome_host'),
    domanda: col('domanda', 'domande', 'messaggio_ospite', 'messaggi_ospite', 'ospite', 'guest_msg'),
    onesto: col('onesto', 'honest', 'draft', 'messaggio_onesto', 'autentico'),
    cordiale: col('cordiale', 'cordial', 'messaggio', 'risposta_host', 'sent'),
    risposta: col('risposta', 'risposta_ospite', 'reply', 'guest_reply', 'risposte'),
  };
  if (ci.domanda < 0 && ci.cordiale < 0) {
    console.error('  ✗ Servono almeno le colonne "domanda" e/o "cordiale" nell\'intestazione.');
    process.exit(1);
  }
  const get = (row: string[], i: number) => (i >= 0 ? row[i] ?? '' : '');

  const dataRows = rows.slice(1);
  console.log(`\n  Trovate ${dataRows.length} conversazioni. Preparo il motore di render…`);
  const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'Root.tsx'), onProgress: () => undefined});
  const outDir = path.join(ROOT, 'out');
  fs.mkdirSync(outDir, {recursive: true});

  const used = new Set<string>();
  let done = 0;
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    const guests = clamp(parseInt(get(row, ci.ospiti), 10) || 2, 2, 6);
    const items = buildItems(
      {
        domanda: get(row, ci.domanda),
        onesto: get(row, ci.onesto),
        cordiale: get(row, ci.cordiale),
        risposta: get(row, ci.risposta),
      },
      guests,
    );
    if (items.filter((i) => i.type === 'message').length === 0) continue; // empty row

    const hostName = get(row, ci.host).trim() || DEFAULT_PROPS.hostName;
    const base = slug(get(row, ci.nome)) || `video-${r + 1}`;
    let outName = base;
    for (let k = 2; used.has(outName); k++) outName = `${base}-${k}`;
    used.add(outName);

    if (process.env.DRY) {
      console.log(`\n=== ${outName} (ospiti:${guests}, host:${hostName}) ===`);
      for (const it of items) {
        if (it.type === 'separator') console.log(`  --- ${it.label} ---`);
        else console.log(`  ${it.sender.padEnd(5)} ${it.draft ? `[onesto:"${it.draft}"] ` : ''}${it.text}${it.reaction ? ` (${it.reaction})` : ''}${it.animate === false ? ' [già a schermo]' : ''}`);
      }
      done++;
      continue;
    }

    const seed = r + 1; // stable per row, different across rows
    const props: ChatProps = {
      ...DEFAULT_PROPS,
      items,
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
