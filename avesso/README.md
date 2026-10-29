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

## Os sistemas

### Três atos

A corrida tem **três atos de 300 m**, e cada um diz o próprio nome e a
própria dificuldade em voz alta quando começa.

| Ato | Metros | Dificuldade | Cara |
|---|---|---|---|
| **Subsolo** | 0–300 | Fácil | terra com grão e madeira com veio, parados |
| **Forja** | 300–600 | Médio | fogo: roda girando, faísca saindo |
| **Desabamento** | 600–900 | Difícil | pedra: lasca na borda, cascalho caindo |

Passados os 900 m fica no Desabamento, só mais rápido. A cada ato a
velocidade dá um degrau e **a faixa do chão e do teto engrossa**, apertando o
campo de verdade em vez de só acelerar.

**Já foram seis setores em 900 m**, e não funcionou: dava 2,6 s de mundo por
setor — a cara mudava antes de a pessoa reparar que tinha mudado. Com três,
cada ato dura de 3 a 5 segundos e dá para ver o que ele é.

**A régua.** Um ato mede 2.100px de mundo, e com 1 m = 7px ele vale 300 m.
Mexer em `A.setorM` e `A.passoM` muda só a escala do placar, nunca a
dificuldade: quem decide o quanto aperta é a tabela `ATOS` mais a rampa de
velocidade. A corrida mediana medida dá 307 m — ou seja, a Forja começa
exatamente onde o jogador mediano morre.

**O ato sai do PLACAR, não da distância crua.** O placar soma o bônus da
roçada e dos desafios; com o ato preso apenas à distância, o número na tela e
a troca de mundo andavam em unidades diferentes e a divisão "0 a 300 é fácil"
nunca fechava com o que se via.

**O tema de um obstáculo é o do ato de agora**, não o do ato em que ele
nasceu. A geração enche até ~2.000px à frente, que na régua nova são ~285 m:
quase um ato inteiro. Com o tema gravado no nascimento, o mundo só mudava de
cara 285 m depois de o aviso anunciar a troca.

**O tema só muda o desenho.** Faísca, cascalho e espinho de pêndulo **não têm
colisão nenhuma** — quem mata é a caixa, e só ela. Um enfeite que mata é um
enfeite que mente. A roda de fogo gira **inscrita dentro** do retângulo pelo
mesmo motivo.

A textura é pintada **na cor do fundo**, nunca numa cor própria: assim ela
inverte junto com o mundo sem ninguém escrever a regra duas vezes. E cada
peça carrega uma semente fixa — sem ela a textura sorteia de novo a cada
quadro e o obstáculo ferve.

### Pêndulos

No Forja e no Desabamento aparecem **pêndulos**: uma bola de espinhos presa
por corrente a um pino no teto ou no chão, varrendo um arco.

- **A bola é círculo contra círculo**, não a caixa que a cerca. Com caixa, os
  cantos matariam sem encostar, e o desenho estaria mentindo.
- **Os espinhos ficam todos dentro do raio que mata.** O que passasse da
  conta seria desenho prometendo o que a física não cumpre.
- **O arco fica desenhado na tela.** É o que torna o pêndulo justo: avisa
  para onde a bola vai antes de ela ir. Sem ele, seria sorte.
- **A largura do grupo cobre o arco inteiro.** Sem isso a bola sai da faixa
  que o jogo olha e mata por trás.
- A corrente é feita de **elos**, não de um risco: é o que faz ler como peso
  pendurado em vez de linha esticada.

### Desafios da partida

Antes de cada corrida saem **três desafios sorteados** — um fácil, um médio e
um difícil, sempre nessa ordem — e uma contagem de 3 a 1. Cumprido, cada um
paga **metros de bônus**, iguais aos da roçada: entram no placar, no recorde
e nos metros somados.

São oito tipos (distância, roçadas, multiplicador, voo sem tocar nas bordas,
ato alcançado, tempo vivo, obstáculos passados, passagens limpas seguidas),
cada um com três níveis e três prêmios, de **+40 m a +210 m**. Os prêmios são
calibrados contra uma corrida mediana de ~307 m: cumprir o fácil soma pouco,
cumprir o difícil muda a corrida, e cumprir os três é raro e paga bem.

