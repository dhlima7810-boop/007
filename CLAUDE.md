# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Pizza Mia — site

Site estático da pizzaria Pizza Mia (Av. Emilio Ribas, 3175 — Vila Galvão,
Guarulhos / SP). HTML, CSS e JavaScript puros, sem build e sem framework.

Não há testes nem lint: `npm test` é um placeholder que falha. Para ver o
site, abra `index.html` ou rode `python3 -m http.server 8000` na raiz.

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
o carimbo não levanta, a linha do cardápio não rasga, e nada no console avisa.
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
as quatro ações, títulos de seção, nomes do cardápio, sabores e preços,
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
- **Cardápio**: é um cardápio de verdade, não uma nota. Fechado, uma capa de
  **couro marrom espessa, com o ouro na ponta** e a logo no centro; aberto,
  folhas de papel com a **divisa da lombada** entre as duas páginas e a
  assinatura da casa no pé. A borda serrada de comprovante **saiu**: folha de
  cardápio não é cupom rasgado.
- **Encostar num sabor rasga a linha**: a linha inclina, desloca e abre
  embaixo uma faixa serrada. Vale para **todos os 111 itens**, não só para as
  pizzas. É hover de estado, feito em CSS — não gaste GSAP com isso.
- **Preço em `tabular-nums`, não em monoespaçada.** A monoespaçada alinhava
  as colunas mas era larga demais: `R$ 58,00` comia a linha no celular e o
  nome do sabor quebrava em duas. `font-variant-numeric: tabular-nums` na
  fonte do corpo dá o mesmo alinhamento numa largura bem menor.
- **O cardápio recorta o que sai dele** (`overflow:hidden`). A folha girando
  em `rotationY` transborda a caixa e empurra o documento: sem o recorte isso
  abria **36px de rolagem horizontal de verdade** entre 600 e 719px — faixa
  que uma varredura de larguras "redondas" não pega. Varra de 20 em 20px.
- **Raio pequeno** (4–8px) e pílula. Não voltar para raio grande nem sombra.

## O cardápio: a capa que abre e o livro

São **111 itens** em seis seções. Uma lista corrida com 111 linhas não se lê,
então o cardápio é um objeto: fechado é uma capa, aberto é um livro.

**A capa é a primeira folha do livro.** Ela não sai de cena por fora: vira na
**mesma lombada** que as páginas, no mesmo gesto, e pousa como página da
esquerda — é o cardápio na mão. Abrir e fechar não são um efeito à parte, são
a folha 0 girando; voltar da primeira abertura **fecha o cardápio**.

Sendo um `<button>`, o teclado e o leitor de tela chegam junto, com
`aria-expanded`. Tocar nela chama `virar(1)`, e o arrasto a conduz como
conduz qualquer página.

Com o livro **fechado** só a capa existe na tela. Três coisas fazem isso, e
as três correm junto do giro:

- **as abas, a navegação e o pé saem do fluxo** (CSS, sob `.js`), então a
  altura do livro cai para a altura da capa; ao abrir, ela cresce até a
  altura cheia no mesmo tempo do giro;
- **o papel apaga** (`.livro__papel`). Ele mora no `.livro`, e não no miolo,
  por dois motivos: o miolo recorta o que sai dele (`overflow:hidden`) e
  cortaria a sombra projetada, e separado ele pode acender e apagar em GSAP;
- **a área do livro desliza** um quarto da largura (`xPercent: -25`), que é
  meia página: é isso que deixa a capa no meio da tela com o livro fechado e
  a traz para o lugar da página da direita ao abrir.

Nada disso tem tween próprio: tudo é função do ângulo da folha 0, para abrir
no dedo ficar igual a abrir no toque.

### A capa tem corpo, e o ouro mora na ponta

O dono recusou duas vezes a capa chapada. O que ficou de pé:

- **A espessura vem do corte das páginas**, não da sombra: a pilha de lâminas
  creme nos `box-shadow` da `.livro__capa`, deslocadas para a direita e para
  baixo. O deslocamento lateral **para em 8px** — acima disso a pilha abre
  rolagem horizontal nas telas estreitas.
- **O ouro é de borda, não de moldura desenhada.** São o fio que contorna a
  capa inteira (`.livro__fio`, por `inset box-shadow` e não por `border`:
  `border` empurraria 3px a caixa das cantoneiras e elas desencontrariam o
  canto), as quatro cantoneiras de metal fechando os cantos e os dois anéis da
  lombada. A moldura interna continua, mas é acabamento.
- **A cor do couro não muda.** Foi aprovada; só a espessura e o ouro estavam
  errados.
