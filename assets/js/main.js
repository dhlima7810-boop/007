/* =========================================================
   Pizza Mia — comportamento e animação

   Regra do projeto (CLAUDE.md):
   toda animação usa Lenis no scroll e GSAP no movimento.
   O encaixe entre os dois fica aqui no topo, uma vez só.
   ========================================================= */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var temLibs = typeof window.gsap !== 'undefined' &&
                typeof window.ScrollTrigger !== 'undefined' &&
                typeof window.Lenis !== 'undefined';
  var menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anima = temLibs && !menosMovimento;

  if (!anima) {
    // sem libs ou com movimento reduzido: mostra tudo, parado
    raiz.classList.remove('js');
    var cortina = document.getElementById('heroCortina');
    if (cortina) { cortina.style.display = 'none'; }
  }

  /* =======================================================
     1. Menu do celular
     ======================================================= */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('navegacao');

  function fecharMenu() {
    if (!nav) { return; }
    nav.classList.remove('aberto');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menu');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var aberto = nav.classList.toggle('aberto');
      menuBtn.setAttribute('aria-expanded', String(aberto));
      menuBtn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
  }

  /* =======================================================
     2. Sombra/fio no topo ao rolar
     ======================================================= */
  var topo = document.getElementById('topo');
  function marcarTopo(y) {
    if (topo) { topo.classList.toggle('rolou', y > 16); }
  }

  /* =======================================================
     3. Destaque do dia de hoje
     ======================================================= */
  var hoje = String(new Date().getDay()); // 0 = domingo
  var diaHoje = document.querySelector('.dia[data-dia="' + hoje + '"]');
  if (diaHoje) { diaHoje.classList.add('dia--hoje'); }

  /* =======================================================
     4. Lightbox das fotos
     ======================================================= */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxLeg = document.getElementById('lightboxLeg');
  var lightboxFechar = document.getElementById('lightboxFechar');
  var ultimoFoco = null;
  var lenis = null;

  function abrirFoto(botao) {
    ultimoFoco = botao;
    lightboxImg.src = botao.dataset.img;
    lightboxImg.alt = botao.querySelector('img').alt;
    lightboxLeg.textContent = botao.dataset.leg || '';
    lightbox.hidden = false;
    if (lenis) { lenis.stop(); } else { document.body.style.overflow = 'hidden'; }
    lightboxFechar.focus();
  }

  function fecharFoto() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute('src');
    if (lenis) { lenis.start(); } else { document.body.style.overflow = ''; }
    if (ultimoFoco) { ultimoFoco.focus(); }
  }

  if (lightbox) {
    document.querySelectorAll('.noite__foto').forEach(function (botao) {
      botao.addEventListener('click', function () { abrirFoto(botao); });
    });
    lightboxFechar.addEventListener('click', fecharFoto);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { fecharFoto(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) { fecharFoto(); }
    });
  }

  /* =======================================================
     5. Ano no rodapé
     ======================================================= */
  var ano = document.getElementById('ano');
  if (ano) { ano.textContent = new Date().getFullYear(); }

  /* -------------------------------------------------------
     Sem animação? Liga o scroll do navegador nas âncoras e sai.
     ------------------------------------------------------- */
  if (!anima) {
    window.addEventListener('scroll', function () { marcarTopo(window.scrollY); }, { passive: true });
    if (nav) {
      nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { fecharMenu(); } });
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* =======================================================
     6. Lenis + GSAP + ScrollTrigger — o encaixe

     Lenis é o dono do scroll; ele avisa o ScrollTrigger a cada
     quadro. O ticker do GSAP conduz o Lenis, então os dois
     andam no mesmo relógio e não brigam por quadro.
     ======================================================= */
  lenis = new Lenis({
    duration: 1.05,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
    syncTouch: true,       // o pin também vale no celular
    touchMultiplier: 1.4,
    gestureOrientation: 'vertical'
  });

  lenis.on('scroll', ScrollTrigger.update);
  lenis.on('scroll', function (e) { marcarTopo(e.scroll); });

  gsap.ticker.add(function (tempo) { lenis.raf(tempo * 1000); });
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop: function (valor) {
      if (arguments.length) { lenis.scrollTo(valor, { immediate: true }); }
      return lenis.animatedScroll;
    }
  });

  // âncoras passam pelo Lenis, nunca pelo scroll nativo
  document.querySelectorAll('a[href^="#"]').forEach(function (elo) {
    elo.addEventListener('click', function (e) {
      var alvo = document.querySelector(elo.getAttribute('href'));
      if (!alvo) { return; }
      e.preventDefault();
      fecharMenu();
      lenis.scrollTo(alvo, { offset: -4, duration: 1.2 });
    });
  });

  /* =======================================================
     7. Quebra o texto em letras, mantendo as palavras inteiras
     ======================================================= */
  function quebrarEmLetras(el) {
    var texto = el.textContent.trim();
    var letras = [];
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');

    texto.split(' ').forEach(function (palavra, i, todas) {
      var spanPalavra = document.createElement('span');
      spanPalavra.className = 'palavra';
      palavra.split('').forEach(function (caractere) {
        var spanLetra = document.createElement('span');
        spanLetra.className = 'letra';
        spanLetra.textContent = caractere;
        spanPalavra.appendChild(spanLetra);
        letras.push(spanLetra);
      });
      el.appendChild(spanPalavra);
      if (i < todas.length - 1) {
        var espaco = document.createElement('span');
        espaco.className = 'letra';
        espaco.textContent = ' ';
        el.appendChild(espaco);
        letras.push(espaco);
      }
    });
    return letras;
  }

  var divididos = {};
  document.querySelectorAll('[data-split]').forEach(function (el, i) {
    el.dataset.splitId = 's' + i;
    divididos[el.dataset.splitId] = quebrarEmLetras(el);
  });
  function letrasDe(el) { return divididos[el.dataset.splitId] || []; }

  /* =======================================================
     8. Abertura do hero
     ======================================================= */
  var linhasTitulo = document.querySelectorAll('.hero__titulo [data-split]');
  var abertura = gsap.timeline({ defaults: { ease: 'power3.out' } });

  abertura
    .fromTo('.hero__media', { scale: 1.14 }, { scale: 1, duration: 3.6, ease: 'power2.out' }, 0)
    .to('.hero__cortina', { opacity: 0, duration: 1.3, ease: 'power2.inOut' }, 0.2)
    .fromTo('.hero__rotulo',
      { opacity: 0, y: 14, filter: 'blur(5px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1 }, 0.65);

  linhasTitulo.forEach(function (linha, i) {
    abertura.from(letrasDe(linha), {
      yPercent: 115, rotate: 4, opacity: 0,
      duration: .95, ease: 'power4.out', stagger: 0.024
    }, 1.05 + i * 0.2);
  });

  abertura
    .to('.hero__texto', { opacity: 1, duration: .8 }, 1.75)
    .from('.hero__texto', { y: 22, duration: .8 }, 1.75)
    .to('.hero__acoes', { opacity: 1, duration: .1 }, 1.9)
    .from('.hero__acoes .botao', { y: 20, opacity: 0, duration: .7, stagger: .1 }, 1.9)
    .to('.rolar', { opacity: 1, duration: .7 }, 2.25);

  gsap.fromTo('.rolar__bola',
    { x: -12 }, { x: 34, duration: 1.6, repeat: -1, ease: 'power2.inOut' });

  /* =======================================================
     9. Parallax do hero e saída do indicador
     ======================================================= */
  gsap.to('.rolar', {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '14% top', scrub: true }
  });
  gsap.to('.hero__media', {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__inner', {
    y: 70, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '75% top', scrub: true }
  });

  /* =======================================================
     10. Letreiro em movimento contínuo
     ======================================================= */
  var trilho = document.getElementById('marqueeTrilho');
  if (trilho) {
    var grupo = trilho.querySelector('.marquee__grupo');
    while (trilho.offsetWidth < window.innerWidth * 2) {
      trilho.appendChild(grupo.cloneNode(true));
    }
    var umGrupo = grupo.offsetWidth;
    gsap.to(trilho, { x: -umGrupo, duration: umGrupo / 55, ease: 'none', repeat: -1 });
  }

  /* =======================================================
     11. Entradas das seções
     ======================================================= */
  document.querySelectorAll('.titulo [data-split]').forEach(function (linha) {
    gsap.from(letrasDe(linha), {
      yPercent: 110, opacity: 0, duration: .85, ease: 'power4.out', stagger: .02,
      scrollTrigger: { trigger: linha, start: 'top 88%' }
    });
  });

  document.querySelectorAll('.cabecalho .rotulo, .noite__cabecalho .rotulo').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, x: -14, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%' }
    });
  });

  document.querySelectorAll('.cabecalho__texto').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, y: 18, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  function entrarEmGrupo(pai, filho, desloca) {
    document.querySelectorAll(pai).forEach(function (p) {
      gsap.from(p.querySelectorAll(filho), {
        y: desloca, opacity: 0, duration: .8, ease: 'power3.out', stagger: .07,
        scrollTrigger: { trigger: p, start: 'top 84%' }
      });
    });
  }
  entrarEmGrupo('.semana', '.dia', 26);
  entrarEmGrupo('.itens', '.item', 24);
  entrarEmGrupo('.local__info', '.dado', 22);

  gsap.from('.local__mapa', {
    opacity: 0, y: 28, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.local__mapa', start: 'top 86%' }
  });

  /* =======================================================
     12. "Uma noite aqui" — seção presa na tela

     O scrub é o que dá a sensação de câmera: cada pixel rolado
     move um pedaço da linha do tempo, e o atraso faz a cena
     chegar amaciando. Com o Lenis no scroll, isso vale também
     no celular, por isso o pin agora roda em qualquer largura.
     ======================================================= */
  var secaoNoite = document.getElementById('noite');
  var cenas = gsap.utils.toArray('#noitePalco .noite__cena');
  var contador = document.getElementById('cenaAtual');
  var barra = document.getElementById('cenaBarra');

  if (secaoNoite && cenas.length) {
    secaoNoite.classList.add('pin-ativo');

    var linha = gsap.timeline();
    var marcos = [];   // em que ponto da linha do tempo cada cena entra

    cenas.forEach(function (cena, i) {
      var entram = cena.querySelectorAll('[data-entra]');
      var foto = cena.querySelector('.noite__foto img');

      // A cena 01 entra ANTES do pin, enquanto a seção ainda sobe.
      // Sem isso, quem chega na seção encontra ela vazia e só vê
      // alguma coisa depois de rolar mais um pouco.
      if (i === 0) {
        marcos.push(0);
        gsap.fromTo(entram,
          { autoAlpha: 0, y: 54 },
          {
            autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', stagger: 0.2,
            scrollTrigger: { trigger: secaoNoite, start: 'top 62%' }
          });
        return;
      }

      var pos = (i - 1) * 1.5 + 0.9;
      marcos.push(pos);

      linha.to(cenas[i - 1], {
        autoAlpha: 0, y: -36, scale: .97, duration: .45, ease: 'power3.in'
      }, pos - 0.55);

      linha.fromTo(entram,
        { autoAlpha: 0, y: 54 },
        { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', stagger: 0.2 },
        pos);

      if (foto) {
        linha.fromTo(foto, { scale: 1.07 }, { scale: 1, duration: 1.2, ease: 'none' }, pos);
      }
    });

    linha.to({}, { duration: .8 });   // respiro no fim, antes de soltar o pin

    ScrollTrigger.create({
      animation: linha,
      trigger: secaoNoite,
      start: 'top top',
      end: function () { return '+=' + (window.innerHeight * cenas.length * 0.95); },
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var t = self.progress * linha.duration();
        var i = 0;
        for (var k = 0; k < marcos.length; k++) {
          if (t >= marcos[k] - 0.25) { i = k; }
        }
        if (contador) { contador.textContent = String(i + 1).padStart(2, '0'); }
        if (barra) { barra.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')'; }
      }
    });
  }

  /* =======================================================
     13. Barra de progresso da leitura
     ======================================================= */
  gsap.to('#progresso', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 'top top', end: 'max', scrub: .3 }
  });

  // o pin muda a altura da página; recalcula depois que tudo carregou
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
