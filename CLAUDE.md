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

### A armadilha do `clearProps`

O GSAP escreve `transform` **inline** no elemento, e style inline ganha da
folha de estilo. Então toda entrada em GSAP que mexa em `x`, `y`, `scale` ou
`rotation` de um elemento que **também tem hover que move** precisa terminar
com `clearProps: 'transform'`. Sem isso o hover simplesmente não acontece:
o carimbo não levanta, a linha do cupom não rasga, e nada no console avisa.
Vale hoje para `.carimbo`, `.carimbo__dia` e tudo que passa por
`entrarEmGrupo`.

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

## Composição da página

A estrutura veio da referência que o dono mandou (o site da Tripletta),
recomposta com conteúdo e cores da Pizza Mia:

1. **Wordmark gigante** no topo, ocupando a largura toda da tela, sobre a
   foto da fachada à noite. O nome é o hero, e é a coisa mais visível da
   página — não encolha. Abaixo dele vêm os dois botões e mais nada: o
   parágrafo que existia ali foi retirado de propósito.
2. **As quatro ações** logo abaixo: Rodízio, Para viagem, Disk pizza, Onde
   fica. Palavra enorme + seta, com faixa de cor sangrando de ponta a ponta
   no hover. É por aqui que a pessoa escolhe o que quer, antes de qualquer
   outra coisa — não mexa na ordem sem motivo.
3. **Letreiro** amarelo em movimento.
4. Seções de conteúdo em **bandas alternadas** (`.secao--banda` = `tinta-2`).
5. **Wordmark de novo** no rodapé, fechando o livro.

### Caixa alta em tudo

**Todo título, nome, rótulo e botão do site é maiúsculo.** Wordmark do hero,
as quatro ações, títulos de seção, nomes do cardápio, sabores do cupom,
carimbo "HOJE", wordmark do rodapé, links do menu. Não existe mais exceção
em caixa baixa — a regra anterior, que reservava minúsculo ao wordmark,
caiu a pedido do dono.

A caixa vem sempre de `text-transform` no CSS, **nunca** de texto escrito em
maiúsculo no HTML. O JSON-LD é gerado lendo o próprio HTML: se o texto for
gravado em caixa alta, os dados estruturados saem gritando.

Parágrafos de corpo continuam em caixa de frase. "Tudo em maiúsculo" vale
para a tipografia de display e os rótulos; um parágrafo inteiro em caixa
alta não se lê.

Quando chegarem mais fotos, as quatro ações podem receber uma foto cada,
que cresce no hover no lugar da faixa de cor. Hoje não dá: cada foto já
aparece uma vez e não sobra nenhuma.

## Sistema visual — "Fachada"

A paleta e a tipografia vêm do sistema **Fachada**, construído a partir do
prédio amarelo e vermelho da esquina. Os tokens estão no `:root` do
`style.css`.

- **Display: Antonio**, não Anton. Mesmo desenho condensado, do mesmo autor,
  mas com pesos intermediários. **Título em 600** (`--peso-titulo`), **rótulo
  em 500** (`--peso-rotulo`). Todo uso de `var(--display)` precisa declarar um
  dos dois — sem isso o navegador cai no 400 e a página fica desuniforme.
- **Vermelho é só para pedir** (telefone, disk pizza). **Amarelo é para
  navegar** (`.botao--chunky`, pílula de borda grossa). Não inverta.
- **Carimbo do dia**: na seção da semana, cada dia tem uma pílula torta que
  gira entre amarelo, vermelho e papel. A cor marca o dia, não hierarquia.
  Não espalhe essa rotação em qualquer lista — ela vale ali e nas cenas de
  "Uma noite aqui", e só.
- **Itálico é exceção**: só o carimbo "HOJE", que fica torto e itálico sobre
  o dia de hoje. A caixa, mesmo ali, é alta.
- **Cupom**: o cardápio é um comprovante de balcão — papel claro sobre fundo
  escuro, **borda serrada em cima e embaixo** (dois `conic-gradient` em
  `mask`, um triângulo por dente), fio vermelho no topo, pontilhado entre
  nome e preço e o nome da casa assinando no pé. Em duas colunas o cupom lê
  como **livro aberto**, com o vinco pontilhado no meio. O papel é o objeto,
  não a seção.
- **Encostar num sabor rasga a linha**: a linha inclina, desloca e abre
  embaixo uma faixa serrada. É hover de estado, feito em CSS — não gaste
  GSAP com isso.
