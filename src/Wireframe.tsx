import React from 'react';
import {AbsoluteFill} from 'remotion';
import {theme} from './util';

const RED = '#e5484d';
const BLUE = '#3d7dd8';

const Dim: React.FC<{x: number; y: number; w?: number; h?: number; label: string; vertical?: boolean}> = ({
  x,
  y,
  w = 0,
  h = 0,
  label,
  vertical,
}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: vertical ? 0 : w,
        height: vertical ? h : 0,
        borderTop: vertical ? 'none' : `2px solid ${RED}`,
        borderLeft: vertical ? `2px solid ${RED}` : 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: vertical ? x + 8 : x + w / 2 - 60,
        top: vertical ? y + h / 2 - 14 : y - 30,
        color: RED,
        fontSize: 22,
        fontWeight: 700,
        fontFamily: theme.font,
        width: 120,
        textAlign: vertical ? 'left' : 'center',
      }}
    >
      {label}
    </div>
  </>
);

const Note: React.FC<{x: number; y: number; text: string; w?: number; color?: string}> = ({x, y, text, w = 320, color = '#222'}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, fontSize: 22, lineHeight: 1.3, color, fontFamily: theme.font, fontWeight: 600}}>
    {text}
  </div>
);

const circle = (left: number, top: number, size: number, fill: string, label: string): React.ReactNode => (
  <div style={{position: 'absolute', left, top, width: size, height: size}}>
    <div style={{width: size, height: size, borderRadius: '50%', background: fill, border: `3px solid #fff`, boxShadow: `0 0 0 2px ${RED}`}} />
    <div style={{position: 'absolute', left: 0, top: size / 2 - 12, width: size, textAlign: 'center', color: RED, fontSize: 20, fontWeight: 800}}>{label}</div>
  </div>
);

/**
 * A wireframe of the chat header with every spacing reverse-engineered from the
 * reference screenshots (in canvas px on the 1080-wide frame).
 */
export const Wireframe: React.FC = () => {
  const W = 1080;
  const STATUS_H = 104;
  const PAD_TOP = 22;
  const clusterTop = STATUS_H + PAD_TOP; // 126
  const clusterW = 178;
  const clusterX = (W - clusterW) / 2; // 451

  return (
    <AbsoluteFill style={{background: '#fff', fontFamily: theme.font}}>
      {/* frame outline */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 940, border: '2px solid #ccc'}} />

      {/* status bar band */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: STATUS_H, background: '#f3f4f6', borderBottom: '1px dashed #bbb'}} />
      <Note x={40} y={36} text="STATUS BAR — height 104px (Dynamic Island)" w={600} />
      <Dim x={W - 60} y={0} h={STATUS_H} vertical label="104" />

      {/* header band */}
      <div style={{position: 'absolute', left: 0, top: STATUS_H, width: W, height: 380, background: '#fafafa', borderBottom: '1px solid #ddd'}} />

      {/* top padding */}
      <Dim x={W - 60} y={STATUS_H} h={PAD_TOP} vertical label="22" />

      {/* back arrow box */}
      <div style={{position: 'absolute', left: 44, top: 160, width: 48, height: 48, border: `2px solid ${RED}`}} />
      <Note x={44} y={216} text="← back · 48px · left 44px" w={260} color={RED} />
      <Dim x={0} y={150} w={44} label="44" />

      {/* details pill */}
      <div style={{position: 'absolute', left: W - 44 - 150, top: 158, width: 150, height: 62, border: `2px solid ${RED}`, borderRadius: 40, background: '#ececec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222', fontSize: 26, fontWeight: 600}}>
        Details
      </div>
      <Note x={W - 44 - 330} y={228} text="Details pill · pad 15×32 · radius 40 · right 44px" w={330} color={RED} />
      <Dim x={W - 44} y={150} w={44} label="44" />

      {/* avatar cluster */}
      {circle(clusterX + 0, clusterTop + 24, 86, '#d6d6d6', '86')}
      {circle(clusterX + 94, clusterTop + 0, 78, '#d6d6d6', '78')}
      {circle(clusterX + 118, clusterTop + 86, 46, BLUE + '33', 'M 46')}
      <div style={{position: 'absolute', left: clusterX - 4, top: clusterTop - 4, width: clusterW + 8, height: 148, border: `2px dashed ${RED}`}} />
      <Note x={clusterX - 250} y={clusterTop + 30} text="cluster box 178 × 140" w={230} color={RED} />
      <Note x={clusterX + clusterW + 20} y={clusterTop + 6} text="gap ~8px between every circle (none touch)" w={250} color={RED} />

      {/* title */}
      <div style={{position: 'absolute', left: 0, top: 300, width: W, textAlign: 'center', fontSize: 46, fontWeight: 700, color: '#222', letterSpacing: -0.4}}>
        Giulia, Marco, Sofia
      </div>
      <Note x={40} y={306} text="TITLE 46px / 700" w={240} color={RED} />
      <Dim x={W - 60} y={266} h={34} vertical label="16" />

      {/* subtitle with max-width box */}
      <div style={{position: 'absolute', left: (W - 610) / 2, top: 364, width: 610, height: 44, border: `2px solid ${RED}`}} />
      <div style={{position: 'absolute', left: (W - 610) / 2, top: 366, width: 610, fontSize: 34, fontWeight: 500, color: theme.ash, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
        23–29 Jun • Villa di Prestigio Privata con Piscina e Suite
      </div>
      <Note x={40} y={372} text="SUBTITLE 34px / 500" w={220} color={RED} />
      <Dim x={(W - 610) / 2} y={420} w={610} label="max-width 610 → clips with …" />

      <Note x={40} y={470} w={1000} color="#555" text={'date • listing — ALWAYS clipped to 610px wide with an ellipsis "…". Subtitle marginTop 10px from title.'} />

      {/* legend */}
      <Note x={40} y={540} w={1000} color="#111" text={'All values in px on the 1080×1920 canvas. Header band ≈ 380px tall (under the status bar).'} />
    </AbsoluteFill>
  );
};
