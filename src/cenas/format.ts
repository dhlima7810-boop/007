// Formata número com separador de milhar. `decimals` fixo deixa o valor
// interpolado (Remotion) contar sem a largura pular.
export function fmt(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function signed(value: number, decimals = 0): string {
  const s = fmt(Math.abs(value), decimals);
  return value < 0 ? `−${s}` : `+${s}`;
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
