import React from 'react';
import { color, font } from './tokens';
import { fmt } from './format';

type Props = {
  value: number | string;
  /** Casas decimais fixas quando `value` é número. */
  decimals?: number;
  size?: number;
  unit?: string;
  /** Tamanho da unidade. Padrão: 22% do número. */
  unitSize?: number;
  tone?: 'ink' | 'accent' | 'muted';
  style?: React.CSSProperties;
};

// Número em serifa grande, o protagonista tipográfico das telas.
export const BigNumber: React.FC<Props> = ({
  value,
  decimals = 0,
  size = 240,
  unit,
  unitSize,
  tone = 'ink',
  style,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: size * 0.08,
      color: tone === 'accent' ? color.accent : tone === 'muted' ? color.ink2 : color.ink,
      ...style,
    }}
  >
    <span
      style={{
        fontFamily: font.serif,
        fontSize: size,
        lineHeight: 0.82,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      {typeof value === 'number' ? fmt(value, decimals) : value}
    </span>
    {unit ? (
      <span
        style={{
          fontFamily: font.sans,
          fontSize: unitSize ?? Math.max(32, size * 0.2),
          fontWeight: 500,
          color: color.ink2,
        }}
      >
        {unit}
      </span>
    ) : null}
  </div>
);
