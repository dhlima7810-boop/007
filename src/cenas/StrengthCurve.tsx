import React from 'react';
import { color, font } from './tokens';
import { clamp01 } from './format';

type Props = {
  points: number[];
  width: number;
  height: number;
  /** 0..1: quanto da curva já foi desenhada. Quem anima é o Remotion. */
  draw?: number;
  /** Rótulos do eixo x, por índice de ponto. */
  xLabels?: { index: number; text: string }[];
  /** Rótulo do ponto final (ex.: "52.5 kg"). */
  endLabel?: string;
  stroke?: number;
  lineColor?: string;
};

const SAMPLES = 24; // amostras por segmento: curva lisa sem depender de `pathLength`
const PAD_T = 56;
const PAD_R = 28;
const PAD_B = 64;

// Spline cúbica monotônica (Fritsch–Carlson): suave e nunca passa do ponto,
// então a curva de força não "ondula" para baixo entre dois pontos crescentes.
function monotone(xs: number[], ys: number[]): [number, number][] {
  const n = xs.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    m.push((ys[i + 1] - ys[i]) / dx[i]);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  }
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      t[i] = (3 * a * m[i]) / h;
      t[i + 1] = (3 * b * m[i]) / h;
    }
  }
  const out: [number, number][] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let s = 0; s < SAMPLES; s++) {
      const u = s / SAMPLES;
      const u2 = u * u;
      const u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1;
      const h10 = u3 - 2 * u2 + u;
      const h01 = -2 * u3 + 3 * u2;
      const h11 = u3 - u2;
      out.push([
        xs[i] + u * dx[i],
        h00 * ys[i] + h10 * dx[i] * t[i] + h01 * ys[i + 1] + h11 * dx[i] * t[i + 1],
      ]);
    }
  }
  out.push([xs[n - 1], ys[n - 1]]);
  return out;
}

export const StrengthCurve: React.FC<Props> = ({
  points,
  width,
  height,
  draw = 1,
  xLabels,
  endLabel,
  stroke = 9,
  lineColor = color.accent,
}) => {
  const n = points.length;
  const plotW = width - PAD_R;
  const plotH = height - PAD_T - PAD_B;
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const span = hi - lo || 1;
  const yMin = lo - span * 0.12;
  const yMax = hi + span * 0.08;

  const px = (i: number) => (i / (n - 1)) * plotW;
  const py = (v: number) => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const xs = points.map((_, i) => px(i));
  const ys = points.map((v) => py(v));
  const full = monotone(xs, ys);

  // Corta a polilinha no ponto `draw`, interpolando o último pedaço.
  const exact = clamp01(draw) * (full.length - 1);
  const whole = Math.floor(exact);
  const frac = exact - whole;
  const shown = full.slice(0, whole + 1);
  if (frac > 0 && whole < full.length - 1) {
    const [x0, y0] = full[whole];
    const [x1, y1] = full[whole + 1];
    shown.push([x0 + (x1 - x0) * frac, y0 + (y1 - y0) * frac]);
  }
  const tip = shown[shown.length - 1];
  const line = shown.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const baseY = PAD_T + plotH;
  const area = `${line} L${tip[0].toFixed(1)} ${baseY} L${shown[0][0]} ${baseY} Z`;

  const grid = [0, 1, 2].map((k) => PAD_T + (plotH / 2) * k);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      {grid.map((y) => (
        <line key={y} x1={0} x2={plotW} y1={y} y2={y} stroke={color.hair} strokeWidth={2} />
      ))}
      <path d={area} fill={lineColor} opacity={0.1} />
      <path d={line} fill="none" stroke={lineColor} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
      {draw > 0 ? (
        <>
          <circle cx={tip[0]} cy={tip[1]} r={stroke * 2.1} fill={color.paper} />
          <circle cx={tip[0]} cy={tip[1]} r={stroke * 1.5} fill={lineColor} />
        </>
      ) : null}
      {endLabel && draw >= 1 ? (
        <text
          x={tip[0] - 36}
          y={tip[1] - 44}
          textAnchor="end"
          fontFamily={font.serif}
          fontSize={64}
          fill={color.ink}
        >
          {endLabel}
        </text>
      ) : null}
      {xLabels?.map(({ index, text }) => (
        <text
          key={index}
          x={px(index)}
          y={height - 8}
          textAnchor={index === 0 ? 'start' : index === n - 1 ? 'end' : 'middle'}
          fontFamily={font.sans}
          fontSize={28}
          fontWeight={500}
          letterSpacing="0.1em"
          fill={color.ink2}
        >
          {text.toUpperCase()}
        </text>
      ))}
    </svg>
  );
};
