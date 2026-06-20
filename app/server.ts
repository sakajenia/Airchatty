/**
 * Airchatty local web app.
 *   GET  /         -> the paste/preview/download UI
 *   GET  /app.js   -> esbuild-bundled frontend (Player preview)
 *   POST /render   -> renders the conversation to MP4 and streams it back
 *   /<file>        -> static assets from public/ (pop.wav, music.wav, ...)
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import * as esbuild from 'esbuild';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';
import {parseScript} from '../src/parseScript';
import {ChatProps, DEFAULT_PROPS} from '../src/schema';

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
const app = express();
app.use(express.json({limit: '15mb'}));

// --- Frontend bundle (built once at startup) -------------------------------
let appJs = '';
const buildFrontend = async () => {
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, 'index.tsx')],
    bundle: true,
    write: false,
    format: 'iife',
    jsx: 'automatic',
    define: {'process.env.NODE_ENV': '"development"'},
    loader: {'.ts': 'tsx'},
  });
  appJs = result.outputFiles[0].text;
};

// --- Remotion render bundle (built lazily, cached) -------------------------
let serveUrl: Promise<string> | null = null;
const getServeUrl = () => {
  if (!serveUrl) {
    serveUrl = bundle({
      entryPoint: path.join(ROOT, 'src', 'Root.tsx'),
      onProgress: () => undefined,
    });
  }
  return serveUrl;
};

const HTML = `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Airchatty — Airbnb Chat Reel Generator</title>
<script>window.remotion_staticBase = '';</script>
<style>body{margin:0}</style>
</head><body><div id="root"></div><script src="/app.js"></script></body></html>`;

app.get('/', (_req, res) => res.type('html').send(HTML));
app.get('/app.js', (_req, res) => res.type('application/javascript').send(appJs));

app.post('/render', async (req, res) => {
  try {
    const b = req.body ?? {};
    const hostName = String(b.hostName ?? DEFAULT_PROPS.hostName);
    const guestName = String(b.guestName ?? DEFAULT_PROPS.guestName);
    const props: ChatProps = {
      ...DEFAULT_PROPS,
      items: parseScript(String(b.script ?? ''), {hostName, guestName}),
      hostName,
      guestName,
      hostAvatar: String(b.hostAvatar ?? ''),
      guestAvatar: String(b.guestAvatar ?? ''),
      headerSubtitle: String(b.headerSubtitle ?? DEFAULT_PROPS.headerSubtitle),
      youSide: b.youSide === 'host' ? 'host' : 'guest',
      typingFor: ['host', 'guest', 'both', 'none'].includes(b.typingFor) ? b.typingFor : 'guest',
      keyboard: b.keyboard !== false,
      speed: Math.max(0.3, Math.min(3, Number(b.speed) || 1)),
      sound: Boolean(b.sound),
    };
    if (props.items.filter((i) => i.type === 'message').length === 0) {
      res.status(400).json({error: 'Please type a conversation first.'});
      return;
    }

    const url = await getServeUrl();
    const composition = await selectComposition({serveUrl: url, id: 'ChatReel', inputProps: props});

    fs.mkdirSync(path.join(ROOT, 'out'), {recursive: true});
    const outFile = path.join(ROOT, 'out', `reel-${Date.now()}.mp4`);
    await renderMedia({
      composition,
      serveUrl: url,
      codec: 'h264',
      outputLocation: outFile,
      inputProps: props,
      concurrency: 2,
      timeoutInMilliseconds: 120000,
    });

    res.download(outFile, 'airbnb-chat-reel.mp4');
  } catch (err) {
    console.error(err);
    res.status(500).json({error: (err as Error).message});
  }
});

// Static assets (pop.wav, music.wav, avatars) served at the site root so that
// Remotion's staticFile('pop.wav') resolves to '/pop.wav' during preview.
app.use(express.static(path.join(ROOT, 'public')));

(async () => {
  await buildFrontend();
  app.listen(PORT, () => {
    console.log(`\n  Airchatty is running →  http://localhost:${PORT}\n`);
  });
})();
