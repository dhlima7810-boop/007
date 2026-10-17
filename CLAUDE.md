# Pizza Mia — site

Site estático da pizzaria Pizza Mia (Av. Emilio Ribas, 3175 — Vila Galvão,
Guarulhos / SP). HTML, CSS e JavaScript puros, sem build e sem framework.

## Regra de animação

**Toda animação usa Lenis no scroll e GSAP no movimento.**

Sem exceção:

- **Lenis** é o dono do scroll. Qualquer rolagem suave, âncora, pin,
  travamento ou leitura de posição passa por ele. Não use
  `scroll-behavior: smooth` no CSS, `window.scrollTo({behavior:'smooth'})`,
  nem bibliotecas concorrentes de scroll.
- **GSAP** é o dono do movimento. Qualquer coisa que se desloque, apareça,
  suma, escale ou mude de cor ao longo do tempo é feita em GSAP. Não use
  `@keyframes`, `transition` para entrada de elemento, nem
  `Element.animate()`.
- **ScrollTrigger** é a ponte entre os dois. O Lenis avisa o ScrollTrigger a
  cada quadro (`lenis.on('scroll', ScrollTrigger.update)`) e o GSAP conduz o
  ticker (`gsap.ticker.add`). Esse encaixe fica em um lugar só, no topo do
  `assets/js/main.js`, e não se repete.

`transition` no CSS continua valendo para estado de interface — hover, foco,
abrir e fechar menu. O que a regra proíbe é animar entrada, saída e
movimento ligado ao scroll fora do GSAP.

## Sem componentes

O projeto ainda **não** tem camada de componentes. Nada de React, Vue, web
components ou um sistema de componentes próprio. É uma página só, em
`index.html`, com o CSS em um arquivo e o JS em outro. Quando for preciso
repetir um bloco, repita o HTML.

## Bibliotecas

Instaladas por npm e copiadas para `assets/vendor/`, então a página roda sem
build e sem CDN:

| Lib | Versão | Arquivo |
|---|---|---|
| GSAP | 3.13.0 | `assets/vendor/gsap.min.js` |
| ScrollTrigger | 3.13.0 | `assets/vendor/ScrollTrigger.min.js` |
| Lenis | 1.3.11 | `assets/vendor/lenis.min.js` + `lenis.css` |

Para atualizar: `npm install gsap@<v> lenis@<v>` e copiar os arquivos de
`node_modules/*/dist/` para `assets/vendor/`. `node_modules/` não vai para o
repositório.

## Acessibilidade e degradação

A página precisa continuar legível e utilizável nas três situações:

1. **Sem JavaScript** — o `<html>` começa com `class="no-js"`; um script
   inline troca para `js`. O CSS só esconde conteúdo sob `.js`.
2. **GSAP ou Lenis não carregam** — o `main.js` remove a classe `js` e sai
   antes de animar. Tudo aparece parado.
3. **`prefers-reduced-motion: reduce`** — Lenis não é iniciado, o scroll volta
   a ser o do navegador e nenhuma linha do tempo roda.

Nunca deixe conteúdo visível só por efeito de animação.

## Estrutura

```
index.html            página única
assets/css/style.css  estilos
assets/js/main.js     Lenis + GSAP + ScrollTrigger
assets/img/           fotos (cada foto aparece uma vez só no site)
assets/vendor/        libs
```

## Conteúdo

- Preços: **o site não mostra nenhum**, de propósito — os do cartaz antigo não
  valem mais. Cada promoção tem um link "Consultar preço" que liga.
- Fotos: use só as que a pizzaria forneceu. Imagens de Tripadvisor, Google ou
  Restaurant Guru são de terceiros e não entram.
