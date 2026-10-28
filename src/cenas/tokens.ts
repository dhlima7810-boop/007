// Tokens visuais do Ascend. Tela vertical 9:16 em 1080x1920.
// Cor contida: papel + tinta, e UM acento (laranja-vermelho).

export const W = 1080;
export const H = 1920;

export const color = {
  paper: '#F3EEE4',
  paper2: '#E9E2D3',
  ink: '#16130F',
  ink2: '#6F675A', // 4.9:1 sobre o papel
  hair: 'rgba(22, 19, 15, 0.14)',
  accent: '#FF4B1F',
} as const;

// Instrument Serif nos números e títulos grandes, Inter Tight nos rótulos e UI.
// As famílias são carregadas por fora (fontes.css na prévia,
// @remotion/google-fonts no Remotion).
export const font = {
  serif: "'Instrument Serif', 'Times New Roman', serif",
  sans: "'Inter Tight', system-ui, -apple-system, sans-serif",
} as const;

// Zonas seguras para vídeo vertical: o topo e o pé ficam sob a interface
// das plataformas (Reels, Shorts, TikTok).
export const space = {
  side: 80,
  top: 130,
  bottom: 190,
} as const;

// Nada abaixo de 28px: a 1080 de largura, 28px ainda lê em celular.
export const text = {
  min: 28,
} as const;