**A contagem é pulável, e isso é de propósito.** Uma corrida dura uns dez
segundos; 2,2 s de pré-jogo obrigatório a cada tentativa viraria castigo lá
pela vigésima. Quem chega vê; quem está tentando de novo aperta e larga — e
o mesmo aperto já segura a gravidade.

### Roçada

Passar **raspando** num obstáculo — folga abaixo de `A.rocada`, 24px — rende
um anel na tela, um tom agudo e **metros de bônus**. Roçadas seguidas sobem o
multiplicador até ×8, e cada roçada vale o multiplicador da hora em metros.
Uma passagem folgada zera.

O grupo só é julgado **quando passa inteiro por trás do disco**, pela menor
folga do trajeto todo — não pelo quadro em que o disco está mais perto. Um
vão conta uma roçada só, não duas.

### Roupas

São **30**, e cada uma é uma linha de dados em `personagens.js`, não um
desenho: forma × casca × cor × rastro × giro. Aparência não mexe em nada do
jogo — a colisão é sempre o mesmo círculo de raio `A.raio`, qualquer que seja
a forma. Roupa que muda dificuldade faz a pessoa escolher a feia.

- **21 por metros somados** de todas as corridas, de **800 m a 340.000 m**. A
  soma nunca anda para trás: uma corrida ruim ainda aproxima da próxima. As
  três primeiras saem cedo (800, 1.800, 3.200 — duas a três corridas cada) e
  a curva abre depois.
- **Uma vez ganha, nunca se perde.** O conjunto fica gravado em
  `avesso.ganhas`. A curva já subiu uma vez e pode subir de novo; sem esse
  registro, apertar a exigência **tira do armário** uma roupa que a pessoa já
  tinha — a pior coisa que uma coleção pode fazer. A subida anterior trouxe
  junto uma migração de uma vez só, que lê os cortes antigos de
  `AVESSO_CORTES_ANTIGOS` e credita o que era devido.
- **8 por proeza** — chegar a 100 m, passar 10 obstáculos sem tocar nas
  bordas, levar a roçada a ×8, alcançar o setor 4, e assim por diante.
- **1 de saída**, a Avesso.

**A cor não é livre.** A tela inverte, então a cor precisa contrastar com o
preto **e** com o osso: em brilho percebido, ficar entre 68 e 180. Há um teste
que confere as 30.

No vestiário as travadas aparecem **com nome e silhueta**, e com a condição
escrita. Ver o que falta é o que dá vontade; esconder mata o sistema.

### A marca do recorde

Um fio vertical no campo, **pintado com a cor do setor onde ele cai** — do
aço frio do Raso ao vermelho do Avesso. Ele **anda para trás a cada roçada**,
porque o bônus já comeu parte da diferença: a marca é o ponto onde o recorde
cai se dali em diante não vier mais bônus nenhum.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | A página. Carrega o GSAP de `../assets/vendor/`, nada de CDN |
| `estilo.css` | Só a interface por cima do canvas |
| `personagens.js` | As 30 roupas, em dados. É aqui que se acrescenta uma |
| `jogo.js` | Motor: medida, setores, mundo, física, roçada, desenho, telas |

## As decisões que não são óbvias

**Tudo que é gerado guarda fração da altura útil, nunca pixel.** A faixa
engrossa a cada setor e a janela pode mudar de tamanho; com pixel gravado, um
vão que já existia fecharia sozinho e mataria quem estivesse dentro dele.

**A faixa engrossa devagar** (meio segundo), senão ela empurra de uma vez
quem está encostado na borda.

**O primeiro obstáculo da corrida nunca sai do chão.** Quem começa nasce
parado, encostado no chão: um bloco de chão logo de cara pede uma subida do
zero com pouco aviso, e um de teto não pede nada. Medido antes da correção:
**7 de 11 corridas morriam no mesmo lugar**, sempre aos 16 m, que é
exatamente onde cai o primeiro obstáculo. Depois: mínimo de 29 m e mediana
de 43 m.

