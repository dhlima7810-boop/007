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

A corrida tem três atos, e **quem diz qual é o ato é o mundo, não o texto**.

| Ato | Metros | | O que se vê |
|---|---|---|---|
| **Subsolo** | 0–1000 | Fácil | terra caindo do teto, aresta desmoronada, estacas de madeira velha largando terra |
| **Forja** | 1000–2500 | Médio | brasa subindo do chão, fio quente na borda, escória pingando, rodas girando |
| **Desabamento** | 2500+ | Difícil | cascalho despencando, rocha lascada na aresta, pêndulos |

Cada ato tem **paleta própria** — o Subsolo é terroso, a Forja é quente, o
Desabamento é frio — e a paleta **caminha** até a do ato em 0,8s, para a
troca ser uma virada de luz e não um pisca. O nome do ato aparece em letra
pequena quando ele começa: é lembrete, não manchete.

A cada ato a velocidade dá um degrau e **a faixa do chão e do teto engrossa**,
apertando o campo de verdade em vez de só acelerar.

**Os limites dos atos moram numa linha só**, a constante `LIMITES` no topo do
`jogo.js`:

| `LIMITES` | O que dá |
|---|---|
| `[1000, 2500]` | os números que o dono quis ver, **em vigor** |
| `[250, 625]` | a mesma proporção numa escala alcançável |

Com `[1000, 2500]`, medido com o piloto automático em 110 s: **12 corridas,
mediana 152 m, melhor 315 m, nenhuma chegou aos 1.000**. Só o Subsolo
aparece; Forja e Desabamento existem no código e não na tela.

A conta por trás disso: 1.000 m são 20.000px, uns 50 segundos vivo, e a
corrida mediana dura 5. Para os absolutos caberem, o contador teria de correr
5x mais rápido do que a velocidade aprovada — que é exatamente o que foi
corrigido na rodada anterior.

Está assim **por escolha de quem manda, para ver com os próprios olhos**.
Voltar é trocar aquela linha.

O Subsolo também ganhou mais respiro entre obstáculos (`esp` 1.08).

**A régua: 1 m = 20px.** A 400px/s o contador sobe uns 20 m por segundo e dá
para atravessar a tela antes de chegar aos 100. Com 7px ele subia três vezes
mais rápido e o número inflava antes de a pessoa sair do lugar. Mexer em
`A.passoM` muda só a escala do placar, nunca a dificuldade: quem decide o
quanto aperta é a tabela `ATOS` mais a rampa de velocidade.

**O ato sai do PLACAR, não da distância crua.** O placar soma o bônus da
roçada e dos desafios; com o ato preso apenas à distância, o número na tela e
a troca de mundo andavam em unidades diferentes e a divisão nunca fechava com
o que se via.

**O tema de um obstáculo é o do ato de agora**, não o do ato em que ele
nasceu. A geração enche bem à frente; com o tema gravado no nascimento, o
mundo mudava de cara muito depois do aviso.

**Nenhum enfeite tem colisão.** Faísca, cascalho, terra, escória, recorte de
borda e espinho de pêndulo são só desenho — quem mata é a caixa, e só ela. Um
enfeite que mata é um enfeite que mente. Por isso o recorte da borda só
**tira** da faixa ou pendura algo curto, e nunca sugere chão onde não há.

A textura é pintada **na cor do fundo**, nunca numa cor própria: assim ela
inverte junto com o mundo sem ninguém escrever a regra duas vezes. E cada
peça carrega uma semente fixa — sem ela a textura sorteia de novo a cada
quadro e o obstáculo ferve.

**A borda e as lascas são irregulares de propósito.** Em tamanho parelho e
sem pular nenhuma, o olho pega a repetição antes de pegar o tema: vira renda
no Subsolo e serrilha de selo no Desabamento.

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
cada um com três níveis e três prêmios, de **+28 m a +148 m**. Os prêmios e os
alvos **em metros** estão no dobro do que já estiveram, a pedido do dono;
contagens e segundos não dobraram, porque "roçar 3 vezes" é uma meta e não uma
distância. Com a mediana em ~113 m, um prêmio difícil agora mais que dobra a
corrida — e é para ser assim: desafio cumprido tem de ser sentido no número.

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
desenho: forma × casca × cor × rastro × **movimento**.

**O nome é o movimento.** Prumo pende, Mola salta, Relógio anda de segundo em
segundo, Espelho se inverte, Eco deixa um fantasma atrás, Bússola aponta para
onde a gravidade puxa, Hélice gira mais rápido quanto mais rápido se cai. São
30 movimentos, um por roupa. Se um dia o movimento mudar, o nome muda junto —
nome que não descreve o que se vê é só rótulo.

**Movimento não é física.** Nada em `MOVS` mexe na colisão: ela continua sendo
o mesmo círculo de raio `A.raio` no centro de onde o disco está de verdade.
`dx`, `dy`, `ex` e `ey` só deslocam e deformam o desenho. Uma roupa que
esticasse a caixa faria a pessoa escolher a mais estreita, e o jogo deixaria
de ser sobre conduzir para ser sobre escolher bem no armário.

**No vestiário os 30 cartões se mexem**, cada um do seu jeito, com um estado
de mentira que inverte a gravidade a cada 1,2s. Cartão parado não conta o que
a roupa é. Medido: 30 quadros distintos entre si, de 30.

- **21 por metros somados** de todas as corridas, de **300 m a 119.000 m**. A
  soma nunca anda para trás: uma corrida ruim ainda aproxima da próxima.
- **8 por proeza** — chegar a 200 m, passar 10 obstáculos sem tocar nas
  bordas, levar a roçada a ×8, alcançar o Desabamento, e assim por diante.
- **1 de saída**, a Avesso.

**Uma vez ganha, nunca se perde.** O conjunto fica em `avesso.ganhas`. A
régua e a curva já mudaram três vezes; sem esse registro, cada mudança
**tiraria do armário** uma roupa que a pessoa já tinha — a pior coisa que uma
coleção pode fazer. `avesso.regua` diz qual régua gerou os números no disco, e
cada mudança passa o que está guardado pela mesma conta. Medido nas três
gerações de save: quem tinha 6 de 30 continua com 6 de 30.

**Os `id` não mudam nunca**: é por eles que o armário lembra. Nome, forma, cor
e movimento podem mudar.

**A cor não é livre.** A tela inverte, então a cor precisa contrastar com o
preto **e** com o osso: em brilho percebido, ficar entre 68 e 180. Há um teste
que confere as 30.

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
| corrida mediana | ~113 m (Subsolo) |
| corrida boa | ~278 m (entrando na Forja) |
| corrida ótima | 625 m+ (Desabamento) |

A medição vale para o piloto automático, que lê uma coluna de pixels; quem
joga enxerga a tela inteira e vai mais longe.

**O piloto tem de engolir os blocos curtos.** Faísca, terra e cascalho ocupam
poucos pixels na coluna e não são parede: sem ignorar sequências de até 9px,
o piloto desvia de poeira e a mediana medida cai de 113 m para 77 m. Isso é
erro de medição, não dificuldade — foi o que quase me fez "corrigir" o jogo
por causa do próprio enfeite.

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
