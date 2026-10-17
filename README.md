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

## Design

A direção visual saiu de benchmarks de sites de banco de imagem (Adobe Stock e
afins), conforme a skill `find-types`: superfície quase preta como padrão,
tipografia contida, um único acento vibrante, raios de borda pequenos e
hairlines no lugar de sombra.

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

**Topo:** foto parada da fachada à noite. A abertura é encadeada — cortina
preta, foto assentando de 14% maior, rótulo desfocado que entra, e só então as
letras do título subindo de dentro de uma janela.

**"Uma noite aqui":** seção presa na tela. O scroll deixa de rolar a página e
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

1. **Preços** — o site não mostra nenhum, de propósito: os do cartaz antigo não
   valem mais. Cada dia tem um link "Consultar preço" que liga. Dentro do bloco
   de segunda-feira em `index.html` há uma linha comentada mostrando como pôr o
   preço de volta.
2. **Horário de funcionamento** — seção `#local`. Guias da cidade indicam terça
   a domingo, das 18h às 00h, mas não batem entre si.
3. **Cardápio completo** — a seção `#cardapio` tem só as categorias, com um
   bloco de exemplo comentado para copiar.
4. **Segunda unidade** — existe uma Pizza Mia na Av. São Paulo, 474, Cidade
   Brasil, (11) 2425-5960. Ainda não está no site.

## As fotos

Cada foto aparece **uma única vez**:

| Foto | Onde |
|---|---|
| `fachada-noite.jpg` | fundo do topo |
| `fachada.jpg` | cena 01 — "A casa na esquina" |
| `salao.jpg` | cena 02 — "O salão vai enchendo" |
| `pizza-viagem.jpg` | cena 03 — "E também sai para viagem" |
| `logo.jpg` | cabeçalho e rodapé |

**Para conseguir mais fotos:** peça na própria pizzaria, que tem as originais.
As que aparecem no Tripadvisor, no Restaurant Guru e no Google são de clientes
e pertencem a quem tirou. A página oficial no Facebook
(`facebook.com/PizzariaMia`) tem fotos da própria casa — essas a pizzaria pode
autorizar.

## Publicar de graça (GitHub Pages)

1. No GitHub, vá em **Settings → Pages**.
2. Em *Source*, escolha a branch do site e a pasta `/ (root)`.
3. Salve. Em alguns minutos o site fica no ar.
