import React from 'react';
import { Screen } from '../../cenas/Screen';
import { Eyebrow } from '../../cenas/Eyebrow';
import { BigNumber } from '../../cenas/BigNumber';
import { color, font } from '../../cenas/tokens';
import { fmt, signed } from '../../cenas/format';

export type SetLogProps = {
  exercise: string;
  setNumber: number;
  totalSets: number;
  weight: number;
  unit: string;
  reps: number;
  /** Mesma série na semana anterior: dá o "bati ou não bati" na hora. */
  lastWeek?: { weight: number; reps: number };
  /** Séries já registradas neste exercício. */
  logged: { weight: number; reps: number }[];
  /** Botão já confirmado: vira "Logged". */
  confirmed?: boolean;
  context?: string;
};

const Stepper: React.FC<{ sign: '−' | '+' }> = ({ sign }) => (
  <div
    style={{
      width: 120,
      height: 120,
      borderRadius: 60,
      border: `3px solid ${color.ink}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: font.sans,
      fontSize: 64,
      fontWeight: 400,
      lineHeight: 1,
    }}
  >
    {sign}
  </div>
);

// Tela 1 — o momento do log. Peso e reps gigantes, um botão que ocupa a
// largura toda: tem que parecer feito para o polegar e para dois segundos.
export const SetLogScreen: React.FC<SetLogProps> = ({
  exercise,
  setNumber,
  totalSets,
  weight,
  unit,
  reps,
  lastWeek,
  logged,
  confirmed = false,
  context = 'Workout',
}) => {
  const delta = lastWeek ? weight - lastWeek.weight : 0;
  return (
    <Screen context={context}>
      <Eyebrow>
        Set {setNumber} of {totalSets}
      </Eyebrow>
      <div
        style={{
          fontFamily: font.serif,
          fontSize: 112,
          lineHeight: 0.98,
          letterSpacing: '-0.01em',
          marginTop: 20,
        }}
      >
        {exercise}
      </div>

      {/* Progresso das séries: segmentos, não bolinhas. */}
      <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
        {Array.from({ length: totalSets }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 10,
              borderRadius: 5,
              background: i < logged.length ? color.ink : i === setNumber - 1 ? color.accent : color.hair,
            }}
          />
        ))}
      </div>

      {/* Peso */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 72 }}>
        <Stepper sign="−" />
        <div style={{ textAlign: 'center' }}>
          <BigNumber value={weight} decimals={weight % 1 ? 1 : 0} size={300} unit={unit} unitSize={56} />
        </div>
        <Stepper sign="+" />
      </div>
      {lastWeek ? (
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 34, fontWeight: 500, color: color.ink2 }}>
          Last week {fmt(lastWeek.weight, lastWeek.weight % 1 ? 1 : 0)} {unit} × {lastWeek.reps}
          {delta !== 0 ? (
            <span style={{ color: color.accent, fontWeight: 600 }}>
              {'  '}
              {signed(delta, delta % 1 ? 1 : 0)} {unit}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Reps */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 64,
          paddingTop: 48,
          borderTop: `2px solid ${color.hair}`,
        }}
      >
        <Stepper sign="−" />
        <BigNumber value={reps} size={230} unit="reps" unitSize={52} />
        <Stepper sign="+" />
      </div>

      {/* Séries anteriores */}
      <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {logged.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 34,
              fontWeight: 500,
              color: color.ink2,
              padding: '10px 0',
            }}
          >
            <span>Set {i + 1}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: color.ink }}>
              {fmt(s.weight, s.weight % 1 ? 1 : 0)} {unit} × {s.reps}
            </span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          height: 176,
          borderRadius: 88,
          background: confirmed ? color.ink : color.accent,
          color: confirmed ? color.paper : color.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 56,
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        {confirmed ? 'Logged ✓' : 'Log set'}
      </div>
    </Screen>
  );
};