- **A face da capa não recorta** (`overflow:visible`). O corte das páginas e
  a sombra caem fora da caixa dela e sumiriam.

### Quantos itens por página é a proporção da capa

A capa é uma folha do livro, então ela é **tão alta quanto a página mais
alta** — e quem decide a altura da página é quantos itens cabem nela. Com 12
por página a capa saía **1:2,45**: uma tira de couro, não um cardápio.

Hoje são **9 por página espalhado e 8 no estreito**, e o livro vai até
1080px, o que põe a capa perto de **1:1,5** no desktop. Mexeu num desses
números, confira a proporção antes de dar por bom.

### O livro abre em duas páginas

Acima de 720px o cardápio é um **livro aberto**, e a dobradiça é a **lombada
do meio**: quem gira é a metade direita, que atravessa e pousa como metade
esquerda. Abaixo de 720px cabe uma página só, e aí a folha ocupa a largura
toda e gira pela borda esquerda, varrendo para fora.

Foi isso que resolveu o "é muito grande": no feitio antigo a folha varria a
**largura inteira** a cada virada. Espalhado, só metade se move.

A montagem é em duas etapas, e nesta ordem:

1. **as páginas** (`.ticket__pag`) — 9 itens cada quando espalhado, 8 em
   coluna única no estreito. **Nenhuma mistura seções**: cada uma pertence a
   uma e leva o nome dela no alto, senão a pessoa perde o fio.
2. **as folhas** (`.ticket__folha`) — espalhado, cada folha tem **duas
   faces**: a frente é sempre a página da direita, o verso sempre a da
   esquerda. É por isso que o respiro da lombada pode ser fixo em cada uma.

**A face 0 é a capa**, e o estado 0 é o livro fechado. Daí para a frente,
espalhado a página `p` está na abertura `ceil((p+1)/2)`; solta, ela é a folha
`p+1`, porque a folha 0 é a capa.

Numa pilha assim **não há folha escondida**: as já viradas ficam à esquerda,
com a última por cima; as que faltam ficam à direita, com a da vez por cima.
Quem decide o que se vê é o `z-index` mais o `backface-visibility`. A classe
`e-a-folha` continua existindo, mas **só no estreito**, onde a folha é uma
página só e as outras precisam sumir de verdade.

Num salto de aba **só uma folha atravessa**: as outras mudam de estado na
hora. Um livro não folheia catorze páginas de uma vez.

O `.ticket__caderno--espalhado` vem do mesmo `matchMedia` que monta o livro,
nunca de uma media query solta — uma media query poderia discordar do JS.

As duas colunas do CSS valem agora só para a **lista solta** (`.secao-card
.ticket__lista`), a dos 111 itens sem JS. Com o livro montado, as duas
colunas da tela são as duas páginas abertas.

**As abas** (Salgadas · Doces · Bordas · Esfihas · Pacotes · Bebidas) pulam
direto. **A passagem sequencial continua inteira**: dá para percorrer tudo de
ponta a ponta sem tocar numa aba, e ela segue funcionando depois de usar uma.

### Onde se toca para virar

**Encostar num sabor não vira a página.** Ler um preço não pode tirar a folha
debaixo do dedo. A virada mora só nas duas faixas de margem:

- **faixa da direita**, depois dos preços → próxima
- **faixa da esquerda**, antes dos nomes → anterior

O que garante isso é o **recuo lateral da folha** (`inset: 0 var(--faixa)`):
as faixas ficam fora do alcance de qualquer `.ticket__item`. Se esse recuo
sumir, as faixas passam por baixo dos itens e o toque volta a virar página.

### A folha segue o dedo

**O arrasto não é lido só no soltar.** Essa foi a reclamação que voltou duas
vezes — "não vi diferença" — e as duas vezes eu mexi na animação, que era a
coisa errada. Com o gesto lido só no `pointerup`, a folha fica **parada**
enquanto o dedo anda e só depois roda um tween: nenhuma curva faz uma
animação que começa depois do gesto parecer conduzida por ele.

Agora é `pointerdown` → `pointermove` → `pointerup`:

- no `pointermove`, assim que o gesto se mostra horizontal (|dx| > 12px e
  |dx| > |dy|), a folha passa a ser desenhada quadro a quadro em
  `rotationY = dx / largura × -180`, com a sombra acompanhando. A `largura`
  é a da **folha**, não a do caderno: espalhado ela é a metade, e é essa
  metade que o dedo tem de atravessar;
- no `pointerup`, passou de 35% do caminho **ou** veio rápido (acima de
  0,5px/ms) completa; senão volta. Os dois assentam **de onde o dedo
  largou**, não do zero.

