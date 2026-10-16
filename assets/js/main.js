/* =========================================================
   Pizza Mia — comportamentos e animacoes da pagina
   Depende do GSAP + ScrollTrigger (carregados pelo index.html).
   Se o GSAP nao carregar, a pagina continua funcionando: o
   bloco de abertura tira a classe .js e o conteudo aparece.
   ========================================================= */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var temGsap = typeof window.gsap !== 'undefined';
  var menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!temGsap || menosMovimento) {
    raiz.classList.remove('js');
    var cortina = document.getElementById('heroCortina');
    if (cortina) { cortina.style.display = 'none'; }
    var video = document.getElementById('heroVideo');
    if (video && menosMovimento) { video.pause(); }
  }

  /* =======================================================
     1. Menu do celular
     ======================================================= */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('navegacao');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var aberto = nav.classList.toggle('aberto');
      menuBtn.setAttribute('aria-expanded', String(aberto));
      menuBtn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('aberto');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Abrir menu');
      }
    });
  }

  /* =======================================================
     2. Sombra no topo ao rolar
     ======================================================= */
  var topo = document.getElementById('topo');
  if (topo) {
    window.addEventListener('scroll', function () {
      topo.classList.toggle('rolou', window.scrollY > 20);
    }, { passive: true });
  }

  /* =======================================================
     3. Destaque da promocao de hoje
     ======================================================= */
  var hoje = String(new Date().getDay()); // 0 = domingo
  var promoHoje = document.querySelector('.promo[data-dia="' + hoje + '"]');
  if (promoHoje) { promoHoje.classList.add('promo--hoje'); }

  /* =======================================================
     4. Lightbox das fotos
     ======================================================= */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxLeg = document.getElementById('lightboxLeg');
  var lightboxFechar = document.getElementById('lightboxFechar');
  var ultimoFoco = null;

  function abrirFoto(botao) {
    ultimoFoco = botao;
    lightboxImg.src = botao.dataset.img;
    lightboxImg.alt = botao.querySelector('img').alt;
    lightboxLeg.textContent = botao.dataset.leg || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxFechar.focus();
  }

  function fecharFoto() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute('src');
    document.body.style.overflow = '';
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
     5. Ano no rodape
     ======================================================= */
  var ano = document.getElementById('ano');
  if (ano) { ano.textContent = new Date().getFullYear(); }

  /* -------------------------------------------------------
     Daqui para baixo e so animacao. Sem GSAP, para por aqui.
     ------------------------------------------------------- */
  if (!temGsap || menosMovimento) { return; }

  gsap.registerPlugin(ScrollTrigger);

  /* =======================================================
     6. Quebra o texto em letras, mantendo as palavras inteiras
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

  var titulosDivididos = {};
  document.querySelectorAll('[data-split]').forEach(function (el, i) {
    el.dataset.splitId = 'split-' + i;
    titulosDivididos[el.dataset.splitId] = quebrarEmLetras(el);
  });

  function letrasDe(el) { return titulosDivididos[el.dataset.splitId] || []; }

  /* =======================================================
     7. Abertura do hero
        A ordem cria a tensao: o video entra grande e vai
        assentando, o risco se estica, a linha de cima
        aparece esticada e fecha o espacamento, e so entao
        a primeira palavra do titulo sobe.
     ======================================================= */
  var linhasTitulo = document.querySelectorAll('.hero__titulo [data-split]');
  var abertura = gsap.timeline({ defaults: { ease: 'power3.out' } });

  abertura
    .fromTo('.hero__video',
      { scale: 1.22 },
      { scale: 1, duration: 4.2, ease: 'power2.out' }, 0)
    .to('.hero__cortina',
      { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 0.25)
    .to('.hero__risco',
      { scaleX: 1, duration: 1, ease: 'power4.inOut' }, 0.55)
    .fromTo('.hero__tag-txt',
      { opacity: 0, letterSpacing: '1.1em', filter: 'blur(7px)' },
      { opacity: 1, letterSpacing: '0.14em', filter: 'blur(0px)', duration: 1.2 }, 0.8);

  linhasTitulo.forEach(function (linha, i) {
    abertura.from(letrasDe(linha), {
      yPercent: 115,
      rotate: 5,
      opacity: 0,
      duration: 1,
      ease: 'power4.out',
      stagger: 0.026
    }, 1.45 + i * 0.22);
  });

  abertura
    .to('.hero__texto', { opacity: 1, duration: .9 }, 2.15)
    .from('.hero__texto', { y: 26, duration: .9 }, 2.15)
    .to('.hero__acoes', { opacity: 1, duration: .1 }, 2.3)
    .from('.hero__acoes .botao', { y: 24, opacity: 0, duration: .8, stagger: .11 }, 2.3)
    .to('.rolar', { opacity: 1, duration: .8 }, 2.75)
    .from('.rolar', { y: -16, duration: .8 }, 2.75);

  /* bolinha pulando dentro do indicador */
  gsap.to('.rolar__bola', {
    y: 14, opacity: .2, duration: .9,
    repeat: -1, yoyo: true, ease: 'power1.inOut'
  });

  /* =======================================================
     8. Indicador some ao descer + parallax do video
     ======================================================= */
  gsap.to('.rolar', {
    opacity: 0, y: 24, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '18% top', scrub: true }
  });

  gsap.to('.hero__media', {
    yPercent: 16, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  gsap.to('.hero__inner', {
    y: 90, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '70% top', scrub: true }
  });

  /* =======================================================
     9. Letreiro amarelo em movimento continuo
     ======================================================= */
  var trilho = document.getElementById('marqueeTrilho');
  if (trilho) {
    var grupo = trilho.querySelector('.marquee__grupo');
    // duplica ate dar o dobro da largura da tela, para o loop nao mostrar buraco
    while (trilho.offsetWidth < window.innerWidth * 2) {
      trilho.appendChild(grupo.cloneNode(true));
    }
    var umGrupo = grupo.offsetWidth;
    gsap.to(trilho, {
      x: -umGrupo,
      duration: umGrupo / 55,
      ease: 'none',
      repeat: -1
    });
  }

  /* =======================================================
     10. Titulos das secoes sobem da janela
     ======================================================= */
  document.querySelectorAll('.secao__titulo [data-split]').forEach(function (linha) {
    gsap.from(letrasDe(linha), {
      yPercent: 110, opacity: 0, duration: .85, ease: 'power4.out', stagger: .02,
      scrollTrigger: { trigger: linha, start: 'top 88%' }
    });
  });

  document.querySelectorAll('.secao__sobretitulo').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, letterSpacing: '.6em', duration: .9,
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  /* =======================================================
     11. Entrada dos blocos
     ======================================================= */
  function entrarEmGrupo(seletorPai, seletorFilho, deslocamento) {
    document.querySelectorAll(seletorPai).forEach(function (pai) {
      gsap.from(pai.querySelectorAll(seletorFilho), {
        y: deslocamento, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08,
        scrollTrigger: { trigger: pai, start: 'top 82%' }
      });
    });
  }

  entrarEmGrupo('.promos', '.promo', 36);
  entrarEmGrupo('.cardapio', '.item', 30);
  entrarEmGrupo('.local__info', '.dado', 26);
  entrarEmGrupo('.aviso', 'p, .botao', 20);

  gsap.from('.local__mapa', {
    opacity: 0, scale: .96, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.local__mapa', start: 'top 85%' }
  });

  /* =======================================================
     12. "Uma noite aqui" — secao presa na tela (pin scroll)

     O scroll deixa de rolar a pagina e passa a mover a cena:
     e o scrub que da a sensacao de camera, porque cada pixel
     rolado corresponde a um pedaco da linha do tempo, e o
     atraso de 1s faz a camera chegar amaciando em vez de
     grudar no dedo.

     Dentro de cada cena os elementos entram em sequencia,
     0.2s entre um e outro, com ease power3.out.

     So no desktop: no celular a secao vira uma lista comum,
     porque prender a tela em telas pequenas atrapalha mais
     do que ajuda.
     ======================================================= */
  var mm = gsap.matchMedia();

  mm.add('(min-width: 860px)', function () {
    var secao = document.getElementById('noite');
    var cenas = gsap.utils.toArray('#noitePalco .noite__cena');
    var contador = document.getElementById('cenaAtual');
    if (!secao || !cenas.length) { return; }

    secao.classList.add('pin-ativo');

    var linha = gsap.timeline({
      scrollTrigger: {
        trigger: secao,
        start: 'top top',
        end: function () { return '+=' + (window.innerHeight * cenas.length * 0.9); },
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var i = Math.min(cenas.length - 1, Math.floor(self.progress * cenas.length));
          if (contador) { contador.textContent = String(i + 1).padStart(2, '0'); }
        }
      }
    });

    cenas.forEach(function (cena, i) {
      var entram = cena.querySelectorAll('[data-entra]');
      var foto = cena.querySelector('.noite__foto img');

      // a cena anterior recua, como quem sai de foco
      if (i > 0) {
        linha.to(cenas[i - 1], {
          autoAlpha: 0, y: -40, scale: .96, duration: .45, ease: 'power3.in'
        }, i - 0.55);
      }

      linha.fromTo(entram,
        { autoAlpha: 0, y: 56 },
        { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', stagger: 0.2 },
        i);

      // a foto continua se aproximando enquanto a cena esta no ar
      if (foto) {
        linha.fromTo(foto, { scale: 1.08 }, { scale: 1, duration: 1.2, ease: 'none' }, i);
      }
    });

    return function () {
      secao.classList.remove('pin-ativo');
      gsap.set(cenas, { clearProps: 'all' });
      gsap.set('#noitePalco [data-entra]', { clearProps: 'all' });
    };
  });

  /* no celular: entrada simples, cena por cena */
  mm.add('(max-width: 859px)', function () {
    var limpar = [];
    document.querySelectorAll('#noitePalco .noite__cena').forEach(function (cena) {
      limpar.push(gsap.fromTo(cena.querySelectorAll('[data-entra]'),
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: 0.2,
          scrollTrigger: { trigger: cena, start: 'top 80%' }
        }));
    });
    return function () { limpar.forEach(function (t) { t.kill(); }); };
  });

  /* =======================================================
     13. Barra de progresso da leitura
     ======================================================= */
  gsap.to('#progresso', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 'top top', end: 'max', scrub: .3 }
  });

  /* =======================================================
     14. Pausa o video quando ele sai da tela (economiza bateria)
     ======================================================= */
  var video = document.getElementById('heroVideo');
  if (video) {
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: function (self) {
        if (self.isActive) { video.play().catch(function () {}); }
        else { video.pause(); }
      }
    });
  }
})();
