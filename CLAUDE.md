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

### Tempo e curva

Sites cinematográficos são lentos com intenção.

- **Nada que entre ou saia em menos de 0.6s.** Vale para GSAP e para
  `transition` no CSS. Entrada, saída, abrir, fechar, revelar, sumir.
- **Ease só power3 ou expo** (`.out`, `.in`, `.inOut`). Nada de power2,
  power4, back, elastic, bounce, nem a palavra `ease` solta no CSS.
- No CSS as curvas vêm dos tokens `--saida` (expo.out) e `--dupla`
  (expo.inOut), definidos no `:root`.

Três exceções, e só estas:

1. `ease: 'none'` em tween preso ao scroll — parallax, barra de progresso.
   Ali a posição vem do scroll, não do relógio; uma curva faria o elemento
   empurrar e recuar em relação ao dedo.
2. `ease: 'none'` no letreiro em loop, que precisa de velocidade constante
   ou pulsa a cada volta.
3. Hover de **cor e borda** fica em 0.25s. É devolutiva de estado, não
   entrada — acima de meio segundo o botão parece travado. Hover que
   **move** (escala de foto, por exemplo) segue a regra dos 0.6s.

Em tween preso ao scroll a `duration` só normaliza o mapa: quem manda na
posição é o scroll. Ainda assim escreva um valor de 0.6s para cima, para o
arquivo não ter número curto que confunda na próxima leitura.

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

- Preços das **pizzas**: vêm do cardápio da casa, fotografado em 7/2/2026, e
  estão na seção `#cardapio`. A foto pegou só a coluna do meio — faltam os
  sabores de A a E, a coluna da direita e as pizzas doces. Não invente os que
  faltam: ou o dono manda uma foto do resto, ou eles ficam fora.
- Preços das **promoções da semana**: continuam fora do site. Os do cartaz
  antigo não valem mais e os atuais não são conhecidos. Cada dia tem um link
  "Consultar preço" que liga.
- Fotos: use só as que a pizzaria forneceu. Imagens de Tripadvisor, Google ou
  Restaurant Guru são de terceiros e não entram.
- **Telefone: um só, (11) 2452-8022.** Confirmado pelo dono em 17/10/2026.
  Não troque pelo 2452-6575 com base em fonte externa: a placa da fachada, o
  rodapé do cardápio impresso e os guias da cidade dão o 6575 em primeiro
  lugar, e foi exatamente por isso que o site saiu errado uma vez. A linha que
  atende é a 8022. Se um dia mudar, troque em `index.html`, `privacidade.html`,
  `termos.html` e no `telephone` do JSON-LD.
- **Instagram oficial: `@pizzamia_1`.** Confirmado pelo dono. Existe um
  `@pizzamiagv` parecido que **não** é desta casa.
- **Horário: todos os dias, 18h à meia-noite.** Os dias vêm do próprio cartaz
  da casa, que anuncia promoção para os sete dias da semana.
- **Razão social e CNPJ:** La Casa Della Pizza Mia Ltda, 54.968.854/0001-95.
  Aparece no rodapé e nas páginas legais.

## Dados estruturados e publicação

O `index.html` tem um bloco JSON-LD (`Restaurant` + `Menu`) no `<head>`. Ele é
**gerado a partir do próprio HTML** da página, lendo os `<li class="sabor">`,
para nunca divergir do que está na tela. Mexeu nos sabores, regere — a receita
está no README.

Antes de publicar, trocar `SITE_URL` pelo domínio real em três lugares:
`index.html` (JSON-LD), `sitemap.xml` e `robots.txt`. Enquanto for `SITE_URL`,
os buscadores ignoram essas URLs.

O `robots.txt` libera explicitamente GPTBot, ClaudeBot, PerplexityBot e
Google-Extended, entre outros. Não feche esses agentes sem o dono pedir.
