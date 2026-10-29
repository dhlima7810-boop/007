/* ===========================================================================
   AVESSO — os 30 personagens.

   Cada um e uma LINHA DE DADOS, nao um desenho. Cinco eixos se combinam:

     forma   disco · quadrado · losango · hexagono · triangulo · capsula · cruz
     casca   solido · vazado (so contorno) · anel (furo no meio) · partido
     cor     paleta de luminancia media
     rastro  bolhas · risco · pontos · nenhum
     giro    fixo · roda (gira com a distancia) · inclina (tomba com a queda)

   A COR NAO E LIVRE. A tela inverte quando se segura o botao, entao a cor
   precisa contrastar com o preto E com o osso. Em brilho percebido
   (0.299R + 0.587G + 0.114B) isso quer dizer ficar entre 68 e 180: abaixo
   some no preto, acima some no osso. Ha um teste que confere os 30.

   `por` diz como se ganha:
     {tipo:'livre'}            — ja vem vestida
     {tipo:'soma', m:1200}     — metros somados de TODAS as corridas
     {tipo:'proeza', id:'cem'} — uma proeza, descrita em PROEZAS no jogo.js

   Aparencia nao mexe em nada do jogo: a colisao e sempre o mesmo circulo de
   raio A.raio, qualquer que seja a forma. Roupa que muda dificuldade faz a
   pessoa escolher a feia.
   ======================================================================== */

