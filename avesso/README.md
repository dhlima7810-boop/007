# Avesso

Jogo de **um botão só**. Segure para inverter a gravidade, solte para cair.
Não há pulo: o que o botão faz é trocar o lado para onde o mundo puxa, e a
tela inverte junto — é daí que vem o nome.

Abre com um duplo clique no `index.html`, ou em `/avesso/` quando o site
estiver no ar.

## Isto não é parte do site da Pizza Mia

Mora no mesmo repositório e só. Leva `noindex, nofollow`, está fora do
`sitemap.xml`, não é linkado pelo site e não aparece no JSON-LD. A paleta e a
tipografia são próprias — **não é o sistema Fachada** e não deve ser
"corrigido" para ele.

## Como se joga

| | |
|---|---|
| Segurar | `Espaço`, `↑`, `W`, clique ou toque em qualquer lugar do campo |
| Pausar | `Esc` ou `P` (e também ao trocar de aba) |
| Recomeçar | o mesmo botão de segurar, assim que a tela de fim aparece |

O aperto que começa a corrida **é o mesmo que segura a gravidade**: dá para
morrer com o dedo afundado, apertar de novo e já subir, sem soltar no meio.

A pontuação é distância: 50px de mundo valem 1 metro. O recorde fica no
`localStorage` do navegador (`avesso.recorde`), junto da preferência de
inverter a tela (`avesso.inverter`).

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | A página. Carrega o GSAP de `../assets/vendor/`, nada de CDN |
| `estilo.css` | Só a interface por cima do canvas: menu, HUD, fim, pausa |
| `jogo.js` | Motor: medida da tela, mundo, física, colisão, desenho, entrada |

## As decisões que não são óbvias

**O mundo logico preenche o canvas por inteiro, e quem cede é a altura.**
A referência é 720 de altura, mas se a tela for estreita demais a largura
lógica é fixada em 980 e a altura cresce para fechar a proporção. Sem isso,
num celular em pé o campo visível à frente do disco ficaria em ~250px e não
daria tempo de reagir. Mexeu em `largMin` ou `largMax`, confira no retrato.

**A inversão da tela é desenhada, não é CSS.** As duas cores do mundo são
interpoladas a cada quadro por `C.inv`, que persegue 0 ou 1 com constante de
tempo de 55ms. Em CSS isso seria um `transition`, e um `transition` curto é
exatamente o que o `CLAUDE.md` do repositório proíbe — com razão, porque ali
se trata de interface. Aqui é devolutiva de jogo: precisa ser imediata, e o
canvas é o lugar certo para ela.

**Quem não quiser a inversão, desliga.** Há uma opção no menu, e sob
`prefers-reduced-motion` ela já nasce desligada, junto com o tremor de tela e
com dois terços dos cacos. O jogo continua inteiro: o ponto dentro do disco
muda de lado e diz para onde a gravidade puxa.

**O HUD usa `mix-blend-mode: difference`.** É o que o deixa legível dos dois
lados da inversão sem ninguém trocar a cor dele. O efeito colateral: baixar a
opacidade aproxima o texto do fundo **nos dois lados**, então a hierarquia ali
vem do tamanho, não da opacidade.

**A colisão é círculo contra retângulo**, pelo ponto do retângulo mais perto
do centro do disco. E o `dt` é cortado em 33ms, senão uma aba em segundo plano
volta e teleporta o disco para dentro de uma parede.

**O menu corre devagar com o campo vazio.** Começar a partida não corta a
cena: o `camX` continua de onde estava e os obstáculos passam a nascer à
frente. Por isso a pontuação conta a partir de `C.base`, não de zero.

**As telas que saem param de receber clique na hora.** Uma tela leva 0.6s
saindo, e nesses 0.6s ela ainda está no documento, com os botões inteiros.
Sem marcar `data-saindo` e cortar o `pointer-events` logo no começo da saída,
o botão continua clicável o tempo todo — medido, um clique repetido em
**De novo** reiniciava a corrida a cada quadro, e quem desse um duplo clique
perdia o começo da partida sem entender por quê.

## Dificuldade, medida

Um piloto automático lendo os pixels do canvas — acha o maior corredor livre a
20% da largura à frente e persegue o centro dele — fez, em 45 segundos:

| | |
|---|---|
| corridas | 6 |
| distâncias | 16, 29, 30, 42, 57, 84 m |
| mediana | 42 m |

Esse número é **piso, não teto**: o piloto enxerga uma coluna, quem joga
enxerga a tela inteira. Ele serve para dizer que a geração não produz paredes
impossíveis — não para dizer que o ajuste está bom. Isso só o dedo diz.

## Degradação

| Situação | O que acontece |
|---|---|
| Sem JavaScript | A tela de início aparece parada, com um aviso no lugar do botão |
| GSAP não carrega | O jogo roda igual: o laço cai no `requestAnimationFrame` e as telas trocam sem animação |
| `prefers-reduced-motion` | Sem inversão de tela, sem tremor, sem animação de interface |
| Sem canvas 2D | A tela de início fica de pé sozinha |

As quatro foram medidas no navegador, não deduzidas.

## O que ainda não existe

Som, modos de jogo, obstáculos móveis, progressão entre corridas e placar
compartilhado. Os números de ajuste estão todos no objeto `A`, no topo do
`jogo.js` — velocidade, gravidade, espessura das faixas, respiro entre
obstáculos e a rampa de dificuldade.

## Cache

O `_headers` da raiz não cobre esta pasta. Se o cache importar aqui, acrescente
uma regra para `/avesso/*` — e lembre que o GitHub Pages ignora esse arquivo.
