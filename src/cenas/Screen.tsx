import React from 'react';
import { H, W, color, font, space } from './tokens';

type Props = {
  /** Contexto à direita do wordmark: "Week 9", "Today"… */
  context?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

// Quadro 1080x1920. Sem moldura de aparelho e sem barra de status:
// o vídeo é vertical e a UI ocupa a tela inteira.
export const Screen: React.FC<Props> = ({ context, children, style }) => (
  <div
    style={{
      width: W,
      height: H,
      boxSizing: 'border-box',
      padding: `${space.top}px ${space.side}px ${space.bottom}px`,
      background: color.paper,
      color: color.ink,
      fontFamily: font.sans,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      ...style,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 56,
      }}
    >
      <span style={{ fontFamily: font.serif, fontSize: 56, lineHeight: 1 }}>
        Ascend
      </span>
      {context ? (
        <span
          style={{
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: color.ink2,
          }}
        >
          {context}
        </span>
      ) : null}
    </div>
    {children}
  </div>
);