**O HUD mora DENTRO da faixa do teto, e o corpo do número sai da altura
dela** (`calc(var(--faixa) * .58)`). Foram três tentativas:

1. cruzando a borda, a linha do chão cortava o número ao meio;
2. abaixo da faixa, os obstáculos passavam por trás dele;
3. dentro da faixa, nada atravessa o placar — porque ali só existe a faixa.

A faixa engrossa a cada ato e muda com o tamanho da janela, então nem o recuo
nem o corpo podem ser fixos: o jogo escreve `--faixa` e o CSS lê. Medido:
47px de base numa faixa de 63 (paisagem), 62 em 84 (tela grande), 49 em 66
(retrato) e 25 em 33 (janela de 700×420).

**`--faixa` nunca é lido do layout dentro do laço.** `clientHeight` a cada
quadro força o navegador a recalcular layout a cada quadro — exatamente o
tremor que a regra do `transform` existe para evitar. O valor vem do
`medir()`, e só é reescrito quando muda de pixel.

**A câmera lenta sobe depressa e desce devagar.** Com a mesma constante nos
dois sentidos ela pisca ao raspar de leve. Sobe em 35ms, volta em 220ms.

**O mundo lógico preenche o canvas por inteiro, e quem cede é a altura.** A
referência é 720 de altura, mas em tela estreita a largura lógica é fixada em
980 e a altura cresce. Sem isso, num celular em pé o campo visível à frente
ficaria em ~250px e não daria tempo de reagir.

**A inversão da tela é desenhada, não é CSS.** As duas cores do mundo são
interpoladas a cada quadro, com constante de tempo de 55ms. Em CSS seria um
`transition` curto, que é justamente o que o `CLAUDE.md` do repositório
proíbe — com razão, porque lá se trata de interface. Aqui é devolutiva de
jogo: precisa ser imediata.

**O som nasce no primeiro aperto, nunca no carregamento.** O contexto de
áudio só pode ser criado dentro de um gesto. Os tons são gerados por código:
nenhum arquivo, nenhum CDN.

**O HUD usa `mix-blend-mode: difference`**, que o deixa legível dos dois
lados da inversão sem ninguém trocar a cor dele. O efeito colateral: baixar a
opacidade aproxima o texto do fundo **nos dois lados**, então a hierarquia
ali vem do tamanho, não da opacidade.

**As telas que saem param de receber clique na hora.** Uma tela leva 0.6s
saindo e continua no documento, com os botões inteiros. Medido antes:
um clique repetido em **De novo** reiniciava a corrida a cada quadro.

## Dificuldade, medida

Um piloto automático lendo os pixels do canvas — acha o maior corredor livre
a 34% da largura à frente e persegue o centro dele:

| | |
|---|---|
| corridas | 8 em 55 s |
| distâncias | 210, 213, 257, 306, 307, 347, 458, 502 m |
| mediana | 307 m |
| atos alcançados | Subsolo e Forja |

É **piso, não teto**: o piloto enxerga uma coluna, quem joga enxerga a tela
inteira. Serve para dizer que a geração não produz parede impossível — não
para dizer que o ajuste está bom. Isso só o dedo diz.

## Degradação

| Situação | O que acontece |
|---|---|
| Sem JavaScript | A tela de início aparece parada, com um aviso no lugar do botão |
| GSAP não carrega | O jogo roda igual pelo `requestAnimationFrame`, vestiário e desafios incluídos; as telas trocam sem animação |
| `prefers-reduced-motion` | Sem inversão de tela, sem tremor, sem faísca, sem cascalho; a roda de fogo fica parada |
| Sem canvas 2D | A tela de início fica de pé e o botão continua alcançável |

As quatro foram medidas no navegador, não deduzidas.

## O que ainda não existe

Placar compartilhado, modos de jogo e obstáculos que reagem a quem joga. Os
números de ajuste estão todos no objeto `A`, no topo do `jogo.js`; a cara de
cada setor está em `SETORES`, logo abaixo; as roupas, em `personagens.js`.

## Cache

O `_headers` da raiz não cobre esta pasta. Se o cache importar aqui,
acrescente uma regra para `/avesso/*` — e lembre que o GitHub Pages ignora
esse arquivo.
