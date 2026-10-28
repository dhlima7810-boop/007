import React from 'react';
import { Screen } from '../../cenas/Screen';
import { Eyebrow } from '../../cenas/Eyebrow';
import { BigNumber } from '../../cenas/BigNumber';
import { StrengthCurve } from '../../cenas/StrengthCurve';
import { color, font } from '../../cenas/tokens';
import { fmt, signed } from '../../cenas/format';

export type MilestoneRow = {
  label: string;
  from: number;
  to: number;
  unit: string;
  decimals?: number;
  /** 'pct' (padrão) ou 'abs': percentual absurdo (3 → 38 dias) fica melhor em valor. */
  delta?: 'pct' | 'abs';
};

export type MilestoneProps = {
  week: number;
  /** Frase editorial sob o número. */
  line: string;
  rows: MilestoneRow[];
  /** Curva de força semana a semana (1 → week). */
  curve: number[];
  /** 0..1 — desenho da curva. Quem anima é o Remotion. */
  draw?: number;
};

// Tela 4 — o marco. Um número gigante, uma frase, e a prova lado a lado:
// semana 1 em cinza, semana 12 em tinta, o ganho em acento.
export const MilestoneScreen: React.FC<MilestoneProps> = ({ week, line, rows, curve, draw = 1 }) => (
  <Screen context="Milestone">
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
      <BigNumber value={week} size={400} tone="accent" />
      <div style={{ fontFamily: font.serif, fontSize: 84, lineHeight: 0.98, paddingBottom: 10 }}>
        weeks
        <br />
        <span style={{ fontStyle: 'italic' }}>in</span>
      </div>
    </div>
    <p style={{ fontFamily: font.serif, fontSize: 68, lineHeight: 1.05, margin: '36px 0 0', letterSpacing: '-0.005em' }}>
      {line}
    </p>

    <div style={{ marginTop: 44 }}>
      <StrengthCurve
        points={curve}
        width={920}
        height={270}
        draw={draw}
        xLabels={[
          { index: 0, text: 'Week 1' },
          { index: curve.length - 1, text: `Week ${week}` },
        ]}
      />
    </div>

    <div style={{ flex: 1 }} />

    <div style={{ borderTop: `2px solid ${color.ink}` }}>
      {rows.map((r) => {
        const d = r.decimals ?? 0;
        const pct = Math.round(((r.to - r.from) / r.from) * 100);
        return (
          <div
            key={r.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              padding: '22px 0',
              borderBottom: `2px solid ${color.hair}`,
            }}
          >
            <div>
              <Eyebrow>{r.label}</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 12 }}>
                <span style={{ fontFamily: font.serif, fontSize: 56, color: color.ink2, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(r.from, d)}
                </span>
                <span style={{ fontSize: 40, color: color.ink2 }}>→</span>
                <span style={{ fontFamily: font.serif, fontSize: 96, lineHeight: 0.9, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(r.to, d)}
                </span>
                <span style={{ fontSize: 32, fontWeight: 500, color: color.ink2 }}>{r.unit}</span>
              </div>
            </div>
            <div style={{ fontSize: 48, fontWeight: 600, color: color.accent }}>{r.delta === 'abs' ? signed(r.to - r.from, d) : `${signed(pct)}%`}</div>
          </div>
        );
      })}
    </div>
  </Screen>
);
