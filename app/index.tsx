import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {ChatReel} from '../src/ChatReel';
import {buildTimeline} from '../src/timeline';
import {ChatItem, ChatProps, DEFAULT_PROPS} from '../src/schema';
import {makeParticipants, pickApartment, pickDate} from '../src/avatars';

const FPS = 30;
const accent = '#FF385C';

const field: React.CSSProperties = {width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit'};
const label: React.CSSProperties = {fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.4};
const card: React.CSSProperties = {border: '1px solid #e5e5e5', borderRadius: 14, padding: 16, marginBottom: 14, background: '#fff'};

const readAsDataURL = (file: File, set: (s: string) => void) => {
  const r = new FileReader();
  r.onload = () => set(String(r.result));
  r.readAsDataURL(file);
};

type GuestBlock = {kind: 'guest'; guest: number; text: string; photo: string; photoPos: 'before' | 'after'};
type HostBlock = {kind: 'host'; draft: string; messages: string};
type Block = GuestBlock | HostBlock;

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);

const App: React.FC = () => {
  const [count, setCount] = useState(2);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [hostName, setHostName] = useState('Lorenzo');
  const [hostAvatar, setHostAvatar] = useState('faces/face1.jpg');
  const [speed, setSpeed] = useState(1);
  const [sound, setSound] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([
    {kind: 'guest', guest: 0, text: 'Ciao! Scusa il disturbo 🙂\nDove si accendono le luci?? Non riesco a trovarle 🙈', photo: '', photoPos: 'after'},
    {kind: 'host', draft: 'Ma è possibile che tu non veda gli interruttori che ci sono in ogni stanza??', messages: "Ciao! Le luci sono di fianco alla porta d'ingresso, sulla destra 😊"},
  ]);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');

  // Random (per spec): guest names + faces, listing name + date — different
  // every time you regenerate. Guest names are NOT editable.
  const guests = useMemo(() => makeParticipants(count, seed), [count, seed]);
  const headerApt = useMemo(() => pickApartment(seed), [seed]);
  const headerDate = useMemo(() => pickDate(seed), [seed]);

  const setBlock = (i: number, b: Block) => setBlocks((bs) => bs.map((x, j) => (j === i ? b : x)));
  const removeBlock = (i: number) => setBlocks((bs) => bs.filter((_, j) => j !== i));
  const move = (i: number, d: number) =>
    setBlocks((bs) => {
      const j = i + d;
      if (j < 0 || j >= bs.length) return bs;
      const c = [...bs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const items: ChatItem[] = useMemo(() => {
    const out: ChatItem[] = [{type: 'separator', label: 'Today'}];
    for (const b of blocks) {
      if (b.kind === 'guest') {
        const sender = `p${Math.min(b.guest, count - 1)}`;
        const photoItem: ChatItem | null = b.photo ? {type: 'message', sender, text: '', photo: b.photo} : null;
        if (photoItem && b.photoPos === 'before') out.push(photoItem);
        for (const l of lines(b.text)) out.push({type: 'message', sender, text: l});
        if (photoItem && b.photoPos === 'after') out.push(photoItem);
      } else {
        lines(b.messages).forEach((l, idx) => {
          out.push({type: 'message', sender: 'host', text: l, draft: idx === 0 && b.draft.trim() ? b.draft.trim() : undefined});
        });
      }
    }
    return out;
  }, [blocks, count]);

  const inputProps: ChatProps = useMemo(
    () => ({...DEFAULT_PROPS, items, hostName, hostAvatar, participants: guests, headerDate, headerApt, speed, sound}),
    [items, hostName, hostAvatar, guests, headerDate, headerApt, speed, sound],
  );

  const durationInFrames = useMemo(
    () => buildTimeline(items, {fps: FPS, speed, typingFor: 'guest', keyboard: true}).durationInFrames,
    [items, speed],
  );

  const download = async () => {
    setRendering(true);
    setError('');
    try {
      const res = await fetch('/render', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({items, hostName, hostAvatar, participants: guests, headerDate, headerApt, speed, sound, keyboard: true, typingFor: 'guest'}),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Render failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'airbnb-chat-reel.mp4';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRendering(false);
    }
  };

  return (
    <div style={{fontFamily: '-apple-system, Segoe UI, Roboto, sans-serif', background: '#FAFAFA', minHeight: '100vh', color: '#222'}}>
      <header style={{padding: '18px 28px', borderBottom: '1px solid #eee', background: '#fff'}}>
        <h1 style={{margin: 0, fontSize: 21}}><span style={{color: accent}}>Airchatty</span> — Costruttore conversazione</h1>
        <p style={{margin: '4px 0 0', color: '#777', fontSize: 13}}>Scrivi i messaggi, guarda l'anteprima, scarica l'MP4. Nomi/foto guest, date e nome listing sono casuali.</p>
      </header>

      <div style={{display: 'flex', gap: 28, padding: 24, alignItems: 'flex-start', flexWrap: 'wrap'}}>
        <div style={{flex: '1 1 520px', maxWidth: 640}}>
          {/* booking setup */}
          <div style={{...card, background: '#fcfcfc'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
              <div>
                <label style={label}>Numero di guest: {count}</label>
                <input type="range" min={2} max={6} value={count} onChange={(e) => setCount(Number(e.target.value))} style={{width: '100%'}} />
              </div>
              <div>
                <label style={label}>Prenotazione (casuale)</label>
                <button type="button" onClick={() => setSeed(Math.floor(Math.random() * 1e6))} style={{...field, cursor: 'pointer', background: '#fff'}}>🔀 Rigenera guest, foto, date e listing</button>
              </div>
            </div>
            <div style={{fontSize: 12, color: '#888', marginTop: 10}}>
              Guest: <b>{guests.map((g) => g.name).join(', ')}</b> · {headerDate} · {headerApt}
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14}}>
              <div>
                <label style={label}>Nome host (tu)</label>
                <input style={field} value={hostName} onChange={(e) => setHostName(e.target.value)} />
              </div>
              <div>
                <label style={label}>Foto host</label>
                <input type="file" accept="image/*" style={{fontSize: 12}} onChange={(e) => e.target.files?.[0] && readAsDataURL(e.target.files[0], setHostAvatar)} />
              </div>
            </div>
          </div>

          {/* conversation blocks */}
          {blocks.map((b, i) =>
            b.kind === 'guest' ? (
              <div key={i} style={{...card, borderLeft: '4px solid #b0b0b0'}}>
                <Row title="💬 Messaggio Guest" i={i} n={blocks.length} onMove={move} onRemove={removeBlock} />
                <div style={{display: 'flex', gap: 12, marginBottom: 10}}>
                  <div style={{flex: 1}}>
                    <label style={label}>Chi scrive</label>
                    <select style={field} value={b.guest} onChange={(e) => setBlock(i, {...b, guest: Number(e.target.value)})}>
                      {guests.map((g, gi) => (<option key={gi} value={gi}>{g.name}</option>))}
                    </select>
                  </div>
                  <div style={{flex: 1}}>
                    <label style={label}>Foto (opzionale)</label>
                    <input type="file" accept="image/*" style={{fontSize: 12}} onChange={(e) => e.target.files?.[0] && readAsDataURL(e.target.files[0], (s) => setBlock(i, {...b, photo: s}))} />
                  </div>
                  {b.photo && (
                    <div>
                      <label style={label}>Posizione foto</label>
                      <select style={field} value={b.photoPos} onChange={(e) => setBlock(i, {...b, photoPos: e.target.value as 'before' | 'after'})}>
                        <option value="before">Prima del testo</option>
                        <option value="after">Dopo il testo</option>
                      </select>
                    </div>
                  )}
                </div>
                <label style={label}>Messaggi (una riga = un messaggio separato)</label>
                <textarea value={b.text} onChange={(e) => setBlock(i, {...b, text: e.target.value})} style={{...field, height: 80, resize: 'vertical'}} />
              </div>
            ) : (
              <div key={i} style={{...card, borderLeft: `4px solid ${accent}`}}>
                <Row title="🧑‍💼 Risposta Host" i={i} n={blocks.length} onMove={move} onRemove={removeBlock} />
                <label style={label}>Messaggio "onesto" (digitato e poi cancellato — opzionale)</label>
                <textarea value={b.draft} onChange={(e) => setBlock(i, {...b, draft: e.target.value})} placeholder="Quello che vorresti rispondere ma cancelli…" style={{...field, height: 60, resize: 'vertical', marginBottom: 12}} />
                <label style={label}>Messaggi inviati (una riga = un messaggio separato)</label>
                <textarea value={b.messages} onChange={(e) => setBlock(i, {...b, messages: e.target.value})} style={{...field, height: 70, resize: 'vertical'}} />
              </div>
            ),
          )}

          <div style={{display: 'flex', gap: 10, marginBottom: 16}}>
            <button type="button" onClick={() => setBlocks((bs) => [...bs, {kind: 'guest', guest: bs.filter((x) => x.kind === 'guest').length % count, text: '', photo: '', photoPos: 'after'}])} style={{...field, cursor: 'pointer', background: '#fff', flex: 1}}>+ Messaggio Guest</button>
            <button type="button" onClick={() => setBlocks((bs) => [...bs, {kind: 'host', draft: '', messages: ''}])} style={{...field, cursor: 'pointer', background: '#fff', flex: 1}}>+ Risposta Host</button>
          </div>

          <div style={{display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14}}>
            <div style={{flex: 1}}>
              <label style={label}>Velocità: {speed.toFixed(2)}×</label>
              <input type="range" min={0.5} max={2} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{width: '100%'}} />
            </div>
            <label style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginTop: 18}}>
              <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Suoni tastiera
            </label>
          </div>

          <button onClick={download} disabled={rendering} style={{width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 700, color: '#fff', background: rendering ? '#bbb' : accent, border: 'none', borderRadius: 12, cursor: rendering ? 'default' : 'pointer'}}>
            {rendering ? 'Rendering in corso…' : '⬇  Scarica MP4'}
          </button>
          {error && <p style={{color: accent, fontSize: 13, marginTop: 8}}>{error}</p>}
        </div>

        <div style={{flex: '0 0 auto', position: 'sticky', top: 24}}>
          <label style={label}>Anteprima dal vivo</label>
          <div style={{borderRadius: 26, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', width: 300}}>
            <Player component={ChatReel} inputProps={inputProps} durationInFrames={durationInFrames} compositionWidth={1080} compositionHeight={1920} fps={FPS} style={{width: 300, height: 533}} controls loop autoPlay />
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{title: string; i: number; n: number; onMove: (i: number, d: number) => void; onRemove: (i: number) => void}> = ({title, i, n, onMove, onRemove}) => (
  <div style={{display: 'flex', alignItems: 'center', marginBottom: 12}}>
    <div style={{fontWeight: 700, fontSize: 14, flex: 1}}>{title}</div>
    <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} style={{border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, opacity: i === 0 ? 0.3 : 1}}>↑</button>
    <button type="button" onClick={() => onMove(i, 1)} disabled={i === n - 1} style={{border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, opacity: i === n - 1 ? 0.3 : 1}}>↓</button>
    <button type="button" onClick={() => onRemove(i)} style={{border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, color: '#c00', marginLeft: 6}}>✕</button>
  </div>
);

createRoot(document.getElementById('root')!).render(<App />);
