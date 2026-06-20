# Airchatty 💬 → 🎬

Turn a written conversation into a vertical **Airbnb-style chat reel** (MP4) —
messages pop in one at a time, with typing "…" bubbles, a host header, timestamps,
read receipts, and sound. Built with [Remotion](https://www.remotion.dev).

---

## 🎬 Modalità BATCH — tanti video da un solo Google Sheet (consigliata)

Scrivi **tutte** le conversazioni nel Google Sheet "Airchatty" e ottieni **tutti i
video pronti** in automatico. **Una RIGA = un MESSAGGIO**; le righe con lo stesso
valore nella colonna `chat` formano un video.

1. Apri il Google Sheet "Airchatty" (o copia `conversations.example.csv`).
2. Compila i messaggi: una riga per messaggio, stesso `chat` = stesso video.
3. **File → Scarica → CSV** e dai il file a me (oppure `npm run batch -- file.csv`).
4. Trovi tutti gli MP4 nella cartella `out/`. 🎉

### Le colonne

| Colonna | Cosa scrivere |
| --- | --- |
| `chat` | **Raggruppa** i messaggi in un video + nome del file (es. `luci`). |
| `ospiti` | Numero di ospiti 2–6 (solo sulla 1ª riga del video; default 2). |
| `host` | Il tuo nome come host (1ª riga; default Lorenzo). |
| `foto_host` | Foto host: file in `public/` (`faces/face1.jpg`), nome file caricato (→ `public/uploads/…`) o URL. |
| `da` | Chi manda il messaggio: `Host`, `O1`, `O2`, `O3`… (default `O1`). |
| `testo` | Il testo del messaggio. |
| `onesto` | Solo host: il messaggio **onesto** digitato e poi **cancellato** prima di `testo`. |
| `foto` | Una foto allegata al messaggio (nome file / percorso / URL). |
| `foto_pos` | Posizione della foto rispetto al testo: `prima` o `dopo` (default). |

> Nomi/foto degli ospiti, date e nome dell'appartamento sono **casuali e diversi
> per ogni chat** — non li scrivi tu, li genera Airchatty. Tu carichi solo la foto
> dell'host e le eventuali foto allegate ai messaggi.

### Le foto

Non si possono "caricare" immagini dentro una cella. Metti i file immagine nella
cartella **"Airchatty" del Google Drive** (o in `public/uploads/`) e nel foglio
scrivi solo il **nome del file** (es. `salotto.jpg`). In fase di render l'immagine
viene scaricata e inserita come bolla foto. Puoi anche incollare un **URL**.

Vedi `conversations.example.csv` per un esempio completo con 3 video (incluso uno
con foto allegata).

---

## 🇮🇹 Come usarlo sul TUO computer (passo-passo)

Airchatty è un'app che gira **in locale sul tuo computer**. Non c'è un sito online:
apri l'app sul tuo Mac/PC e si apre nel browser all'indirizzo `http://localhost:3000`.

> ⚠️ `localhost` vuol dire "questo computer". Funziona **solo** sul computer dove
> avvii l'app — non è un sito su internet che puoi aprire dal telefono.

**1. Installa Node.js** (una volta sola) da <https://nodejs.org> → scarica la versione **LTS**.

**2. Scarica il progetto.** Apri il **Terminale** (Mac) o **Prompt dei comandi** (Windows) e incolla:

```bash
git clone -b claude/chat-video-generator-q0hpru https://github.com/sakajenia/airchatty.git
cd airchatty
```

**3. Avvia l'app** (sempre nel Terminale):

```bash
npm install        # solo la prima volta — installa tutto (1–2 min)
npm start          # avvia l'app
```

**4. Apri il browser** (Chrome/Safari) e vai su:

```
http://localhost:3000
```

Vedrai l'interfaccia: scrivi i messaggi → guarda l'anteprima a destra → premi
**⬇ Scarica MP4**. Per chiudere l'app: torna nel Terminale e premi `Ctrl + C`.

---

## 🌐 Usarlo da interfaccia WEB (link online, senza installare niente)

Vuoi un vero indirizzo web (es. `https://airchatty.onrender.com`) apribile da
qualsiasi browser o telefono? Si pubblica l'app online con un deploy. Nel progetto
c'è già tutto pronto (`Dockerfile` + `render.yaml`). Percorso più semplice per
chi non programma → **Render.com**:

1. Vai su <https://render.com> e crea un account (puoi accedere con GitHub).
2. Clicca **New → Blueprint**.
3. Collega il repository GitHub `sakajenia/airchatty` e scegli il branch
   `claude/chat-video-generator-q0hpru`.
4. Render legge il file `render.yaml`, crea il servizio e fa il build da solo
   (5–10 min la prima volta — deve scaricare Chromium per generare gli MP4).
5. Quando è "Live", apri l'URL che ti dà Render: **è la tua interfaccia web**,
   uguale a quella locale, usabile da telefono.

**Nota sui costi/risorse:** la creazione del video MP4 è pesante (usa Chromium).
Il piano gratuito di Render (512 MB) può non bastare e andare in errore sui video
lunghi → consigliato il piano **Starter** (~7 $/mese), già indicato nel
`render.yaml`. Funziona allo stesso modo anche su Railway o Fly.io con lo stesso
`Dockerfile`.

> 💡 La parte "scrivi messaggi + anteprima" è leggera; solo il pulsante
> **Scarica MP4** richiede potenza. Se in futuro vuoi tenere bassi i costi si può
> spostare solo il rendering su un servizio on-demand.

---

## Quick start (short version)

```bash
git clone -b claude/chat-video-generator-q0hpru https://github.com/sakajenia/airchatty.git
cd airchatty
npm install
npm start             # opens the app at http://localhost:3000
```

Then in your browser:

1. Paste your conversation in the box (see format below).
2. Watch the **live preview** update instantly.
3. Tweak the host name/photo, who's on the right, speed, and sound.
4. Click **Download MP4**.

### Conversation format

One message per line. Begin a line with `Host:` or `Guest:` to set who's talking.
Lines without a label continue the previous speaker as a new bubble.

```
Host: Hi Maria! Welcome to Lisbon 🌸 So excited to host you
Guest: Thank you so much!! We can't wait 😍
Guest: Quick question — what time can we check in?
Host: Anytime after 3pm. I'll text you the door code that morning 🔑
```

## For tinkerers

| Command | What it does |
| --- | --- |
| `npm start` | The web app (paste → preview → download). |
| `npm run dev` | Opens **Remotion Studio** to tweak the visuals frame-by-frame. |
| `npm run render` | Renders the built-in sample to `out/sample.mp4`. |
| `npm run make-assets` | Regenerates `public/pop.wav` and `public/music.wav`. |

## Notes

- **Output:** 1080×1920 (vertical 9:16), H.264 MP4 — ready for Reels / TikTok / Shorts.
- **First render** downloads a one-time headless-Chromium component (needs internet once).
- **Emoji** render using your operating system's emoji font (great on macOS/Windows).
- Swap the music by replacing `public/music.wav`; swap the default look in `src/util.ts` (`theme`).

## Project layout

```
src/        the video: schema, parser, timeline, ChatReel + components
app/        the local web app (server + UI)
scripts/    asset generator
public/     generated audio assets
```
