import React from 'react';
import { Screen } from '../../cenas/Screen';
import { Eyebrow } from '../../cenas/Eyebrow';
import { BigNumber } from '../../cenas/BigNumber';
import { color, font } from '../../cenas/tokens';
import { fmt } from '../../cenas/format';

export type DayStatus = 'done' | 'rest' | 'missed' | 'today' | 'upcoming';

export type WeekDay = {
  day: string; // "Mon"
  date: number;
  status: DayStatus;
  title?: string; // "Push", "Legs"…
  minutes?: number;
  volume?: number;
};

export type WeekHistoryProps = {
  week: number;
  unit: string;
  days: WeekDay[];
  planned: number;
  /** 0..1 — quantas linhas já entraram. Quem anima é o Remotion. */
  reveal?: number;
};

const Marker: React.FC<{ status: DayStatus }> = ({ status }) => {
  const base: React.CSSProperties = { width: 44, height: 44, borderRadius: 22, boxSizing: 'border-box', flexShrink: 0 };
  if (status === 'done')
    return (
      <div style={{ ...base, background: color.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color.ink} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
    );
  if (status === 'today') return <div style={{ ...base, border: `5px solid ${color.accent}` }} />;
  if (status === 'missed') return <div style={{ ...base, border: `3px solid ${color.ink2}` }} />;
  return <div style={{ ...base, border: `3px dashed ${color.hair}` }} />;
};

// Tela 3 — a semana em lista. Cada dia é uma linha; a barra fina é o
// volume daquele dia, e a coluna de marcadores à direita é a consistência.
export const WeekHistoryScreen: React.FC<WeekHistoryProps> = ({ week, unit, days, planned, reveal = 1 }) => {
  const done = days.filter((d) => d.status === 'done').length;
  const maxVol = Math.max(...days.map((d) => d.volume ?? 0), 1);
  return (
    <Screen context={`Week ${week}`}>
      <Eyebrow>Sessions</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginTop: 28 }}>
        <BigNumber value={done} size={400} tone="ink" />
        <div style={{ fontFamily: font.serif, fontSize: 84, lineHeight: 0.98, paddingBottom: 8 }}>
          of {planned}
          <br />
          <span style={{ fontStyle: 'italic' }}>planned</span>
        </div>
      </div>

      <div style={{ marginTop: 72, borderTop: `2px solid ${color.ink}` }}>
        {days.map((d, i) => {
          const muted = d.status === 'rest' || d.status === 'upcoming';
          const t = Math.min(1, Math.max(0, reveal * days.length - i));
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                height: 138,
                borderBottom: `2px solid ${color.hair}`,
                opacity: t,
                transform: `translateY(${(1 - t) * 24}px)`,
              }}
            >
              <div style={{ width: 150 }}>
                <div style={{ fontFamily: font.serif, fontSize: 64, lineHeight: 1, color: muted ? color.ink2 : color.ink }}>
                  {d.day}
                </div>
                <div style={{ fontSize: 28, fontWeight: 500, color: color.ink2, marginTop: 4 }}>{d.date}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {d.status === 'done' || d.status === 'today' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 42, fontWeight: 600 }}>{d.title ?? 'Workout'}</span>
                      <span style={{ fontSize: 30, fontWeight: 500, color: color.ink2, fontVariantNumeric: 'tabular-nums' }}>
                        {d.status === 'done' ? `${d.minutes} min` : 'Today'}
                      </span>
                    </div>
                    {d.status === 'done' ? (
                      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 10, borderRadius: 5, background: color.accent, width: `${((d.volume ?? 0) / maxVol) * 100}%`, minWidth: 24 }} />
                        </div>
                        <span style={{ width: 170, textAlign: 'right', fontSize: 28, fontWeight: 500, color: color.ink2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {fmt(d.volume ?? 0)} {unit}
                        </span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <span style={{ fontSize: 38, fontWeight: 500, color: color.ink2 }}>
                    {d.status === 'rest' ? 'Rest' : d.status === 'missed' ? 'Missed' : 'Up next'}
                  </span>
                )}
              </div>
              <Marker status={d.status} />
            </div>
          );
        })}
      </div>
    </Screen>
  );
};