- **Preço em `tabular-nums`, não em monoespaçada.** A monoespaçada alinhava
  as colunas mas era larga demais: `R$ 58,00` comia a linha no celular e o
  nome do sabor quebrava em duas. `font-variant-numeric: tabular-nums` na
  fonte do corpo dá o mesmo alinhamento numa largura bem menor.
- **O cupom recorta o que sai dele** (`overflow:hidden`). A folha girando em
  `rotationY` transborda a caixa e empurra o documento: sem o recorte isso
  abria **36px de rolagem horizontal de verdade** entre 600 e 719px — faixa
  que uma varredura de larguras "redondas" não pega. Varra de 20 em 20px.
- **Raio pequeno** (4–8px) e pílula. Não voltar para raio grande nem sombra.

## O cardápio vira página no celular

Acima de 720px o cupom já lê como livro aberto, com o vinco no meio. Abaixo
disso vira coluna única, e aí **o dedo vira a folha**: os sabores são
repartidos em cadernos de 6 e a folha da vez gira pela lombada para
descobrir a de baixo.

O caderno é montado em JS, dentro de um `gsap.matchMedia()`, e desmontado
quando a janela alarga. Sem JS, sem GSAP ou com a janela larga, o que fica
na tela é **a lista inteira de uma vez** — a paginação é conforto, não
suporte.

Três coisas que não dá para mexer sem quebrar:

1. **Visibilidade da folha é só da classe `e-a-folha`.** Posta inline, ela
   sobrevive ao `clearProps` e a folha nunca mais some: em três viradas o
   caderno vira uma pilha de páginas sobrepostas.
2. **A altura do caderno é medida com as folhas soltas** (classe `medindo`).
   Enquanto são `position:absolute` com `inset:0` dentro de um pai sem
   altura, todas medem zero e o cupom fecha.
3. **`touch-action: pan-y` no caderno.** Entrega a rolagem vertical ao
   navegador (e ao Lenis) e guarda o arrasto horizontal para a virada. Sem
   isso o navegador reivindica o gesto lateral como rolagem e dispara
   `pointercancel` no meio.

O gesto só é lido no soltar, e só se for claramente horizontal. Nada de
`preventDefault`: rolar a página com o dedo em cima do cardápio continua
sendo do Lenis, como em qualquer outro lugar. Os dois botões de seta e o
fólio ("Página 3 de 6") existem para quem não descobre o gesto e para o
teclado.

## Abertura: a lua vira a logo

Na chegada, sem precisar rolar, roda uma sequência de ~5,5s:

1. **A câmera sobe** pela foto da fachada — animando o `object-position` da
   imagem, de `50% 76%` (calçada) para `50% 42%` (céu).
2. **A lua cheia desce** para dentro do quadro e acende.
3. **O morph**: o disco da lua apaga enquanto a face da logo acende, no mesmo
   lugar e no mesmo tamanho. Não é morph nenhum — são duas faces do mesmo
   elemento `#lua`, e as duas são bolas. É por isso que funciona.
4. **O voo**: a logo formada vai até a vaga do cabeçalho e cruza com a
   `.marca__logo` de verdade num cross-fade de 0.6s, no mesmo ponto e tamanho.

**A câmera sobe pelo `object-position`, não deslocando `.hero__media`.** O
transbordo desse elemento é de 4%; empurrá-lo para baixo abriria fresta preta
no topo. Mexendo no enquadramento dentro do mesmo retângulo não há fresta
possível — e também não há briga com o parallax da seção 9, que escreve
`yPercent` no mesmo elemento.

**A regra que não pode cair: existe uma logo só.** O dono rejeitou
explicitamente uma cópia caindo ao lado da logo do cabeçalho. `#lua` e
`.marca__logo` nunca podem estar visíveis ao mesmo tempo em **lugares
diferentes**. No mesmo ponto, durante o cross-fade, é o projeto.

A lua é enfeite: não recebe ponteiro, não entra na árvore de acessibilidade e
some inteira sem GSAP ou sob `prefers-reduced-motion`. **Nunca ponha
informação nela.**

### A abertura tem de ser pulável

São ~4,5s até o wordmark. `wheel`, `touchstart`, `keydown` e `pointerdown`
levam a linha do tempo direto ao fim (`abertura.progress(1)`). Sem isso a
chegada vira armadilha, e a sequência ficaria rodando por cima de uma página
já em curso.

### A logo do cabeçalho é escondida por GSAP, nunca por CSS

A sequência começa com `gsap.set(logoTopo, { autoAlpha: 0 })`. Isso **tem**
de ser em GSAP: posto no CSS, o cabeçalho carregaria sem logo em toda máquina
sem JS. Qualquer caminho novo que esconda essa logo precisa de um caminho que
a reacenda — e o teste das três degradações é o que pega isso.