Posição vinda do dedo **não é tween** — como no scroll, ali não há curva nem
duração. A curva só aparece no assentamento, e ele não desce de 0.6s (regra
do projeto); com `power3.out` quase todo o movimento sai no primeiro terço,
então um resto curto ainda larga rápido.

`setPointerCapture` no começo da condução, senão o arrasto se perde se o dedo
sair da folha. E `touch-action: pan-y` no caderno é o que permite tudo isso
sem brigar com a rolagem.

Um toque parado continua com `dx` pequeno e não vira nada — é por isso que
encostar num sabor para ler não tira a folha do lugar.

### A virada é de folha, não de cartão

Três coisas fazem a diferença, e as três são fáceis de desfazer sem perceber:

1. **Nada de opacidade.** Papel não desbota ao virar. A folha gira até
   `-180` e, com `backface-visibility:hidden`, some sozinha ao passar da
   vertical — que é exatamente o que uma folha faz.
2. **A perspectiva mora no contêiner**, no CSS do `.ticket__caderno`, nunca
   em `transformPerspective` por tween. Por tween, cada folha ganha o seu
   próprio ponto de fuga e a virada lê como carta girando no vazio. Com o
   livro espalhado o ponto de fuga vai para o **meio**, que é onde fica a
   lombada; à esquerda ele torceria as duas metades para o mesmo lado.
3. **A sombra corre junto do giro** (`--sombra-folha`, com pico na
   vertical). Sem ela, uma folha girando lê como imagem plana inclinando.
   Ela fica na **face**, nunca na folha: coplanares dentro de um pai
   `preserve-3d` brigam por profundidade e piscam.

`power3.inOut`, não `expo.inOut`: a expo tem um talo quase reto no meio e a
folha parece saltar. A power3 sai, acelera e assenta — o jeito de quem passa
o dedo. A virada por faixa, seta ou aba leva **0.8s**; a do arrasto não tem
duração nenhuma, porque quem manda é o dedo.

### A divisa é o vinco, não um enfeite no meio

No meio das duas colunas já houve um fio tracejado com sombra, e depois uma
fita de marca-página. Os dois caíram pelo mesmo motivo: eram **coisas postas
no meio da tela**, sem explicação física. A fita ainda por cima tinha cara de
gerada.

O que ficou é a **divisa de verdade** — a página curvando para dentro da
lombada mais o fio onde o papel dobra:

- ela mora **na face** (`.ticket__face::before`) e por isso **gira junto com
  a folha**. A página que levanta leva o seu vinco, como papel de verdade;
- atrás das folhas há a **calha da lombada** (`.ticket__livro::before`), que
  só aparece quando uma página levanta e descobre o fundo do livro. Ela leva
  `translateZ(-1px)`: coplanar com as folhas num pai `preserve-3d` ela
  brigaria por profundidade e piscaria.

Medido atravessando a lombada: 244 de luminância na página, caindo suave até
208 e um fio em 123 no vinco, simétrico dos dois lados. É esse perfil que faz
ler como dobra em vez de borda.

**Só acima de 720px**, onde o livro abre em duas páginas. Na página única não
existe lombada no meio, e nada vai ali.

### Três coisas que não dá para mexer sem quebrar

1. **No estreito, visibilidade da folha é só da classe `e-a-folha`.** Posta
   inline, ela sobrevive ao `clearProps` e a folha nunca mais some: em três
   viradas o caderno vira uma pilha de páginas sobrepostas. (Espalhado não
   há folha escondida — quem resolve é a pilha.)
2. **A altura do caderno é medida com as folhas soltas** (classe `medindo`),
   e quem mede é a **face**, não a folha. Enquanto são `position:absolute`
   com `inset` dentro de um pai sem altura, todas medem zero e o cardápio
   fecha. Espalhado a medição tem de ser na **largura de verdade** (metade),
   senão a página mede mais larga, sai mais baixa, e o conteúdo é cortado.
3. **`touch-action: pan-y` no caderno.** Entrega a rolagem vertical ao
   navegador (e ao Lenis) e guarda o arrasto horizontal para a virada.

### O `matchMedia` precisa de duas condições

`gsap.matchMedia()` recebe `{ estreito, largo }`, não uma condição sempre
verdadeira. É a **troca entre elas** que remonta o livro quando a janela cruza
os 720px; com uma condição só, o número de itens por folha fica congelado na
largura da chegada.

Capa e paginação são montadas em JS **de propósito**. Sem JS, sem GSAP ou sob
`prefers-reduced-motion` não há capa nem folhas: a lista inteira dos 111 itens
aparece de uma vez. São conforto, nunca suporte.


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

