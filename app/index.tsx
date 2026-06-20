import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {ChatReel} from '../src/ChatReel';
import {parseScript} from '../src/parseScript';
import {buildTimeline} from '../src/timeline';
import {ChatProps, DEFAULT_PROPS, SAMPLE_SCRIPT} from '../src/schema';

const FPS = 30;
const accent = '#FF385C';

const label: React.CSSProperties = {fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6, display: 'block'};
const field: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: 10,
  fontSize: 14,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const readAsDataURL = (file: File, set: (s: string) => void) => {
  const r = new FileReader();
  r.onload = () => set(String(r.result));
  r.readAsDataURL(file);
};

const App: React.FC = () => {
  const [script, setScript] = useState(SAMPLE_SCRIPT);
  const [hostName, setHostName] = useState(DEFAULT_PROPS.hostName);
  const [guestName, setGuestName] = useState(DEFAULT_PROPS.guestName);
  const [hostAvatar, setHostAvatar] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('');
  const [headerSubtitle, setHeaderSubtitle] = useState(DEFAULT_PROPS.headerSubtitle);
  const [youSide, setYouSide] = useState<'guest' | 'host'>('host');
  const [typingFor, setTypingFor] = useState<'host' | 'guest' | 'both' | 'none'>('guest');
  const [speed, setSpeed] = useState(1);
  const [sound, setSound] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');

  const inputProps: ChatProps = useMemo(
    () => ({
      ...DEFAULT_PROPS,
      items: parseScript(script, {hostName, guestName}),
      hostName,
      guestName,
      hostAvatar,
      guestAvatar,
      headerSubtitle,
      youSide,
      typingFor,
      speed,
      sound,
    }),
    [script, hostName, guestName, hostAvatar, guestAvatar, headerSubtitle, youSide, typingFor, speed, sound],
  );

  const durationInFrames = useMemo(
    () => buildTimeline(inputProps.items, {fps: FPS, speed, youSide, typingFor}).durationInFrames,
    [inputProps.items, speed, youSide, typingFor],
  );

  const download = async () => {
    setRendering(true);
    setError('');
    try {
      const res = await fetch('/render', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          script,
          hostName,
          guestName,
          hostAvatar,
          guestAvatar,
          headerSubtitle,
          youSide,
          typingFor,
          speed,
          sound,
        }),
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
      <header style={{padding: '20px 32px', borderBottom: '1px solid #eee', background: '#fff'}}>
        <h1 style={{margin: 0, fontSize: 22}}>
          <span style={{color: accent}}>Airchatty</span> — Airbnb Chat Reel Generator
        </h1>
        <p style={{margin: '4px 0 0', color: '#777', fontSize: 14}}>
          Paste a conversation, watch the live preview, then download the MP4.
        </p>
      </header>

      <div style={{display: 'flex', gap: 32, padding: 32, flexWrap: 'wrap'}}>
        <div style={{flex: '1 1 440px', maxWidth: 580}}>
          <label style={label}>Conversation</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            spellCheck={false}
            style={{...field, height: 230, resize: 'vertical', lineHeight: 1.5, fontFamily: 'ui-monospace, monospace'}}
          />
          <p style={{fontSize: 12, color: '#999', margin: '6px 0 18px'}}>
            One message per line — start with <b>Host:</b> or <b>Guest:</b>. Use{' '}
            <b># Today</b> for a date divider and <b>+❤️</b> on its own line to react to the message above.
          </p>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
            <div>
              <label style={label}>Host name</label>
              <input style={field} value={hostName} onChange={(e) => setHostName(e.target.value)} />
            </div>
            <div>
              <label style={label}>Guest name</label>
              <input style={field} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </div>
            <div>
              <label style={label}>Host photo</label>
              <input type="file" accept="image/*" style={{fontSize: 13}} onChange={(e) => e.target.files?.[0] && readAsDataURL(e.target.files[0], setHostAvatar)} />
            </div>
            <div>
              <label style={label}>Guest photo</label>
              <input type="file" accept="image/*" style={{fontSize: 13}} onChange={(e) => e.target.files?.[0] && readAsDataURL(e.target.files[0], setGuestAvatar)} />
            </div>
            <div style={{gridColumn: '1 / 3'}}>
              <label style={label}>Header subtitle (dates · listing)</label>
              <input style={field} value={headerSubtitle} onChange={(e) => setHeaderSubtitle(e.target.value)} />
            </div>
            <div>
              <label style={label}>Dark bubbles (right side) =</label>
              <select style={field} value={youSide} onChange={(e) => setYouSide(e.target.value as 'guest' | 'host')}>
                <option value="host">Host (light grey = guest)</option>
                <option value="guest">Guest (light grey = host)</option>
              </select>
            </div>
            <div>
              <label style={label}>Show typing "…" before</label>
              <select style={field} value={typingFor} onChange={(e) => setTypingFor(e.target.value as typeof typingFor)}>
                <option value="guest">Guest / other person (like Airbnb)</option>
                <option value="host">Host</option>
                <option value="both">Both</option>
                <option value="none">No typing</option>
              </select>
            </div>
            <div>
              <label style={label}>Speed: {speed.toFixed(2)}×</label>
              <input type="range" min={0.5} max={2} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{width: '100%'}} />
            </div>
          </div>

          <label style={{display: 'flex', alignItems: 'center', gap: 8, margin: '18px 0', fontSize: 14}}>
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
            Message pop sounds + soft background music
          </label>

          <button
            onClick={download}
            disabled={rendering}
            style={{width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 700, color: '#fff', background: rendering ? '#bbb' : accent, border: 'none', borderRadius: 12, cursor: rendering ? 'default' : 'pointer'}}
          >
            {rendering ? 'Rendering your video…' : '⬇  Download MP4'}
          </button>
          {rendering && (
            <p style={{fontSize: 12, color: '#999', marginTop: 8}}>
              This can take up to a minute. The first ever render also downloads a one-time rendering component.
            </p>
          )}
          {error && <p style={{color: accent, fontSize: 13, marginTop: 8}}>{error}</p>}
        </div>

        <div style={{flex: '0 0 auto'}}>
          <label style={label}>Live preview</label>
          <div style={{borderRadius: 28, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', width: 324}}>
            <Player
              component={ChatReel}
              inputProps={inputProps}
              durationInFrames={durationInFrames}
              compositionWidth={1080}
              compositionHeight={1920}
              fps={FPS}
              style={{width: 324, height: 576}}
              controls
              loop
              autoPlay
            />
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