## A logo despencando

Quem despenca é a **própria `.marca__logo`**, a mesma que nasceu da lua. Não
existe cópia. São três travessias presas ao scroll: a primeira sai da própria
vaga do cabeçalho, as outras duas entram por cima. Subir a página devolve a
logo à vaga.

O `.topo` é `sticky` e não tem `overflow:hidden`, então ela sai da caixa do
cabeçalho sem ser cortada, e a origem dela acompanha o alto da janela — é
isso que faz a queda ler como queda.

### A vaga se fecha por transform, nunca por layout

Quando a logo sai, o texto "PIZZA MIA" **desliza por `transform`** até o lugar
onde ela estava — os 36px da logo mais o `gap` do `.marca`, lidos do próprio
elemento em vez de escritos à mão.

Não anime `width`, `margin` nem `gap` para fechar essa vaga. Qualquer um
desses força o navegador a recalcular a caixa a cada quadro, e é exatamente
daí que vem o tremor. `transform` não reflui: a largura do `.marca` fica
constante do começo ao fim, e o texto anda liso.

### A armadilha do `immediateRender`

`fromTo` escreve o estado inicial **no instante em que é criado**, não quando
chega a vez dele na linha do tempo. As três quedas são criadas em sequência,
então sem `immediateRender: false` da segunda em diante **vale o `from` da
última** — e a logo nasce em `y:-180`, fora da tela, no topo da página. O
cabeçalho carrega sem logo nenhuma, e nada no console avisa.

Vale para qualquer `fromTo` repetido na mesma linha do tempo sobre o mesmo
alvo.


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

### A logo do cabeçalho nasce apagada sob `.js`

`.js .marca__logo{opacity:0}` existe para ela não piscar entre o script do
`<head>` e o `main.js` (medido antes: ainda visível aos 365ms, e só de volta
5s depois). É o mesmo contrato do `[data-entra]` — sem `.js`, ela aparece
normal — e é compatível com a rede de segurança abaixo, que tira a classe.

### A rede de segurança do `.js`

As três situações acima só valem **depois que o `main.js` consegue rodar** — e
ele vem atrás de três `<script>` bloqueantes das libs. Se essas libs penderem
(rede ruim, não falha instantânea), o CSS já escondeu a cortina do hero e todo
`[data-entra]` sob `.js`, e não há quem reacenda: o hero fica preto e **o botão
do telefone fica invisível** durante toda a espera. Medido: com as libs
penduradas 7s, opacidade 0 no CTA até o fim.

Por isso o script inline do `<head>` arma um `setTimeout` de 2,5s
(`window.__pmRede`). Passado esse tempo sem sinal do `main.js`, ele tira a
classe `js` e a página volta ao estado parado e legível. O `main.js` cancela
esse timer ao começar; se ele já tiver disparado (`window.__pmRevelou`), o
`main.js` **não reesconde para animar** — isso piscaria a página na cara de
quem acabou de esperar.

Os 2,5s são um meio-termo: carga normal termina muito antes (a rede não
dispara), e numa conexão lenta mas funcionando o visitante perde a abertura,
o que é melhor que uma tela preta. Não suba esse número sem medir.

### Chegar fora do topo não roda a abertura

F5 no meio da página, ou um link `/#cardapio`, carregam a página já rolada. A
sequência da lua ali não tem sentido: ela acenderia por cima da seção que a
pessoa pediu. Medido antes da correção: o disco branco tapando o título
CARDÁPIO.

`conferirEntrada()` manda a linha do tempo direto para o fim quando
`scrollY > 40` ou existe um `location.hash`. A conferência se repete no
`load`, porque o navegador às vezes só restaura o scroll depois.

### Subtítulo que aparece no hover

Os subtítulos do cardápio (`.item__revela`) e das três cenas
(`.noite__revela`) ficam invisíveis até o ponteiro chegar no nome. Três
regras seguram isso de pé:

1. O espaço fica **reservado desde o início** — anima-se `opacity` e
   `transform`, nunca `max-height`. Crescer no hover empurraria a seção
   inteira e a página pularia debaixo do mouse.
2. Em tela sem ponteiro, `@media (hover:none)` deixa tudo aberto. Num
   celular o gesto não existe, e o conteúdo não pode depender dele.
3. Teclado chega junto: os blocos têm `tabindex="0"` e as regras respondem a
   `:focus-visible` e `:focus-within` além de `:hover`.

Leitor de tela lê os dois de qualquer jeito — `opacity:0` não esconde de
tecnologia assistiva.

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
