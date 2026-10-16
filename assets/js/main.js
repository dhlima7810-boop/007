/* =========================================================
   Pizza Mia — comportamentos da página
   ========================================================= */
(function () {
  'use strict';

  /* ---- Menu do celular ---- */
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

  /* ---- Sombra no topo ao rolar ---- */
  var topo = document.getElementById('topo');
  if (topo) {
    window.addEventListener('scroll', function () {
      topo.classList.toggle('rolou', window.scrollY > 20);
    }, { passive: true });
  }

  /* ---- Destaque da promoção de hoje ---- */
  var hoje = String(new Date().getDay()); // 0 = domingo
  var promoHoje = document.querySelector('.promo[data-dia="' + hoje + '"]');
  if (promoHoje) {
    promoHoje.classList.add('promo--hoje');
  }

  /* ---- Revelar seções ao rolar ---- */
  var alvos = document.querySelectorAll('.promo, .item, .galeria__item, .dado, .local__mapa');

  if ('IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    alvos.forEach(function (alvo, i) {
      alvo.classList.add('revelar');
      alvo.style.transitionDelay = (i % 4) * 60 + 'ms';
      observador.observe(alvo);
    });
  }

  /* ---- Lightbox da galeria ---- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxLeg = document.getElementById('lightboxLeg');
  var lightboxFechar = document.getElementById('lightboxFechar');
  var ultimoFoco = null;

  function abrir(botao) {
    ultimoFoco = botao;
    lightboxImg.src = botao.dataset.img;
    lightboxImg.alt = botao.querySelector('img').alt;
    lightboxLeg.textContent = botao.dataset.leg || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxFechar.focus();
  }

  function fechar() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (ultimoFoco) { ultimoFoco.focus(); }
  }

  if (lightbox) {
    document.querySelectorAll('.galeria__item').forEach(function (botao) {
      botao.addEventListener('click', function () { abrir(botao); });
    });

    lightboxFechar.addEventListener('click', fechar);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { fechar(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) { fechar(); }
    });
  }

  /* ---- Ano no rodapé ---- */
  var ano = document.getElementById('ano');
  if (ano) { ano.textContent = new Date().getFullYear(); }
})();
