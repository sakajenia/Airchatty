/**
 * Airchatty — Google Sheets read/write helper (no more recreating files!).
 *
 * Uses the Google Sheets API with a **service account**, so it can modify the
 * EXISTING "Airchatty" sheet in place: read it, overwrite a tab, append rows,
 * and even add the dropdown menus (data validation).
 *
 * ── One-time setup ───────────────────────────────────────────────────────────
 *  1. Go to https://console.cloud.google.com → create (or pick) a project.
 *  2. Enable the "Google Sheets API" for that project.
 *  3. Create a Service Account → Keys → Add key → JSON → download it.
 *  4. Save that file as  service-account.json  in this folder (or set the env
 *     var GOOGLE_SHEETS_KEY to its path).
 *  5. Open the JSON, copy the "client_email" (looks like
 *     xxxx@yyyy.iam.gserviceaccount.com) and **Share** the Airchatty Google
 *     Sheet with that email as **Editor**.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   npm run sheet read     <sheetId> [tab] [out.csv]   # dump a tab to CSV
 *   npm run sheet overwrite<sheetId> <tab> <in.csv>    # replace a tab's content
 *   npm run sheet append   <sheetId> <tab> <in.csv>    # add rows to a tab
 *   npm run sheet dropdowns<sheetId> [tab]             # add the menu-a-tendina
 *
 * The Airchatty sheet id is in its URL:
 *   docs.google.com/spreadsheets/d/<THIS_IS_THE_ID>/edit
 */
import {google, sheets_v4} from 'googleapis';
import fs from 'fs';
import path from 'path';

const KEY = process.env.GOOGLE_SHEETS_KEY || path.join(__dirname, '..', 'service-account.json');

// --- tiny CSV helpers -------------------------------------------------------
function parseCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let row: string[] = [];
  let f = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { f += '"'; i++; } else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}
const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const toCSV = (rows: string[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

async function api(): Promise<sheets_v4.Sheets> {
  if (!fs.existsSync(KEY)) {
    console.error(`\n  ✗ Credenziali non trovate: ${KEY}`);
    console.error(`    Segui il setup in cima a scripts/sheet.ts (account di servizio).\n`);
    process.exit(1);
  }
  const auth = new google.auth.GoogleAuth({keyFile: KEY, scopes: ['https://www.googleapis.com/auth/spreadsheets']});
  return google.sheets({version: 'v4', auth: (await auth.getClient()) as never});
}

/** Resolve a tab name → its numeric sheetId (gid); defaults to the first tab. */
async function tabId(s: sheets_v4.Sheets, spreadsheetId: string, tab?: string): Promise<{title: string; id: number}> {
  const meta = await s.spreadsheets.get({spreadsheetId});
  const sheets = meta.data.sheets ?? [];
  const found = tab ? sheets.find((x) => x.properties?.title === tab) : sheets[0];
  if (!found?.properties) throw new Error(`Tab "${tab ?? '(first)'}" non trovato.`);
  return {title: found.properties.title!, id: found.properties.sheetId!};
}

async function main() {
  const [cmd, spreadsheetId, a, b] = process.argv.slice(2);
  if (!cmd || !spreadsheetId) {
    console.log('Uso: npm run sheet <read|overwrite|append|dropdowns> <sheetId> [tab] [file.csv]');
    process.exit(1);
  }
  const s = await api();

  if (cmd === 'read') {
    const {title} = await tabId(s, spreadsheetId, a);
    const res = await s.spreadsheets.values.get({spreadsheetId, range: title});
    const csv = toCSV((res.data.values ?? []) as string[][]);
    if (b) { fs.writeFileSync(b, csv); console.log(`  ✓ Scritto ${b}`); }
    else process.stdout.write(csv);
    return;
  }

  if (cmd === 'overwrite' || cmd === 'append') {
    const tab = a;
    const file = b;
    if (!tab || !file) { console.error('  ✗ Servono <tab> e <file.csv>'); process.exit(1); }
    const {title} = await tabId(s, spreadsheetId, tab);
    const values = parseCSV(fs.readFileSync(file, 'utf8'));
    if (cmd === 'overwrite') {
      await s.spreadsheets.values.clear({spreadsheetId, range: title});
      await s.spreadsheets.values.update({spreadsheetId, range: `${title}!A1`, valueInputOption: 'RAW', requestBody: {values}});
      console.log(`  ✓ Tab "${title}" sovrascritto (${values.length} righe).`);
    } else {
      await s.spreadsheets.values.append({spreadsheetId, range: title, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: {values}});
      console.log(`  ✓ Aggiunte ${values.length} righe al tab "${title}".`);
    }
    return;
  }

  if (cmd === 'dropdowns') {
    const {title, id} = await tabId(s, spreadsheetId, a);
    // header → 0-based column index for the columns that get a dropdown
    const res = await s.spreadsheets.values.get({spreadsheetId, range: `${title}!1:1`});
    const header = ((res.data.values ?? [[]])[0] as string[]).map((h) => h.trim().toLowerCase());
    const lists: Record<string, string[]> = {
      ospiti: ['2', '3', '4', '5', '6'],
      da: ['Host', 'O1', 'O2', 'O3', 'O4', 'O5', 'O6'],
      foto_pos: ['prima', 'dopo'],
    };
    const requests: sheets_v4.Schema$Request[] = [];
    for (const [col, values] of Object.entries(lists)) {
      const c = header.indexOf(col);
      if (c < 0) continue;
      requests.push({
        setDataValidation: {
          range: {sheetId: id, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: c, endColumnIndex: c + 1},
          rule: {condition: {type: 'ONE_OF_LIST', values: values.map((v) => ({userEnteredValue: v}))}, showCustomUi: true, strict: false},
        },
      });
    }
    if (!requests.length) { console.error('  ✗ Nessuna colonna ospiti/da/foto_pos trovata.'); process.exit(1); }
    await s.spreadsheets.batchUpdate({spreadsheetId, requestBody: {requests}});
    console.log(`  ✓ Menu a tendina aggiunti su ${requests.length} colonne del tab "${title}".`);
    return;
  }

  console.error(`  ✗ Comando sconosciuto: ${cmd}`);
  process.exit(1);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
