# Ascend — telas

Quatro telas 1080×1920 (9:16), em React + TypeScript, sem biblioteca de UI.
Tudo que aparece entra por props; exemplos em `dados.ts`.

| Tela | Componente |
|---|---|
| Registro de série | `SetLogScreen` |
| Painel de progresso | `ProgressScreen` |
| Histórico da semana | `WeekHistoryScreen` |
| Marco (semana 12) | `MilestoneScreen` |

Reaproveitáveis em `src/cenas/`: `Screen`, `Eyebrow`, `BigNumber`,
`StrengthCurve`, mais `tokens.ts` e `format.ts`.

- **Paleta:** papel `#F3EEE4`, tinta `#16130F`, acento `#FF4B1F` (único).
- **Fontes:** Instrument Serif (números e títulos) + Inter Tight (rótulos e UI).
  No Remotion, carregue com `@remotion/google-fonts/InstrumentSerif` e
  `@remotion/google-fonts/InterTight`. `src/cenas/fontes.css` serve só para prévia.
- **Métricas:** Volume · Streak · Strength.
- **Animação:** os componentes não têm relógio próprio. `draw` (curva),
  `reveal` (linhas da semana), `streakShown` e `confirmed` vêm de fora,
  via `useCurrentFrame()` + `interpolate()`.
