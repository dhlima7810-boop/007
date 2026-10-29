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

    // Setor a cada 50 m, nao 500: a mediana medida e 42 m e a melhor corrida
    // automatizada foi 84 m. Com 500 m ninguem veria UMA troca de setor.
    // Suba este numero junto com a dificuldade, nunca sozinho.
    setorM: 50,

    passoM: 50,          // px de mundo que valem 1 metro
    rocada: 24,          // folga que ainda conta como rocada
    multMax: 8,
    perigo: 20,          // folga que dispara a camera lenta
    lenta: 0.42          // quanto o tempo desacelera no perigo
  };

  var TINTA = [12, 13, 16];
  var OSSO = [237, 234, 227];

  // A cara do mundo por setor. `fFaixa` e a espessura do chao e do teto em
  // fracao da altura — ela ENGROSSA a cada setor, e e por isso que o campo
  // aperta de verdade em vez de so acelerar. Tudo que e gerado guarda fracao
  // da altura util, nunca pixel: assim a faixa pode crescer (e a janela pode
  // mudar de tamanho) sem fechar um vao que ja existia.
  var SETORES = [
    { nome: 'Raso',    fFaixa: 0.075, vel: 0,   esp: 1.00, vao: 0.00, laje: 0.00, movel: 0,    aperto: 0,   cor: '#6f7b86' },
    { nome: 'Vão',     fFaixa: 0.086, vel: 40,  esp: 0.96, vao: 0.34, laje: 0.00, movel: 0,    aperto: 0,   cor: '#4f9ec4' },
    { nome: 'Laje',    fFaixa: 0.097, vel: 80,  esp: 0.92, vao: 0.30, laje: 0.22, movel: 0,    aperto: 0.2, cor: '#4fb38d' },
    { nome: 'Pêndulo', fFaixa: 0.108, vel: 120, esp: 0.88, vao: 0.28, laje: 0.24, movel: 0.55, aperto: 0.4, cor: '#c9a44a' },
    { nome: 'Agulha',  fFaixa: 0.119, vel: 170, esp: 0.82, vao: 0.40, laje: 0.22, movel: 0.6,  aperto: 0.7, cor: '#e07a2a' },
    { nome: 'Avesso',  fFaixa: 0.131, vel: 220, esp: 0.78, vao: 0.36, laje: 0.28, movel: 0.7,  aperto: 1.0, cor: '#e03a2a' }
  ];

  var PROEZAS = {
    cem:      'Chegar a 100 m numa corrida',
    duzentos: 'Chegar a 200 m numa corrida',
    voo:      'Passar 10 obstáculos sem tocar no chão nem no teto',
    fio:      'Levar a roçada até ×8',
    fundo:    'Alcançar o setor 4',
    cegas:    'Fazer 40 m com a inversão da tela desligada',
    folego:   'Ficar 30 segundos vivo numa corrida',
    limalha:  'Roçar 20 vezes numa única corrida'
  };

  /* §2 — estado ---------------------------------------------------------- */

  var C = {
    estado: 'menu',
    camX: 0, base: 0, tempo: 0,
    y: 0, vy: 0, segurando: false,
    obst: [], proximoX: 0,
    rastro: [], cacos: [], faiscas: [],
    inv: 0, tremor: 0,
    larg: 1280, alt: 720,
    fFaixa: SETORES[0].fFaixa,
    setor: 0,
    escalaTempo: 1,
    mult: 0, bonus: 0, rocadas: 0, semTocar: 0,
    passouRecorde: false, primeiro: true,
    recorde: 0, total: 0,
    proezas: {}, vestido: 'avesso',
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
    marca:  function ()     { tom(660, 990, 0.3, 'triangle', 0.07); },
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

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(lp * dpr);
    cv.height = Math.round(ap * dpr);
    esc = cv.width / larg;

    var f = faixa();
    if (C.y < f + A.raio) C.y = f + A.raio;
    if (C.y > C.alt - f - A.raio) C.y = C.alt - f - A.raio;
  }

  /* §6 — setores --------------------------------------------------------- */

  function setorDe(x) {
    var i = Math.floor((x - C.base) / (A.setorM * A.passoM));
    return i < 0 ? 0 : (i > SETORES.length - 1 ? SETORES.length - 1 : i);
  }

  function corSetorEm(x) { return SETORES[setorDe(x)].cor; }

  /* §7 — mundo ----------------------------------------------------------- */

  function dureza() {
    var d = C.camX - C.base;
    return d < 0 ? 0 : (d > A.durezaEm ? 1 : d / A.durezaEm);
  }

  // Tudo guardado em FRACAO da altura util. A faixa engrossa a cada setor e
  // a janela pode mudar de tamanho: com pixel gravado, um vao ja existente
  // fecharia sozinho e mataria quem estivesse dentro dele.
  function caixa(g, p) {
    var f = faixa(), H = C.alt - f * 2, h = p.fh * H;
    if (p.anc === 'teto') return { x: g.x, y: f, w: g.w, h: h };
    if (p.anc === 'chao') return { x: g.x, y: C.alt - f - h, w: g.w, h: h };
    var fc = p.fc + (p.mov ? p.mov.fa * Math.sin(p.mov.fase + C.tempo * p.mov.vel) : 0);
    return { x: g.x, y: f + fc * H - h / 2, w: g.w, h: h };
  }

  function gerar() {
    while (C.proximoX < C.camX + C.larg + 600) {
      var k = dureza();
      var s = SETORES[setorDe(C.proximoX)];
      var w = acaso(46, 80);
      var g = { x: C.proximoX, w: w, pecas: [], dmin: Infinity, pronto: false };
      var sorte = Math.random(), folgaExtra = 0;

      if (sorte < s.vao) {
        var fvao = Math.max(0.28, 0.46 - 0.12 * k - 0.06 * s.aperto);
        var marg = 0.07;
        var fc = acaso(fvao / 2 + marg, 1 - fvao / 2 - marg);
        g.pecas.push({ anc: 'teto', fh: fc - fvao / 2 });
        g.pecas.push({ anc: 'chao', fh: 1 - (fc + fvao / 2) });
        folgaExtra = 60;

      } else if (sorte < s.vao + s.laje) {
        var fh = acaso(0.10, 0.19);
        var movel = Math.random() < s.movel;
        g.pecas.push({
          anc: 'livre', fh: fh, fc: acaso(0.30, 0.70),
          mov: movel ? { fa: acaso(0.08, 0.16), vel: acaso(0.7, 1.5), fase: Math.random() * 6.2832 } : null
        });
        folgaExtra = 60;

      } else {
        // O primeiro obstaculo da corrida nunca sai do chao. Quem comeca
        // nasce parado, encostado no chao: um bloco de chao logo de cara
        // pede uma subida do zero com pouco aviso, e um de teto nao pede
        // nada. Medido antes disso: 7 de 11 corridas morriam no mesmo lugar,
        // sempre aos 16 m, que e exatamente onde cai o primeiro obstaculo.
        g.pecas.push({
          anc: C.primeiro ? 'teto' : (Math.random() < 0.5 ? 'chao' : 'teto'),
          fh: C.primeiro ? acaso(0.16, 0.26) : Math.min(0.62, acaso(0.16, 0.38 + 0.16 * k))
        });
      }
      C.primeiro = false;

      C.obst.push(g);
      C.proximoX += w + (A.espBase - A.espCorte * k) * s.esp + folgaExtra;
    }

    var i = 0;
    while (i < C.obst.length) {
      if (C.obst[i].x + C.obst[i].w < C.camX - 160) C.obst.splice(i, 1); else i++;
    }
  }

  function limparMundo() {
    C.obst.length = 0; C.rastro.length = 0; C.cacos.length = 0; C.faiscas.length = 0;
    C.y = C.alt - faixa() - A.raio;
    C.vy = 0; C.inv = 0; C.tremor = 0; C.segurando = false;
    C.escalaTempo = 1; C.mult = 0; C.bonus = 0; C.rocadas = 0; C.semTocar = 0;
    C.passouRecorde = false; C.primeiro = true;
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
    var s = SETORES[C.setor];
    var vel = A.velBase + Math.min(d / A.velRampa, A.velGanho) + s.vel;
    C.camX += vel * dt;
    C.tempo += dt;

    var novo = setorDe(C.camX);
    if (novo !== C.setor) {
      C.setor = novo;
      if (novo > 0) { avisar(SETORES[novo].nome, SETORES[novo].cor); SONS.setor(); }
    }
    // a faixa engrossa devagar: de uma vez ela empurraria quem esta encostado
    C.fFaixa += (SETORES[C.setor].fFaixa - C.fFaixa) * Math.min(1, dt / 0.5);

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
          var b = caixa(g, g.pecas[j]);
          var fo = folga(jx, C.y, A.raio, b.x, b.y, b.w, b.h);
          if (fo < 0) { morrer(); return; }
          if (fo < g.dmin) g.dmin = fo;
          if (fo < maisPerto) maisPerto = fo;
        }
      }

      // o grupo so e julgado quando passa inteiro por tras do disco
      if (!g.pronto && g.x + g.w < jx - A.raio) {
        g.pronto = true;
        C.semTocar++;
        if (g.dmin < A.rocada) {
          C.mult = Math.min(C.mult + 1, A.multMax);
          C.bonus += C.mult;
          C.rocadas++;
          C.faiscas.push({ x: g.x + g.w, y: C.y, v: 1, n: C.mult });
          SONS.rocada(C.mult);
        } else {
          C.mult = 0;
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
    if (C.setor !== setorEscrito) { setorEscrito = C.setor; el.hudSetor.textContent = SETORES[C.setor].nome; }

    conferirProezas(m);
  }

  function conferirProezas(m) {
    if (m >= 100) marcar('cem');
    if (m >= 200) marcar('duzentos');
    if (C.semTocar >= 10) marcar('voo');
    if (C.mult >= A.multMax) marcar('fio');
    if (C.setor >= 3) marcar('fundo');
    if (!C.inverter && m >= 40) marcar('cegas');
    if (C.tempo >= 30) marcar('folego');
    if (C.rocadas >= 20) marcar('limalha');
  }

  function marcar(id) {
    if (C.proezas[id]) return;
    C.proezas[id] = 1;
    guardar('avesso.proezas', Object.keys(C.proezas).join(','));
  }

  function atualizar(dtReal) {
    var dt = dtReal * (C.estado === 'jogando' ? C.escalaTempo : 1);

    if (C.estado === 'jogando') passo(dt);
    else if (C.estado === 'menu' && !C.poucoMov) { C.camX += A.velMenu * dt; C.tempo += dt; }

    for (var i = C.cacos.length - 1; i >= 0; i--) {
      var c = C.cacos[i];
      c.vy += 1700 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; c.v -= dt * 1.25;
      if (c.v <= 0) C.cacos.splice(i, 1);
    }
    for (var j = C.faiscas.length - 1; j >= 0; j--) {
      C.faiscas[j].v -= dtReal * 1.7;
      if (C.faiscas[j].v <= 0) C.faiscas.splice(j, 1);
    }

    if (C.tremor > 0) C.tremor = Math.max(0, C.tremor - dtReal * 55);

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
  function desenharPeca(ctx, p, r, ang, fundo, gravCima) {
    ctx.save();
    ctx.rotate(ang);
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

    ctx.beginPath();
    ctx.arc(0, gravCima ? -r * 0.5 : r * 0.5, r * 0.24, 0, 6.2832);
    ctx.fillStyle = (p.casca === 'vazado' || p.casca === 'anel') ? p.cor : fundo;
    ctx.fill();
  }

  function anguloDe(p) {
    if (p.giro === 'roda') return (C.camX / 34) % 6.2832;
    if (p.giro === 'inclina') return (C.vy / A.vyMax) * 0.55;
    return 0;
  }

  function desenhar() {
    var p = porId[C.vestido] || P[0];
    cx.setTransform(esc, 0, 0, esc, 0, 0);
    cx.save();
    if (C.tremor > 0.2) {
      cx.translate((Math.random() * 2 - 1) * C.tremor, (Math.random() * 2 - 1) * C.tremor);
    }

    var fA = mistura(TINTA, OSSO, C.inv);
    var sA = mistura(OSSO, TINTA, C.inv);
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
        cx.fillStyle = corSetorEm(marcaX());
        cx.globalAlpha = 0.5; cx.fillRect(mX - 1.5, f, 3, C.alt - f * 2);
        cx.globalAlpha = 1; cx.fillRect(mX - 9, f, 18, 7); cx.fillRect(mX - 9, C.alt - f - 7, 18, 7);
        cx.restore();
      }
    }

    cx.fillStyle = solido;
    cx.fillRect(0, 0, C.larg, f);
    cx.fillRect(0, C.alt - f, C.larg, f);

    for (var i = 0; i < C.obst.length; i++) {
      var g = C.obst[i];
      var sx = g.x - C.camX;
      if (sx > C.larg + 8 || sx + g.w < -8) continue;
      for (var j = 0; j < g.pecas.length; j++) {
        var b = caixa(g, g.pecas[j]);
        cx.fillRect(b.x - C.camX, b.y, b.w, b.h);
      }
    }

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
      desenharPeca(cx, p, A.raio, anguloDe(p), fundo, C.segurando);
      cx.restore();
    }

    cx.restore();
  }

  /* §10 — roupas: o que se tem e o que falta ----------------------------- */

  function tem(p) {
    if (p.por.tipo === 'livre') return true;
    if (p.por.tipo === 'soma') return C.total >= p.por.m;
    return !!C.proezas[p.por.id];
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

  function comecar() {
    C.base = C.camX;
    C.setor = 0; setorEscrito = -1; multEscrito = -1; placarEscrito = -1;
    C.fFaixa = SETORES[0].fFaixa;
    C.tempo = 0;
    limparMundo();
    C.proximoX = C.camX + C.larg * 0.95;
    C.podeReiniciar = false;
    el.placar.textContent = '0';
    el.hudRecorde.textContent = C.recorde;
    el.hudSetor.textContent = SETORES[0].nome;
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

    var novo = m > C.recorde;
    if (novo) { C.recorde = m; guardar('avesso.recorde', m); }

    var agora = tidas(), novas = [];
    for (var j = 0; j < agora.length; j++) if (antes.indexOf(agora[j]) < 0) novas.push(agora[j]);

    el.fimPlacar.textContent = m;
    el.fimSelo.textContent = novo ? 'Recorde' : 'Bateu';
    el.fimLinha.textContent = (novo ? 'Melhor que todas as anteriores. ' : 'Recorde de ' + C.recorde + ' m. ')
      + (C.rocadas ? C.rocadas + (C.rocadas === 1 ? ' roçada, ' : ' roçadas, ') + '+' + C.bonus + ' m de bônus.' : 'Nenhuma roçada.');
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
    C.estado = 'menu';
    C.podeReiniciar = false; C.segurando = false;
    C.fFaixa = SETORES[0].fFaixa;
    limparMundo();
    atualizarMenu();
    fechar(el.hud); fechar(el.fim); fechar(el.pausa); fechar(el.vestiario);
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
  function avisar(texto, corTexto) {
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
    }, 1200);
  }

  function pintarPeca(canvas, p, vestida) {
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    var L = canvas.width;
    ctx.clearRect(0, 0, L, L);
    ctx.save();
    ctx.translate(L / 2, L / 2);
    if (vestida === 'travada') {
      desenharPeca(ctx, { forma: p.forma, casca: p.casca, cor: '#2a2e34' }, L * 0.30, 0, '#14171b', false);
    } else {
      desenharPeca(ctx, p, L * 0.30, 0, '#14171b', false);
    }
    ctx.restore();
  }

  function montarGrade() {
    el.grade.textContent = '';
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
      pintarPeca(cvv, p, livre ? 'ok' : 'travada');
    }
    el.vestLinha.textContent = tidas().length + ' de ' + P.length + ' · ' + C.total + ' m somados';
  }

  function montarNovidade(novas) {
    el.novidadeLista.textContent = '';
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
      pintarPeca(cvv, p, 'ok');
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
    if (C.estado === 'menu') { fechar(el.inicio); comecar(); C.segurando = true; return; }
    if (C.estado === 'morto' && C.podeReiniciar) { fechar(el.fim); comecar(); C.segurando = true; }
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

    el.btJogar.addEventListener('click', function () { somAcordar(); fechar(el.inicio); comecar(); });
    el.btDeNovo.addEventListener('click', function () { fechar(el.fim); comecar(); });
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
    C.inverter = lerGuardado('avesso.inverter', '1') !== '0';
    C.som = lerGuardado('avesso.som', '1') !== '0';

    var pr = lerGuardado('avesso.proezas', '').split(',');
    for (var j = 0; j < pr.length; j++) if (pr[j]) C.proezas[pr[j]] = 1;

    var v = lerGuardado('avesso.vestido', 'avesso');
    C.vestido = (porId[v] && tem(porId[v])) ? v : 'avesso';

    el.optInverter.checked = C.inverter;
    el.optSom.checked = C.som;

    medir();
    limparMundo();
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
