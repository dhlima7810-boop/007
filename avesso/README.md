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

### Setores

A cada **50 m** o mundo muda de cara: entra um tipo novo de obstáculo, a
velocidade dá um degrau e **a faixa do chão e do teto engrossa**, apertando o
campo de verdade em vez de só acelerar. São seis, e depois do sexto fica nele.

| | Setor | O que entra | Cara |
|---|---|---|---|
| 1 | Raso | só blocos | terra, com grão |
| 2 | Vão | frestas entre duas peças | madeira, com veio e nó |
| 3 | Laje | lajes flutuantes | fogo: roda girando, faísca |
| 4 | Pêndulo | as lajes passam a balançar | fogo |
| 5 | Agulha | vãos apertados, menos respiro | pedra: lasca na borda, cascalho caindo |
| 6 | Avesso | tudo, no mais rápido | pedra |

**O tema só muda o desenho.** Faísca, cascalho e roda de fogo **não têm
colisão nenhuma** — quem mata continua sendo o retângulo, e só ele. Um
enfeite que mata é um enfeite que mente. A roda de fogo gira **inscrita
dentro** do retângulo pelo mesmo motivo: o que gira nunca passa da caixa que
mata.

A textura é pintada **na cor do fundo**, nunca numa cor própria: assim ela
inverte junto com o mundo sem ninguém escrever a regra duas vezes. E cada
peça carrega uma semente fixa — sem ela a textura sorteia de novo a cada
quadro e o obstáculo ferve.

O tema de um obstáculo vem do setor **em que ele está**, não daquele em que
você está. Na virada, o mundo muda na frente dos seus olhos em vez de piscar
inteiro de uma vez.

**Por que 50 m e não 500 m**, que foi o pedido: a mediana medida é 42 m e a
melhor corrida automatizada deu 95 m. Com 500 m ninguém veria uma única troca
de setor — o recurso existiria e nunca apareceria. O valor mora em
`A.setorM`, num lugar só: suba junto com a dificuldade, nunca sozinho.

### Desafios da partida

Antes de cada corrida saem **três desafios sorteados** — um fácil, um médio e
um difícil, sempre nessa ordem — e uma contagem de 3 a 1. Cumprido, cada um
paga **metros de bônus**, iguais aos da roçada: entram no placar, no recorde
e nos metros somados.

São oito tipos (distância, roçadas, multiplicador, voo sem tocar nas bordas,
setor alcançado, tempo vivo, obstáculos passados, passagens limpas seguidas),
cada um com três níveis e três prêmios, de +16 m a +58 m.

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

- **21 por metros somados** de todas as corridas, de **150 m a 83.000 m**. A
  soma nunca anda para trás: uma corrida ruim de 11 m ainda aproxima da
  próxima. As três primeiras saem cedo (150, 300, 550) e a curva abre depois.
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

**O HUD cabe numa linha só.** O setor e o recorde já moraram em duas, e a
segunda caía em cima da borda da faixa. A faixa mede 7,5% da altura no setor
1 — 61px numa janela de 810, e menos ainda numa janela baixa — e duas linhas
de 12px com respiro não cabem lá. Numa linha, a borda nunca atravessa texto:
medido, a linha termina em 46px com a faixa indo até 61px.

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
| corridas | 5 em 50 s |
| distâncias | 42, 42, 43, 100, 110 m |
| mediana | 43 m |

As duas corridas de três dígitos são desafios cumpridos: o bônus entra no
placar.

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
