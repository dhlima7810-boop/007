/* ===========================================================================
   AVESSO — jogo de um botao so. Segurar inverte a gravidade.

   Projeto separado: mora neste repositorio, mas NAO faz parte do site da
   Pizza Mia. Nao entra no sitemap, nao e linkado pelo site e leva noindex.

   O que vale aqui, vindo do CLAUDE.md do repositorio:
   - sem build, sem framework, sem componentes. HTML, CSS e JS puros;
   - GSAP cuida da interface (inicio, fim, vestiario, pausa, HUD): nada entra
     ou sai abaixo de 0.6s, e a curva e power3 ou expo;
   - caixa alta vem de text-transform, nunca do texto escrito no HTML;
   - a pagina continua legivel sem JS, sem GSAP e sob prefers-reduced-motion.

   O que nao vale, e por que:
   - a fisica nao e tween. Posicao conduzida por quem joga nao tem curva nem
     duracao — e a mesma razao pela qual o CLAUDE.md libera ease:'none' em
     tween preso ao scroll. Quem conduz o relogio continua sendo o GSAP: o
     laco roda no gsap.ticker e so cai no requestAnimationFrame se o GSAP
     nao carregar;
   - Lenis nao entra: esta pagina nao rola.
   ======================================================================== */

(function () {
  'use strict';

  /* §1 — ajuste ---------------------------------------------------------- */

  var A = {
    alturaBase: 720,
    largMin: 980,
    largMax: 1560,
    raio: 17,
    grav: 2100,
    vyMax: 820,
    velBase: 380,
    velGanho: 180,       // a escalada grossa agora vem dos setores
    velRampa: 40,
    espBase: 600,
    espCorte: 170,
    durezaEm: 9000,
    xJogador: 0.3,
    velMenu: 90,
    rastro: 11,
    inverteEm: 0.055,

    // A REGUA. 1 m = 20px: a 400px/s o contador sobe uns 20 m por segundo, e
    // dá para atravessar a tela antes de chegar nos 100. Com 7px ele subia
    // tres vezes mais rapido e o numero inflava antes de a pessoa sair do
    // lugar. Mexer aqui muda so a escala do placar, nunca a dificuldade:
    // quem decide o quanto aperta e a tabela ATOS, mais a rampa de velocidade.
    passoM: 20,
    rocada: 24,          // folga que ainda conta como rocada
    multMax: 8,
    perigo: 20,          // folga que dispara a camera lenta
    lenta: 0.42          // quanto o tempo desacelera no perigo
  };

  var TINTA = [12, 13, 16];
  var OSSO = [237, 234, 227];

  // TRES ATOS de 300 m. Um tema cada, uma dificuldade dita em voz alta.
  //
  // Antes eram seis setores em 900 m, o que dava 2,6s de mundo por setor:
  // a cara mudava antes de a pessoa reparar que tinha mudado. Com tres, cada
  // ato dura de 3 a 5 segundos e da para ver o que ele e.
  //
  // `fFaixa` e a espessura do chao e do teto em fracao da altura — ela
  // ENGROSSA a cada ato, e e por isso que o campo aperta de verdade em vez
  // de so acelerar. Tudo que e gerado guarda fracao da altura util, nunca
  // pixel: assim a faixa pode crescer (e a janela pode mudar de tamanho) sem
  // fechar um vao que ja existia.
  //
  // `tema` so muda o DESENHO. Faisca, cascalho e espinho de pendulo nao tem
  // colisao nenhuma: quem mata e a caixa, e so ela. Um enfeite que mata e um
  // enfeite que mente.
  var ATOS = [
    { nome: 'Subsolo',     dif: 'Fácil',   tema: 'terra', cor: '#b08c5a', ate: 250, art: 'ao',
      tinta: [21, 17, 12], osso: [228, 217, 196], pino: '#8a7355',
      fFaixa: 0.078, vel: 0,   esp: 1.08, vao: 0.22, laje: 0.08, pendulo: 0,    aperto: 0 },
    { nome: 'Forja',       dif: 'Médio',   tema: 'fogo',  cor: '#ff7a1a', ate: 625, art: 'à',
      tinta: [25, 13, 10], osso: [244, 228, 205], pino: '#ff7a1a',
      fFaixa: 0.100, vel: 95,  esp: 0.90, vao: 0.30, laje: 0.20, pendulo: 0.30, aperto: 0.45 },
    { nome: 'Desabamento', dif: 'Difícil', tema: 'pedra', cor: '#9aa0a6', ate: Infinity, art: 'ao',
      tinta: [13, 15, 19], osso: [223, 225, 224], pino: '#9a9890',
      fFaixa: 0.125, vel: 195, esp: 0.80, vao: 0.34, laje: 0.16, pendulo: 0.50, aperto: 1.0 }
  ];

  // O MOVIMENTO DE CADA ROUPA. O nome da roupa e o que ela faz: Prumo pende,
  // Mola salta, Relogio anda de segundo em segundo, Eco deixa um fantasma.
  //
  // NADA AQUI MEXE NA FISICA. A colisao continua sendo o mesmo circulo de
  // raio A.raio no centro de onde o disco esta de verdade — `dx`, `dy`, `ex`
  // e `ey` so deslocam e deformam o DESENHO. Uma roupa que esticasse a caixa
  // faria a pessoa escolher a mais estreita, e o jogo deixaria de ser sobre
  // conduzir para ser sobre escolher bem no armario.
  //
  // Cada funcao recebe o estado e devolve, tudo opcional:
  //   r  giro em radianos        dx, dy  deslocamento em px
  //   ex, ey  escala por eixo    a  opacidade     eco  desenha um fantasma
  var MOVS = {
    fixo:    function ()  { return {}; },

    // meia volta a cada inversao, assentando em 0.25s
    vira:    function (e) {
      var t = Math.min(1, (e.t - e.virou) / 0.25), f = 1 - Math.pow(1 - t, 3);
      var de = e.segurando ? 0 : Math.PI, ate = e.segurando ? Math.PI : 0;
      return { r: de + (ate - de) * f };
    },
    pulsa:   function (e) { var k = 1 + Math.sin(e.t * 13) * 0.09; return { ex: k, ey: k }; },
    pende:   function (e) { return { r: Math.atan2(e.vy, 900) * 1.4 }; },
    escorre: function (e) { var v = e.vy / e.vyMax; return { ex: 1 - v * v * 0.3, ey: 1 + v * v * 0.45 }; },
    fia:     function (e) { return { r: e.t * 9 }; },
    bate:    function (e) {
      var f = (e.t * 1.5) % 1;
      return { ex: 1 + Math.exp(-f * 20) * 0.17 + Math.exp(-Math.max(0, f - 0.17) * 20) * 0.11,
               ey: 1 + Math.exp(-f * 20) * 0.17 + Math.exp(-Math.max(0, f - 0.17) * 20) * 0.11 };
    },
    ondula:  function (e) { return { dy: Math.sin(e.t * 4.5) * e.raio * 0.5 }; },
    boia:    function (e) { return { dy: Math.sin(e.t * 2.1) * e.raio * 0.45, r: Math.sin(e.t * 1.7) * 0.22 }; },
    piao:    function (e) { return { r: e.t * 11, ex: 1 + Math.sin(e.t * 11) * 0.17 }; },
    some:    function (e) { return { a: 0.38 + 0.62 * (0.5 + 0.5 * Math.sin(e.t * 2.3)) }; },
    treme:   function (e) { return { dx: (Math.random() - 0.5) * e.raio * 0.34,
                                     dy: (Math.random() - 0.5) * e.raio * 0.34 }; },
    roda:    function (e) { return { r: e.camX / 34 }; },
    tique:   function (e) { return { r: Math.floor(e.t) * (6.2832 / 12) }; },
    infla:   function (e) { var k = Math.sin(e.t * 3.4); return { ex: 1 + k * 0.23, ey: 1 - k * 0.19 }; },
    flutua:  function (e) { return { dy: Math.sin(e.t * 1.6) * e.raio * 0.6,
                                     dx: Math.cos(e.t * 1.1) * e.raio * 0.32,
                                     r: Math.sin(e.t * 0.9) * 0.42 }; },
    volta:   function (e) { var f = (e.t * 0.85) % 1;
                            return { r: (f < 0.72 ? f / 0.72 : 1 - (f - 0.72) / 0.28) * 6.2832 }; },
    afunda:  function (e) { return { dy: (e.vy / e.vyMax) * e.raio * 0.85 }; },
    pisca:   function (e) { var k = Math.sin(e.t * 26);
                            return { a: k > 0 ? 1 : 0.38, ex: 1 + k * 0.11, ey: 1 + k * 0.11 }; },
    serra:   function (e) { return { r: Math.floor(e.t * 14) * (6.2832 / 14) }; },
    lasca:   function (e) { return { r: Math.sin(Math.floor(e.t * 2.2) * 91.7) * 0.55 }; },
    repete:  function ()  { return { eco: true }; },
    salta:   function (e) {
      var t = Math.min(1, (e.t - e.virou) / 0.45);
      var k = Math.exp(-t * 7) * Math.cos(t * 26) * 0.3;
      return { ex: 1 - k, ey: 1 + k };
    },
    aponta:  function (e) { return { r: e.segurando ? -1.5708 : 1.5708 }; },
    ventila: function (e) { return { r: e.giro }; },
    ata:     function (e) { return { r: Math.sin(e.t * 9) * 0.5 }; },
    rolar:   function (e) { return { r: Math.floor(e.camX / 95) * 1.5708 }; },
    reflete: function (e) { return { ex: Math.sin(e.t * 2.4) > 0 ? 1 : -1 }; },
    respira: function (e) { var k = 1 + Math.sin(e.t * 1.5) * 0.17; return { ex: k, ey: k }; },
    risca:   function (e) { return { ex: 1.38, ey: 0.78, r: Math.atan2(e.vy, 1400) }; },
    atrai:   function (e) { return { dy: (e.segurando ? -1 : 1) * (0.5 + 0.5 * Math.sin(e.t * 7)) * e.raio * 0.42 }; }
  };

  var COR_FAISCA = '#ff7a1a';   // brilho 148: aparece no preto e no osso
  var COR_PEDRA = '#8a7f74';    // brilho 138
  var COR_TERRA = '#8a7355';    // brilho 119

  // Tres desafios por partida, sorteados: um facil, um medio, um dificil,
  // sempre nessa ordem. `le` tira o progresso do estado da corrida; cumprido,
  // o premio entra como metros de bonus, iguais aos da rocada.
  // Tres desafios por partida, sorteados: um facil, um medio, um dificil,
  // sempre nessa ordem. `le` tira o progresso do estado da corrida; cumprido,
  // o premio entra como metros de bonus, iguais aos da rocada.
  //
  // Os premios e os alvos em METROS estao no dobro do que ja estiveram, a
  // pedido do dono. Contagens e segundos nao dobraram: "roçar 3 vezes" e uma
  // meta, nao uma distancia. Com a mediana em ~107 m, um premio dificil agora
  // mais que dobra a corrida — e e para ser assim: desafio cumprido tem de
  // ser sentido no numero.
  var DESAFIOS = [
    { id: 'dist',   diz: function (n) { return 'Chegar a ' + n + ' m'; },
      alvos: [100, 220, 360], premios: [32, 68, 120], le: function (e) { return e.m; } },

    { id: 'rocar',  diz: function (n) { return 'Roçar ' + n + (n > 1 ? ' vezes' : ' vez'); },
      alvos: [3, 6, 10], premios: [36, 74, 130], le: function (e) { return e.rocadas; } },

    { id: 'mult',   diz: function (n) { return 'Levar a roçada a ×' + n; },
      alvos: [3, 5, 7], premios: [40, 78, 136], le: function (e) { return e.maxMult; } },

    { id: 'voo',    diz: function (n) { return 'Passar ' + n + ' obstáculos sem tocar nas bordas'; },
      alvos: [4, 7, 11], premios: [42, 84, 148], le: function (e) { return e.maxSemTocar; } },

    { id: 'ato',    diz: function (n) {
        var i = setorDeM(n);
        return (i > 0 && ATOS[i - 1].ate === n)
          ? 'Chegar ' + ATOS[i].art + ' ' + ATOS[i].nome
          : 'Passar dos ' + n + ' m';
      },
      alvos: [250, 625, 1000], premios: [36, 74, 134], le: function (e) { return e.m; } },

    { id: 'tempo',  diz: function (n) { return 'Ficar ' + n + ' segundos vivo'; },
      alvos: [12, 20, 30], premios: [32, 68, 116], le: function (e) { return e.tempo; } },

    { id: 'passar', diz: function (n) { return 'Passar ' + n + ' obstáculos'; },
      alvos: [8, 14, 20], premios: [28, 64, 112], le: function (e) { return e.passados; } },

    { id: 'limpo',  diz: function (n) { return 'Passar ' + n + ' obstáculos seguidos sem roçar'; },
      alvos: [5, 8, 12], premios: [32, 68, 116], le: function (e) { return e.maxLimpo; } }
  ];

  var PROEZAS = {
    cem:      'Chegar a 200 m numa corrida',
    duzentos: 'Chegar a 500 m numa corrida',
    voo:      'Passar 10 obstáculos sem tocar no chão nem no teto',
    fio:      'Levar a roçada até ×8',
    fundo:    'Alcançar o Desabamento',
    cegas:    'Fazer 100 m com a inversão da tela desligada',
    folego:   'Ficar 30 segundos vivo numa corrida',
    limalha:  'Roçar 20 vezes numa única corrida'
  };

  /* §2 — estado ---------------------------------------------------------- */

  var C = {
    estado: 'menu',
    camX: 0, base: 0, tempo: 0,
    y: 0, vy: 0, segurando: false,
    obst: [], proximoX: 0,
    rastro: [], cacos: [], faiscas: [], part: [],
    inv: 0, tremor: 0,
    larg: 1280, alt: 720, altCSS: 720,
    tintaC: [21, 17, 12], ossoC: [228, 217, 196],
    fFaixa: ATOS[0].fFaixa,
    setor: 0,
    escalaTempo: 1, virou: 0, segAntes: false, giro: 0, relogio: 0, cartoes: [],
    mult: 0, bonus: 0, rocadas: 0, semTocar: 0,
    maxMult: 0, maxSemTocar: 0, limpo: 0, maxLimpo: 0, passados: 0,
    desafios: [], premioDesafios: 0,
    passouRecorde: false, primeiro: true,
    recorde: 0, total: 0,
    proezas: {}, ganhas: {}, vestido: 'avesso',
    inverter: true, som: true,
    poucoMov: false, podeReiniciar: false
  };

  var el = {}, P = [], porId = {};
  var cv, cx, esc = 1, anima = false, placarEscrito = -1, multEscrito = -1, setorEscrito = -1;

  /* §3 — ajudantes ------------------------------------------------------- */

  function lerGuardado(chave, padrao) {
    try {
      var v = window.localStorage.getItem(chave);
      return v === null ? padrao : v;
    } catch (e) { return padrao; }
  }

  function guardar(chave, valor) {
    try { window.localStorage.setItem(chave, String(valor)); } catch (e) {}
  }

  function mistura(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function cor(c) {
    return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
  }

  function doHex(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function clarear(h, t) { return cor(mistura(doHex(h), [255, 255, 255], t)); }

  function acaso(min, max) { return min + Math.random() * (max - min); }

  // distancia do centro do circulo ate o retangulo; negativa quer dizer dentro
  function folga(cxx, cyy, r, x, y, w, h) {
    var px = x > cxx ? x : (cxx > x + w ? x + w : cxx);
    var py = y > cyy ? y : (cyy > y + h ? y + h : cyy);
    var dx = cxx - px, dy = cyy - py;
    return Math.sqrt(dx * dx + dy * dy) - r;
  }

  function faixa() { return C.alt * C.fFaixa; }

  /* §4 — som ------------------------------------------------------------- */
  /* Web Audio gera os tons por codigo: nenhum arquivo, nenhum CDN. O
     contexto so pode nascer dentro de um gesto — por isso ele e criado no
     primeiro aperto, nunca no carregamento. */

  var ac = null;

  function somAcordar() {
    if (!C.som) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!ac) ac = new Ctx();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { ac = null; }
  }

  function tom(f1, f2, dur, tipo, vol) {
    if (!C.som || !ac || ac.state !== 'running') return;
    try {
      var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = tipo;
      o.frequency.setValueAtTime(f1, t);
      if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }

  var SONS = {
    virar:  function (cima) { tom(cima ? 300 : 190, cima ? 420 : 140, 0.06, 'square', 0.035); },
    rocada: function (n)    { tom(540 + n * 95, 540 + n * 95, 0.055, 'triangle', 0.055); },
    morte:  function ()     { tom(200, 55, 0.38, 'sawtooth', 0.09); },
    setor:  function ()     { tom(330, 495, 0.22, 'triangle', 0.06); },
    ato:    function ()     { tom(196, 294, 0.5, 'sawtooth', 0.055); },
    marca:  function ()     { tom(660, 990, 0.3, 'triangle', 0.07); },
    meta:   function ()     { tom(700, 1050, 0.26, 'triangle', 0.07); },
    conta:  function (n)    { tom(n > 1 ? 380 : 620, n > 1 ? 380 : 780, 0.12, 'triangle', 0.05); },
    roupa:  function ()     { tom(523, 523, 0.14, 'triangle', 0.07);
                              window.setTimeout(function () { tom(659, 659, 0.14, 'triangle', 0.07); }, 120);
                              window.setTimeout(function () { tom(784, 784, 0.3, 'triangle', 0.07); }, 240); }
  };

  /* §5 — medida da tela -------------------------------------------------- */

  // O mundo logico preenche o canvas por inteiro: nada de tarja preta. Em
  // tela estreita e a ALTURA que cede — e melhor jogar num campo mais alto
  // do que enxergar meio metro a frente.
  function medir() {
    var r = el.palco.getBoundingClientRect();
    var lp = Math.max(1, Math.round(r.width));
    var ap = Math.max(1, Math.round(r.height));
    var prop = lp / ap;

    var alt = A.alturaBase, larg = alt * prop;
    if (larg < A.largMin) { larg = A.largMin; alt = larg / prop; }
    else if (larg > A.largMax) { larg = A.largMax; alt = larg / prop; }

    C.larg = larg;
    C.alt = alt;
    C.altCSS = ap;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(lp * dpr);
    cv.height = Math.round(ap * dpr);
    esc = cv.width / larg;

    var f = faixa();
    if (C.y < f + A.raio) C.y = f + A.raio;
    if (C.y > C.alt - f - A.raio) C.y = C.alt - f - A.raio;
  }

  /* §6 — setores --------------------------------------------------------- */

  // O setor sai do PLACAR, e nao da distancia crua. O placar ja soma o bonus
  // da rocada e dos desafios; com o setor preso so a distancia, o numero na
  // tela e a troca de mundo andavam em unidades diferentes, e a divisao
  // "0 a 300 e facil" nunca fechava com o que se via.
  // Os atos crescem na proporcao 1 : 2,5 : 4 — a que o dono desenhou como
  // 1.000 / 2.500 / 4.000. Os absolutos dele nao cabem: 1.000 m sao 20.000px,
  // uns 50 segundos vivo, e a corrida mediana dura 5. Com o fim do primeiro
  // ato ali, toda partida morreria no Subsolo e a Forja nunca apareceria.
  // A proporcao era o que importava; a escala e a que cabe.
  function setorDeM(m) {
    for (var i = 0; i < ATOS.length - 1; i++) if (m < ATOS[i].ate) return i;
    return ATOS.length - 1;
  }

  function corSetorEmM(m) { return ATOS[setorDeM(m)].cor; }

  /* §7 — mundo ----------------------------------------------------------- */

  function dureza() {
    var d = C.camX - C.base;
    return d < 0 ? 0 : (d > A.durezaEm ? 1 : d / A.durezaEm);
  }

  // Tudo guardado em FRACAO da altura util. A faixa engrossa a cada setor e
  // a janela pode mudar de tamanho: com pixel gravado, um vao ja existente
  // fecharia sozinho e mataria quem estivesse dentro dele.
  function geo(g, p) {
    var f = faixa(), H = C.alt - f * 2;

    if (p.anc === 'pendulo') {
      var L = p.fL * H, r = p.fr * H;
      var ang = p.amp * Math.sin(p.fase + C.tempo * p.vel);
      var ox = g.x + g.w / 2;
      var oy = p.lado === 'teto' ? f : C.alt - f;
      var lado = p.lado === 'teto' ? 1 : -1;
      return { tipo: 'bola', r: r, amp: p.amp, L: L, ang: ang, lado: lado,
        ox: ox, oy: oy, cx: ox + Math.sin(ang) * L, cy: oy + lado * Math.cos(ang) * L };
    }

    var h = p.fh * H;
    if (p.anc === 'teto') return { tipo: 'ret', x: g.x, y: f, w: g.w, h: h };
    if (p.anc === 'chao') return { tipo: 'ret', x: g.x, y: C.alt - f - h, w: g.w, h: h };
    var fc = p.fc + (p.mov ? p.mov.fa * Math.sin(p.mov.fase + C.tempo * p.mov.vel) : 0);
    return { tipo: 'ret', x: g.x, y: f + fc * H - h / 2, w: g.w, h: h };
  }

  // A folga de uma peca ate o disco. Para a bola do pendulo e circulo contra
  // circulo, nao a caixa que a cerca: com caixa, os cantos matariam sem
  // encostar, e o desenho estaria mentindo.
  function folgaPeca(b, jx, jy) {
    if (b.tipo === 'bola') {
      var dx = jx - b.cx, dy = jy - b.cy;
      return Math.sqrt(dx * dx + dy * dy) - b.r - A.raio;
    }
    return folga(jx, jy, A.raio, b.x, b.y, b.w, b.h);
  }

  function gerar() {
    while (C.proximoX < C.camX + C.larg + 700) {
      var k = dureza();
      var s = ATOS[C.setor];
      var w = acaso(46, 80);
      var g = { x: C.proximoX, w: w, setor: C.setor, pecas: [], dmin: Infinity, pronto: false };
      var folgaExtra = 0;
      var sorte = Math.random();

      // O primeiro obstaculo da corrida e sempre um bloco de TETO. Quem
      // comeca nasce parado, encostado no chao: um bloco de chao logo de
      // cara pede uma subida do zero com pouco aviso, e um de teto nao pede
      // nada. Medido antes disso: 7 de 11 corridas morriam no mesmo lugar,
      // sempre no ponto onde cai o primeiro obstaculo.
      var corte1 = C.primeiro ? 0 : s.vao;
      var corte2 = C.primeiro ? 0 : corte1 + s.pendulo;
      var corte3 = C.primeiro ? 0 : corte2 + s.laje;

      if (sorte < corte1) {
        // vao: duas pecas e uma fresta no meio
        var fvao = Math.max(0.28, 0.46 - 0.12 * k - 0.06 * s.aperto);
        var marg = 0.07;
        var fc = acaso(fvao / 2 + marg, 1 - fvao / 2 - marg);
        g.pecas.push({ anc: 'teto', fh: fc - fvao / 2 });
        g.pecas.push({ anc: 'chao', fh: 1 - (fc + fvao / 2) });
        folgaExtra = 70;

      } else if (sorte < corte2) {
        // Pendulo: bola de espinhos presa por corrente a um pino no teto ou
        // no chao, varrendo um arco. A largura do GRUPO cobre o arco inteiro
        // — sem isso a bola sai da faixa que o jogo olha e mata por tras.
        var lado = Math.random() < 0.62 ? 'teto' : 'chao';
        var fL = acaso(0.34, 0.50);
        var fr = acaso(0.085, 0.125);
        var amp = acaso(0.62, 1.15);
        g.pecas.push({ anc: 'pendulo', lado: lado, fL: fL, fr: fr, amp: amp,
          vel: acaso(1.2, 2.1), fase: Math.random() * 6.2832 });
        var Href = C.alt * (1 - s.fFaixa * 2);
        g.w = Math.max(w, (2 * Math.sin(amp) * fL + 2 * fr) * Href);
        folgaExtra = 150;

      } else if (sorte < corte3) {
        // laje solta no meio do campo
        g.pecas.push({ anc: 'livre', fh: acaso(0.10, 0.19), fc: acaso(0.30, 0.70), mov: null });
        folgaExtra = 70;

      } else {
        g.pecas.push({
          anc: C.primeiro ? 'teto' : (Math.random() < 0.5 ? 'chao' : 'teto'),
          fh: C.primeiro ? acaso(0.16, 0.26) : Math.min(0.62, acaso(0.16, 0.38 + 0.16 * k))
        });
      }
      C.primeiro = false;

      // semente fixa por peca: sem ela a textura sorteia de novo a cada
      // quadro e o obstaculo fica fervendo
      for (var q = 0; q < g.pecas.length; q++) g.pecas[q].s = Math.random();
      C.obst.push(g);
      C.proximoX += g.w + (A.espBase - A.espCorte * k) * s.esp + folgaExtra;
    }

    var i = 0;
    while (i < C.obst.length) {
      if (C.obst[i].x + C.obst[i].w < C.camX - 200) C.obst.splice(i, 1); else i++;
    }
  }

  function limparMundo() {
    C.obst.length = 0; C.rastro.length = 0; C.cacos.length = 0;
    C.faiscas.length = 0; C.part.length = 0;
    C.y = C.alt - faixa() - A.raio;
    C.vy = 0; C.inv = 0; C.tremor = 0; C.segurando = false;
    C.escalaTempo = 1; C.mult = 0; C.bonus = 0; C.rocadas = 0; C.semTocar = 0;
    C.passouRecorde = false; C.primeiro = true;
    C.maxMult = 0; C.maxSemTocar = 0; C.limpo = 0; C.maxLimpo = 0;
    C.passados = 0; C.premioDesafios = 0;
  }

  /* §8 — passo da fisica ------------------------------------------------- */

  function placarAgora() {
    return Math.floor((C.camX - C.base) / A.passoM) + C.bonus;
  }

  // Onde a marca do recorde cai AGORA. Ela anda para tras a cada rocada,
  // porque o bonus ja comeu parte da diferenca: e o ponto onde o recorde
  // cai se dali em diante nao vier mais bonus nenhum.
  function marcaX() {
    return C.base + Math.max(0, C.recorde - C.bonus) * A.passoM;
  }

  function passo(dt) {
    var d = C.camX - C.base;
    var s = ATOS[C.setor];
    var vel = A.velBase + Math.min(d / A.velRampa, A.velGanho) + s.vel;
    C.camX += vel * dt;
    C.tempo += dt;

    var novo = setorDeM(placarAgora());
    if (novo !== C.setor) {
      C.setor = novo;
      // o ato e o que a pessoa guarda — "cheguei na Forja" —, entao ele diz
      // o nome E a dificuldade, em voz alta
      avisar(ATOS[novo].nome + ' · ' + ATOS[novo].dif, ATOS[novo].cor, 1900, 'ato');
      SONS.ato();
    }
    // a faixa engrossa devagar: de uma vez ela empurraria quem esta encostado
    C.fFaixa += (ATOS[C.setor].fFaixa - C.fFaixa) * Math.min(1, dt / 0.5);

    C.vy += (C.segurando ? -A.grav : A.grav) * dt;
    if (C.vy > A.vyMax) C.vy = A.vyMax;
    if (C.vy < -A.vyMax) C.vy = -A.vyMax;
    C.y += C.vy * dt;

    var f = faixa(), teto = f + A.raio, chao = C.alt - f - A.raio;
    if (C.y < teto) { C.y = teto; if (C.vy < 0) C.vy = 0; C.semTocar = 0; }
    if (C.y > chao) { C.y = chao; if (C.vy > 0) C.vy = 0; C.semTocar = 0; }

    gerar();

    var jx = C.camX + C.larg * A.xJogador;
    C.rastro.push({ wx: jx, y: C.y });
    while (C.rastro.length > A.rastro) C.rastro.shift();

    // rocada, colisao e perigo saem todos da mesma folga medida
    var maisPerto = Infinity;
    for (var i = 0; i < C.obst.length; i++) {
      var g = C.obst[i];
      if (g.x > jx + C.larg) continue;

      if (g.x <= jx + A.raio + 40 && g.x + g.w >= jx - A.raio - 40) {
        for (var j = 0; j < g.pecas.length; j++) {
          var b = geo(g, g.pecas[j]);
          var fo = folgaPeca(b, jx, C.y);
          if (fo < 0) { morrer(); return; }
          if (fo < g.dmin) g.dmin = fo;
          if (fo < maisPerto) maisPerto = fo;
        }
      }

      // o grupo so e julgado quando passa inteiro por tras do disco
      if (!g.pronto && g.x + g.w < jx - A.raio) {
        g.pronto = true;
        C.semTocar++;
        C.passados++;
        if (C.semTocar > C.maxSemTocar) C.maxSemTocar = C.semTocar;
        if (g.dmin < A.rocada) {
          C.mult = Math.min(C.mult + 1, A.multMax);
          if (C.mult > C.maxMult) C.maxMult = C.mult;
          C.bonus += C.mult;
          C.rocadas++;
          C.limpo = 0;
          C.faiscas.push({ x: g.x + g.w, y: C.y, v: 1, n: C.mult });
          SONS.rocada(C.mult);
        } else {
          C.mult = 0;
          C.limpo++;
          if (C.limpo > C.maxLimpo) C.maxLimpo = C.limpo;
        }
      }
    }

    // camera lenta: sobe depressa e desce devagar, senao pisca
    var alvoT = maisPerto < A.perigo ? A.lenta : 1;
    var vel2 = alvoT < C.escalaTempo ? 0.035 : 0.22;
    C.escalaTempo += (alvoT - C.escalaTempo) * Math.min(1, dt / vel2);

    var m = placarAgora();
    if (!C.passouRecorde && C.recorde > 0 && jx > marcaX()) {
      C.passouRecorde = true;
      avisar('Recorde', '#edeae3');
      SONS.marca();
    }

    if (m !== placarEscrito) { placarEscrito = m; el.placar.textContent = m; }
    if (C.mult !== multEscrito) {
      multEscrito = C.mult;
      el.mult.hidden = C.mult < 1;
      el.multN.textContent = C.mult;
    }
    if (C.setor !== setorEscrito) {
      setorEscrito = C.setor;
      el.hudSetor.textContent = ATOS[C.setor].nome;
      el.hudDif.textContent = ATOS[C.setor].dif;
    }

    conferirProezas(m);
    conferirDesafios(m);
    emitir(dt);
  }

  /* §8b — enfeite dos setores: faisca e pedra ---------------------------- */
  /* Nada disto tem colisao. Quem mata e o retangulo, e so ele: um enfeite
     que mata e um enfeite que mente. */

  // O AR DO ATO. Terra caindo do teto no Subsolo, brasa subindo do chao na
  // Forja, cascalho despencando no Desabamento. E a coisa que mais diz o
  // tema, porque acontece na tela inteira e o tempo todo — nao so onde ha
  // obstaculo. Como tudo que e enfeite aqui, nao tem colisao nenhuma.
  function ambiente(dt) {
    if (C.poucoMov || C.part.length > 170) return;
    var tema = ATOS[C.setor].tema, f = faixa();
    var taxa = tema === 'fogo' ? 9 : 11;
    if (Math.random() > dt * taxa) return;
    var x = C.camX + acaso(-40, C.larg + 40);

    // `d` e o quanto a vida desce por segundo: sem ele a terra morria em
    // menos de 1s e nao saia de perto do teto — caia 35px e sumia.
    if (tema === 'terra') {
      C.part.push({ t: 'a', cor: COR_TERRA, x: x, y: f + acaso(0, 8),
        vx: acaso(-40, 5), vy: acaso(70, 190), r: acaso(1.4, 3), v: 1, d: 0.3, g: 110 });
    } else if (tema === 'fogo') {
      C.part.push({ t: 'a', cor: COR_FAISCA, x: x, y: C.alt - f - acaso(0, 8),
        vx: acaso(-70, 10), vy: acaso(-190, -80), r: acaso(1.6, 3.2), v: 1, d: 0.42, g: -25 });
    } else {
      C.part.push({ t: 'p', x: x, y: f + acaso(0, 10),
        vx: acaso(-45, 0), vy: acaso(60, 150), r: acaso(2.2, 5), v: 1, d: 0.34 });
    }
  }

  function emitir(dt) {
    ambiente(dt);
    if (C.poucoMov || C.part.length > 140) return;
    for (var i = 0; i < C.obst.length; i++) {
      var g = C.obst[i];
      var sx = g.x - C.camX;
      if (sx > C.larg || sx + g.w < 0) continue;
      var tema = ATOS[C.setor].tema;

      for (var j = 0; j < g.pecas.length; j++) {
        var pc = g.pecas[j];
        var b = geo(g, pc);

        if (b.tipo === 'bola') {
          // solta no fundo do arco, que e onde ela corre mais rapido
          if (Math.abs(b.ang) > b.amp * 0.4) continue;
          if (Math.random() > dt * 14) continue;
          C.part.push({ t: tema === 'pedra' ? 'p' : 'f',
            x: b.cx + acaso(-b.r, b.r), y: b.cy + acaso(-b.r, b.r),
            vx: acaso(-140, -20), vy: acaso(-110, 110), r: acaso(1.8, 3.2), v: acaso(0.5, 1) });
          continue;
        }

        if (tema === 'terra') {
          // estaca velha largando terra pela aresta virada para o campo
          if (b.tipo === 'bola' || Math.random() > dt * 3.2) continue;
          var ey = pc.anc === 'teto' ? b.y + b.h : (pc.anc === 'chao' ? b.y : b.y + b.h);
          C.part.push({ t: 'a', cor: COR_TERRA, x: b.x + acaso(2, b.w - 2), y: ey,
            vx: acaso(-40, 0), vy: acaso(20, 90), r: acaso(1.3, 2.6), v: 1, d: 0.35, g: 110 });
          continue;
        }

        if (tema === 'fogo') {
          if (Math.random() > dt * 10) continue;
          var py = pc.anc === 'teto' ? b.y + b.h : (pc.anc === 'chao' ? b.y : b.y + Math.random() * b.h);
          var dir = pc.anc === 'teto' ? 1 : (pc.anc === 'chao' ? -1 : (Math.random() < 0.5 ? -1 : 1));
          C.part.push({ t: 'f', x: b.x + acaso(4, b.w - 4), y: py,
            vx: acaso(-90, 10), vy: dir * acaso(50, 190), v: acaso(0.5, 1) });
        } else if (pc.anc === 'teto') {
          if (Math.random() > dt * 2.4) continue;
          C.part.push({ t: 'p', x: b.x + acaso(3, b.w - 3), y: b.y + b.h,
            vx: acaso(-30, 0), vy: acaso(10, 60), r: acaso(1.8, 3.6), v: 1 });
        }
      }
    }
  }

  function sortearDesafios() {
    var pool = DESAFIOS.slice(), i, j, t;
    for (i = pool.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    // sempre um facil, um medio e um dificil, nessa ordem: a partida ganha
    // uma meta que quase sempre se cumpre e uma que quase nunca
    var fora = [];
    for (i = 0; i < 3; i++) {
      fora.push({ d: pool[i], alvo: pool[i].alvos[i], premio: pool[i].premios[i], feito: false });
    }
    return fora;
  }

  function conferirDesafios(m) {
    if (!C.desafios.length) return;
    var e = { m: m, rocadas: C.rocadas, maxMult: C.maxMult, maxSemTocar: C.maxSemTocar,
      setor: C.setor, tempo: C.tempo, passados: C.passados, maxLimpo: C.maxLimpo };
    for (var i = 0; i < C.desafios.length; i++) {
      var x = C.desafios[i];
      if (x.feito || x.d.le(e) < x.alvo) continue;
      x.feito = true;
      C.bonus += x.premio;
      C.premioDesafios += x.premio;
      avisar('+' + x.premio + ' m', '#ff3b14');
      SONS.meta();
    }
  }

  function conferirProezas(m) {
    if (m >= 200) marcar('cem');
    if (m >= 500) marcar('duzentos');
    if (C.semTocar >= 10) marcar('voo');
    if (C.mult >= A.multMax) marcar('fio');
    if (C.setor >= 2) marcar('fundo');
    if (!C.inverter && m >= 100) marcar('cegas');
    if (C.tempo >= 30) marcar('folego');
    if (C.rocadas >= 20) marcar('limalha');
  }

  function marcar(id) {
    if (C.proezas[id]) return;
    C.proezas[id] = 1;
    guardar('avesso.proezas', Object.keys(C.proezas).join(','));
  }

  // O CSS precisa saber onde a faixa acaba para pousar o HUD abaixo dela.
  // So escreve quando muda de verdade: escrever variavel do documento a cada
  // quadro refaz layout a cada quadro, que e exatamente o tremor que a regra
  // do `transform` no CLAUDE.md existe para evitar.
  var faixaEscrita = -1;
  function avisarFaixa() {
    // C.altCSS vem do medir(), nunca de uma leitura aqui: ler clientHeight
    // dentro do laco forca o navegador a recalcular layout a cada quadro,
    // que e exatamente o tremor que a regra do transform existe para evitar.
    var px = Math.round(C.fFaixa * C.altCSS);
    if (px === faixaEscrita) return;
    faixaEscrita = px;
    document.documentElement.style.setProperty('--faixa', px + 'px');
  }

  function atualizar(dtReal) {
    avisarFaixa();
    if (!C.poucoMov) C.relogio += dtReal;
    var dt = dtReal * (C.estado === 'jogando' ? C.escalaTempo : 1);

    if (C.estado === 'jogando') passo(dt);
    else if ((C.estado === 'menu' || C.estado === 'largada') && !C.poucoMov) {
      C.camX += A.velMenu * dt; C.tempo += dt;
    }

    for (var i = C.cacos.length - 1; i >= 0; i--) {
      var c = C.cacos[i];
      c.vy += 1700 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; c.v -= dt * 1.25;
      if (c.v <= 0) C.cacos.splice(i, 1);
    }
    var chao = C.alt - faixa();
    for (var q = C.part.length - 1; q >= 0; q--) {
      var w = C.part[q];
      if (w.t === 'p') {
        w.vy += 900 * dt;
      } else if (w.t === 'a') {
        w.vy += (w.g || 0) * dt;
        w.vx -= w.vx * Math.min(1, dt * 0.5);
      } else {
        w.vx -= w.vx * Math.min(1, dt * 2.0);
        w.vy -= w.vy * Math.min(1, dt * 1.6);
      }
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      if (w.t === 'p' && w.y > chao) { w.y = chao; w.vy = 0; w.vx *= 0.25; }
      w.v -= dt * (w.d || (w.t === 'p' ? 0.5 : 1.5));
      if (w.v <= 0 || w.x < C.camX - 140) C.part.splice(q, 1);
    }

    for (var j = C.faiscas.length - 1; j >= 0; j--) {
      C.faiscas[j].v -= dtReal * 1.7;
      if (C.faiscas[j].v <= 0) C.faiscas.splice(j, 1);
    }

    if (C.tremor > 0) C.tremor = Math.max(0, C.tremor - dtReal * 55);

    // quando a gravidade vira, o relogio do movimento marca a hora: Avesso,
    // Mola e Bussola vivem disso
    if (C.segurando !== C.segAntes) { C.segAntes = C.segurando; C.virou = C.tempo; }
    // giro que acelera com a queda, para a Helice
    C.giro += dtReal * (4 + Math.abs(C.vy / A.vyMax) * 16);

    // A paleta caminha ate a do ato em ~0.8s. E ela que faz o Subsolo parecer
    // terra e a Forja parecer fogo sem uma palavra escrita — e caminhando, a
    // troca de ato deixa de ser um pisca e vira uma virada de luz.
    var at = ATOS[C.setor], andar = Math.min(1, dtReal / 0.8);
    C.tintaC = mistura(C.tintaC, at.tinta, andar);
    C.ossoC = mistura(C.ossoC, at.osso, andar);

    var alvo = (C.estado === 'jogando' && C.segurando && C.inverter && !C.poucoMov) ? 1 : 0;
    C.inv += (alvo - C.inv) * Math.min(1, dtReal / A.inverteEm);
  }

  /* §9 — desenho --------------------------------------------------------- */

  function caminho(ctx, forma, r) {
    ctx.beginPath();
    var i, an, x, y;
    switch (forma) {
      case 'quadrado': ctx.rect(-r * 0.86, -r * 0.86, r * 1.72, r * 1.72); break;
      case 'losango':
        ctx.moveTo(0, -r * 1.18); ctx.lineTo(r * 1.18, 0);
        ctx.lineTo(0, r * 1.18); ctx.lineTo(-r * 1.18, 0); ctx.closePath(); break;
      case 'hexagono':
        for (i = 0; i < 6; i++) {
          an = Math.PI / 6 + i * Math.PI / 3;
          x = Math.cos(an) * r * 1.1; y = Math.sin(an) * r * 1.1;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.closePath(); break;
      case 'triangulo':
        ctx.moveTo(r * 1.3, 0); ctx.lineTo(-r * 0.88, -r * 1.08);
        ctx.lineTo(-r * 0.88, r * 1.08); ctx.closePath(); break;
      case 'capsula': ctx.ellipse(0, 0, r * 1.32, r * 0.78, 0, 0, 6.2832); break;
      case 'cruz':
        var b = r * 0.40, a = r * 1.16;
        ctx.moveTo(-b, -a); ctx.lineTo(b, -a); ctx.lineTo(b, -b); ctx.lineTo(a, -b);
        ctx.lineTo(a, b); ctx.lineTo(b, b); ctx.lineTo(b, a); ctx.lineTo(-b, a);
        ctx.lineTo(-b, b); ctx.lineTo(-a, b); ctx.lineTo(-a, -b); ctx.lineTo(-b, -b);
        ctx.closePath(); break;
      default: ctx.arc(0, 0, r, 0, 6.2832);
    }
  }

  // Serve ao campo e ao vestiario. O ponto da gravidade e desenhado FORA da
  // rotacao: ele aponta para onde o mundo puxa, e o mundo nao gira.
  function estadoMov() {
    return { t: C.tempo, vy: C.vy, vyMax: A.vyMax, segurando: C.segurando,
      camX: C.camX, raio: A.raio, virou: C.virou, giro: C.giro };
  }

  function desenharPeca(ctx, p, r, e, fundo, gravCima, fantasma) {
    var m = (MOVS[p.mov] || MOVS.fixo)(e) || {};
    var ex = m.ex === undefined ? 1 : m.ex;
    var ey = m.ey === undefined ? 1 : m.ey;

    if (m.eco && !fantasma) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.translate(-r * 1.6, 0);
      desenharPeca(ctx, p, r * 0.82, e, fundo, gravCima, true);
      ctx.restore();
    }

    ctx.save();
    if (m.a !== undefined) ctx.globalAlpha = m.a;
    ctx.translate(m.dx || 0, m.dy || 0);

    ctx.save();
    ctx.rotate(m.r || 0);
    ctx.scale(ex, ey);
    caminho(ctx, p.forma, r);
    if (p.casca === 'vazado') {
      ctx.lineWidth = r * 0.42; ctx.lineJoin = 'round';
      ctx.strokeStyle = p.cor; ctx.stroke();
    } else if (p.casca === 'partido') {
      ctx.save(); ctx.clip();
      ctx.fillStyle = p.cor; ctx.fillRect(-r * 2, -r * 2, r * 2, r * 4);
      ctx.fillStyle = clarear(p.cor, 0.45); ctx.fillRect(0, -r * 2, r * 2, r * 4);
      ctx.restore();
    } else {
      ctx.fillStyle = p.cor; ctx.fill();
      if (p.casca === 'anel') { caminho(ctx, p.forma, r * 0.46); ctx.fillStyle = fundo; ctx.fill(); }
    }
    ctx.restore();

    // o ponto da gravidade NAO gira nem escala: ele aponta para onde o mundo
    // puxa, e o mundo nao se mexe junto com a roupa
    ctx.beginPath();
    ctx.arc(0, gravCima ? -r * 0.5 : r * 0.5, r * 0.24, 0, 6.2832);
    ctx.fillStyle = (p.casca === 'vazado' || p.casca === 'anel') ? p.cor : fundo;
    ctx.fill();

    ctx.restore();
  }

  // Desenha a cara do setor por cima da peca ja pintada. Tudo em cor de
  // FUNDO, nunca numa cor propria: assim a textura inverte junto com o
  // mundo sem ninguem escrever a regra duas vezes.
  // A aresta interna da faixa, com a cara do ato: terra batida desmorona em
  // conchas, a forja pinga escoria com um fio quente na borda, a rocha sai
  // lascada. E o que faz o ato se reconhecer num relance, sem texto.
  // Nada disto tem colisao: a borda de verdade continua reta, onde a faixa
  // acaba. Por isso o recorte so TIRA da faixa (ou pendura algo curto), e
  // nunca sugere chao onde nao ha.
  function bordaFaixa(f, solido, fundo, acento, tema) {
    var passo = 46, base0 = Math.floor(C.camX / passo), desl = C.camX % passo;
    var topo = f, pe = C.alt - f, i, x, idx, s1, s2, h1, h2;
    cx.save();
    for (i = -1; i * passo - desl < C.larg + passo; i++) {
      x = i * passo - desl;
      idx = base0 + i;
      s1 = Math.sin(idx * 12.9 + 7.3) * 0.5 + 0.5;
      s2 = Math.sin(idx * 7.7 + 3.1) * 0.5 + 0.5;

      if (tema === 'terra') {
        // sem a irregularidade (e sem pular alguns) isto vira renda, nao
        // terra desmoronando: o olho pega a repeticao antes de pegar o tema
        cx.fillStyle = fundo;
        if (s1 > 0.22) {
          cx.beginPath();
          cx.arc(x + passo * (0.2 + s2 * 0.6), topo, passo * (0.08 + s1 * 0.26), Math.PI, 0);
          cx.fill();
        }
        if (s2 > 0.18) {
          cx.beginPath();
          cx.arc(x + passo * (0.15 + s1 * 0.65), pe, passo * (0.07 + s2 * 0.25), 0, Math.PI);
          cx.fill();
        }

      } else if (tema === 'fogo') {
        cx.fillStyle = solido;
        if (s1 > 0.25) {
          h1 = 3 + s1 * 15;
          cx.fillRect(x + passo * (0.1 + s2 * 0.6), topo, passo * (0.1 + s1 * 0.14), h1);
          cx.beginPath();
          cx.arc(x + passo * (0.15 + s2 * 0.6), topo + h1, passo * (0.05 + s1 * 0.07), 0, 6.2832);
          cx.fill();
        }
        if (s2 > 0.35) {
          h2 = 3 + s2 * 11;
          cx.fillRect(x + passo * (0.2 + s1 * 0.6), pe - h2, passo * (0.08 + s2 * 0.12), h2);
        }
        cx.fillStyle = acento; cx.globalAlpha = 0.5;
        cx.fillRect(x, topo - 2.5, passo, 2.5);
        cx.fillRect(x, pe, passo, 2.5);
        cx.globalAlpha = 1;

      } else {
        // lascas de larguras e alturas diferentes, e nem toda casa tem uma:
        // em zigue-zague parelho isto lia como serrilha de selo, nao rocha
        cx.fillStyle = fundo;
        if (s1 > 0.15) {
          cx.beginPath();
          cx.moveTo(x + passo * s2 * 0.3, topo);
          cx.lineTo(x + passo * (0.15 + s1 * 0.5), topo - (4 + s1 * 17));
          cx.lineTo(x + passo * (0.45 + s2 * 0.5), topo);
          cx.closePath(); cx.fill();
        }
        if (s2 > 0.12) {
          cx.beginPath();
          cx.moveTo(x + passo * s1 * 0.25, pe);
          cx.lineTo(x + passo * (0.2 + s2 * 0.45), pe + (4 + s2 * 15));
          cx.lineTo(x + passo * (0.5 + s1 * 0.45), pe);
          cx.closePath(); cx.fill();
        }
      }
    }
    cx.restore();
  }

  function textura(b, tema, pc, fundo) {
    var sd = pc.s || 0, i;
    cx.save();
    cx.fillStyle = fundo;

    if (tema === 'terra') {
      cx.globalAlpha = 0.2;
      var n = Math.max(3, Math.min(14, Math.floor(b.h / 20)));
      for (i = 0; i < n; i++) {
        var a1 = Math.sin(sd * 99 + i * 12.9) * 0.5 + 0.5;
        var a2 = Math.sin(sd * 57 + i * 7.3) * 0.5 + 0.5;
        cx.fillRect(b.x + 4 + a1 * Math.max(0, b.w - 11), b.y + 6 + a2 * Math.max(0, b.h - 13), 3, 3);
      }

    } else if (tema === 'madeira') {
      cx.globalAlpha = 0.17;
      var linhas = Math.max(2, Math.min(6, Math.floor(b.h / 28)));
      for (i = 1; i <= linhas; i++) cx.fillRect(b.x + 3, b.y + (b.h * i) / (linhas + 1), b.w - 6, 1.6);
      cx.globalAlpha = 0.22;
      cx.beginPath();
      cx.ellipse(b.x + b.w * 0.5, b.y + b.h * (0.2 + sd * 0.6), b.w * 0.16, b.w * 0.1, 0, 0, 6.2832);
      cx.fill();

    } else if (tema === 'fogo') {
      // roda entalhada girando, inscrita DENTRO do retangulo: o que gira
      // nunca passa da caixa que mata, senao o desenho mentiria
      var r = Math.min(b.w, b.h) * 0.34;
      if (r > 4.5) {
        var px = b.x + b.w / 2;
        var py = pc.anc === 'teto' ? b.y + b.h - r - 3 : (pc.anc === 'chao' ? b.y + r + 3 : b.y + b.h / 2);
        cx.globalAlpha = 0.8;
        cx.translate(px, py);
        cx.rotate(C.poucoMov ? sd * 6.2832 : C.tempo * 2.3 + sd * 6.2832);
        for (i = 0; i < 6; i++) {
          cx.rotate(1.0472);
          cx.fillRect(-r * 0.17, -r, r * 0.34, r * 0.58);
        }
        cx.beginPath(); cx.arc(0, 0, r * 0.34, 0, 6.2832); cx.fill();
      }

    } else {
      // pedra: lascas na borda virada para o campo
      cx.globalAlpha = 0.3;
      var borda = pc.anc === 'teto' ? b.y + b.h : b.y;
      var sinal = pc.anc === 'teto' ? -1 : 1;
      var q = Math.max(2, Math.min(8, Math.floor(b.w / 13)));
      var lw = b.w / q;
      for (i = 0; i < q; i++) {
        var f = Math.sin(sd * 71 + i * 4.1) * 0.5 + 0.5;
        cx.beginPath();
        cx.moveTo(b.x + i * lw, borda);
        cx.lineTo(b.x + (i + 0.5) * lw, borda + sinal * (4 + f * 9));
        cx.lineTo(b.x + (i + 1) * lw, borda);
        cx.closePath(); cx.fill();
      }
    }
    cx.restore();
  }

  // No Subsolo as pecas se dividem entre terra e madeira pela propria
  // semente, para o ato nao ficar de uma cor so.
  function temaDa(tema, pc) {
    if (tema !== 'terra') return tema;
    return (pc.s || 0) < 0.5 ? 'terra' : 'madeira';
  }

  // O pendulo e desenhado por inteiro: o arco que ele varre, a corrente, o
  // pino e a bola de espinhos. O arco e o que torna ele justo — avisa para
  // onde a bola vai antes de ela ir. Os espinhos ficam TODOS dentro do raio
  // que mata; o que passa da conta mentiria.
  function desenharPendulo(b, solido, fundo, tema) {
    var ox = b.ox - C.camX, bx = b.cx - C.camX;
    var base = b.lado > 0 ? 1.5708 : -1.5708;
    cx.save();

    cx.strokeStyle = solido;
    cx.globalAlpha = 0.14;
    cx.lineWidth = Math.max(2, b.r * 0.18);
    cx.beginPath();
    cx.arc(ox, b.oy, b.L, base - b.amp, base + b.amp, b.lado < 0);
    cx.stroke();
    cx.globalAlpha = 1;

    // corrente: elos, nao um risco. É o que faz ler como peso pendurado
    var elos = Math.max(3, Math.round(b.L / 26));
    cx.lineWidth = Math.max(2.5, b.r * 0.17);
    cx.lineCap = 'round';
    for (var i = 0; i < elos; i++) {
      var t0 = i / elos, t1 = (i + 0.62) / elos;
      cx.beginPath();
      cx.moveTo(ox + (bx - ox) * t0, b.oy + (b.cy - b.oy) * t0);
      cx.lineTo(ox + (bx - ox) * t1, b.oy + (b.cy - b.oy) * t1);
      cx.stroke();
    }

    cx.fillStyle = solido;
    cx.beginPath(); cx.arc(ox, b.oy, Math.max(5, b.r * 0.3), 0, 6.2832); cx.fill();

    cx.translate(bx, b.cy);
    cx.rotate(b.ang * 1.7);
    cx.beginPath();
    for (var k = 0; k < 12; k++) {
      var an = (k / 12) * 6.2832;
      var rr = k % 2 ? b.r * 0.58 : b.r;
      var px = Math.cos(an) * rr, py = Math.sin(an) * rr;
      if (k) cx.lineTo(px, py); else cx.moveTo(px, py);
    }
    cx.closePath(); cx.fill();

    cx.fillStyle = fundo;
    cx.beginPath(); cx.arc(0, 0, b.r * 0.3, 0, 6.2832); cx.fill();
    if (tema === 'fogo') {
      cx.fillStyle = COR_FAISCA;
      cx.globalAlpha = 0.9;
      cx.beginPath(); cx.arc(0, 0, b.r * 0.17, 0, 6.2832); cx.fill();
    }
    cx.restore();
  }

  function desenhar() {
    var p = porId[C.vestido] || P[0];
    cx.setTransform(esc, 0, 0, esc, 0, 0);
    cx.save();
    if (C.tremor > 0.2) {
      cx.translate((Math.random() * 2 - 1) * C.tremor, (Math.random() * 2 - 1) * C.tremor);
    }

    var fA = mistura(C.tintaC, C.ossoC, C.inv);
    var sA = mistura(C.ossoC, C.tintaC, C.inv);
    var fundo = cor(fA), solido = cor(sA);
    var f = faixa();

    cx.fillStyle = fundo;
    cx.fillRect(-48, -48, C.larg + 96, C.alt + 96);

    cx.fillStyle = cor(mistura(fA, sA, 0.085));
    var vaoM = 140, desl = (C.camX * 0.45) % vaoM;
    for (var mx = -desl; mx < C.larg; mx += vaoM) cx.fillRect(mx, f, 2, C.alt - f * 2);

    // a marca do recorde, pintada com a cor do setor onde ela cai
    if (C.estado === 'jogando' && C.recorde > 0 && !C.passouRecorde) {
      var mX = marcaX() - C.camX;
      if (mX > -40 && mX < C.larg + 40) {
        cx.save();
        cx.fillStyle = corSetorEmM(C.recorde);
        cx.globalAlpha = 0.5; cx.fillRect(mX - 1.5, f, 3, C.alt - f * 2);
        cx.globalAlpha = 1; cx.fillRect(mX - 9, f, 18, 7); cx.fillRect(mX - 9, C.alt - f - 7, 18, 7);
        cx.restore();
      }
    }

    cx.fillStyle = solido;
    cx.fillRect(0, 0, C.larg, f);
    cx.fillRect(0, C.alt - f, C.larg, f);
    bordaFaixa(f, solido, fundo, ATOS[C.setor].pino, ATOS[C.setor].tema);

    for (var i = 0; i < C.obst.length; i++) {
      var g = C.obst[i];
      var sx = g.x - C.camX;
      if (sx > C.larg + 8 || sx + g.w < -8) continue;
      var tema = ATOS[C.setor].tema;
      for (var j = 0; j < g.pecas.length; j++) {
        var pc = g.pecas[j];
        var b = geo(g, pc);
        if (b.tipo === 'bola') { desenharPendulo(b, solido, fundo, tema); continue; }
        b.x -= C.camX;
        cx.fillStyle = solido;
        cx.fillRect(b.x, b.y, b.w, b.h);
        textura(b, temaDa(tema, pc), pc, fundo);
      }
    }

    // faiscas e pedras soltas
    for (var pq = 0; pq < C.part.length; pq++) {
      var w2 = C.part[pq];
      var wx = w2.x - C.camX;
      if (wx < -20 || wx > C.larg + 20) continue;
      cx.globalAlpha = Math.max(0, Math.min(1, w2.v));
      if (w2.t === 'f') {
        cx.fillStyle = COR_FAISCA;
        cx.fillRect(wx - 1.6, w2.y - 1.6, 3.2, 3.2);
      } else if (w2.t === 'a') {
        cx.fillStyle = w2.cor;
        cx.fillRect(wx - w2.r / 2, w2.y - w2.r / 2, w2.r, w2.r);
      } else {
        cx.fillStyle = COR_PEDRA;
        cx.fillRect(wx - w2.r / 2, w2.y - w2.r / 2, w2.r, w2.r);
      }
    }
    cx.globalAlpha = 1;

    var jx = C.larg * A.xJogador;

    // rastro, no estilo da roupa
    if (p.rastro !== 'nenhum' && C.rastro.length > 1) {
      cx.save();
      if (p.rastro === 'risco') {
        cx.strokeStyle = p.cor; cx.globalAlpha = 0.3;
        cx.lineWidth = A.raio * 0.8; cx.lineCap = 'round'; cx.lineJoin = 'round';
        cx.beginPath();
        for (var r1 = 0; r1 < C.rastro.length; r1++) {
          var q = C.rastro[r1];
          if (r1) cx.lineTo(q.wx - C.camX, q.y); else cx.moveTo(q.wx - C.camX, q.y);
        }
        cx.stroke();
      } else {
        cx.fillStyle = p.cor;
        var salto = p.rastro === 'pontos' ? 2 : 1;
        for (var r2 = 0; r2 < C.rastro.length; r2 += salto) {
          var t = (r2 + 1) / C.rastro.length;
          cx.globalAlpha = t * (p.rastro === 'pontos' ? 0.4 : 0.26);
          cx.beginPath();
          cx.arc(C.rastro[r2].wx - C.camX, C.rastro[r2].y,
                 A.raio * (p.rastro === 'pontos' ? 0.22 : (0.3 + t * 0.55)), 0, 6.2832);
          cx.fill();
        }
      }
      cx.restore();
    }

    // faiscas da rocada
    for (var k = 0; k < C.faiscas.length; k++) {
      var fa = C.faiscas[k];
      cx.save();
      cx.globalAlpha = Math.max(0, fa.v) * 0.9;
      cx.strokeStyle = p.cor; cx.lineWidth = 2.5;
      cx.beginPath();
      cx.arc(fa.x - C.camX, fa.y, A.raio * (1.3 + (1 - fa.v) * 2.4), 0, 6.2832);
      cx.stroke();
      cx.restore();
    }

    cx.fillStyle = p.cor;
    for (var c2 = 0; c2 < C.cacos.length; c2++) {
      var c = C.cacos[c2];
      cx.save();
      cx.translate(c.x - C.camX, c.y); cx.rotate(c.a);
      cx.globalAlpha = c.v > 1 ? 1 : c.v;
      cx.fillRect(-c.t / 2, -c.t / 2, c.t, c.t);
      cx.restore();
    }

    if (C.estado !== 'morto') {
      cx.save();
      cx.translate(jx, C.y);
      desenharPeca(cx, p, A.raio, estadoMov(), fundo, C.segurando);
      cx.restore();
    }

    cx.restore();
  }

  /* §10 — roupas: o que se tem e o que falta ----------------------------- */

  // Uma vez ganha, nunca se perde. A curva de metros ja subiu uma vez e pode
  // subir de novo; sem este registro, apertar a exigencia TIRA do armario uma
  // roupa que a pessoa ja tinha, que e a pior coisa que uma colecao pode fazer.
  function tem(p) {
    if (p.por.tipo === 'livre') return true;
    if (C.ganhas[p.id]) return true;
    if (p.por.tipo === 'soma') return C.total >= p.por.m;
    return !!C.proezas[p.por.id];
  }

  function gravarGanhas() {
    var mudou = false;
    for (var i = 0; i < P.length; i++) {
      if (tem(P[i]) && !C.ganhas[P[i].id]) { C.ganhas[P[i].id] = 1; mudou = true; }
    }
    if (mudou) guardar('avesso.ganhas', Object.keys(C.ganhas).join(','));
  }

  function tidas() {
    var r = [];
    for (var i = 0; i < P.length; i++) if (tem(P[i])) r.push(P[i].id);
    return r;
  }

  function comoSeGanha(p) {
    if (p.por.tipo === 'livre') return 'De saída';
    if (p.por.tipo === 'soma') return p.por.m + ' m somados';
    return PROEZAS[p.por.id] || '';
  }

  // a proxima por soma, para a barra de progresso da tela de fim
  function proximaPorSoma() {
    var anterior = 0;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      if (p.por.tipo !== 'soma') continue;
      if (C.total < p.por.m) return { p: p, de: anterior, ate: p.por.m };
      anterior = p.por.m;
    }
    return null;
  }

  /* §11 — vida e morte --------------------------------------------------- */

  var contaTimer = null;

  function preparar() {
    C.desafios = sortearDesafios();
    montarMetas(el.metas, C.desafios, false);
    C.estado = 'largada';
    abrir(el.largada);
    contar(3);
  }

  // A contagem e PULAVEL de proposito. Uma corrida dura uns dez segundos;
  // 2,2s de pre-jogo obrigatorio a cada tentativa viraria castigo la pela
  // vigesima. Quem chega ve; quem esta tentando de novo aperta e larga.
  function contar(n) {
    if (contaTimer) window.clearTimeout(contaTimer);
    el.conta.textContent = n;
    if (anima) {
      window.gsap.fromTo(el.conta, { scale: 1.3, autoAlpha: 0.15 },
        { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'power3.out', overwrite: true, clearProps: 'transform' });
    }
    SONS.conta(n);
    contaTimer = window.setTimeout(function () {
      if (C.estado !== 'largada') return;
      if (n > 1) contar(n - 1);
      else pularLargada();
    }, 750);
  }

  function pularLargada() {
    if (C.estado !== 'largada') return;
    if (contaTimer) { window.clearTimeout(contaTimer); contaTimer = null; }
    fechar(el.largada);
    comecar();
  }

  function comecar() {
    C.base = C.camX;
    C.setor = 0; setorEscrito = -1; multEscrito = -1; placarEscrito = -1;
    C.fFaixa = ATOS[0].fFaixa;
    C.tempo = 0;
    limparMundo();
    C.proximoX = C.camX + C.larg * 0.95;
    C.podeReiniciar = false;
    el.placar.textContent = '0';
    el.hudRecorde.textContent = C.recorde;
    el.hudSetor.textContent = ATOS[0].nome;
    el.hudDif.textContent = ATOS[0].dif;
    el.mult.hidden = true;
    C.estado = 'jogando';
    abrir(el.hud);
  }

  function morrer() {
    C.estado = 'morto';
    C.rastro.length = 0;
    C.escalaTempo = 1;
    SONS.morte();

    var p = porId[C.vestido] || P[0];
    var jx = C.camX + C.larg * A.xJogador;
    var quantos = C.poucoMov ? 6 : 15;
    for (var i = 0; i < quantos; i++) {
      var ang = acaso(0, 6.2832), forca = acaso(140, 520);
      C.cacos.push({
        x: jx, y: C.y,
        vx: Math.cos(ang) * forca - 120, vy: Math.sin(ang) * forca - 160,
        a: acaso(0, 3.14), va: acaso(-9, 9), t: acaso(4, 11), v: acaso(0.75, 1.3)
      });
    }
    if (!C.poucoMov) C.tremor = 17;

    var m = placarAgora();
    var antes = tidas();

    C.total += m;
    guardar('avesso.total', C.total);
    conferirProezas(m);
    gravarGanhas();

    var novo = m > C.recorde;
    if (novo) { C.recorde = m; guardar('avesso.recorde', m); }

    var agora = tidas(), novas = [];
    for (var j = 0; j < agora.length; j++) if (antes.indexOf(agora[j]) < 0) novas.push(agora[j]);

    el.fimPlacar.textContent = m;
    el.fimSelo.textContent = novo ? 'Recorde' : 'Bateu';
    var feitos = 0;
    for (var f = 0; f < C.desafios.length; f++) if (C.desafios[f].feito) feitos++;
    el.fimLinha.textContent = (novo ? 'Melhor que todas as anteriores. ' : 'Recorde de ' + C.recorde + ' m. ')
      + (C.rocadas ? C.rocadas + (C.rocadas === 1 ? ' roçada' : ' roçadas') : 'Nenhuma roçada')
      + ' · ' + feitos + ' de ' + C.desafios.length + ' desafios · +' + C.bonus + ' m de bônus.';
    montarMetas(el.metasFim, C.desafios, true);
    el.recorde.textContent = C.recorde;
    el.hudRecorde.textContent = C.recorde;
    atualizarMenu();

    montarNovidade(novas);
    montarBarra();
    void p;

    esperar(0.55, function () {
      if (C.estado !== 'morto') return;
      fechar(el.hud);
      abrir(el.fim);
      C.podeReiniciar = true;
      if (novas.length) SONS.roupa();
    });
  }

  function aoMenu() {
    if (contaTimer) { window.clearTimeout(contaTimer); contaTimer = null; }
    C.estado = 'menu';
    C.podeReiniciar = false; C.segurando = false;
    C.fFaixa = ATOS[0].fFaixa;
    limparMundo();
    atualizarMenu();
    fechar(el.hud); fechar(el.fim); fechar(el.pausa); fechar(el.vestiario); fechar(el.largada);
    abrir(el.inicio);
  }

  function pausar() {
    if (C.estado !== 'jogando') return;
    C.estado = 'pausado'; C.segurando = false;
    abrir(el.pausa);
  }

  function despausar() {
    if (C.estado !== 'pausado') return;
    fechar(el.pausa);
    C.estado = 'jogando';
  }

  /* §12 — telas ---------------------------------------------------------- */

  // Uma tela leva 0.6s saindo, e nesses 0.6s ela ainda esta no documento.
  // Sem o aviso de 'saindo' ela continua recebendo clique o tempo todo:
  // medido, um clique repetido em DE NOVO reiniciava a corrida a cada quadro.
  function abrir(alvo) {
    if (!alvo.hidden && alvo.dataset.saindo !== '1') return;
    alvo.dataset.saindo = ''; alvo.style.pointerEvents = ''; alvo.hidden = false;
    if (!anima) return;
    window.gsap.fromTo(alvo, { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', overwrite: true, clearProps: 'transform' });
  }

  function fechar(alvo) {
    if (alvo.hidden || alvo.dataset.saindo === '1') return;
    if (!anima) { alvo.hidden = true; return; }
    alvo.dataset.saindo = '1';
    alvo.style.pointerEvents = 'none';
    window.gsap.to(alvo, {
      autoAlpha: 0, duration: 0.6, ease: 'power3.out', overwrite: true,
      onComplete: function () {
        alvo.hidden = true;
        window.gsap.set(alvo, { clearProps: 'all' });
        alvo.style.pointerEvents = ''; alvo.dataset.saindo = '';
      }
    });
  }

  function esperar(seg, feito) {
    if (window.gsap) window.gsap.delayedCall(seg, feito);
    else window.setTimeout(feito, seg * 1000);
  }

  var avisoTimer = null;
  function avisar(texto, corTexto, dura, classe) {
    el.aviso.className = 'aviso' + (classe ? ' aviso--' + classe : '');
    el.avisoTexto.textContent = texto;
    el.aviso.style.color = corTexto;
    el.aviso.hidden = false;
    if (anima) {
      window.gsap.fromTo(el.aviso, { autoAlpha: 0, scale: 0.92 },
        { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power3.out', overwrite: true });
    }
    if (avisoTimer) window.clearTimeout(avisoTimer);
    avisoTimer = window.setTimeout(function () {
      if (anima) {
        window.gsap.to(el.aviso, { autoAlpha: 0, duration: 0.6, ease: 'power3.out', overwrite: true,
          onComplete: function () { el.aviso.hidden = true; } });
      } else { el.aviso.hidden = true; }
    }, dura || 1200);
  }

  function montarMetas(onde, lista, comResultado) {
    onde.textContent = '';
    for (var i = 0; i < lista.length; i++) {
      var x = lista[i];
      var li = document.createElement('li');
      li.className = 'meta' + (comResultado ? (x.feito ? ' meta--feita' : ' meta--perdida') : '');

      var mk = document.createElement('span');
      mk.className = 'meta__marca';
      mk.textContent = comResultado ? (x.feito ? '\u2713' : '\u00b7') : String(i + 1);
      li.appendChild(mk);

      var tx = document.createElement('span');
      tx.className = 'meta__texto';
      tx.textContent = x.d.diz(x.alvo);
      li.appendChild(tx);

      var pr = document.createElement('span');
      pr.className = 'meta__premio';
      pr.textContent = '+' + x.premio + ' m';
      li.appendChild(pr);

      onde.appendChild(li);
    }
    onde.hidden = !lista.length;
  }

  // Um estado de mentira para o vestiario: inverte a gravidade a cada 1.2s e
  // sobe e desce, para Avesso, Mola, Bussola e Ima terem o que mostrar.
  function estadoMostra(t, raio) {
    var meio = 1.2, f = t % (meio * 2);
    return { t: t, vy: Math.sin(t * 2.6) * A.vyMax * 0.75, vyMax: A.vyMax,
      segurando: f < meio, camX: t * 300, raio: raio,
      virou: t - (f % meio), giro: t * 9 };
  }

  function pintarPeca(canvas, p, travada, t) {
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    var L = canvas.width, r = L * 0.27;
    ctx.clearRect(0, 0, L, L);
    ctx.save();
    ctx.translate(L / 2, L / 2);
    var e = estadoMostra(t || 0, r);
    if (travada) {
      desenharPeca(ctx, { forma: p.forma, casca: p.casca, cor: '#2a2e34', mov: p.mov },
        r, e, '#14171b', e.segurando);
    } else {
      desenharPeca(ctx, p, r, e, '#14171b', e.segurando);
    }
    ctx.restore();
  }

  // Enquanto o armario estiver aberto, os 30 cartoes sao redesenhados a cada
  // quadro: e o movimento que diferencia uma roupa da outra, e cartao parado
  // nao conta isso. Para fora do armario, nenhum custo.
  function pintarCartoes() {
    for (var i = 0; i < C.cartoes.length; i++) {
      var c = C.cartoes[i];
      pintarPeca(c.cv, c.p, c.travada, C.relogio);
    }
  }

  function montarGrade() {
    el.grade.textContent = '';
    C.cartoes.length = 0;
    for (var i = 0; i < P.length; i++) {
      var p = P[i], livre = tem(p), vestida = p.id === C.vestido;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'peca' + (livre ? '' : ' peca--trava') + (vestida ? ' peca--vestida' : '');
      b.setAttribute('data-id', p.id);
      if (!livre) b.disabled = true;

      var cvv = document.createElement('canvas');
      cvv.width = 112; cvv.height = 112; cvv.className = 'peca__fig';
      b.appendChild(cvv);

      var n = document.createElement('span');
      n.className = 'peca__nome';
      n.textContent = p.nome;   // ver o nome do que falta e o que da vontade
      b.appendChild(n);

      var c = document.createElement('span');
      c.className = 'peca__como';
      c.textContent = livre ? (vestida ? 'Vestida' : 'Vestir') : comoSeGanha(p);
      b.appendChild(c);

      el.grade.appendChild(b);
      C.cartoes.push({ cv: cvv, p: p, travada: !livre });
      pintarPeca(cvv, p, !livre, C.relogio);
    }
    el.vestLinha.textContent = tidas().length + ' de ' + P.length + ' · ' + C.total + ' m somados';
  }

  function montarNovidade(novas) {
    el.novidadeLista.textContent = '';
    C.cartoes.length = 0;
    el.novidade.hidden = !novas.length;
    if (!novas.length) return;
    for (var i = 0; i < novas.length && i < 3; i++) {
      var p = porId[novas[i]];
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'nova'; b.setAttribute('data-id', p.id);
      var cvv = document.createElement('canvas');
      cvv.width = 112; cvv.height = 112; cvv.className = 'nova__fig';
      b.appendChild(cvv);
      var n = document.createElement('span');
      n.className = 'nova__nome'; n.textContent = p.nome;
      b.appendChild(n);
      var v = document.createElement('span');
      v.className = 'nova__acao'; v.textContent = 'Vestir';
      b.appendChild(v);
      el.novidadeLista.appendChild(b);
      C.cartoes.push({ cv: cvv, p: p, travada: false });
      pintarPeca(cvv, p, false, C.relogio);
    }
  }

  function montarBarra() {
    var prox = proximaPorSoma();
    if (!prox) { el.barra.hidden = true; return; }
    el.barra.hidden = false;
    el.barraTexto.textContent = 'Faltam ' + (prox.ate - C.total) + ' m para a próxima roupa';
    var frac = (C.total - prox.de) / Math.max(1, prox.ate - prox.de);
    frac = Math.max(0, Math.min(1, frac));
    if (anima) {
      window.gsap.fromTo(el.barraCheio, { width: '0%' },
        { width: (frac * 100).toFixed(1) + '%', duration: 0.6, ease: 'power3.out', overwrite: true });
    } else {
      el.barraCheio.style.width = (frac * 100).toFixed(1) + '%';
    }
  }

  function vestir(id) {
    if (!porId[id] || !tem(porId[id])) return;
    C.vestido = id;
    guardar('avesso.vestido', id);
    atualizarMenu();
  }

  function montarAtos() {
    el.atos.textContent = '';
    for (var i = 0; i < ATOS.length; i++) {
      var d = document.createElement('p');
      d.className = 'ato';

      var f = document.createElement('span');
      f.className = 'ato__faixa';
      f.textContent = (i ? ATOS[i - 1].ate : 0) + (i < ATOS.length - 1 ? '–' + ATOS[i].ate : '+') + ' m';
      d.appendChild(f);

      var n = document.createElement('span');
      n.className = 'ato__nome';
      n.textContent = ATOS[i].nome;
      d.appendChild(n);

      var g = document.createElement('span');
      g.className = 'ato__dif';
      g.textContent = ATOS[i].dif;
      d.appendChild(g);

      el.atos.appendChild(d);
    }
  }

  function atualizarMenu() {
    el.recorde.textContent = C.recorde;
    el.somaTotal.textContent = C.total;
    el.vestCont.textContent = tidas().length + '/' + P.length;
  }

  /* §13 — entrada -------------------------------------------------------- */

  function apertou() {
    somAcordar();
    if (C.estado === 'jogando') {
      if (!C.segurando) SONS.virar(true);
      C.segurando = true; return;
    }
    if (C.estado === 'pausado') { despausar(); return; }
    if (C.estado === 'largada') { pularLargada(); C.segurando = true; return; }
    if (C.estado === 'menu') { fechar(el.inicio); preparar(); return; }
    if (C.estado === 'morto' && C.podeReiniciar) { fechar(el.fim); preparar(); }
  }

  function soltou() {
    if (C.estado === 'jogando' && C.segurando) SONS.virar(false);
    C.segurando = false;
  }

  function ligarEntrada() {
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!el.vestiario.hidden) return;   // no vestiario o espaco nao joga
        apertou();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (!el.vestiario.hidden) { fecharVestiario(); return; }
        if (C.estado === 'jogando') pausar();
        else if (C.estado === 'pausado') despausar();
      }
    });

    window.addEventListener('keyup', function (e) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') soltou();
    });

    el.palco.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, label, input, a')) return;
      if (!el.vestiario.hidden) return;
      e.preventDefault();
      apertou();
    });
    window.addEventListener('pointerup', soltou);
    window.addEventListener('pointercancel', soltou);
    window.addEventListener('blur', function () { soltou(); pausar(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { soltou(); pausar(); }
    });

    el.btJogar.addEventListener('click', function () { somAcordar(); fechar(el.inicio); preparar(); });
    el.btDeNovo.addEventListener('click', function () { fechar(el.fim); preparar(); });
    el.btMenu.addEventListener('click', aoMenu);
    el.btVoltar.addEventListener('click', despausar);
    el.btSair.addEventListener('click', aoMenu);
    el.btVestiario.addEventListener('click', abrirVestiario);
    el.btVestiario2.addEventListener('click', abrirVestiario);
    el.btVestFechar.addEventListener('click', fecharVestiario);

    el.grade.addEventListener('click', function (e) {
      var b = e.target.closest('.peca');
      if (!b || b.disabled) return;
      vestir(b.getAttribute('data-id'));
      montarGrade();
    });

    el.novidadeLista.addEventListener('click', function (e) {
      var b = e.target.closest('.nova');
      if (!b) return;
      vestir(b.getAttribute('data-id'));
      var acao = b.querySelector('.nova__acao');
      if (acao) acao.textContent = 'Vestida';
    });

    el.optInverter.addEventListener('change', function () {
      C.inverter = el.optInverter.checked;
      guardar('avesso.inverter', C.inverter ? '1' : '0');
    });
    el.optSom.addEventListener('change', function () {
      C.som = el.optSom.checked;
      guardar('avesso.som', C.som ? '1' : '0');
      if (C.som) { somAcordar(); SONS.setor(); }
    });

    window.addEventListener('resize', medir);
    window.addEventListener('orientationchange', medir);
  }

  var voltarPara = 'inicio';
  function abrirVestiario() {
    voltarPara = el.fim.hidden ? 'inicio' : 'fim';
    montarGrade();
    fechar(el.inicio); fechar(el.fim);
    abrir(el.vestiario);
  }
  function fecharVestiario() {
    fechar(el.vestiario);
    if (voltarPara === 'fim') { abrir(el.fim); }
    else { atualizarMenu(); abrir(el.inicio); }
  }

  /* §14 — laco ----------------------------------------------------------- */

  function quadro(dt) {
    if (dt > 0.033) dt = 0.033;
    if (dt > 0) atualizar(dt);
    desenhar();
    if (!C.poucoMov && (!el.vestiario.hidden || !el.fim.hidden)) pintarCartoes();
  }

  function ligarLaco() {
    if (window.gsap) {
      window.gsap.ticker.add(function (t, dtMs) { quadro(dtMs / 1000); });
      return;
    }
    var antes = 0;
    (function volta(agora) {
      var dt = antes ? (agora - antes) / 1000 : 0;
      antes = agora;
      quadro(dt);
      window.requestAnimationFrame(volta);
    })(0);
  }

  /* §15 — inicio --------------------------------------------------------- */

  function pegar() {
    var ids = ['palco', 'tela', 'hud', 'placar', 'hudRecorde', 'hudSetor', 'mult', 'multN',
      'aviso', 'avisoTexto', 'inicio', 'fim', 'pausa', 'vestiario', 'grade', 'vestLinha',
      'largada', 'metas', 'conta', 'metasFim', 'hudDif', 'atos',
      'btJogar', 'btDeNovo', 'btMenu', 'btVoltar', 'btSair', 'btVestiario', 'btVestiario2',
      'btVestFechar', 'fimPlacar', 'fimSelo', 'fimLinha', 'recorde', 'somaTotal', 'vestCont',
      'optInverter', 'optSom', 'novidade', 'novidadeLista', 'barra', 'barraTexto', 'barraCheio'];
    for (var i = 0; i < ids.length; i++) {
      el[ids[i]] = document.getElementById(ids[i]);
      if (!el[ids[i]]) return false;
    }
    return true;
  }

  function partir() {
    P = window.AVESSO_PERSONAGENS || [];
    if (!P.length || !pegar()) return;
    for (var i = 0; i < P.length; i++) porId[P[i].id] = P[i];

    cv = el.tela;
    cx = cv.getContext && cv.getContext('2d');
    if (!cx) return;

    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    C.poucoMov = !!(mq && mq.matches);
    anima = !!window.gsap && !C.poucoMov;

    C.recorde = parseInt(lerGuardado('avesso.recorde', '0'), 10) || 0;
    C.total = parseInt(lerGuardado('avesso.total', '0'), 10) || 0;

    // O metro encolheu de 50px para 17px para os atos caírem em 0/300/600/900.
    // Tudo que esta guardado foi medido na regua antiga, entao passa pela
    // mesma conta — senao o recorde de ontem viraria um numero pequeno e os
    // metros somados valeriam um terço do que valiam. Uma vez so.
    var totalAntigo = C.total;   // para a migracao das roupas, mais abaixo
    // Cada vez que a regua muda, o que esta guardado passa pela mesma conta.
    // `avesso.regua` diz qual regua gerou os numeros que estao no disco.
    var reguaVinda = lerGuardado('avesso.regua', '1');
    var reguaAntiga = { '1': 50, '2': 7 }[reguaVinda];
    if (reguaAntiga && reguaAntiga !== A.passoM) {
      var fator = reguaAntiga / A.passoM;
      C.recorde = Math.round(C.recorde * fator);
      C.total = Math.round(C.total * fator);
      guardar('avesso.recorde', C.recorde);
      guardar('avesso.total', C.total);
      guardar('avesso.regua', '3');
    }
    C.inverter = lerGuardado('avesso.inverter', '1') !== '0';
    C.som = lerGuardado('avesso.som', '1') !== '0';

    var pr = lerGuardado('avesso.proezas', '').split(',');
    for (var j = 0; j < pr.length; j++) if (pr[j]) C.proezas[pr[j]] = 1;

    var gs = lerGuardado('avesso.ganhas', null);
    if (gs === null) {
      // Migracao, uma vez so, e SO para quem vem da primeira regua: os
      // cortes de AVESSO_CORTES_ANTIGOS foram medidos nela. Um save mais
      // novo que este ja nasceu com `ganhas` gravado, e um save sem `ganhas`
      // vindo de outra regua compararia metros de reguas diferentes — foi
      // assim que um armario de 6 roupas virou 16 num teste.
      var antigos = reguaVinda === '1' ? (window.AVESSO_CORTES_ANTIGOS || []) : [];
      var n = 0, soma = [];
      for (var q = 0; q < antigos.length; q++) if (totalAntigo >= antigos[q]) n++;
      for (var w = 0; w < P.length; w++) if (P[w].por.tipo === 'soma') soma.push(P[w].id);
      for (var z = 0; z < n && z < soma.length; z++) C.ganhas[soma[z]] = 1;
    } else {
      var lista = gs.split(',');
      for (var y = 0; y < lista.length; y++) if (lista[y]) C.ganhas[lista[y]] = 1;
    }
    gravarGanhas();

    var v = lerGuardado('avesso.vestido', 'avesso');
    C.vestido = (porId[v] && tem(porId[v])) ? v : 'avesso';

    el.optInverter.checked = C.inverter;
    el.optSom.checked = C.som;

    medir();
    limparMundo();
    montarAtos();
    atualizarMenu();
    ligarEntrada();
    ligarLaco();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', partir);
  } else {
    partir();
  }
})();