## A logo despencando — e pousando no rodapé

Quem despenca é a **própria `.marca__logo`**, a mesma que nasceu da lua. Não
existe cópia. São **duas quedas e um pouso**: no fim da página ela para ao
lado do wordmark do rodapé, num tamanho tirado da altura dele (78%). Ali é o
fim do site, então ela para ali. Subir a página devolve tudo à vaga.

Ela pousa **em pé**: as duas quedas somam 1520 graus e o pouso soma 640, o que
dá 2160 — seis voltas exatas. Mexeu nos graus de uma queda, acerte o pouso.

**Queda, bamboleio e pouso moram numa linha do tempo só.** Em duas, o
bamboleio e o pouso disputariam o `x` do mesmo elemento e a logo nunca
chegaria no alvo.

**Onde ela para é ao lado do texto**, encostada no "MIA". O retângulo do
`<p class="wordmark">` é a largura do **contêiner**, não a do texto — por ele
a logo pousava lá na margem, longe do nome. Um `Range` sobre o conteúdo
devolve a caixa do texto de verdade.

O alvo do pouso é calculado para o **scroll máximo**, não para onde o rodapé
está no instante do tween. E o centro natural da logo sai do retângulo menos
o `x`/`y` que o GSAP escreveu — rotação e escala giram em torno do centro e
não o deslocam, então só a translação conta.

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

### Medir a logo é `offsetWidth`, não o retângulo

O retângulo (`getBoundingClientRect`) inclui a **rotação da queda**: uma logo
de 36px girada mede até 49px de caixa. A vaga do cabeçalho media por ali e,
a cada refresh do ScrollTrigger com a logo girada, o texto deslizava mais do
que devia e ficava desalinhado para sempre. `offsetWidth` é a largura de
layout, imune ao transform.

### O bamboleio não pode usar `keyframes`

Dentro de `keyframes` o GSAP interpola com `easeEach`, que cai no
**power1.inOut** por padrão — justamente a curva que a exceção 1 proíbe em
tween preso ao scroll. O `ease: 'none'` do tween **não alcança** os trechos
entre quadros-chave. Por isso o bamboleio é uma sequência de `.to()` de
verdade, cada um com seu `ease: 'none'`.

A amplitude é **função**, com `invalidateOnRefresh`. Congelada na largura do
carregamento, girar o aparelho de paisagem para retrato jogava a logo para
fora da tela — medido: 6 de 60 amostras fora.

### Resize no meio da abertura: vai direto para o fim

O voo mira a vaga do cabeçalho lida **no instante do tween**. Redimensionar a
janela depois disso move a vaga, mas o voo segue para a posição antiga, e no
cross-fade as duas logos aparecem em **lugares diferentes** — medido, 41px de
distância aos 4,8s. Isso quebra a regra de uma logo só.

A abertura é enfeite: diante de um `resize` ela pula para o fim, onde as duas
coincidem.

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

### Medir alcance é `elementFromPoint`, não `getBoundingClientRect`

Um elemento recortado por `overflow:hidden` de um ancestral **continua com
retângulo não-zero**. Testar `getBoundingClientRect().width > 1` dá "visível"
para conteúdo que ninguém alcança — foi assim que o menu quebrado passou por
um teste meu.

O teste que vale: `document.elementFromPoint` no centro do elemento devolve
ele mesmo (ou um filho dele)? Se devolver outra coisa, está inalcançável.

### O menu fechado mora sob `.js`

O estado fechado do menu do celular (`max-height:0`) é `.js .nav`, e só. Sem
JavaScript não há quem abra: a nav tem de **chegar aberta**, empilhada no
próprio cabeçalho (`position:static`), em vez de ficar como dropdown
recortado. Medido antes: nenhum dos seis links recebia o ponteiro.

O fechado também leva `visibility:hidden`, com atraso de 0.7s na transição
para a animação de fechar terminar antes. Recortados só por `max-height`, os
links continuavam **focáveis**: o Tab entrava nos seis e o foco sumia da tela,
sem anel visível em lugar nenhum (WCAG 2.4.7).

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

- **O cardápio está completo**: as duas faces do impresso foram fotografadas
  e transcritas — 66 pizzas salgadas, 9 doces, 2 bordas, 17 esfihas por
  unidade, 8 pacotes e 9 bebidas. Os preços das pizzas terminam em `,99`; os
  das esfihas e bebidas, não. Não invente item nenhum: o que não estava na
  foto não entra.
- **O horário do impresso é diferente do que vai no site.** O cardápio diz
  "Dom a Qui 18h–23h, Sex e Sáb 18h–24h". O site diz "todos os dias, 18h à
  meia-noite", e **é o que vale** — decisão do dono em 18/10/2026. Não troque
  com base no impresso.
