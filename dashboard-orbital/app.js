/* ORBITAL — lógica do painel. Sem bibliotecas: SVG e DOM puros. */
(function () {
  'use strict';
  const D = window.DADOS;
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const paisPorId = Object.fromEntries(D.paises.map(p => [p.id, p]));
  const empPais = Object.fromEntries(D.empresas.map(e => [e.nome, e.pais]));
  const NEON = '#3ee6ff';

  const state = { pais: '', tri: 0, vivo: false, novaId: null };

  /* ---------- formatação ---------- */
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const curto = v => {
    if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
    if (v >= 1e3) return 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
    return brl(v);
  };
  const int = v => Math.round(v).toLocaleString('pt-BR');
  const pct = v => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- dados ---------- */
  function filtrar({ ignorarPais = false, ignorarTri = false } = {}) {
    return D.vendas.filter(s =>
      (ignorarPais || !state.pais || s.pais === state.pais) &&
      (ignorarTri || !state.tri || s.q === state.tri));
  }
  const total = arr => arr.reduce((s, x) => s + x.v, 0);
  function agrupar(arr, chave) {
    const m = new Map();
    for (const s of arr) {
      const k = chave(s);
      const o = m.get(k) || { k, v: 0, n: 0 };
      o.v += s.v; o.n++;
      m.set(k, o);
    }
    return [...m.values()].sort((a, b) => b.v - a.v);
  }
  function svg(tag, attrs, html) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (html) e.innerHTML = html;
    return e;
  }
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const tipAttr = html => `data-tip="${esc(html)}"`;
  function escala(max) {
    const bruto = max / 4, mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const passo = [1, 2, 2.5, 5, 10].map(f => f * mag).find(p => p >= bruto);
    return { passo, topo: passo * 4 };
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    const f = filtrar();
    const baseAno = filtrar({ ignorarTri: true });
    const tAtual = state.tri || 4, tAnt = tAtual - 1;
    const trim = q => baseAno.filter(s => s.q === q);
    const metricas = [
      { rot: 'Faturamento', fn: a => total(a), fmt: curto },
      { rot: 'Vendas feitas', fn: a => a.length, fmt: int },
      { rot: 'Ticket médio', fn: a => (a.length ? total(a) / a.length : 0), fmt: curto },
      { rot: 'Empresas ativas', fn: a => new Set(a.map(s => s.emp)).size, fmt: int },
    ];
    $('#kpis').replaceChildren(...metricas.map(m => {
      let delta = '<span class="sub">sem período anterior</span>';
      if (tAnt >= 1) {
        const a = m.fn(trim(tAtual)), b = m.fn(trim(tAnt));
        if (b) {
          const d = a / b - 1;
          delta = `<b class="${d >= 0 ? 'sobe' : 'desce'}">${d >= 0 ? '▲' : '▼'} ${pct(Math.abs(d))}</b> T${tAtual} vs T${tAnt}`;
        }
      }
      return el(`<div class="kpi"><div class="kpi__rot">${m.rot}</div><div class="kpi__val">${m.fmt(m.fn(f))}</div><div class="kpi__delta">${delta}</div></div>`);
    }));
  }

  /* ---------- radar de países ---------- */
  function renderRadar() {
    const dados = agrupar(filtrar({ ignorarPais: true }), s => s.pais);
    const max = dados[0] ? dados[0].v : 1;
    const soma = dados.reduce((s, x) => s + x.v, 0);
    const S = svg('svg', { viewBox: '-80 0 560 400', role: 'img', 'aria-label': 'Radar com os países ordenados por faturamento' });
    S.appendChild(svg('defs', {}, `<radialGradient id="varr" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 200) scale(190)"><stop offset="0" stop-color="${NEON}" stop-opacity=".35"/><stop offset="1" stop-color="${NEON}" stop-opacity="0"/></radialGradient>`));
    [60, 105, 150, 190].forEach(r => S.appendChild(svg('circle', { cx: 200, cy: 200, r, fill: 'none', class: 'grid', 'stroke-dasharray': r === 190 ? '' : '2 5' })));
    for (let a = 0; a < 360; a += 45) {
      const rad = a * Math.PI / 180;
      S.appendChild(svg('line', { x1: 200, y1: 200, x2: 200 + 190 * Math.cos(rad), y2: 200 + 190 * Math.sin(rad), class: 'grid' }));
    }
    S.appendChild(svg('path', { class: 'varredura', d: 'M200 200 L390 200 A190 190 0 0 0 331 66 Z', fill: 'url(#varr)', transform: 'rotate(0)' }));
    S.lastChild.setAttribute('style', 'transform-origin:200px 200px');
    S.appendChild(svg('circle', { cx: 200, cy: 200, r: 26, fill: 'none', stroke: NEON, 'stroke-width': 1, class: 'nucleo-pulso' }));
    S.appendChild(svg('circle', { cx: 200, cy: 200, r: 8, fill: NEON }));

    dados.forEach((d, i) => {
      const p = paisPorId[d.k];
      const raio = 62 + i * (118 / Math.max(1, dados.length - 1));
      const ang = (i * 137.5 - 60) * Math.PI / 180;
      const x = 200 + raio * Math.cos(ang), y = 200 + raio * Math.sin(ang);
      const r = 7 + 17 * Math.sqrt(d.v / max);
      const cls = 'planeta' + (state.pais === p.id ? ' ativo' : state.pais ? ' apagado' : '');
      const dica = `<b>${p.nome}</b><br>${brl(d.v)}<br>${int(d.n)} vendas · ${pct(d.v / soma)} do total<br>ticket ${curto(d.v / d.n)}`;
      const g = svg('g', { class: cls, 'data-pais': p.id, tabindex: 0, role: 'button', 'aria-label': `${p.nome}, ${curto(d.v)}`, 'data-tip': dica });
      g.appendChild(svg('circle', { cx: x, cy: y, r: r + 5, fill: p.cor, opacity: 0.16 }));
      g.appendChild(svg('circle', { cx: x, cy: y, r, fill: p.cor, stroke: '#05080f', 'stroke-width': 2, class: 'corpo' }));
      const ladoEsq = x < 200;
      g.appendChild(svg('text', { x: ladoEsq ? x - r - 8 : x + r + 8, y: y + 1, 'text-anchor': ladoEsq ? 'end' : 'start', class: 'rot-forte' }, esc(p.nome)));
      g.appendChild(svg('text', { x: ladoEsq ? x - r - 8 : x + r + 8, y: y + 13, 'text-anchor': ladoEsq ? 'end' : 'start', class: 'rot' }, curto(d.v)));
      S.appendChild(g);
    });
    $('#radar').replaceChildren(S);
  }

  /* ---------- faturamento mensal ---------- */
  function renderMensal() {
    const arr = filtrar({ ignorarTri: true });
    const porMes = Array.from({ length: 12 }, (_, m) => ({ m, v: 0, n: 0 }));
    arr.forEach(s => { porMes[s.m].v += s.v; porMes[s.m].n++; });
    const W = 720, H = 400, L = 54, R = 14, T = 22, B = 32;
    const iw = W - L - R, ih = H - T - B;
    const { passo, topo } = escala(Math.max(...porMes.map(x => x.v), 1));
    const X = i => L + (i * iw) / 11, Y = v => T + ih - (v / topo) * ih;
    const S = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Faturamento por mês' });
    S.appendChild(svg('defs', {}, `<linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${NEON}" stop-opacity=".4"/><stop offset="1" stop-color="${NEON}" stop-opacity="0"/></linearGradient>`));

    if (state.tri) {
      const a = (state.tri - 1) * 3, x0 = X(a) - iw / 22, x1 = X(a + 2) + iw / 22;
      S.appendChild(svg('rect', { x: x0, y: T, width: x1 - x0, height: ih, fill: NEON, opacity: 0.08 }));
    }
    for (let i = 0; i <= 4; i++) {
      const v = passo * i, y = Y(v);
      S.appendChild(svg('line', { x1: L, x2: W - R, y1: y, y2: y, class: i ? 'grid' : 'eixo' }));
      S.appendChild(svg('text', { x: L - 8, y: y + 4, 'text-anchor': 'end', class: 'rot' }, i ? curto(v).replace('R$ ', '') : '0'));
    }
    const pts = porMes.map((d, i) => [X(i), Y(d.v)]);
    const linha = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    S.appendChild(svg('path', { d: `${linha} L${X(11)} ${Y(0)} L${X(0)} ${Y(0)} Z`, fill: 'url(#area)' }));
    S.appendChild(svg('path', { d: linha, fill: 'none', stroke: NEON, 'stroke-width': 2, 'stroke-linejoin': 'round', style: 'filter:drop-shadow(0 0 6px rgba(62,230,255,.7))' }));

    const iMax = porMes.reduce((b, d, i) => (d.v > porMes[b].v ? i : b), 0);
    porMes.forEach((d, i) => {
      S.appendChild(svg('text', { x: X(i), y: H - 10, 'text-anchor': 'middle', class: 'rot' }, MESES[i]));
      const dica = `<b>${MESES[i]}/2025</b><br>${brl(d.v)}<br>${int(d.n)} vendas${d.n ? ` · ticket ${curto(d.v / d.n)}` : ''}`;
      const g = svg('g', { class: 'col', 'data-tip': dica });
      g.appendChild(svg('line', { class: 'guia', x1: X(i), x2: X(i), y1: T, y2: T + ih }));
      g.appendChild(svg('circle', { class: 'pt', cx: X(i), cy: pts[i][1], r: 4 }));
      g.appendChild(svg('rect', { class: 'col-hit', x: X(i) - iw / 22, y: T, width: iw / 11, height: ih }));
      S.appendChild(g);
    });
    S.appendChild(svg('text', { x: X(iMax), y: pts[iMax][1] - 12, 'text-anchor': 'middle', class: 'rot-forte' }, `pico · ${curto(porMes[iMax].v)}`));
    $('#mensal').replaceChildren(S);
    $('#mensal-sub').textContent = state.pais ? paisPorId[state.pais].nome : 'todos os países';
  }

  /* ---------- anéis trimestrais ---------- */
  function renderTri() {
    const arr = filtrar({ ignorarTri: true });
    const porQ = [1, 2, 3, 4].map(q => { const a = arr.filter(s => s.q === q); return { q, v: total(a), n: a.length }; });
    const max = Math.max(...porQ.map(x => x.v), 1);
    const sat = [0.4, 0.58, 0.78, 1];
    const S = svg('svg', { viewBox: '0 0 300 300', role: 'img', 'aria-label': 'Faturamento por trimestre em anéis' });
    porQ.forEach((d, i) => {
      const r = 132 - i * 24;
      const cor = `rgba(62,230,255,${sat[i]})`;
      const g = svg('g', { class: 'anel' + (state.tri && state.tri !== d.q ? ' apagado' : ''), 'data-tri': d.q, tabindex: 0, role: 'button', 'aria-label': `T${d.q}, ${curto(d.v)}`,
        'data-tip': `<b>T${d.q}</b><br>${brl(d.v)}<br>${int(d.n)} vendas` });
      g.appendChild(svg('circle', { cx: 150, cy: 150, r, fill: 'none', stroke: 'rgba(90,200,230,.1)', 'stroke-width': 14 }));
      g.appendChild(svg('circle', { cx: 150, cy: 150, r, fill: 'none', stroke: cor, 'stroke-width': 14, 'stroke-linecap': 'round',
        pathLength: 100, 'stroke-dasharray': `${(d.v / max) * 74} 100`, transform: 'rotate(-90 150 150)' }));
      g.appendChild(svg('text', { x: 150 - 6, y: 150 - r + 4, 'text-anchor': 'end', class: 'rot-forte' }, 'T' + d.q));
      S.appendChild(g);
    });
    const t = total(arr);
    S.appendChild(svg('text', { x: 150, y: 148, 'text-anchor': 'middle', style: 'font-size:12px;font-family:ui-monospace,monospace;fill:#e6f1f7' }, curto(t)));
    S.appendChild(svg('text', { x: 150, y: 164, 'text-anchor': 'middle', class: 'rot' }, 'no ano'));
    const box = document.createElement('div');
    box.appendChild(S);
    const leg = document.createElement('div');
    leg.className = 'legenda';
    porQ.forEach(d => leg.appendChild(el(`<button data-tri="${d.q}" aria-pressed="${state.tri === d.q}"><span>T${d.q}</span><b>${curto(d.v)}</b></button>`)));
    box.appendChild(leg);
    $('#tri').replaceChildren(box);
    S.style.maxWidth = '300px'; S.style.margin = '0 auto';
  }

  /* ---------- listas ---------- */
  function lista(itens, max, linhaHtml) {
    const ul = document.createElement('ul');
    ul.className = 'lista';
    itens.forEach((d, i) => ul.appendChild(el(`<li class="linha ${i === 0 ? 'topo1' : ''}">${linhaHtml(d, i)}<div class="barra"><i style="width:${(d.v / max) * 100}%"></i></div></li>`)));
    return ul;
  }
  function renderVend() {
    const d = agrupar(filtrar(), s => s.vend);
    $('#vend').replaceChildren(lista(d, d[0] ? d[0].v : 1, (x, i) =>
      `<span class="linha__n">${String(i + 1).padStart(2, '0')}</span><span class="linha__nome">${esc(x.k)} <span class="sub">${int(x.n)} vendas</span></span><span class="linha__val">${curto(x.v)}</span>`));
  }
  function renderEmp() {
    const d = agrupar(filtrar(), s => s.emp).slice(0, 8);
    $('#emp').replaceChildren(lista(d, d[0] ? d[0].v : 1, (x, i) => {
      const p = paisPorId[empPais[x.k]];
      return `<span class="linha__n">${String(i + 1).padStart(2, '0')}</span><span class="linha__nome"><span class="pont" style="background:${p.cor}"></span>${esc(x.k)} <span class="sub">${esc(p.nome)} · ${int(x.n)}x</span></span><span class="linha__val">${curto(x.v)}</span>`;
    }));
  }
  function renderFeed() {
    const f = filtrar().slice().sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : b.id - a.id)).slice(0, 8);
    $('#feed').replaceChildren(...f.map(s => el(
      `<li class="${s.id === state.novaId ? 'nova' : ''}"><time>${s.data.slice(8)}/${s.data.slice(5, 7)}</time>
        <span>${esc(s.emp)}<span class="quem">${esc(s.vend)} · ${esc(paisPorId[s.pais].nome)}</span></span><span class="valor">${brl(s.v)}</span></li>`)));
  }

  /* ---------- leitura automática ---------- */
  function insights() {
    const f = filtrar();
    if (!f.length) return [];
    const t = total(f), out = [];
    const meses = agrupar(f, s => s.m).sort((a, b) => a.k - b.k);
    const best = meses.reduce((a, b) => (b.v > a.v ? b : a)), worst = meses.reduce((a, b) => (b.v < a.v ? b : a));
    out.push(['Sazonalidade', `${MESES[best.k]} foi o melhor mês (${curto(best.v)}) e ${MESES[worst.k]} o mais fraco (${curto(worst.v)}). O pico vale <b>${(best.v / worst.v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×</b> o vale.`]);
    const tr = agrupar(filtrar({ ignorarTri: true }), s => s.q).sort((a, b) => a.k - b.k);
    if (tr.length >= 2) {
      const g = tr[tr.length - 1].v / tr[0].v - 1;
      out.push(['Tendência', `T${tr[tr.length - 1].k} fatura <b>${pct(Math.abs(g))} ${g >= 0 ? 'a mais' : 'a menos'}</b> que T${tr[0].k}. <em>Cuidado: um ano só não separa tendência de sazonalidade.</em>`]);
    }
    if (!state.pais) {
      const ps = agrupar(f, s => s.pais), top3 = ps.slice(0, 3).reduce((s, x) => s + x.v, 0);
      out.push(['Concentração', `${paisPorId[ps[0].k].nome} lidera com <b>${pct(ps[0].v / t)}</b>. Os 3 primeiros países somam ${pct(top3 / t)} — risco de depender de poucos mercados.`]);
      const tk = ps.map(x => ({ ...x, tk: x.v / x.n })).sort((a, b) => b.tk - a.tk)[0];
      out.push(['Ticket', `O maior ticket médio é de ${paisPorId[tk.k].nome} (${curto(tk.tk)}), contra ${curto(t / f.length)} na média geral.`]);
    }
    const vs = agrupar(f, s => s.vend), media = t / vs.length;
    out.push(['Equipe', `${vs[0].k} lidera com ${curto(vs[0].v)}, <b>${pct(vs[0].v / media - 1)}</b> acima da média por vendedor. ${vs[vs.length - 1].k} está no fim da lista com ${curto(vs[vs.length - 1].v)}.`]);
    const es = agrupar(f, s => s.emp), top3e = es.slice(0, 3).reduce((s, x) => s + x.v, 0);
    out.push(['Clientes', `${es[0].k} é a maior compradora (${curto(es[0].v)}). As 3 maiores empresas respondem por <b>${pct(top3e / t)}</b> do faturamento.`]);
    return out;
  }
  function renderIa() {
    const cards = insights();
    $('#ia').innerHTML = cards.length
      ? cards.map(([tag, txt]) => `<div class="ia__card"><div class="ia__tag">${tag}</div><p>${txt}</p></div>`).join('')
      : '<p class="sub">Sem vendas neste recorte.</p>';
  }
  function resumoTexto() {
    const f = filtrar();
    const rec = `${state.pais ? paisPorId[state.pais].nome : 'todos os países'}, ${state.tri ? 'T' + state.tri : 'ano todo'}`;
    const lin = (titulo, arr, n) => `${titulo}:\n` + arr.slice(0, n).map(x => `- ${x.k}: ${brl(x.v)} (${x.n} vendas)`).join('\n');
    return [
      `RESUMO DO PAINEL ORBITAL (dados fictícios) — recorte: ${rec}`,
      `Faturamento: ${brl(total(f))} | Vendas: ${f.length} | Ticket médio: ${f.length ? brl(total(f) / f.length) : '-'}`,
      lin('Por mês', agrupar(f, s => MESES[s.m]).sort((a, b) => MESES.indexOf(a.k) - MESES.indexOf(b.k)), 12),
      lin('Por trimestre', agrupar(filtrar({ ignorarTri: true }), s => 'T' + s.q).sort((a, b) => (a.k < b.k ? -1 : 1)), 4),
      lin('Por país', agrupar(filtrar({ ignorarPais: true }), s => paisPorId[s.pais].nome), 8),
      lin('Vendedores', agrupar(f, s => s.vend), 8),
      lin('Empresas', agrupar(f, s => s.emp), 8),
      'Peço: o que você enxerga de importante, que riscos e que perguntas eu deveria fazer a estes números?',
    ].join('\n\n');
  }

  /* ---------- orquestração ---------- */
  function sincronizarControles() {
    $('#f-pais').value = state.pais;
    document.querySelectorAll('#f-tri button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.tri === state.tri)));
    const v = $('#b-vivo'); v.setAttribute('aria-pressed', String(state.vivo));
    v.textContent = state.vivo ? '■ Parar ao vivo' : '▶ Vendas ao vivo';
  }
  function renderTudo() {
    esconderDica();
    sincronizarControles();
    renderKpis(); renderRadar(); renderMensal(); renderTri(); renderVend(); renderEmp(); renderFeed(); renderIa();
  }

  /* ---------- dica (tooltip) ---------- */
  const tip = $('#tip');
  function esconderDica() { tip.hidden = true; }
  document.addEventListener('pointermove', e => {
    const alvo = e.target.closest && e.target.closest('[data-tip]');
    if (!alvo) return esconderDica();
    tip.innerHTML = alvo.getAttribute('data-tip');
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(e.clientX + 14, innerWidth - w - 8) + 'px';
    tip.style.top = (e.clientY + 18 + h > innerHeight ? e.clientY - h - 12 : e.clientY + 18) + 'px';
  });
  document.addEventListener('pointerleave', esconderDica);

  /* ---------- eventos ---------- */
  document.addEventListener('click', e => {
    const p = e.target.closest('[data-pais]'), q = e.target.closest('[data-tri]');
    if (p) state.pais = state.pais === p.dataset.pais ? '' : p.dataset.pais;
    else if (q) { const n = +q.dataset.tri; state.tri = state.tri === n ? 0 : n; }
    else return;
    renderTudo();
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('svg g[role=button]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  $('#f-pais').addEventListener('change', e => { state.pais = e.target.value; renderTudo(); });
  $('#b-copiar').addEventListener('click', async () => {
    const txt = resumoTexto(), aviso = $('#copiado');
    try { await navigator.clipboard.writeText(txt); aviso.textContent = 'Copiado! Cole no chat com o Claude.'; }
    catch { window.prompt('Copie o resumo:', txt); aviso.textContent = ''; }
    setTimeout(() => (aviso.textContent = ''), 3500);
  });

  /* vendas ao vivo: sorteia uma venda nova a cada 2,2 s e redesenha tudo */
  let timer = null;
  function novaVenda() {
    const e = D.empresas[Math.floor(Math.random() * D.empresas.length)];
    const v = D.vendedores[Math.floor(Math.random() * D.vendedores.length)];
    const valor = Math.round(Math.exp(Math.log(13000) + (Math.random() + Math.random() + Math.random() - 1.5) * 1.4) * e.peso / 10) * 10;
    const id = D.vendas.length + 1;
    D.vendas.push({ id, m: 11, q: 4, pais: e.pais, vend: v.nome, emp: e.nome, v: Math.max(900, valor), data: '2025-12-' + String(28 + (id % 3)).padStart(2, '0') });
    state.novaId = id;
    renderTudo();
  }
  $('#b-vivo').addEventListener('click', () => {
    state.vivo = !state.vivo;
    clearInterval(timer);
    if (state.vivo) { novaVenda(); timer = setInterval(novaVenda, 2200); }
    else { state.novaId = null; renderTudo(); }
    sincronizarControles();
  });

  /* ---------- início ---------- */
  D.paises.forEach(p => $('#f-pais').appendChild(el(`<option value="${p.id}">${esc(p.nome)}</option>`)));
  const relogio = () => { $('#relogio').textContent = new Date().toLocaleTimeString('pt-BR'); };
  relogio(); setInterval(relogio, 1000);
  renderTudo();
})();
