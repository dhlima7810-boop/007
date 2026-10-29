/* ===========================================================================
   AVESSO — jogo de um botao so. Segurar inverte a gravidade.

   Projeto separado: mora neste repositorio, mas NAO faz parte do site da
   Pizza Mia. Nao entra no sitemap, nao e linkado pelo site e leva noindex.

   O que vale aqui, vindo do CLAUDE.md do repositorio:
   - sem build, sem framework, sem componentes. HTML, CSS e JS puros;
   - GSAP cuida da interface (inicio, fim, pausa, HUD): nada entra ou sai
     abaixo de 0.6s, e a curva e power3 ou expo;
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
    alturaBase: 720,     // altura logica de referencia
    largMin: 980,        // largura logica minima: abaixo disso o retrato
    largMax: 1560,       //   nao mostra campo suficiente a frente
    faixa: 54,           // espessura do chao e do teto
    raio: 17,
    grav: 2100,          // px/s^2
    vyMax: 820,
    velBase: 380,
    velGanho: 340,       // vel = velBase + min(dist/velRampa, velGanho)
    velRampa: 30,
    espBase: 600,        // respiro entre obstaculos, no comeco
    espCorte: 170,       //   e quanto ele encurta ate o fim da rampa
    durezaEm: 9000,      // distancia onde a dureza chega a 1
    xJogador: 0.3,       // onde o disco fica na largura da tela
    velMenu: 90,         // o fundo anda devagar no menu
    rastro: 9,
    inverteEm: 0.055     // constante de tempo da inversao da tela, em s
  };

  var TINTA = [12, 13, 16];
  var OSSO = [237, 234, 227];
  var ACENTO = '#ff3b14';

  /* §2 — estado ---------------------------------------------------------- */

  var C = {
    estado: 'menu',      // menu | jogando | morto | pausado
    camX: 0,
    base: 0,             // camX onde a corrida comecou
    y: 0,
    vy: 0,
    segurando: false,
    obst: [],
    proximoX: 0,
    rastro: [],
    cacos: [],
    inv: 0,              // 0..1 — quanto a tela esta invertida
    tremor: 0,
    recorde: 0,
    inverter: true,
    poucoMov: false,
    podeReiniciar: false,
    larg: 1280,
    alt: 720
  };

  var el = {};
  var cv, cx, esc = 1, anima = false, placarEscrito = -1;

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
    return [a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t];
  }

  function cor(c) {
    return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
  }

  function acaso(min, max) { return min + Math.random() * (max - min); }

  // circulo contra retangulo: o ponto do retangulo mais perto do centro
  function bate(cxx, cyy, r, x, y, w, h) {
    var px = x > cxx ? x : (cxx > x + w ? x + w : cxx);
    var py = y > cyy ? y : (cyy > y + h ? y + h : cyy);
    var dx = cxx - px, dy = cyy - py;
    return dx * dx + dy * dy < r * r;
  }

  /* §4 — medida da tela -------------------------------------------------- */

  // O mundo logico preenche o canvas por inteiro: nada de tarja preta.
  // Quando a tela e estreita demais, e a ALTURA que cede — e melhor jogar
  // num campo mais alto do que enxergar meio metro a frente.
  function medir() {
    var r = el.palco.getBoundingClientRect();
    var lp = Math.max(1, Math.round(r.width));
    var ap = Math.max(1, Math.round(r.height));
    var prop = lp / ap;

    var alt = A.alturaBase;
    var larg = alt * prop;
    if (larg < A.largMin) { larg = A.largMin; alt = larg / prop; }
    else if (larg > A.largMax) { larg = A.largMax; alt = larg / prop; }

    C.larg = larg;
    C.alt = alt;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(lp * dpr);
    cv.height = Math.round(ap * dpr);
    esc = cv.width / larg;

    // a janela pode ter encolhido com o disco onde agora e parede
    var teto = A.faixa + A.raio, chao = C.alt - A.faixa - A.raio;
    if (C.y < teto) C.y = teto;
    if (C.y > chao) C.y = chao;
  }

  /* §5 — mundo ----------------------------------------------------------- */

  function dureza() {
    var d = C.camX - C.base;
    return d < 0 ? 0 : (d > A.durezaEm ? 1 : d / A.durezaEm);
  }

  function gerar() {
    var H = C.alt - A.faixa * 2;
    var teto = A.faixa, chao = C.alt - A.faixa;

    while (C.proximoX < C.camX + C.larg + 600) {
      var k = dureza();
      var w = acaso(46, 80);
      var x = C.proximoX;
      var sorte = Math.random();
      var pBloco = 0.60 - 0.35 * k;
      var pVao = pBloco + 0.28 + 0.17 * k;
      var folga = 0;

      if (sorte < pBloco) {
        // bloco saindo do chao ou do teto
        var h = H * acaso(0.16, 0.38 + 0.18 * k);
        if (Math.random() < 0.5) C.obst.push({ x: x, y: chao - h, w: w, h: h });
        else C.obst.push({ x: x, y: teto, w: w, h: h });

      } else if (sorte < pVao) {
        // par com um vao no meio: o disco tem de passar pela fresta
        var vao = H * (0.46 - 0.14 * k);
        var margem = H * 0.08;
        var centro = acaso(teto + vao / 2 + margem, chao - vao / 2 - margem);
        var cima = centro - vao / 2;
        var baixo = centro + vao / 2;
        C.obst.push({ x: x, y: teto, w: w, h: cima - teto });
        C.obst.push({ x: x, y: baixo, w: w, h: chao - baixo });
        folga = 60;

      } else {
        // laje flutuante: passa por cima ou por baixo
        var hl = H * acaso(0.10, 0.20);
        var cl = acaso(teto + H * 0.30, chao - H * 0.30);
        C.obst.push({ x: x, y: cl - hl / 2, w: w, h: hl });
        folga = 60;
      }

      C.proximoX += w + (A.espBase - A.espCorte * k) + folga;
    }

    // joga fora o que ja passou
    var i = 0;
    while (i < C.obst.length) {
      var o = C.obst[i];
      if (o.x + o.w < C.camX - 120) C.obst.splice(i, 1);
      else i++;
    }
  }

  function reiniciarMundo() {
    C.obst.length = 0;
    C.rastro.length = 0;
    C.cacos.length = 0;
    C.y = C.alt - A.faixa - A.raio;
    C.vy = 0;
    C.inv = 0;
    C.tremor = 0;
    C.segurando = false;
  }

  /* §6 — passo da fisica ------------------------------------------------- */

  function passo(dt) {
    var d = C.camX - C.base;
    var vel = A.velBase + Math.min(d / A.velRampa, A.velGanho);
    C.camX += vel * dt;

    C.vy += (C.segurando ? -A.grav : A.grav) * dt;
    if (C.vy > A.vyMax) C.vy = A.vyMax;
    if (C.vy < -A.vyMax) C.vy = -A.vyMax;
    C.y += C.vy * dt;

    var teto = A.faixa + A.raio, chao = C.alt - A.faixa - A.raio;
    if (C.y < teto) { C.y = teto; if (C.vy < 0) C.vy = 0; }
    if (C.y > chao) { C.y = chao; if (C.vy > 0) C.vy = 0; }

    gerar();

    var jx = C.camX + C.larg * A.xJogador;
    C.rastro.push({ wx: jx, y: C.y });
    while (C.rastro.length > A.rastro) C.rastro.shift();

    for (var i = 0; i < C.obst.length; i++) {
      var o = C.obst[i];
      if (o.x > jx + A.raio || o.x + o.w < jx - A.raio) continue;
      if (bate(jx, C.y, A.raio, o.x, o.y, o.w, o.h)) { morrer(); return; }
    }

    var m = Math.floor((C.camX - C.base) / 50);
    if (m !== placarEscrito) {
      placarEscrito = m;
      el.placar.textContent = m;
    }
  }

  function atualizar(dt) {
    if (C.estado === 'jogando') passo(dt);
    else if (C.estado === 'menu' && !C.poucoMov) C.camX += A.velMenu * dt;

    for (var i = C.cacos.length - 1; i >= 0; i--) {
      var c = C.cacos[i];
      c.vy += 1700 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.a += c.va * dt;
      c.v -= dt * 1.25;
      if (c.v <= 0) C.cacos.splice(i, 1);
    }

    if (C.tremor > 0) C.tremor = Math.max(0, C.tremor - dt * 55);

    var alvo = (C.estado === 'jogando' && C.segurando && C.inverter && !C.poucoMov) ? 1 : 0;
    C.inv += (alvo - C.inv) * Math.min(1, dt / A.inverteEm);
  }

  /* §7 — desenho --------------------------------------------------------- */

  function desenhar() {
    cx.setTransform(esc, 0, 0, esc, 0, 0);
    cx.save();

    if (C.tremor > 0.2) {
      cx.translate((Math.random() * 2 - 1) * C.tremor, (Math.random() * 2 - 1) * C.tremor);
    }

    // as duas cores do mundo trocam de lugar conforme C.inv vai de 0 a 1
    var fA = mistura(TINTA, OSSO, C.inv);
    var sA = mistura(OSSO, TINTA, C.inv);
    var fundo = cor(fA);
    var solido = cor(sA);

    cx.fillStyle = fundo;
    cx.fillRect(-48, -48, C.larg + 96, C.alt + 96);

    // marcas de velocidade: dao leitura de quanto o mundo esta correndo.
    // a cor sai da propria mistura, senao ela pularia no meio da inversao
    cx.fillStyle = cor(mistura(fA, sA, 0.085));
    var vaoM = 140, desl = (C.camX * 0.45) % vaoM;
    for (var mx = -desl; mx < C.larg; mx += vaoM) {
      cx.fillRect(mx, A.faixa, 2, C.alt - A.faixa * 2);
    }

    cx.fillStyle = solido;
    cx.fillRect(0, 0, C.larg, A.faixa);
    cx.fillRect(0, C.alt - A.faixa, C.larg, A.faixa);

    for (var i = 0; i < C.obst.length; i++) {
      var o = C.obst[i];
      var sx = o.x - C.camX;
      if (sx > C.larg + 8 || sx + o.w < -8) continue;
      cx.fillRect(sx, o.y, o.w, o.h);
    }

    var jx = C.larg * A.xJogador;

    cx.fillStyle = ACENTO;
    for (var j = 0; j < C.rastro.length; j++) {
      var p = C.rastro[j], t = (j + 1) / C.rastro.length;
      cx.globalAlpha = t * 0.26;
      cx.beginPath();
      cx.arc(p.wx - C.camX, p.y, A.raio * (0.3 + t * 0.55), 0, 6.2832);
      cx.fill();
    }
    cx.globalAlpha = 1;

    for (var k = 0; k < C.cacos.length; k++) {
      var c = C.cacos[k];
      cx.save();
      cx.translate(c.x - C.camX, c.y);
      cx.rotate(c.a);
      cx.globalAlpha = c.v > 1 ? 1 : c.v;
      cx.fillRect(-c.t / 2, -c.t / 2, c.t, c.t);
      cx.restore();
    }
    cx.globalAlpha = 1;

    if (C.estado !== 'morto') {
      cx.beginPath();
      cx.arc(jx, C.y, A.raio, 0, 6.2832);
      cx.fill();
      // o ponto fica do lado para onde a gravidade puxa: e o estado do botao
      cx.fillStyle = fundo;
      cx.beginPath();
      cx.arc(jx, C.y + (C.segurando ? -A.raio * 0.42 : A.raio * 0.42), A.raio * 0.27, 0, 6.2832);
      cx.fill();
    }

    cx.restore();
  }

  /* §8 — vida e morte ---------------------------------------------------- */

  function comecar() {
    C.base = C.camX;
    C.obst.length = 0;
    C.rastro.length = 0;
    C.cacos.length = 0;
    C.y = C.alt - A.faixa - A.raio;
    C.vy = 0;
    C.tremor = 0;
    C.segurando = false;
    C.podeReiniciar = false;
    C.proximoX = C.camX + C.larg * 0.95;
    placarEscrito = -1;
    el.placar.textContent = '0';
    el.hudRecorde.textContent = C.recorde;
    C.estado = 'jogando';
    abrir(el.hud);
  }

  function morrer() {
    C.estado = 'morto';
    C.rastro.length = 0;   // senao o rastro fica de pe como um risco vermelho

    var jx = C.camX + C.larg * A.xJogador;
    var quantos = C.poucoMov ? 6 : 15;
    for (var i = 0; i < quantos; i++) {
      var ang = acaso(0, 6.2832), forca = acaso(140, 520);
      C.cacos.push({
        x: jx, y: C.y,
        vx: Math.cos(ang) * forca - 120,
        vy: Math.sin(ang) * forca - 160,
        a: acaso(0, 3.14), va: acaso(-9, 9),
        t: acaso(4, 11), v: acaso(0.75, 1.3)
      });
    }
    if (!C.poucoMov) C.tremor = 17;

    var m = Math.floor((C.camX - C.base) / 50);
    var novo = m > C.recorde;
    if (novo) { C.recorde = m; guardar('avesso.recorde', m); }

    el.fimPlacar.textContent = m;
    el.fimSelo.textContent = novo ? 'Recorde' : 'Bateu';
    el.fimLinha.textContent = novo
      ? 'Melhor que todas as anteriores.'
      : 'Recorde de ' + C.recorde + ' m.';
    el.recorde.textContent = C.recorde;
    el.hudRecorde.textContent = C.recorde;

    esperar(0.55, function () {
      if (C.estado !== 'morto') return;
      fechar(el.hud);
      abrir(el.fim);
      C.podeReiniciar = true;
    });
  }

  function aoMenu() {
    C.estado = 'menu';
    C.podeReiniciar = false;
    C.segurando = false;
    reiniciarMundo();
    el.recorde.textContent = C.recorde;
    fechar(el.hud);
    fechar(el.fim);
    fechar(el.pausa);
    abrir(el.inicio);
  }

  function pausar() {
    if (C.estado !== 'jogando') return;
    C.estado = 'pausado';
    C.segurando = false;
    abrir(el.pausa);
  }

  function despausar() {
    if (C.estado !== 'pausado') return;
    fechar(el.pausa);
    C.estado = 'jogando';
  }

  /* §9 — telas ----------------------------------------------------------- */

  // Uma tela leva 0.6s saindo, e nesses 0.6s ela ainda esta no documento. Sem
  // o aviso de 'saindo' ela continua recebendo clique o tempo todo: medido,
  // um clique repetido em DE NOVO reiniciava a corrida a cada quadro.
  function abrir(alvo) {
    if (!alvo.hidden && alvo.dataset.saindo !== '1') return;
    alvo.dataset.saindo = '';
    alvo.style.pointerEvents = '';
    alvo.hidden = false;
    if (!anima) return;
    window.gsap.fromTo(alvo,
      { autoAlpha: 0, y: 16 },
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
        alvo.style.pointerEvents = '';
        alvo.dataset.saindo = '';
      }
    });
  }

  function esperar(seg, feito) {
    if (window.gsap) window.gsap.delayedCall(seg, feito);
    else window.setTimeout(feito, seg * 1000);
  }

  /* §10 — entrada -------------------------------------------------------- */

  // O aperto que comeca a corrida e o mesmo que segura a gravidade. Sem isso,
  // quem morre com o dedo afundado recomeca caindo: o comecar() zera o
  // segurando, e o navegador nao manda outro keydown por uma tecla que ja
  // estava apertada (e.repeat fica de fora de proposito).
  function apertou() {
    if (C.estado === 'jogando') { C.segurando = true; return; }
    if (C.estado === 'pausado') { despausar(); return; }
    if (C.estado === 'menu') { fechar(el.inicio); comecar(); C.segurando = true; return; }
    if (C.estado === 'morto' && C.podeReiniciar) { fechar(el.fim); comecar(); C.segurando = true; }
  }

  function soltou() { C.segurando = false; }

  function ligarEntrada() {
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        apertou();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (C.estado === 'jogando') pausar();
        else if (C.estado === 'pausado') despausar();
      }
    });

    window.addEventListener('keyup', function (e) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') soltou();
    });

    // o palco inteiro e o botao — menos onde ja existe um controle de verdade
    el.palco.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, label, input, a')) return;
      e.preventDefault();
      apertou();
    });
    window.addEventListener('pointerup', soltou);
    window.addEventListener('pointercancel', soltou);
    window.addEventListener('blur', function () { soltou(); pausar(); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { soltou(); pausar(); }
    });

    el.btJogar.addEventListener('click', function () { fechar(el.inicio); comecar(); });
    el.btDeNovo.addEventListener('click', function () { fechar(el.fim); comecar(); });
    el.btMenu.addEventListener('click', aoMenu);
    el.btVoltar.addEventListener('click', despausar);
    el.btSair.addEventListener('click', aoMenu);

    el.optInverter.addEventListener('change', function () {
      C.inverter = el.optInverter.checked;
      guardar('avesso.inverter', C.inverter ? '1' : '0');
    });

    window.addEventListener('resize', medir);
    window.addEventListener('orientationchange', medir);
  }

  /* §11 — laco ----------------------------------------------------------- */

  function quadro(dt) {
    if (dt > 0.033) dt = 0.033;   // aba em segundo plano nao teleporta ninguem
    if (dt > 0) atualizar(dt);
    desenhar();
  }

  function ligarLaco() {
    if (window.gsap) {
      // o GSAP continua dono do relogio, como manda o CLAUDE.md
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

  /* §12 — inicio --------------------------------------------------------- */

  function pegar() {
    var ids = ['palco', 'tela', 'hud', 'placar', 'hudRecorde', 'inicio', 'fim',
      'pausa', 'btJogar', 'btDeNovo', 'btMenu', 'btVoltar', 'btSair',
      'fimPlacar', 'fimSelo', 'fimLinha', 'recorde', 'optInverter', 'marca'];
    for (var i = 0; i < ids.length; i++) {
      el[ids[i]] = document.getElementById(ids[i]);
      if (!el[ids[i]]) return false;
    }
    return true;
  }

  function partir() {
    if (!pegar()) return;

    cv = el.tela;
    cx = cv.getContext && cv.getContext('2d');
    if (!cx) return;   // sem canvas 2d a tela de inicio fica de pe sozinha

    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    C.poucoMov = !!(mq && mq.matches);
    anima = !!window.gsap && !C.poucoMov;

    C.recorde = parseInt(lerGuardado('avesso.recorde', '0'), 10) || 0;
    C.inverter = lerGuardado('avesso.inverter', '1') !== '0';
    el.recorde.textContent = C.recorde;
    el.hudRecorde.textContent = C.recorde;
    el.optInverter.checked = C.inverter;

    medir();
    reiniciarMundo();
    ligarEntrada();
    ligarLaco();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', partir);
  } else {
    partir();
  }
})();
