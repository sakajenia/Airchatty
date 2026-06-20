# Airchatty 💬 → 🎬

Turn a written conversation into a vertical **Airbnb-style chat reel** (MP4) —
messages pop in one at a time, with typing "…" bubbles, a host header, timestamps,
read receipts, and sound. Built with [Remotion](https://www.remotion.dev).

---

## 🎬 Modalità BATCH — tanti video da una sola tabella (consigliata)

Vuoi scrivere **tutte** le conversazioni in una volta e ottenere **tutti i video
pronti** in automatico? Questa è la strada. Una riga della tabella = un video.

1. Apri il template **Google Sheet** (o copia `conversations.example.csv`).
2. Compila una riga per ogni video.
3. In Google Sheet: **File → Scarica → Valori separati da virgola (.csv)**.
4. Dai il CSV a me (lo carichi qui) **oppure**, sul tuo computer:
   ```bash
   npm run batch -- conversations.csv
   ```
5. Trovi tutti gli MP4 nella cartella `out/`. 🎉

### Le colonne della tabella

| Colonna | Obbligatoria | Cosa scrivere |
| --- | --- | --- |
| `name` | no | Nome del file video (es. `luci`). Se vuoto → `video-1`, `video-2`… |
| `guests` | no | Numero di ospiti nella chat, 2–6 (default 2). |
| `host_name` | no | Il tuo nome come host (default Lorenzo). |
| `conversation` | **sì** | La conversazione, **un messaggio per riga** (Alt+Invio nella cella). |

> Nomi/foto degli ospiti, date e nome dell'appartamento sono **casuali e diversi
> per ogni riga** — non li scrivi tu, li genera Airchatty.

### Come si scrive la cella `conversation`

Un messaggio per riga, con un'etichetta all'inizio:

| Scrivi | Significato |
| --- | --- |
| `G: ...` | Messaggio dell'ospite #1 |
| `G2: ...` | Messaggio dell'ospite #2 (`G3:`, `G4:`… fino al numero di ospiti) |
| `HD: ...` | Il messaggio **ONESTO** dell'host: viene digitato e poi **cancellato** |
| `H: ...` | Il messaggio cordiale dell'host che viene **inviato davvero** |
| `+❤️` | Aggiunge una reazione al messaggio precedente |
| `# Oggi` | Una riga separatore con la data |

Una riga `HD:` si "attacca" alla riga `H:` successiva (prima digita l'onesto, lo
cancella, poi scrive e invia il cordiale). Esempio di una cella:

```
G: Ciao! Scusa il disturbo 🙂
G: Dove si accendono le luci??
HD: Ma è possibile che tu non veda gli interruttori??
H: Le luci sono di fianco alla porta, sulla destra 😊
```

Vedi `conversations.example.csv` per un esempio completo con 3 video.

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
