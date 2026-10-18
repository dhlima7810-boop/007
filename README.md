# Site da Pizza Mia

Site institucional da **Pizza Mia** — pizzaria e rodízio em Vila Galvão,
Guarulhos / SP.

Site estático: HTML, CSS e JavaScript. Não tem build, não tem framework e não
depende de CDN — as bibliotecas ficam em `assets/vendor/`.

As regras do projeto estão no [`CLAUDE.md`](CLAUDE.md). A principal:
**toda animação usa Lenis no scroll e GSAP no movimento.**

## Como ver no computador

Abra `index.html` no navegador, ou suba um servidor local (o mapa e as fontes
carregam melhor assim):

```bash
python3 -m http.server 8000
```

## Estrutura

```
index.html              página única
CLAUDE.md               regras do projeto
assets/
  css/style.css         estilos
  js/main.js            Lenis + GSAP + ScrollTrigger
  img/                  fotos (cada foto aparece uma vez só no site)
  vendor/               gsap, ScrollTrigger, lenis
  favicon.png
```

## Bibliotecas

```bash
npm install          # baixa para node_modules/
```

Os arquivos usados pela página ficam versionados em `assets/vendor/`, copiados
de `node_modules/*/dist/`. `node_modules/` não vai para o repositório.

| Lib | Versão |
|---|---|
| GSAP + ScrollTrigger | 3.13.0 |
| Lenis | 1.3.11 |

## Estrutura da página

A composição veio do site de referência que o dono mandou:

| Peça | O que é |
|---|---|
| Wordmark gigante | o nome ocupa a tela toda, em caixa alta, sobre a fachada |
| As quatro ações | Rodízio · Para viagem · Disk pizza · Onde fica, com faixa de cor no hover |
| Letreiro | faixa amarela em movimento contínuo |
| Bandas alternadas | seções escuras alternando `tinta` e `tinta-2` |
| Wordmark no rodapé | fecha o livro |

As quatro ações são a espinha: é a primeira coisa depois do nome, e cada uma
leva direto ao que a pessoa veio fazer. Quando chegarem mais fotos, cada ação
pode receber uma, crescendo no hover no lugar da faixa de cor.

## Design — sistema "Fachada"

A base veio de benchmarks de sites de banco de imagem (Adobe Stock e afins),
pela skill `find-types`: superfície quase preta, tipografia contida, acento
único, raio pequeno e hairline no lugar de sombra.

Por cima disso entrou o sistema **Fachada**, tirado do próprio prédio amarelo
e vermelho da esquina. O que ele trouxe de novo:

| Peça | Onde |
|---|---|
| **Antonio** no lugar da Anton | toda a tipografia de display |
| **Carimbo do dia** | seção "A semana inteira" |
| **Cupom serrado** | seção "Cardápio" |
| **Botão chunky** amarelo | "Ver a semana" no topo |
| **Wordmark de fecho** | rodapé |

O cupom do cardápio ganhou borda serrada em cima e embaixo (dois
`conic-gradient` numa `mask`, um triângulo por dente), fio vermelho no topo,
vinco de livro entre as duas colunas e a assinatura da casa no pé. Encostar
num sabor inclina a linha e abre embaixo uma faixa serrada — o comprovante
rasgando. Tudo em CSS: é estado de hover, não entrada.

No celular o cupom vira coluna única e o dedo vira a folha: 33 sabores em
6 cadernos de 6, com setas e fólio para quem não descobre o gesto. É montado
em JS — sem JS ou com a janela larga, a lista inteira aparece de uma vez.
Uma cópia da logo cai pela tela enquanto a página desce, três vezes ao
longo da leitura; é decorativa e some sob `prefers-reduced-motion`.

Os subtítulos do cardápio e das três cenas só aparecem quando o ponteiro
chega no nome. O espaço deles fica reservado desde o início (anima `opacity`
e `transform`, nunca `max-height`), em tela de toque ficam sempre abertos, e
o teclado chega por `tabindex` + `:focus-visible`.

Duas coisas do sistema **não** foram adotadas como estavam:

1. Os *story cards* do sistema são blocos de cor chapada, porque o documento
   não tinha fotos. A seção "Uma noite aqui" tem fotos reais da casa e um pin
   scroll — trocar foto por gradiente pioraria o site. Adotei a ideia pela
   cor: o número de cada cena gira entre amarelo, papel e vermelho, igual ao
   carimbo da semana.
2. A escala `--space-*` não entrou. O CSS já usa `clamp()` direto em cada
   lugar, que é mais fino que uma escala de cinco degraus. Trocar daria
   trabalho e nenhuma diferença visível.

O que envelhecia a versão anterior era justamente o contrário — raio de 16px em
tudo, sombra em cada card, fundo creme e cabeçalhos centralizados. Os tokens
estão no `:root` do `style.css`.

Mudanças de layout que vieram daí:

- As promoções deixaram de ser sete cards e viraram **uma lista da semana**,
  com fios finos separando os dias. Lê melhor e parece menos template.
- Os cabeçalhos de seção foram para a **esquerda**, em vez de centralizados.
- O cardápio virou uma grade de colunas com fios, sem caixas.

## Animação

O encaixe Lenis + GSAP + ScrollTrigger fica no topo do `main.js`, em um lugar
só: o Lenis avisa o ScrollTrigger a cada quadro e o ticker do GSAP conduz o
Lenis, então os dois andam no mesmo relógio.

**Tempo e curva:** nada entra ou sai em menos de 0.6s, e o ease é sempre
power3 ou expo. As exceções (parallax, letreiro, hover de cor) estão listadas
no `CLAUDE.md`.

