import React from 'react';
import { color, font } from './tokens';

type Props = {
  children: React.ReactNode;
  tone?: 'muted' | 'ink' | 'accent';
  style?: React.CSSProperties;
};

// Rótulo pequeno em caixa alta: o contraponto sóbrio aos números grandes.
export const Eyebrow: React.FC<Props> = ({ children, tone = 'muted', style }) => (
  <div
    style={{
      fontFamily: font.sans,
      fontSize: 30,
      fontWeight: 600,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: tone === 'accent' ? color.accent : tone === 'ink' ? color.ink : color.ink2,
      ...style,
    }}
  >
    {children}
  </div>
);
