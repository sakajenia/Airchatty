# Airchatty 💬 → 🎬

Turn a written conversation into a vertical **Airbnb-style chat reel** (MP4) —
messages pop in one at a time, with typing "…" bubbles, a host header, timestamps,
read receipts, and sound. Built with [Remotion](https://www.remotion.dev).

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