**Topo:** foto parada da fachada à noite. A abertura é encadeada — cortina
preta, foto assentando de 14% maior, rótulo desfocado que entra, e só então as
letras do título subindo de dentro de uma janela.

**"Uma noite especial conosco":** seção presa na tela. O scroll deixa de rolar a página e
passa a mover a câmera, uma cena de cada vez, da calçada até a mesa. O `scrub`
é o que dá essa sensação: cada pixel rolado move um pedaço da linha do tempo.
Dentro de cada cena os elementos entram com `stagger: 0.2` e `ease: power3.out`.

A cena 01 entra **antes** do pin, enquanto a seção ainda sobe — sem isso, quem
chega na seção encontra ela vazia.

A moldura da foto é deitada (4:3) por padrão. A cena 03 usa
`.noite__foto--retrato`, que inverte a proporção para 3:4 e manda pela altura
em vez da largura — assim a foto em pé aparece inteira, sem corte, e a coluna
dela encolhe junto para não abrir vão até o texto.

O pin vale **também no celular**: com o Lenis no scroll, prender a tela em
aparelho pequeno funciona bem.

Para mexer nas cenas, cada uma é um bloco `.noite__cena` no `index.html`.
Acrescentar ou tirar uma funciona sozinho — o JavaScript conta quantas existem
e ajusta a altura do pin e o contador.

**Degradação:** sem JavaScript, com as libs fora do ar ou com "reduzir
movimento" ligado, o `main.js` tira a classe `js` e sai antes de animar. A
página aparece inteira e parada, com as quatro cenas uma embaixo da outra.

## O que ainda falta preencher

Marcado com `TODO` / comentário no código:

1. **Cardápio incompleto** — a foto do cardápio pegou só a coluna do meio
   (33 sabores, de Frajola a Três queijos). Faltam os sabores de A a E, a
   coluna da direita e as pizzas doces. Precisa de uma foto do resto.
   Os ingredientes do **Hamburguer** estavam cobertos por uma fita na foto.
2. **Preços das promoções da semana** — esses continuam fora do site: os do
   cartaz antigo não valem mais. Cada dia tem um link "Consultar preço" que
   liga. Dentro do bloco de segunda-feira em `index.html` há uma linha
   comentada mostrando como pôr o preço de volta.
3. **Horário de funcionamento** — seção `#local`. Guias da cidade indicam terça
   a domingo, das 18h às 00h, mas não batem entre si.
4. **Segunda unidade** — existe uma Pizza Mia na Av. São Paulo, 474, Cidade
   Brasil, (11) 2425-5960. Ainda não está no site.
5. **CNPJ** — 54.968.854/0001-95 veio de consulta pública. Vale o dono
   confirmar antes de publicar, porque é identificador legal.

## As fotos

Cada foto aparece **uma única vez**:

| Foto | Onde |
|---|---|
| `fachada-noite.jpg` | fundo do topo |
| `fachada.jpg` | cena 01 — "A casa na esquina" |
| `salao.jpg` | cena 02 — "Um bom ambiente" |
| `pizza-viagem.jpg` | cena 03 — "E também sai para viagem" |
| `logo.jpg` | cabeçalho e rodapé |

**Para conseguir mais fotos:** peça na própria pizzaria, que tem as originais.
As que aparecem no Tripadvisor, no Restaurant Guru e no Google são de clientes
e pertencem a quem tirou. A página oficial no Facebook
(`facebook.com/PizzariaMia`) tem fotos da própria casa — essas a pizzaria pode
autorizar.

## Dados estruturados (JSON-LD)

O `<head>` do `index.html` carrega um bloco `Restaurant` + `Menu` que diz em
dados o que a página diz em texto: endereço, telefone, horário e os 33 sabores
com preço. É o que faz buscador e assistente de IA responderem "que horas
abre" e "quanto custa a portuguesa" sem adivinhar.

O bloco é **gerado a partir do próprio HTML**, lendo os
`<li class="ticket__item">`. Se mexer nos sabores, regere para não divergir do
que está na tela. Em resumo: ler os `ticket__nome`, `ticket__preco` e
`ticket__ing`, montar os `MenuItem` com `offers`, e substituir
o bloco inteiro.

## Antes de publicar

1. **Trocar `SITE_URL` pelo domínio real** em três arquivos: `index.html`
   (JSON-LD), `sitemap.xml` e `robots.txt`. Enquanto for `SITE_URL`, os
   buscadores ignoram essas URLs.
2. **Atualizar as datas** do `sitemap.xml`.
3. **Conferir o `robots.txt` no ar**, em `SEU-DOMINIO/robots.txt`. Alguns
   hosts servem um `robots.txt` próprio e ignoram o do repositório — nesse
   caso o arquivo daqui não vale de nada e é preciso configurar no painel do
   host.
4. **Cache:** o `_headers` vale para Netlify e Cloudflare Pages. O GitHub
   Pages ignora e fixa o cache em 10 minutos, sem como mudar.

## Páginas legais

`privacidade.html` e `termos.html` usam o mesmo CSS do site. A política de
privacidade declara o que realmente acontece: o site não coleta nada, mas
carrega Google Fonts e um mapa do Google, e isso conecta o navegador do
visitante a esses serviços.

**São minutas.** Valem como ponto de partida honesto, não como peça jurídica
revisada. Vale uma lida de alguém da área antes de publicar.

## Publicar de graça (GitHub Pages)

1. No GitHub, vá em **Settings → Pages**.
2. Em *Source*, escolha a branch do site e a pasta `/ (root)`.
3. Salve. Em alguns minutos o site fica no ar.