- **Não entra** a linha "preços sujeitos a alteração sem aviso prévio", embora
  esteja impressa no cardápio. Decisão do dono: os preços não mudam sem aviso.
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

## Relógio: a hora é a da pizzaria, não a do visitante

**Tudo que depende de relógio lê `America/Sao_Paulo`.** Nunca `new Date()`
sozinho — isso dá a hora do aparelho de quem acessa. O ajudante
`agoraNaPizzaria()` (§3 do `main.js`) usa `Intl.DateTimeFormat`, é nativo e
devolve `{dia, minutos}` ou `null` quando o navegador não tem `Intl` ou recusa
o fuso.

Dois lugares usam: o **carimbo "HOJE"** da semana e o **selo de
aberto/fechado**. O carimbo errava em silêncio antes disso — quem abrisse o
site de outro fuso via o destaque no dia errado.

Os dois tratam o `null` de forma diferente, de propósito: o carimbo cai no
relógio do aparelho (errar o destaque de um dia é barato, e é melhor que a
semana ficar sem marca nenhuma); o selo **não aparece**, porque dizer "aberto"
com a casa fechada é pior que não dizer nada.

### O selo de aberto ou fechado

Fica no bloco do Horário da seção `#local`. Diz "Aberto agora · até
meia-noite" ou "Fechado · abre hoje às 18h".

- **A regra do horário mora em três lugares e os três têm de concordar:** o
  texto da seção, o `openingHoursSpecification` do JSON-LD e o selo. Mexeu em
  um, confira os outros dois.
- **`closes` é `23:59`, não `00:00`.** Pela documentação do Google para *local
  business*, `opens` e `closes` ambos em `00:00` significam **fechado o dia
  inteiro**. Meia-noite como fim de expediente se escreve `23:59`. Não
  "corrija" isso de volta.
- **O selo nasce `hidden` no HTML e quem o acende é o JS.** Sem JavaScript ele
  não aparece e o horário fixo continua dizendo tudo — o selo é conforto, o
  horário é conteúdo.
- **Ele não fica sob a classe `.js`.** Essa classe é removida quando GSAP ou
  Lenis falham, e o selo não é animação: tem de aparecer mesmo assim. Por isso
  vive na §3, antes do portão do `anima`.
- **Nenhuma animação, e isso é a regra e a degradação apontando para o mesmo
  lugar.** O projeto manda todo movimento para o GSAP, e o selo precisa
  funcionar sem GSAP. Então ele não se move: sem `transition`, sem
  `@keyframes`, sem pulsar. O ponto muda de cor, e só.
- **Reconfere a cada 60s**, reescrevendo só quando o texto muda de fato, senão
  o `aria-live` repete a mesma frase para o leitor de tela.

## Dados estruturados e publicação

O `index.html` tem um bloco JSON-LD (`Restaurant` + `Menu`) no `<head>`. Ele é
**gerado a partir do próprio HTML** da página, lendo os `<li class="ticket__item">` das seis seções,
para nunca divergir do que está na tela. Mexeu nos sabores, regere — a receita
está no README.

O domínio é **`pizzamia.com.br`**, no apex, sem `www`. Ele aparece em quatro
lugares que têm de concordar: o JSON-LD, o `canonical` e o `og:url` do
`index.html`, o `sitemap.xml` e o `robots.txt`. Mudou o domínio, mude nos
quatro — URL que não resolve vale o mesmo que URL nenhuma. As páginas legais
têm `canonical` próprio, apontando para elas mesmas.

### O site tem de responder na RAIZ do domínio

`robots.txt` só é lido na raiz do host (RFC 9309). Servido num subcaminho — o
que acontece no GitHub Pages **sem** domínio próprio,
`usuario.github.io/007-s-repository/` — **o arquivo nunca é buscado**, e as 13
linhas que liberam GPTBot, ClaudeBot, PerplexityBot e Google-Extended deixam de
existir para quem interessa. Nada avisa: nenhum erro, nenhuma página quebrada.
O `_headers` também é ignorado.

O `README` traz as opções em ordem. Não feche esses agentes sem o dono pedir, e
não publique em subcaminho achando que tanto faz.

## Só o site mora aqui

Este repositório é publicado a partir da raiz, então **tudo o que for commitado
vai para o domínio da pizzaria**. Por decisão do dono, só o site da Pizza Mia
fica aqui. Jogos, dashboards, telas de app e qualquer outro projeto vão para
repositório e domínio próprios — nunca para esta árvore.
