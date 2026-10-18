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

  // A rede de seguranca do <head> ja pode ter revelado tudo, se as libs
  // demoraram demais. Nesse caso nao se reesconde para animar: piscaria a
  // pagina na cara de quem acabou de esperar. Segue parado, como nas
  // outras degradacoes.
  if (window.__pmRede) { clearTimeout(window.__pmRede); }
  var anima = temLibs && !menosMovimento && !window.__pmRevelou;

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
  var diaHoje = document.querySelector('.carimbo[data-dia="' + hoje + '"]');
  if (diaHoje) { diaHoje.classList.add('carimbo--hoje'); }

  /* =======================================================
     4. Lightbox das fotos
     ======================================================= */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxLeg = document.getElementById('lightboxLeg');
  var lightboxFechar = document.getElementById('lightboxFechar');
  var ultimoFoco = null;
  var lenis = null;

  var figura = lightbox ? lightbox.querySelector('.lightbox__figura') : null;

  function travarFundo(travar) {
    if (lenis) { lenis[travar ? 'stop' : 'start'](); }
    else { document.body.style.overflow = travar ? 'hidden' : ''; }
  }

  function abrirFoto(botao) {
    ultimoFoco = botao;
    lightboxImg.src = botao.dataset.img;
    lightboxImg.alt = botao.querySelector('img').alt;
    lightboxLeg.textContent = botao.dataset.leg || '';
    lightbox.hidden = false;
    travarFundo(true);

    // a foto abria com corte seco; agora entra, como o resto do site
    if (anima) {
      gsap.fromTo(lightbox, { opacity: 0 },
        { opacity: 1, duration: .7, ease: 'expo.out' });
      gsap.fromTo(figura, { y: 34, scale: .98 },
        { y: 0, scale: 1, duration: 1, ease: 'expo.out' });
    }
    lightboxFechar.focus();
  }

  function fecharFoto() {
    function terminar() {
      lightbox.hidden = true;
      lightboxImg.removeAttribute('src');
      if (anima) { gsap.set([lightbox, figura], { clearProps: 'all' }); }
      travarFundo(false);
      if (ultimoFoco) { ultimoFoco.focus(); }
    }

    if (!anima) { terminar(); return; }

    gsap.killTweensOf([lightbox, figura]);
    gsap.to(lightbox, { opacity: 0, duration: .6, ease: 'power3.in', onComplete: terminar });
    gsap.to(figura, { y: 20, scale: .99, duration: .6, ease: 'power3.in' });
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
     8. Abertura: a camera sobe, a lua acende e vira a logo

     A camera sobe animando o `object-position` da foto, nao a posicao
     do elemento: deslocar `.hero__media` para baixo abriria fresta no
     topo, porque o transbordo dela e so de 4%. Mexendo no enquadramento
     dentro do mesmo retangulo, nao ha fresta possivel — e tambem nao ha
     briga com o parallax da secao 9, que escreve `yPercent` no elemento.

     A lua desce para dentro do quadro e troca de pele: dois circulos do
     mesmo tamanho no mesmo lugar, um apagando enquanto o outro acende.
     Formada, a logo voa ate a vaga do cabecalho e cruza com a logo de
     verdade ali. Nunca ha duas na tela: e sempre a mesma bola.
     ======================================================= */
  var linhasTitulo = document.querySelectorAll('.marcaovo [data-split]');
  var lua = document.getElementById('lua');
  var logoTopo = document.querySelector('.marca__logo');
  var temLua = !!(lua && logoTopo);

  function centroDe(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
  }

  if (temLua) {
    // A logo do cabecalho so acende no fim do voo — e isso e feito em
    // GSAP, nunca em CSS: sem JS ela tem de aparecer normal, como
    // qualquer outra imagem da pagina.
    gsap.set(logoTopo, { autoAlpha: 0 });
    gsap.set(lua, { y: -240, scale: .84 });
  }

  var abertura = gsap.timeline({ defaults: { ease: 'power3.out' } });

  abertura
    .fromTo('.hero__media', { scale: 1.14 }, { scale: 1, duration: 3.6, ease: 'expo.out' }, 0)
    // a camera subindo: o enquadramento sobe da calcada para o ceu
    .fromTo('.hero__media img',
      { objectPosition: '50% 76%' },
      { objectPosition: '50% 42%', duration: 3.2, ease: 'expo.inOut' }, 0.4)
    .to('.hero__cortina', { opacity: 0, duration: 1.4, ease: 'expo.inOut' }, 0.2);

  if (temLua) {
    abertura
      // a lua entra por cima, como quem estava fora do quadro
      .to('.lua__disco', { opacity: 1, duration: 1.4, ease: 'expo.out' }, 1.5)
      .to(lua, { y: 0, scale: 1, duration: 1.8, ease: 'expo.out' }, 1.5)
      // o morph: as duas bolas trocam sem sair do lugar
      .to('.lua__disco', { opacity: 0, duration: 1, ease: 'expo.inOut' }, 2.9)
      .to('.lua__logo', { opacity: 1, duration: 1, ease: 'expo.inOut' }, 2.9)
      // o voo ate a vaga do cabecalho. Os retangulos sao lidos em funcao,
      // isto e, no instante do tween: lidos na montagem da linha do tempo
      // mirariam uma posicao de 4 segundos antes.
      .to(lua, {
        x: function () { return gsap.getProperty(lua, 'x') + centroDe(logoTopo).x - centroDe(lua).x; },
        y: function () { return gsap.getProperty(lua, 'y') + centroDe(logoTopo).y - centroDe(lua).y; },
        scale: function () { return centroDe(logoTopo).w / (lua.offsetWidth || 1); },
        rotation: 300,
        duration: 1.3, ease: 'expo.inOut'
      }, 3.8)
      // a cruzada invisivel: mesmo ponto, mesmo tamanho, meio segundo cada
      .to(lua, { autoAlpha: 0, duration: .6, ease: 'power3.inOut' }, 5.0)
      .to(logoTopo, { autoAlpha: 1, duration: .6, ease: 'power3.inOut' }, 5.0);
  }

  abertura.fromTo('.hero__rotulo',
    { opacity: 0, y: 14, filter: 'blur(5px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1 }, temLua ? 3.9 : 0.65);

  var tLetras = temLua ? 4.3 : 1.05;
  linhasTitulo.forEach(function (linha, i) {
    abertura.from(letrasDe(linha), {
      yPercent: 115, rotate: 4, opacity: 0,
      duration: 1.1, ease: 'expo.out', stagger: 0.045
    }, tLetras + i * 0.2);
  });

  abertura
    .set('.hero__acoes', { opacity: 1 }, tLetras + 0.85)
    .from('.hero__acoes .botao', { y: 20, opacity: 0, duration: .9, stagger: .12 }, tLetras + 0.85)
    .to('.rolar', { opacity: 1, duration: .9 }, tLetras + 1.35);

  gsap.fromTo('.rolar__bola',
    { x: -12 }, { x: 34, duration: 1.9, repeat: -1, ease: 'power3.inOut' });

  // Sao ~4,5s ate o wordmark. Se a pessoa rolar, clicar ou teclar antes do
  // fim, a abertura termina na hora — senao a chegada vira armadilha, e a
  // sequencia da lua ficaria rodando por cima de uma pagina ja em curso.
  function pularAbertura() {
    if (abertura.progress() < 1) { abertura.progress(1); }
  }
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (evt) {
    window.addEventListener(evt, pularAbertura, { once: true, passive: true });
  });

  // Chegando FORA do topo — F5 no meio da pagina, ou um link /#cardapio — a
  // abertura nao tem sentido: a lua acenderia por cima da secao que a
  // pessoa pediu, e o voo miraria uma .marca__logo que a queda ja deslocou
  // pelo scroll, terminando fora da tela. O cabecalho ficaria sem logo
  // nenhuma. Nesse caso a linha do tempo vai direto para o fim.
  // A conferencia se repete no `load` porque o navegador restaura o scroll
  // depois, e as vezes so entao a pagina sai do topo.
  function conferirEntrada() {
    if (window.scrollY > 40 || location.hash) { pularAbertura(); }
  }
  conferirEntrada();
  window.addEventListener('load', conferirEntrada);

  /* =======================================================
     9. Parallax do hero e saída do indicador
     ======================================================= */
  gsap.to('.rolar', {
    opacity: 0, duration: 1, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '14% top', scrub: true }
  });
  gsap.to('.hero__media', {
    yPercent: 12, duration: 1, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__inner', {
    y: 70, opacity: 0, duration: 1, ease: 'none',
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
      yPercent: 110, opacity: 0, duration: 1, ease: 'expo.out', stagger: .04,
      scrollTrigger: { trigger: linha, start: 'top 88%' }
    });
  });

  document.querySelectorAll('.cabecalho .rotulo, .noite__cabecalho .rotulo').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, x: -14, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%' }
    });
  });

  document.querySelectorAll('.cabecalho__texto').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, y: 18, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  // clearProps no fim e obrigatorio: o GSAP escreve transform inline, e
  // style inline ganha da folha. Sem limpar, todo hover que move (o carimbo
  // que levanta, a linha do cupom que rasga) ficaria preso no transform da
  // entrada e nao aconteceria nunca.
  function entrarEmGrupo(pai, filho, desloca, passo) {
    document.querySelectorAll(pai).forEach(function (p) {
      gsap.from(p.querySelectorAll(filho), {
        y: desloca, opacity: 0, duration: 1, ease: 'power3.out',
        stagger: passo === undefined ? .07 : passo,
        clearProps: 'transform',
        scrollTrigger: { trigger: p, start: 'top 84%' }
      });
    });
  }
  entrarEmGrupo('.acoes', '.acao', 34);
  // Os dias nao sobem como uma lista: eles descem e assentam, e a pilula
  // chega girando até o tombo que o CSS deixou. E um carimbo batendo.
  document.querySelectorAll('.semana').forEach(function (lista) {
    gsap.from(lista.querySelectorAll('.carimbo'), {
      opacity: 0, y: -30, scale: .94, duration: 1.1, ease: 'power3.out', stagger: .08,
      clearProps: 'transform',
      scrollTrigger: { trigger: lista, start: 'top 84%' }
    });
    gsap.from(lista.querySelectorAll('.carimbo__dia'), {
      rotation: 9, scale: .8, duration: 1.1, ease: 'expo.out', stagger: .08,
      clearProps: 'transform',
      scrollTrigger: { trigger: lista, start: 'top 84%' }
    });
  });
  entrarEmGrupo('.itens', '.item', 24);
  entrarEmGrupo('.ticket__lista', '.ticket__item', 18, .022);
  entrarEmGrupo('.local__info', '.dado', 22);

  gsap.from('.local__mapa', {
    opacity: 0, y: 28, duration: 1.2, ease: 'power3.out',
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
  var contadorTotal = document.getElementById('cenaTotal');
  var barra = document.getElementById('cenaBarra');

  if (contadorTotal) {
    contadorTotal.textContent = String(cenas.length).padStart(2, '0');
  }

  if (secaoNoite && cenas.length) {
    secaoNoite.classList.add('pin-ativo');

    // a cena 01 ja chega sendo a de cima: sem isso ela fica sem ponteiro
    // ate o primeiro onUpdate, e o hover do titulo nao responde na chegada.
    cenas[0].classList.add('cena-ativa');

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
            autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.2,
            scrollTrigger: { trigger: secaoNoite, start: 'top 62%' }
          });
        return;
      }

      var pos = (i - 1) * 1.5 + 0.9;
      marcos.push(pos);

      linha.to(cenas[i - 1], {
        autoAlpha: 0, y: -36, scale: .97, duration: .7, ease: 'power3.in'
      }, pos - 0.85);

      linha.fromTo(entram,
        { autoAlpha: 0, y: 54 },
        { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.2 },
        pos);

      if (foto) {
        linha.fromTo(foto, { scale: 1.07 }, { scale: 1, duration: 1.4, ease: 'power3.out' }, pos);
      }
    });

    linha.to({}, { duration: 1, ease: 'none' });  // respiro no fim, antes de soltar o pin

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
        for (var c = 0; c < cenas.length; c++) {
          cenas[c].classList.toggle('cena-ativa', c === i);
        }
        if (contador) { contador.textContent = String(i + 1).padStart(2, '0'); }
        if (barra) { barra.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')'; }
      }
    });
  }

  /* =======================================================
     12b. O cardapio vira pagina no celular

     Acima de 720px o cupom ja le como livro aberto, com o vinco no
     meio. Abaixo disso vira coluna unica — e ai o dedo vira a folha:
     os sabores sao repartidos em cadernos de 6 e a folha da vez gira
     pela lombada para descobrir a de baixo.

     O caderno e montado em JS de proposito. Sem JS, sem GSAP ou com
     a janela larga, o que fica na tela e a lista inteira de uma vez,
     que e o conteudo de verdade. A paginacao e conforto, nao suporte.
     ======================================================= */
  var lista = document.querySelector('.ticket__lista');

  if (lista && gsap.matchMedia) {
    gsap.matchMedia().add('(max-width: 719px)', function () {
      var itens = Array.prototype.slice.call(lista.querySelectorAll('.ticket__item'));
      if (itens.length < 8) { return; }

      // a entrada em grupo prendeu esses <li> num tween com opacity 0;
      // sem soltar antes de mover, o cardapio some no celular
      gsap.killTweensOf(itens);
      gsap.set(itens, { clearProps: 'all' });

      var POR_PAGINA = 6;
      var caderno = document.createElement('div');
      caderno.className = 'ticket__caderno';
      var folhas = [];

      for (var i = 0; i < itens.length; i += POR_PAGINA) {
        var folha = document.createElement('ol');
        folha.className = 'ticket__folha';
        folha.start = i + 1;
        for (var k = i; k < Math.min(i + POR_PAGINA, itens.length); k++) {
          folha.appendChild(itens[k]);
        }
        caderno.appendChild(folha);
        folhas.push(folha);
      }

      var nav = document.createElement('div');
      nav.className = 'ticket__nav';
      nav.innerHTML =
        '<button type="button" class="ticket__virar" data-dir="-1" aria-label="Página anterior do cardápio">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<p class="ticket__folio" aria-live="polite">Página <span></span> de ' + folhas.length + '</p>' +
        '<button type="button" class="ticket__virar" data-dir="1" aria-label="Próxima página do cardápio">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>';

      lista.parentNode.insertBefore(caderno, lista.nextSibling);
      caderno.parentNode.insertBefore(nav, caderno.nextSibling);
      lista.hidden = true;

      // A altura do caderno e a da folha mais alta, senao o pe do cupom
      // sobe e desce a cada virada. Medir so depois de soltar as folhas
      // do empilhamento: enquanto sao absolutas com inset:0 dentro de um
      // pai sem altura, todas medem zero e o cupom fecha.
      caderno.classList.add('medindo');
      var alta = 0;
      folhas.forEach(function (f) { alta = Math.max(alta, f.offsetHeight); });
      caderno.classList.remove('medindo');
      caderno.style.height = alta + 'px';

      var atual = 0, virando = false;
      var folio = nav.querySelector('.ticket__folio span');
      var botoes = Array.prototype.slice.call(nav.querySelectorAll('.ticket__virar'));

      function pintar() {
        folhas.forEach(function (f, i) {
          f.classList.toggle('e-a-folha', i === atual);
          f.setAttribute('aria-hidden', i === atual ? 'false' : 'true');
        });
        folio.textContent = String(atual + 1);
        botoes[0].disabled = atual === 0;
        botoes[1].disabled = atual === folhas.length - 1;
      }

      function virar(destino) {
        if (virando || destino === atual || destino < 0 || destino >= folhas.length) { return; }
        virando = true;
        var sai = folhas[atual], entra = folhas[destino], frente = destino > atual;
        var pivo = { transformOrigin: 'left center', transformPerspective: 1100 };

        // As duas folhas ficam visiveis durante a virada, e quem apaga a
        // que saiu e o pintar() no fim. Visibilidade so pela classe: posta
        // inline, ela sobrevive ao clearProps e a folha nunca mais some —
        // em tres viradas o caderno vira uma pilha de paginas sobrepostas.
        entra.classList.add('e-a-folha');

        function fim() {
          gsap.set([sai, entra], { clearProps: 'transform,opacity,zIndex' });
          atual = destino; virando = false; pintar();
        }

        if (frente) {
          // a folha da vez gira pela lombada e descobre a de baixo
          gsap.set(entra, { zIndex: 1, rotationY: 0, opacity: 1 });
          gsap.set(sai, Object.assign({ zIndex: 2 }, pivo));
          gsap.to(sai, { rotationY: -112, opacity: 0, duration: .9, ease: 'expo.inOut', onComplete: fim });
        } else {
          // voltando, a folha anterior desce de volta por cima
          gsap.set(sai, { zIndex: 1 });
          gsap.set(entra, Object.assign({ zIndex: 2, rotationY: -112, opacity: 0 }, pivo));
          gsap.to(entra, { rotationY: 0, opacity: 1, duration: .9, ease: 'expo.inOut', onComplete: fim });
        }
      }

      botoes.forEach(function (b) {
        b.addEventListener('click', function () { virar(atual + (+b.dataset.dir)); });
      });

      // O gesto so e lido no soltar, e so se for claramente horizontal.
      // Nada de preventDefault: a rolagem vertical com o dedo em cima do
      // cardapio continua sendo do Lenis, como em qualquer outro lugar.
      var px = null, py = null;
      caderno.addEventListener('pointerdown', function (e) { px = e.clientX; py = e.clientY; });
      caderno.addEventListener('pointercancel', function () { px = null; });
      caderno.addEventListener('pointerup', function (e) {
        if (px === null) { return; }
        var dx = e.clientX - px, dy = e.clientY - py;
        px = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          virar(atual + (dx < 0 ? 1 : -1));
        }
      });

      pintar();
      ScrollTrigger.refresh();

      // desmontagem: a janela alargou, o livro volta a ser lista
      return function () {
        gsap.killTweensOf(folhas);
        folhas.forEach(function (f) {
          while (f.firstChild) { lista.appendChild(f.firstChild); }
        });
        gsap.set(lista.querySelectorAll('.ticket__item'), { clearProps: 'all' });
        caderno.remove(); nav.remove(); lista.hidden = false;
        ScrollTrigger.refresh();
      };
    });
  }

  /* =======================================================
     13. A logo despencando

     E a logo do cabecalho em pessoa, a mesma que nasceu da lua: nao
     existe copia. Cai girando, presa ao scroll, e subir a pagina faz a
     queda voltar ate a vaga. Tween preso ao scroll — por isso ease
     'none' (exceção 1 do CLAUDE.md).
     ======================================================= */
  if (temLua) {
    gsap.set(logoTopo, { transformOrigin: 'center center' });

    // Tres quedas ao longo da pagina. A primeira parte da propria vaga do
    // cabecalho (y:0), porque agora quem cai e a logo de la — nao ha copia.
    // O `.topo` e sticky e nao tem overflow:hidden, entao ela sai da caixa
    // do cabecalho sem ser cortada, e a origem dela acompanha o alto da
    // janela, que e o que faz a queda ler como queda.
    var cair = gsap.timeline({
      scrollTrigger: { start: 'top top', end: 'max', scrub: .7, invalidateOnRefresh: true }
    });
    // immediateRender:false a partir da segunda queda. O `fromTo` do GSAP
    // escreve o estado inicial na HORA EM QUE E CRIADO, nao quando chega a
    // vez dele na linha do tempo — entao as tres criadas em seguida deixam
    // valer o `from` da ultima, e a logo nasce em y:-180, fora da tela, no
    // topo da pagina. Sem isso o cabecalho carrega sem logo nenhuma.
    for (var q = 0; q < 3; q++) {
      cair.fromTo(logoTopo,
        { y: q === 0 ? 0 : -180 },
        { y: function () { return window.innerHeight + 180; },
          rotation: '+=760', duration: 1, ease: 'none',
          immediateRender: q === 0 });
    }

    // A vaga que a logo deixa no cabecalho se fecha por TRANSFORM no texto,
    // nunca animando largura, margem ou gap. Transform nao reflui: o texto
    // desliza os 36px da logo mais o espaco e para exatamente onde ela
    // estava. Animar layout faria o navegador recalcular a caixa a cada
    // quadro — e e dai que vem o tremor.
    var nomeMarca = document.querySelector('.marca__nome');
    if (nomeMarca) {
      gsap.to(nomeMarca, {
        x: function () {
          var r = logoTopo.getBoundingClientRect();
          var pai = getComputedStyle(logoTopo.parentElement);
          return -(r.width + (parseFloat(pai.columnGap || pai.gap) || 0));
        },
        ease: 'none',
        scrollTrigger: { start: 'top top', end: '+=420', scrub: .7, invalidateOnRefresh: true }
      });
    }

    // o bamboleio lateral: sem ele a queda vira um elevador descendo
    var balanco = Math.min(window.innerWidth * .2, 190);
    gsap.to(logoTopo, {
      keyframes: { x: [0, balanco, -balanco * .75, balanco * 1.05, -balanco * .5, balanco * .8, 0] },
      ease: 'none',
      scrollTrigger: { start: 'top top', end: 'max', scrub: .7 }
    });
  }

  /* =======================================================
     14. Barra de progresso da leitura
     ======================================================= */
  gsap.to('#progresso', {
    scaleX: 1, duration: 1, ease: 'none',
    scrollTrigger: { start: 'top top', end: 'max', scrub: .6 }
  });

  // o pin muda a altura da página; recalcula depois que tudo carregou
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
