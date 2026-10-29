/* ===========================================================================
   AVESSO — as 30 roupas.

   Cada uma e uma LINHA DE DADOS, nao um desenho. Seis eixos se combinam:

     forma   disco · quadrado · losango · hexagono · triangulo · capsula · cruz
     casca   solido · vazado (so contorno) · anel (furo no meio) · partido
     cor     paleta de luminancia media
     rastro  bolhas · risco · pontos · nenhum
     mov     o movimento proprio — a tabela MOVS, no jogo.js
     por     como se ganha

   O NOME E O MOVIMENTO SAO A MESMA COISA. Prumo pende, Mola salta, Relogio
   anda de segundo em segundo, Espelho se inverte, Eco deixa um fantasma
   atras. Se um dia o movimento mudar, o nome muda junto — nome que nao
   descreve o que se ve e so rotulo.

   MOVIMENTO NAO E FISICA. Nada aqui mexe na colisao: ela continua sendo o
   mesmo circulo de raio A.raio no centro de onde o disco esta de verdade.
   Uma roupa que esticasse a caixa faria a pessoa escolher a mais estreita.

   A COR NAO E LIVRE. A tela inverte quando se segura o botao, entao a cor
   precisa contrastar com o preto E com o osso. Em brilho percebido
   (0.299R + 0.587G + 0.114B) isso quer dizer ficar entre 68 e 180. Ha um
   teste que confere as 30.

   Os `id` nao mudam nunca: e por eles que o armario lembra o que ja foi
   ganho (`avesso.ganhas`). Nome, forma, cor e movimento podem mudar.

   `por` diz como se ganha:
     {tipo:'livre'}            — ja vem vestida
     {tipo:'soma', m:1200}     — metros somados de TODAS as corridas
     {tipo:'proeza', id:'cem'} — uma proeza, descrita em PROEZAS no jogo.js
   ======================================================================== */

// Os cortes de ANTES da primeira subida da curva. Servem uma vez so, na
// migracao do jogo.js: quem ja tinha uma roupa nao pode perde-la porque a
// exigencia subiu. Nao use para mais nada e nao mexa.
window.AVESSO_CORTES_ANTIGOS = [120, 300, 550, 850, 1200, 1600, 2050, 2550, 3100, 3700, 4400,
  5200, 6100, 7100, 8200, 9400, 10700, 12100, 13600, 15200, 17500];

