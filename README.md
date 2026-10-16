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
  js/main.js            menu do celular, destaque do dia, galeria, animações
  img/                  fotos da pizzaria
  favicon.png           ícone da aba
```

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
projeto. Antes de publicar, vale confirmar com a pizzaria se pode usar as fotos
de divulgação (as do combo vieram de material promocional do 99Food).