window.AVESSO_PERSONAGENS = [
  { id:'avesso',   nome:'Avesso',    forma:'disco',     casca:'solido',  cor:'#ff3b14', rastro:'bolhas', giro:'fixo',    por:{ tipo:'livre' } },

  { id:'brasa',    nome:'Brasa',     forma:'disco',     casca:'anel',    cor:'#ff6a2b', rastro:'risco',  giro:'roda',    por:{ tipo:'soma', m:120 } },
  { id:'cal',      nome:'Cal',       forma:'quadrado',  casca:'solido',  cor:'#a8aab0', rastro:'bolhas', giro:'fixo',    por:{ tipo:'soma', m:300 } },
  { id:'gema',     nome:'Gema',      forma:'disco',     casca:'solido',  cor:'#e8a400', rastro:'pontos', giro:'roda',    por:{ tipo:'soma', m:550 } },
  { id:'grafite',  nome:'Grafite',   forma:'hexagono',  casca:'vazado',  cor:'#7a828c', rastro:'risco',  giro:'roda',    por:{ tipo:'soma', m:850 } },
  { id:'carmim',   nome:'Carmim',    forma:'losango',   casca:'solido',  cor:'#c21f3a', rastro:'bolhas', giro:'inclina', por:{ tipo:'soma', m:1200 } },
  { id:'indigo',   nome:'Índigo',    forma:'disco',     casca:'partido', cor:'#4455c8', rastro:'bolhas', giro:'roda',    por:{ tipo:'soma', m:1600 } },
  { id:'musgo',    nome:'Musgo',     forma:'capsula',   casca:'solido',  cor:'#5f8c3f', rastro:'risco',  giro:'inclina', por:{ tipo:'soma', m:2050 } },
  { id:'ambar',    nome:'Âmbar',     forma:'hexagono',  casca:'solido',  cor:'#d98324', rastro:'pontos', giro:'fixo',    por:{ tipo:'soma', m:2550 } },
  { id:'vidro',    nome:'Vidro',     forma:'disco',     casca:'vazado',  cor:'#4fb3c9', rastro:'nenhum', giro:'fixo',    por:{ tipo:'soma', m:3100 } },
  { id:'polvora',  nome:'Pólvora',   forma:'triangulo', casca:'solido',  cor:'#8a7f9e', rastro:'pontos', giro:'inclina', por:{ tipo:'soma', m:3700 } },
  { id:'ferrugem', nome:'Ferrugem',  forma:'quadrado',  casca:'anel',    cor:'#9e4a28', rastro:'bolhas', giro:'roda',    por:{ tipo:'soma', m:4400 } },
  { id:'ocre',     nome:'Ocre',      forma:'cruz',      casca:'solido',  cor:'#b89150', rastro:'risco',  giro:'roda',    por:{ tipo:'soma', m:5200 } },
  { id:'menta',    nome:'Menta',     forma:'disco',     casca:'anel',    cor:'#3fbf8f', rastro:'pontos', giro:'fixo',    por:{ tipo:'soma', m:6100 } },
  { id:'lilas',    nome:'Lilás',     forma:'losango',   casca:'vazado',  cor:'#9b6bd6', rastro:'risco',  giro:'inclina', por:{ tipo:'soma', m:7100 } },
  { id:'pessego',  nome:'Pêssego',   forma:'capsula',   casca:'partido', cor:'#e8886b', rastro:'bolhas', giro:'fixo',    por:{ tipo:'soma', m:8200 } },
  { id:'chumbo',   nome:'Chumbo',    forma:'hexagono',  casca:'partido', cor:'#6b7079', rastro:'nenhum', giro:'roda',    por:{ tipo:'soma', m:9400 } },
  { id:'estopim',  nome:'Estopim',   forma:'triangulo', casca:'vazado',  cor:'#ff5a3c', rastro:'pontos', giro:'inclina', por:{ tipo:'soma', m:10700 } },
  { id:'giz',      nome:'Giz',       forma:'quadrado',  casca:'vazado',  cor:'#a8a394', rastro:'bolhas', giro:'fixo',    por:{ tipo:'soma', m:12100 } },
  { id:'lasca',    nome:'Lasca',     forma:'cruz',      casca:'vazado',  cor:'#c9a44a', rastro:'risco',  giro:'roda',    por:{ tipo:'soma', m:13600 } },
  { id:'breu',     nome:'Breu',      forma:'disco',     casca:'solido',  cor:'#5a4a6e', rastro:'risco',  giro:'roda',    por:{ tipo:'soma', m:15200 } },
  { id:'nespera',  nome:'Nêspera',   forma:'capsula',   casca:'anel',    cor:'#d9663f', rastro:'pontos', giro:'inclina', por:{ tipo:'soma', m:17500 } },

  { id:'cem',      nome:'Cem',       forma:'losango',   casca:'partido', cor:'#e09a28', rastro:'risco',  giro:'roda',    por:{ tipo:'proeza', id:'cem' } },
  { id:'voo',      nome:'Voo',       forma:'disco',     casca:'vazado',  cor:'#5ab6cf', rastro:'risco',  giro:'fixo',    por:{ tipo:'proeza', id:'voo' } },
  { id:'fio',      nome:'Fio',       forma:'cruz',      casca:'anel',    cor:'#e03a6a', rastro:'pontos', giro:'roda',    por:{ tipo:'proeza', id:'fio' } },
  { id:'fundo',    nome:'Fundo',     forma:'hexagono',  casca:'anel',    cor:'#3f7fd6', rastro:'nenhum', giro:'roda',    por:{ tipo:'proeza', id:'fundo' } },
  { id:'cegas',    nome:'Às cegas',  forma:'quadrado',  casca:'partido', cor:'#8f8f8f', rastro:'nenhum', giro:'fixo',    por:{ tipo:'proeza', id:'cegas' } },
  { id:'folego',   nome:'Fôlego',    forma:'triangulo', casca:'anel',    cor:'#46b06b', rastro:'risco',  giro:'inclina', por:{ tipo:'proeza', id:'folego' } },
  { id:'duzentos', nome:'Duzentos',  forma:'disco',     casca:'partido', cor:'#ff7a00', rastro:'risco',  giro:'roda',    por:{ tipo:'proeza', id:'duzentos' } },
  { id:'limalha',  nome:'Limalha',   forma:'losango',   casca:'anel',    cor:'#b0a08c', rastro:'pontos', giro:'inclina', por:{ tipo:'proeza', id:'limalha' } }
];
