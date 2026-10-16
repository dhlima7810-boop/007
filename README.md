# Site da Pizza Mia

Site institucional da **Pizza Mia** — pizzaria e rodízio em Vila Galvão, Guarulhos / SP.

Site estático: só HTML, CSS e JavaScript. Não precisa instalar nada nem rodar build.

## Como ver no computador

Abra o arquivo `index.html` no navegador.

Se preferir um servidor local (o mapa e as fontes carregam melhor assim):

```bash
python3 -m http.server 8000
```

Depois acesse <http://localhost:8000>.

## Estrutura

```
index.html              página única, com todas as seções
assets/
  css/style.css         estilos (cores tiradas da marca: amarelo e vermelho)
  js/main.js            animações GSAP, menu, destaque do dia, galeria
  img/                  fotos da pizzaria + hero-poster.jpg
  video/hero.mp4        vídeo de fundo do topo (e hero.webm, mesma coisa)
                        gerado a partir de img/fachada-noite.jpg
  favicon.png           ícone da aba
```

## Animação

O GSAP e o ScrollTrigger vêm de CDN (`cdnjs`), carregados no fim do
`index.html`. Não precisa instalar nada.

A abertura do topo segue esta ordem, e é ela que cria a tensão antes da
primeira palavra:

1. a tela entra preta, com o vídeo já rodando por baixo;
2. o vídeo começa 22% maior e vai assentando ao longo de 4 segundos;
3. a cortina preta sobe;
4. um risco amarelo se estica da esquerda para a direita;
5. "Vila Galvão · Guarulhos · SP" aparece desfocado, com as letras muito
   afastadas, e vai fechando o espaçamento até ficar nítido;
6. só então as letras do título sobem de dentro de uma janela, uma a uma.

Depois disso: barra de progresso no topo, letreiro amarelo rolando sem
parar, parallax no vídeo, títulos de seção subindo da janela e o indicador
"Role" que some assim que a página desce.

### A seção "Uma noite aqui" (pin scroll)

É a seção presa na tela. Enquanto você rola, a página não anda: o scroll
passa a mover as cenas, uma de cada vez, da calçada até a mesa.

O que dá a sensação de câmera é o `scrub: 1` do ScrollTrigger. Cada pixel
rolado corresponde a um pedaço da linha do tempo, e o atraso de 1 segundo
faz a cena chegar amaciando, em vez de grudar no dedo. A cena anterior
recua e some antes de a próxima entrar, para os dois textos nunca
aparecerem juntos.

Dentro de cada cena os elementos entram em sequência — foto, número,
título, descrição — com `stagger: 0.2` e `ease: 'power3.out'`. A foto
continua se aproximando devagar enquanto a cena está no ar.

O pin só vale no desktop (`min-width: 860px`, via `gsap.matchMedia`). No
celular a seção vira uma lista comum, com as mesmas entradas em sequência,
porque prender a tela em aparelho pequeno atrapalha mais do que ajuda.

Para mexer nas cenas, cada uma é um bloco `.noite__cena` no `index.html`.
Acrescentar ou tirar uma funciona sozinho: o JavaScript conta quantas
existem e ajusta a altura do pin e o contador.

**Se o GSAP não carregar**, o `main.js` tira a classe `js` do `<html>` e a
página aparece inteira, sem animação nenhuma. Quem usa "reduzir movimento"
no sistema também vê a versão parada, com o vídeo pausado.

### Trocar o vídeo do topo

O vídeo atual foi gerado a partir da própria foto da pizza, com uma
aproximação lenta que vai e volta — por isso o loop não tem corte. Quando
a pizzaria gravar um vídeo de verdade (o forno, a pizza sendo cortada, o
salão cheio), é só substituir `assets/video/hero.mp4` e
`assets/video/hero.webm` e trocar o `assets/img/hero-poster.jpg` por um
quadro dele. Nada mais precisa mudar.

Dicas para o vídeo novo: sem som, poucos segundos, movimento lento, e de
preferência uma cena escura ou que escureça nas bordas, porque o texto fica
por cima.

## O que ainda falta preencher

Estes pontos estão marcados com comentário `TODO` / `ATENÇÃO` no código:

1. **Preços** — o site não mostra valor nenhum, de propósito: os preços do
   cartaz antigo não valem mais. Cada card de promoção tem um link
   "Consultar preço" que liga para a pizzaria. Quando souber os valores,
   abra `index.html` na seção `#promocoes`: dentro do card de segunda-feira
   há uma linha comentada mostrando exatamente como colocar o preço. É só
   descomentar e repetir nos outros dias.
2. **Horário de funcionamento** — em `index.html`, seção `#local`. Hoje está
   escrito "Aberto todos os dias. Confirme o horário pelo telefone."
3. **Cardápio completo** — a seção `#cardapio` tem só as categorias. Dentro dela há
   um bloco de exemplo comentado para copiar e colar a cada sabor novo.
4. **Foto do cartaz de promoções** — o arquivo continua em
   `assets/img/promocoes.jpg`, mas saiu da galeria porque mostra os preços
   antigos. Quando houver cartaz novo, troque o arquivo e descomente o bloco
   na seção `#galeria`.
5. **Redes sociais e delivery** — se a pizzaria tiver Instagram, iFood ou 99Food,
   dá para incluir os links no menu e no rodapé.

## Dados usados no site

- **Endereço:** Av. Emilio Ribas, 3175 — Vila Galvão, Guarulhos / SP
- **Telefones:** (11) 2452-8022 e (11) 2452-6575 (disk pizza)

## Publicar de graça (GitHub Pages)

1. No GitHub, vá em **Settings → Pages**.
2. Em *Source*, escolha a branch do site e a pasta `/ (root)`.
3. Salve. Em alguns minutos o site fica no ar no endereço que o GitHub mostrar.

## Observação sobre as fotos

As imagens em `assets/img/` foram recortadas das fotos enviadas pelo dono do
projeto. Cada uma aparece **uma única vez** no site: a da pizza virou o vídeo
do topo, e as outras cinco estão na galeria.

Antes de publicar, vale confirmar com a pizzaria se pode usar as fotos de
divulgação — as do combo vieram de material promocional do 99Food.

**Para conseguir mais fotos:** o caminho certo é pedir na própria pizzaria,
que tem as originais em boa resolução. As fotos que aparecem no Tripadvisor,
no Restaurant Guru e no Google são de clientes e pertencem a quem tirou, então
não dá para pegar de lá e publicar. A página oficial no Facebook
(`facebook.com/PizzariaMia`) tem fotos da própria casa — essas a pizzaria pode
autorizar.
