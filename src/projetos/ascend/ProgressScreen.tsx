import React from 'react';
import { Screen } from '../../cenas/Screen';
import { Eyebrow } from '../../cenas/Eyebrow';
import { BigNumber } from '../../cenas/BigNumber';
import { StrengthCurve } from '../../cenas/StrengthCurve';
import { color, font } from '../../cenas/tokens';
import { fmt, signed } from '../../cenas/format';

export type ProgressProps = {
  week: number;
  streak: {
    days: number;
    /** Quantos dos últimos 14 dias tiveram treino, do mais antigo ao mais novo. */
    last14: boolean[];
  };
  strength: {
    /** Estimativa de 1RM por semana. */
    points: number[];
    exercise: string;
    unit: string;
    xLabels?: { index: number; text: string }[];
  };
  volume: {
    value: number;
    unit: string;
    deltaPct: number;
  };
  /** 0..1 — desenho da curva. Quem anima é o Remotion. */
  draw?: number;
  /** Valor exibido do streak, se o Remotion estiver contando. */
  streakShown?: number;
};

// Tela 2 — a principal. Streak e curva dividem o quadro; volume é a linha de
// rodapé, de propósito menor.
export const ProgressScreen: React.FC<ProgressProps> = ({
  week,
  streak,
  strength,
  volume,
  draw = 1,
  streakShown,
}) => {
  const last = strength.points[strength.points.length - 1];
  const first = strength.points[0];
  const gain = last - first;
  return (
    <Screen context={`Week ${week}`}>
      {/* Streak */}
      <Eyebrow>Streak</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28 }}>
        <BigNumber value={Math.round(streakShown ?? streak.days)} size={440} tone="accent" />
        <div
          style={{
            fontFamily: font.serif,
            fontSize: 84,
            lineHeight: 0.95,
            paddingBottom: 10,
            textAlign: 'right',
          }}
        >
          days
          <br />
          <span style={{ fontStyle: 'italic' }}>in a row</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 44 }}>
        {streak.last14.map((on, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 8,
              background: on ? color.accent : 'transparent',
              border: on ? 'none' : `3px solid ${color.hair}`,
            }}
          />
        ))}
      </div>

      {/* Strength */}
      <div style={{ marginTop: 92 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Eyebrow>Strength</Eyebrow>
          <div style={{ fontSize: 32, fontWeight: 500, color: color.ink2 }}>{strength.exercise}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, marginTop: 24 }}>
          <BigNumber value={last} decimals={last % 1 ? 1 : 0} size={150} unit={strength.unit} unitSize={44} />
          <span style={{ fontSize: 40, fontWeight: 600, color: color.accent }}>
            {signed(gain, gain % 1 ? 1 : 0)} {strength.unit}
          </span>
        </div>
        <div style={{ marginTop: 28 }}>
          <StrengthCurve
            points={strength.points}
            width={920}
            height={440}
            draw={draw}
            xLabels={strength.xLabels}
          />
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Volume */}
      <div
        style={{
          borderTop: `2px solid ${color.hair}`,
          paddingTop: 36,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <Eyebrow>Volume · this week</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <span style={{ fontFamily: font.serif, fontSize: 84, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(volume.value)}
          </span>
          <span style={{ fontSize: 34, fontWeight: 500, color: color.ink2 }}>{volume.unit}</span>
          <span style={{ fontSize: 34, fontWeight: 600, color: color.ink }}>{signed(volume.deltaPct)}%</span>
        </div>
      </div>
    </Screen>
  );
};