window.AVESSO_PERSONAGENS = [
  { id:'avesso',   nome:'Avesso',     forma:'disco',     casca:'solido',  cor:'#ff3b14', rastro:'bolhas', mov:'vira',    por:{ tipo:'livre' } },

  { id:'brasa',    nome:'Brasa',      forma:'disco',     casca:'anel',    cor:'#ff6a2b', rastro:'risco',  mov:'pulsa',   por:{ tipo:'soma', m:300 } },
  { id:'cal',      nome:'Prumo',      forma:'losango',   casca:'solido',  cor:'#a8aab0', rastro:'risco',  mov:'pende',   por:{ tipo:'soma', m:650 } },
  { id:'gema',     nome:'Gema',       forma:'disco',     casca:'solido',  cor:'#e8a400', rastro:'pontos', mov:'escorre', por:{ tipo:'soma', m:1150 } },
  { id:'grafite',  nome:'Fuso',       forma:'capsula',   casca:'vazado',  cor:'#7a828c', rastro:'risco',  mov:'fia',     por:{ tipo:'soma', m:1850 } },
  { id:'carmim',   nome:'Pulso',      forma:'disco',     casca:'solido',  cor:'#c21f3a', rastro:'bolhas', mov:'bate',    por:{ tipo:'soma', m:2800 } },
  { id:'indigo',   nome:'Vaga',       forma:'capsula',   casca:'partido', cor:'#4455c8', rastro:'bolhas', mov:'ondula',  por:{ tipo:'soma', m:4000 } },
  { id:'musgo',    nome:'Rolha',      forma:'capsula',   casca:'solido',  cor:'#5f8c3f', rastro:'pontos', mov:'boia',    por:{ tipo:'soma', m:5600 } },
  { id:'ambar',    nome:'Pião',       forma:'triangulo', casca:'solido',  cor:'#d98324', rastro:'risco',  mov:'piao',    por:{ tipo:'soma', m:7500 } },
  { id:'vidro',    nome:'Vulto',      forma:'disco',     casca:'vazado',  cor:'#4fb3c9', rastro:'nenhum', mov:'some',    por:{ tipo:'soma', m:9800 } },
  { id:'polvora',  nome:'Estilhaço',  forma:'triangulo', casca:'solido',  cor:'#8a7f9e', rastro:'pontos', mov:'treme',   por:{ tipo:'soma', m:12600 } },
  { id:'ferrugem', nome:'Roda',       forma:'hexagono',  casca:'anel',    cor:'#9e4a28', rastro:'bolhas', mov:'roda',    por:{ tipo:'soma', m:16000 } },
  { id:'ocre',     nome:'Relógio',    forma:'disco',     casca:'anel',    cor:'#b89150', rastro:'risco',  mov:'tique',   por:{ tipo:'soma', m:20300 } },
  { id:'menta',    nome:'Fole',       forma:'capsula',   casca:'partido', cor:'#3fbf8f', rastro:'pontos', mov:'infla',   por:{ tipo:'soma', m:25200 } },
  { id:'lilas',    nome:'Pluma',      forma:'losango',   casca:'vazado',  cor:'#9b6bd6', rastro:'risco',  mov:'flutua',  por:{ tipo:'soma', m:31000 } },
  { id:'pessego',  nome:'Bumerangue', forma:'triangulo', casca:'vazado',  cor:'#e8886b', rastro:'bolhas', mov:'volta',   por:{ tipo:'soma', m:38000 } },
  { id:'chumbo',   nome:'Âncora',     forma:'cruz',      casca:'partido', cor:'#6b7079', rastro:'nenhum', mov:'afunda',  por:{ tipo:'soma', m:46500 } },
  { id:'estopim',  nome:'Faísca',     forma:'losango',   casca:'solido',  cor:'#ff5a3c', rastro:'pontos', mov:'pisca',   por:{ tipo:'soma', m:56000 } },
  { id:'giz',      nome:'Serra',      forma:'hexagono',  casca:'vazado',  cor:'#a8a394', rastro:'bolhas', mov:'serra',   por:{ tipo:'soma', m:68000 } },
  { id:'lasca',    nome:'Lasca',      forma:'triangulo', casca:'vazado',  cor:'#c9a44a', rastro:'risco',  mov:'lasca',   por:{ tipo:'soma', m:82000 } },
  { id:'breu',     nome:'Eco',        forma:'disco',     casca:'solido',  cor:'#5a4a6e', rastro:'nenhum', mov:'repete',  por:{ tipo:'soma', m:99000 } },
  { id:'nespera',  nome:'Mola',       forma:'capsula',   casca:'anel',    cor:'#d9663f', rastro:'pontos', mov:'salta',   por:{ tipo:'soma', m:119000 } },

  { id:'cem',      nome:'Bússola',    forma:'losango',   casca:'partido', cor:'#e09a28', rastro:'risco',  mov:'aponta',  por:{ tipo:'proeza', id:'cem' } },
  { id:'voo',      nome:'Hélice',     forma:'cruz',      casca:'solido',  cor:'#5ab6cf', rastro:'risco',  mov:'ventila', por:{ tipo:'proeza', id:'voo' } },
  { id:'fio',      nome:'Nó',         forma:'quadrado',  casca:'vazado',  cor:'#e03a6a', rastro:'pontos', mov:'ata',     por:{ tipo:'proeza', id:'fio' } },
  { id:'fundo',    nome:'Dado',       forma:'quadrado',  casca:'solido',  cor:'#3f7fd6', rastro:'nenhum', mov:'rolar',   por:{ tipo:'proeza', id:'fundo' } },
  { id:'cegas',    nome:'Espelho',    forma:'quadrado',  casca:'partido', cor:'#8f8f8f', rastro:'nenhum', mov:'reflete', por:{ tipo:'proeza', id:'cegas' } },
  { id:'folego',   nome:'Sopro',      forma:'disco',     casca:'vazado',  cor:'#46b06b', rastro:'risco',  mov:'respira', por:{ tipo:'proeza', id:'folego' } },
  { id:'duzentos', nome:'Cometa',     forma:'capsula',   casca:'solido',  cor:'#ff7a00', rastro:'risco',  mov:'risca',   por:{ tipo:'proeza', id:'duzentos' } },
  { id:'limalha',  nome:'Ímã',        forma:'capsula',   casca:'anel',    cor:'#b0a08c', rastro:'pontos', mov:'atrai',   por:{ tipo:'proeza', id:'limalha' } }
];
