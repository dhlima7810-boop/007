/* PULSE — painel de vendas de estudo. JS puro, sem bibliotecas. */
(function () {
  'use strict';
  const D = window.DADOS;
  const $ = s => document.querySelector(s);
  const MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const MESL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DIASL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const PAIS = Object.fromEntries(D.paises.map(p => [p.id, p]));
  const EMPPAIS = Object.fromEntries(D.empresas.map(e => [e.nome, e.pais]));
  const SOMA_PESOS = D.paises.reduce((s, p) => s + p.peso, 0);
  D.vendas.forEach(s => { s.dow = new Date(s.data + 'T12:00:00').getDay(); });

  const PERIODOS = [
    { id: 'ano', rot: 'Ano de 2025', a: 0, b: 11 },
    { id: 't1', rot: '1º trimestre', a: 0, b: 2 }, { id: 't2', rot: '2º trimestre', a: 3, b: 5 },
    { id: 't3', rot: '3º trimestre', a: 6, b: 8 }, { id: 't4', rot: '4º trimestre', a: 9, b: 11 },
    { id: 'u3', rot: 'Últimos 3 meses', a: 9, b: 11 },
    ...MESL.map((n, i) => ({ id: 'm' + i, rot: n, a: i, b: i })),
  ];

  const state = {
    tab: 'geral', pais: '', per: 'ano', pop: null, modal: null, drawer: null,
    metric: 'v', rosca: 'v', sort: { col: 'data', dir: -1 }, page: 0, q: '',
    insIdx: 0, cliSort: 'v', eqSort: 'v', chat: [], vivo: false, buscaQ: '',
  };
  const per = () => PERIODOS.find(p => p.id === state.per);

  /* ---------- utilidades ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const semR = v => (v >= 1e6 ? (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi' : v >= 1e3 ? Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil' : String(Math.round(v)));
  const curto = v => 'R$ ' + semR(v);
  const int = v => Math.round(v).toLocaleString('pt-BR');
  const pct = v => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  const tip = h => `data-tip="${esc(h)}"`;
  const total = a => a.reduce((s, x) => s + x.v, 0);
  const iniciais = n => n.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  function agrupar(arr, chave) {
    const m = new Map();
    for (const s of arr) { const k = chave(s); const o = m.get(k) || { k, v: 0, n: 0 }; o.v += s.v; o.n++; m.set(k, o); }
    return [...m.values()].sort((a, b) => b.v - a.v);
  }
  function filtrar(o = {}) {
    const pr = o.periodo === undefined ? per() : (o.periodo || { a: 0, b: 11 });
    const comPais = o.pais !== false;
    return D.vendas.filter(s => s.m >= pr.a && s.m <= pr.b && (!comPais || !state.pais || s.pais === state.pais));
  }
  function periodoAnterior() {
    const p = per(), n = p.b - p.a + 1;
    return p.a - n >= 0 ? { a: p.a - n, b: p.a - 1 } : null;
  }
  const rotPer = p => MES[p.a] + (p.a !== p.b ? '–' + MES[p.b] : '');
  const serieMensal = (arr, k = 'v') => { const r = Array(12).fill(0); arr.forEach(s => { r[s.m] += k === 'v' ? s.v : 1; }); return r; };
  function fatorMeta() { return ((per().b - per().a + 1) / 12) * (state.pais ? PAIS[state.pais].peso / SOMA_PESOS : 1); }
  const metaPeriodo = () => D.metaAnual * fatorMeta();
  function escala(max) {
    const bruto = max / 4, mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const passo = [1, 2, 2.5, 5, 10].map(f => f * mag).find(p => p >= bruto);
    return { passo, topo: passo * 4 };
  }

  const ICONES = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.8"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    building: '<path d="M4 21V5a1 1 0 011-1h8a1 1 0 011 1v16M14 9h5a1 1 0 011 1v11M3 21h18M8 8h2M8 12h2M8 16h2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 010 7M18 14.5c2 .7 3.5 2.5 3.5 5.5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 004 0"/>',
    arrow: '<path d="M7 17L17 7M8 7h9v9"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    send: '<path d="M4 12l16-8-6 16-2-7-8-1z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c-.5-1-1.7-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.5-.5-3-1.5"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12zM7.5 8h.01"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M6 14h12v7H6z"/>',
    live: '<circle cx="12" cy="12" r="3"/><path d="M7 7a7 7 0 000 10M17 7a7 7 0 010 10"/>',
    reset: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.7L3 8M3 3v5h5"/>',
    sort: '<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>',
  };
  const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]}</svg>`;

  /* ---------- análises (regras simples sobre o recorte) ---------- */
  function heat(f) {
    const c = Array.from({ length: 7 }, () => Array(7).fill(0));
    f.forEach(s => { c[s.dow][Math.min(6, Math.max(0, Math.floor((s.h - 8) / 2)))]++; });
    const vals = c.flat().filter(x => x > 0).sort((a, b) => a - b);
    const q1 = vals[Math.floor(vals.length / 3)] || 0, q2 = vals[Math.floor((vals.length * 2) / 3)] || 0;
    let pico = { n: -1 };
    c.forEach((col, d) => col.forEach((n, r) => { if (n > pico.n) pico = { n, d, r }; }));
    const turno = [0, 0, 0];
    f.forEach(s => { turno[s.h < 12 ? 0 : s.h < 18 ? 1 : 2]++; });
    return { c, q1, q2, pico, turno };
  }
  function vendedoresNoRecorte() {
    const f = filtrar(), meta = fatorMeta();
    return D.vendedores.map(v => {
      const arr = f.filter(s => s.vend === v.nome), t = total(arr);
      return { nome: v.nome, v: t, n: arr.length, meta: v.meta * meta, att: t / (v.meta * meta) };
    });
  }
  function analise() {
    const f = filtrar();
    if (!f.length) return [{ tag: 'Sem dados', tom: 'info', txt: 'Nenhuma venda neste recorte. Troque o período ou o país.' }];
    const t = total(f), out = [], pa = periodoAnterior();
    const att = t / metaPeriodo();
    out.push({ tag: 'Meta', tom: att >= 1 ? 'bom' : att < 0.8 ? 'warn' : 'info', txt: `O recorte atingiu [[${pct(att)}]] da meta proporcional: ${curto(t)} de ${curto(metaPeriodo())}.` });
    if (pa) {
      const pv = total(filtrar({ periodo: pa }));
      if (pv) { const d = t / pv - 1; out.push({ tag: 'Tendência', tom: d >= 0 ? 'bom' : 'warn', txt: `O faturamento ${d >= 0 ? 'cresceu' : 'caiu'} [[${pct(Math.abs(d))}]] sobre o período anterior (${rotPer(pa)}).` }); }
    }
    const meses = agrupar(f, s => s.m);
    if (meses.length >= 2) {
      const b = meses[0], w = meses[meses.length - 1];
      out.push({ tag: 'Sazonalidade', tom: 'info', txt: `${MESL[b.k]} foi o melhor mês (${curto(b.v)}) e ${MESL[w.k]} o mais fraco (${curto(w.v)}): o pico vale [[${(b.v / w.v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×]] o vale.` });
    }
    if (!state.pais) {
      const ps = agrupar(f, s => s.pais), t3 = ps.slice(0, 3).reduce((s, x) => s + x.v, 0) / t;
      out.push({ tag: 'Concentração', tom: t3 > 0.65 ? 'warn' : 'info', txt: `${PAIS[ps[0].k].nome} lidera com ${pct(ps[0].v / t)}. Os 3 maiores países somam [[${pct(t3)}]]${t3 > 0.65 ? ': depender de poucos mercados é risco.' : '.'}` });
    }
    const es = agrupar(f, s => s.emp), t3e = es.slice(0, 3).reduce((s, x) => s + x.v, 0) / t;
    out.push({ tag: 'Clientes', tom: t3e > 0.45 ? 'warn' : 'info', txt: `${es[0].k} é a maior compradora (${curto(es[0].v)}). As 3 maiores respondem por [[${pct(t3e)}]] do faturamento.` });
    const eq = vendedoresNoRecorte().filter(x => x.n).sort((a, b) => b.v - a.v);
    if (eq.length) {
      const baixos = eq.filter(x => x.att < 0.7);
      out.push({ tag: 'Equipe', tom: baixos.length ? 'warn' : 'bom', txt: `${eq[0].nome} lidera com ${curto(eq[0].v)}. ${baixos.length ? `[[${baixos.length}]] de ${eq.length} vendedores estão abaixo de 70% da meta.` : 'Todos estão acima de 70% da meta.'}` });
    }
    const h = heat(f);
    out.push({ tag: 'Horário', tom: 'info', txt: `O pico de vendas é na [[${DIASL[h.pico.d]}]], entre ${8 + h.pico.r * 2}h e ${10 + h.pico.r * 2}h (${h.pico.n} vendas). A tarde concentra ${pct(h.turno[1] / f.length)} do total.` });
    return out;
  }
  const rich = (txt, cls) => esc(txt).replace(/\[\[(.+?)\]\]/g, (_, m) => (cls ? `<span class="${cls}">${m}</span>` : `<b>${m}</b>`));

  function responder(texto) {
    const n = norm(texto), f = filtrar(), t = total(f);
    if (!f.length) return 'Não há vendas neste recorte. Troque o período ou o país no topo da página.';
    const base = filtrar({ pais: false });
    if (/pais|mercado|regiao/.test(n)) { const p = agrupar(base, s => s.pais).slice(0, 3); return `No período, os países que mais faturam são ${p.map(x => `<b>${PAIS[x.k].nome}</b> (${curto(x.v)})`).join(', ')}.`; }
    if (/vendedor|quem|equipe|time/.test(n)) { const e = vendedoresNoRecorte().sort((a, b) => b.v - a.v); return `<b>${e[0].nome}</b> lidera com ${curto(e[0].v)} (${pct(e[0].att)} da meta). Por último está ${e[e.length - 1].nome}, com ${curto(e[e.length - 1].v)}.`; }
    if (/mes|sazon|pico/.test(n)) { const m = agrupar(filtrar({ periodo: null }), s => s.m); return `O melhor mês é <b>${MESL[m[0].k]}</b> (${curto(m[0].v)}) e o mais fraco é ${MESL[m[m.length - 1].k]} (${curto(m[m.length - 1].v)}).`; }
    if (/concentra|risco|depend/.test(n)) { const x = analise().filter(i => i.tag === 'Concentração' || i.tag === 'Clientes'); return x.map(i => rich(i.txt)).join('<br>'); }
    if (/empresa|cliente|compra/.test(n)) { const e = agrupar(f, s => s.emp).slice(0, 3); return `As maiores compradoras: ${e.map(x => `<b>${esc(x.k)}</b> (${curto(x.v)})`).join(', ')}.`; }
    if (/meta/.test(n)) { const a = analise().find(i => i.tag === 'Meta'); return rich(a.txt); }
    if (/ticket|medio/.test(n)) return `O ticket médio do recorte é <b>${curto(t / f.length)}</b> em ${int(f.length)} vendas.`;
    if (/cresc|tendenc|trimestre|queda/.test(n)) { const q = [1, 2, 3, 4].map(k => total(filtrar({ periodo: { a: (k - 1) * 3, b: k * 3 - 1 } }))); return `Faturamento por trimestre: ${q.map((v, i) => `T${i + 1} ${curto(v)}`).join(' · ')}. T4 vs T1: <b>${pct(q[3] / q[0] - 1)}</b>.`; }
    if (/hora|dia|semana|turno|horario/.test(n)) { const i = analise().find(x => x.tag === 'Horário'); return rich(i.txt); }
    return 'Eu respondo por regras simples sobre estes números: países, vendedores, meses, clientes, meta, ticket, trimestres e horários. Para uma análise mais profunda, use <b>Compartilhar relatório → Copiar resumo</b> e cole no Claude.';
  }

  function resumo() {
    const f = filtrar(), pr = per();
    const lin = (t, arr, n) => `${t}:\n` + arr.slice(0, n).map(x => `- ${x.k}: ${brl(x.v)} (${x.n} vendas)`).join('\n');
    return [
      `RESUMO DO PAINEL PULSE (dados fictícios) — ${pr.rot}, ${state.pais ? PAIS[state.pais].nome : 'todos os países'}`,
      `Faturamento: ${brl(total(f))} | Vendas: ${f.length} | Ticket médio: ${f.length ? brl(total(f) / f.length) : '-'} | Meta proporcional: ${brl(metaPeriodo())}`,
      lin('Por mês', agrupar(f, s => MES[s.m]).sort((a, b) => MES.indexOf(a.k) - MES.indexOf(b.k)), 12),
      lin('Por país', agrupar(filtrar({ pais: false }), s => PAIS[s.pais].nome), 8),
      lin('Vendedores', agrupar(f, s => s.vend), 8),
      lin('Empresas', agrupar(f, s => s.emp), 8),
      'Peço: o que você enxerga de importante, que riscos existem e que perguntas eu deveria fazer a estes números?',
    ].join('\n\n');
  }

  /* ---------- gráficos em SVG ---------- */
  function suave(p) {
    let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }
  function graficoLinha() {
    const arr = filtrar({ periodo: null });
    const serie = serieMensal(arr, state.metric), pr = per();
    const W = 760, H = 290, L = 48, R = 14, T = 38, B = 26, iw = W - L - R, ih = H - T - B;
    const { passo, topo } = escala(Math.max(...serie, 1));
    const X = i => L + (i * iw) / 11, Y = v => T + ih - (v / topo) * ih;
    const fy = v => (state.metric === 'v' ? semR(v) : int(v));
    let s = `<svg class="linha-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${state.metric === 'v' ? 'Faturamento' : 'Vendas'} por mês"><defs>
      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".5"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient>
      <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4b5fd" stop-opacity=".75"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs>`;
    if (!(pr.a === 0 && pr.b === 11)) s += `<rect x="${X(pr.a) - iw / 22}" y="${T}" width="${((pr.b - pr.a + 1) * iw) / 11}" height="${ih}" rx="8" fill="#8b5cf6" opacity=".13"/>`;
    for (let i = 0; i <= 4; i++) {
      const y = Y(passo * i);
      s += `<line class="grid-h" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 10}" y="${y + 4}" text-anchor="end">${i ? fy(passo * i) : '0'}</text>`;
    }
    const pts = serie.map((v, i) => [X(i), Y(v)]);
    s += `<path d="${suave(pts)} L${X(11)} ${Y(0)} L${X(0)} ${Y(0)} Z" fill="url(#ga)"/>`;
    s += `<path d="${suave(pts)}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" style="filter:drop-shadow(0 0 7px rgba(167,139,250,.9))"/>`;
    serie.forEach((v, i) => {
      const cx = X(i), cy = Y(v), tx = state.metric === 'v' ? semR(v) : int(v) + ' vendas', pw = 14 + tx.length * 7, px = Math.min(W - pw / 2 - 2, Math.max(pw / 2 + 2, cx));
      s += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${MES[i]}</text>
        <g class="col" tabindex="0" aria-label="${MESL[i]}: ${tx}">
          <rect class="barra-hover" x="${cx - 6}" y="${cy}" width="12" height="${T + ih - cy}" rx="6" fill="url(#gb)"/>
          <circle class="pt" cx="${cx}" cy="${cy}" r="4.5"/>
          <g class="pilula"><rect x="${px - pw / 2}" y="${Math.max(2, cy - 40)}" width="${pw}" height="24" rx="12" fill="#fff"/><text x="${px}" y="${Math.max(2, cy - 40) + 16}" text-anchor="middle">${tx}</text></g>
          <rect class="hit" x="${cx - iw / 22}" y="${T - 10}" width="${iw / 11}" height="${ih + 10}"/></g>`;
    });
    return s + '</svg>';
  }
  function spark(vals, h = 36, w = 200) {
    const max = Math.max(...vals, 1), pts = vals.map((v, i) => [(i * w) / (vals.length - 1), h - 3 - (v / max) * (h - 8)]);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px" aria-hidden="true"><path d="${suave(pts)} L${w} ${h} L0 ${h} Z" fill="#8b5cf6" opacity=".18"/><path d="${suave(pts)}" fill="none" stroke="#a78bfa" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function rosca() {
    const arr = filtrar({ pais: false }), k = state.rosca;
    const g = agrupar(arr, s => s.pais).map(x => ({ ...x, val: k === 'v' ? x.v : x.n })).sort((a, b) => b.val - a.val);
    const tot = g.reduce((s, x) => s + x.val, 0) || 1;
    const topo = g.slice(0, 5), resto = g.slice(5).reduce((s, x) => s + x.val, 0);
    const itens = topo.map(x => ({ id: x.k, nome: PAIS[x.k].nome, val: x.val }));
    if (resto) itens.push({ id: '', nome: 'Outros', val: resto });
    const cores = ['#c4b5fd', '#a78bfa', '#8b5cf6', '#6d3df0', '#5b3fb5', '#3a3a4a'];
    let acum = 0, c = '';
    itens.forEach((it, i) => {
      const len = (it.val / tot) * 100, d = `${Math.max(0, len - 1.2)} ${100 - Math.max(0, len - 1.2)}`;
      const on = it.id && it.id === state.pais;
      c += `<circle class="${on ? 'on' : ''}" cx="60" cy="60" r="46" fill="none" stroke="${cores[i]}" stroke-width="16" pathLength="100" stroke-dasharray="${d}" stroke-dashoffset="${-acum}" transform="rotate(-90 60 60)" ${it.id ? `data-act="pais" data-id="${it.id}"` : ''} ${tip(`<b>${esc(it.nome)}</b><br>${k === 'v' ? curto(it.val) : int(it.val) + ' vendas'} · ${pct(it.val / tot)}`)}/>`;
      acum += len;
    });
    const centro = k === 'v' ? curto(tot) : int(tot);
    return `<div class="rosca-wrap"><svg class="rosca ${state.pais ? 'dim' : ''}" viewBox="0 0 120 120" role="img" aria-label="Participação por país">${c}
      <text x="60" y="58" text-anchor="middle" style="fill:#fff;font-size:11px;font-weight:600">${centro}</text><text x="60" y="73" text-anchor="middle" style="fill:#6b6b7a;font-size:8px">Total</text></svg>
      <div>${itens.map((it, i) => `<div class="lg-linha" ${it.id ? `data-act="pais" data-id="${it.id}" role="button" tabindex="0"` : ''} ${tip(`<b>${esc(it.nome)}</b><br>${k === 'v' ? brl(it.val) : int(it.val) + ' vendas'}`)}><i style="background:${cores[i]}"></i>${esc(it.nome)}<span class="pontos"></span><b>${pct(it.val / tot)}</b></div>`).join('')}</div></div>`;
  }
  function medidorMeta() {
    const att = Math.min(1, total(filtrar({ periodo: null })) / (D.metaAnual * (state.pais ? PAIS[state.pais].peso / SOMA_PESOS : 1)));
    const N = 26, cx = 120, cy = 118;
    let s = `<svg viewBox="0 0 240 132" role="img" aria-label="Meta anual atingida: ${pct(att)}" style="width:100%;max-width:300px;margin:0 auto">`;
    for (let i = 0; i < N; i++) {
      const a = Math.PI + ((i + 0.5) / N) * Math.PI, on = (i + 0.5) / N <= att, k = i / (N - 1);
      const cor = on ? `hsl(${262 + k * 10} ${70 - k * 20}% ${40 + k * 32}%)` : 'rgba(255,255,255,.1)';
      s += `<line x1="${(cx + 74 * Math.cos(a)).toFixed(1)}" y1="${(cy + 74 * Math.sin(a)).toFixed(1)}" x2="${(cx + 104 * Math.cos(a)).toFixed(1)}" y2="${(cy + 104 * Math.sin(a)).toFixed(1)}" stroke="${cor}" stroke-width="7" stroke-linecap="round"/>`;
    }
    return s + `<text x="${cx}" y="${cy - 12}" text-anchor="middle" style="fill:#fff;font-size:30px;font-weight:600">${Math.round(att * 100)}%</text><text x="${cx}" y="${cy + 6}" text-anchor="middle" style="fill:#6b6b7a;font-size:11px">da meta anual</text></svg>`;
  }

  /* ---------- peças de tela ---------- */
  function delta(cur, prev) {
    if (!prev) return '<span class="delta zero">—</span>';
    const d = cur / prev - 1;
    return `<span class="delta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${d >= 0 ? '+' : ''}${(d * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</span>`;
  }
  function popPer() {
    return `<div class="pop esq" role="menu"><h4>Período</h4><div class="rolagem">${PERIODOS.map(p => `<button class="item ${p.id === state.per ? 'ativo' : ''}" role="menuitem" data-act="per" data-id="${p.id}">${p.rot}</button>`).join('')}</div></div>`;
  }
  function popPais() {
    return `<div class="pop" role="menu"><h4>País</h4><div class="rolagem"><button class="item ${!state.pais ? 'ativo' : ''}" role="menuitem" data-act="pais" data-id="">Todos os países</button>${D.paises.map(p => `<button class="item ${p.id === state.pais ? 'ativo' : ''}" role="menuitem" data-act="pais" data-id="${p.id}">${p.nome}</button>`).join('')}</div></div>`;
  }
  function titulo(h, sub) {
    return `<div class="titulo"><h1>${h}<small>${sub}</small></h1><div class="filtros">
      <div class="ancora"><button class="chip" data-act="pop" data-pop="per" aria-haspopup="menu" aria-expanded="${state.pop === 'per'}">${ico('calendar')}${per().rot}${ico('chev')}</button>${state.pop === 'per' ? popPer() : ''}</div>
      <div class="ancora"><button class="chip" data-act="pop" data-pop="pais" aria-haspopup="menu" aria-expanded="${state.pop === 'pais'}">${state.pais ? esc(PAIS[state.pais].nome) : 'Todos os países'}${ico('chev')}</button>${state.pop === 'pais' ? popPais() : ''}</div>
      <button class="btn-roxo" data-act="modal" data-modal="share">Compartilhar relatório ${ico('arrow')}</button></div></div>`;
  }
  const subRecorte = () => `${per().rot} · ${state.pais ? PAIS[state.pais].nome : 'todos os países'}`;

  function renderBarra() {
    const abas = [['geral', 'Visão geral', 'grid'], ['vendas', 'Vendas', 'list'], ['clientes', 'Clientes', 'building'], ['equipe', 'Equipe', 'users'], ['insights', 'Insights', 'bulb']];
    const alertas = analise().filter(i => i.tom === 'warn');
    const bell = `<div class="pop" role="menu"><h4>Alertas do recorte</h4><div class="rolagem">${alertas.length ? alertas.map(a => `<button class="item" role="menuitem" data-act="ir" data-tab="insights"><span><b>${a.tag}</b><small>${rich(a.txt).replace(/<\/?b>/g, '')}</small></span></button>`).join('') : '<p class="vazio">Nada preocupante neste recorte.</p>'}</div></div>`;
    const user = `<div class="pop" role="menu"><h4>Dados fictícios · modo estudo</h4>
      <button class="item" role="menuitem" data-act="live">${ico('live')}<span>${state.vivo ? 'Parar' : 'Ligar'} vendas ao vivo<small>Simula uma venda nova a cada 2,5 s</small></span></button>
      <button class="item" role="menuitem" data-act="reset">${ico('reset')}<span>Reiniciar filtros<small>Ano todo, todos os países</small></span></button>
      <button class="item" role="menuitem" data-act="copiar">${ico('copy')}<span>Copiar resumo para o Claude<small>Para pedir uma análise de verdade</small></span></button></div>`;
    $('#barra').innerHTML = `<div class="logo"><i></i>Pulse</div>
      <nav class="abas" role="tablist" aria-label="Seções">${abas.map(([id, n, ic]) => `<button class="aba" role="tab" aria-selected="${state.tab === id}" data-act="tab" data-tab="${id}">${ico(ic)}${n}</button>`).join('')}</nav>
      <div class="acoes">${state.vivo ? '<span class="ao-vivo">AO VIVO</span>' : ''}
        <button class="redondo" data-act="modal" data-modal="busca" aria-label="Buscar (tecla /)">${ico('search')}</button>
        <div class="ancora"><button class="redondo" data-act="pop" data-pop="bell" aria-label="Alertas" aria-haspopup="menu" aria-expanded="${state.pop === 'bell'}">${ico('bell')}${alertas.length ? '<span class="ponto"></span>' : ''}</button>${state.pop === 'bell' ? bell : ''}</div>
        <div class="ancora"><button class="redondo avatar" data-act="pop" data-pop="user" aria-label="Conta e opções" aria-haspopup="menu" aria-expanded="${state.pop === 'user'}">DL</button>${state.pop === 'user' ? user : ''}</div></div>`;
  }

  /* ---------- telas ---------- */
  function vistaGeral() {
    const f = filtrar(), pa = periodoAnterior(), prev = pa ? filtrar({ periodo: pa }) : null;
    const defs = [
      { rot: 'Faturamento', ic: 'coin', a: total(f), b: prev && total(prev), val: curto(total(f)), tab: 'vendas' },
      { rot: 'Vendas feitas', ic: 'list', a: f.length, b: prev && prev.length, val: int(f.length), tab: 'vendas' },
      { rot: 'Ticket médio', ic: 'tag', a: f.length ? total(f) / f.length : 0, b: prev && prev.length ? total(prev) / prev.length : 0, val: f.length ? curto(total(f) / f.length) : '—', tab: 'clientes' },
    ];
    const kpis = defs.map(d => `<article class="cartao k"><header><h3>${ico(d.ic)}${d.rot}</h3><button class="seta" data-act="ir" data-tab="${d.tab}" aria-label="Ver detalhes de ${d.rot}">${ico('arrow')}</button></header>
      <div class="num">${d.val}${delta(d.a, d.b)}</div><p class="nota">${pa ? 'vs ' + rotPer(pa) : 'sem período anterior'}</p></article>`).join('');

    const eq = vendedoresNoRecorte(), naMeta = eq.filter(x => x.att >= 1).length;
    const ps = agrupar(f, s => (state.pais ? s.emp : s.pais)), conc = f.length ? ps.slice(0, 3).reduce((s, x) => s + x.v, 0) / total(f) : 0;
    const barras = (frac, cls) => `<div class="seg-barras" style="grid-template-columns:repeat(10,1fr)">${Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.round(frac * 10) ? cls : ''}"></i>`).join('')}</div>`;
    const aviso = naMeta / 8 < 0.5 ? `<b>Atenção:</b> só ${naMeta} de 8 vendedores bateram a meta proporcional do período.` : `<b>Bom ritmo:</b> ${naMeta} de 8 vendedores já bateram a meta.`;
    const comp = `<article class="cartao g-comp"><header><h3>Termômetro</h3></header>
      <div class="medidor"><div><b>${naMeta} de 8</b><span>vendedores na meta</span></div>${barras(naMeta / 8, naMeta / 8 >= 0.5 ? 'on-bom' : 'on-ruim')}</div>
      <div class="medidor"><div><b>${Math.round(conc * 100)}%</b><span>nos 3 maiores ${state.pais ? 'clientes' : 'países'}</span></div>${barras(conc, conc > 0.6 ? 'on-ruim' : 'on-roxo')}</div>
      <div class="alerta"><span>${aviso}</span></div></article>`;

    const h = heat(f);
    let cel = `<div></div>${DIAS.map(d => `<div class="h-lbl h-col">${d}</div>`).join('')}`;
    for (let r = 6; r >= 0; r--) {
      cel += `<div class="h-lbl">${8 + r * 2}h</div>`;
      for (let d = 0; d < 7; d++) {
        const n = h.c[d][r], cls = n <= h.q1 ? '' : n <= h.q2 ? 'n2' : 'n3';
        cel += `<div class="cel ${cls}" ${tip(`<b>${DIAS[d]}, ${8 + r * 2}h–${10 + r * 2}h</b><br>${n} vendas`)}></div>`;
      }
    }
    const tt = h.turno.reduce((a, b) => a + b, 0) || 1;
    const heatCard = `<article class="cartao" style="display:flex;flex-direction:column"><header><h3>Mapa de vendas por horário</h3></header>
      <div class="leg"><span><i style="background:repeating-linear-gradient(135deg,rgba(255,255,255,.3) 0 2px,transparent 2px 4px)"></i>até ${h.q1}</span><span><i style="background:#8b5cf6"></i>até ${h.q2}</span><span><i style="background:#a78bfa"></i>mais de ${h.q2}</span></div>
      <div class="heat">${cel}</div>
      <div class="turnos"><i style="flex:${h.turno[0]};background:#c4b5fd"></i><i style="flex:${h.turno[1]};background:#8b5cf6"></i><i style="flex:${h.turno[2]};background:#4a3a8a"></i></div>
      <div class="turnos-leg"><span><b>${pct(h.turno[0] / tt)}</b>Manhã</span><span><b>${pct(h.turno[1] / tt)}</b>Tarde</span><span><b>${pct(h.turno[2] / tt)}</b>Noite</span></div>
      <p class="alerta" style="margin-top:auto"><span><b>Leitura:</b> pico na ${DIASL[h.pico.d]}, das ${8 + h.pico.r * 2}h às ${10 + h.pico.r * 2}h (${h.pico.n} vendas).</span></p></article>`;

    const ins = analise(), i = state.insIdx % ins.length;
    const roxo = `<article class="cartao roxo"><span class="tag">${ico('bulb')} Insight · ${ins[i].tag}</span><p>${rich(ins[i].txt, 'hl')}</p>
      <div class="passos" role="group" aria-label="Trocar insight">${ins.map((_, k) => `<button data-act="insight" data-i="${k}" aria-label="Insight ${k + 1}" ${k === i ? 'aria-current="true"' : ''}></button>`).join('')}</div></article>`;

    const aud = `<article class="cartao"><header><h3>Participação por país</h3><div class="sel"><button data-act="rosca" data-k="v" aria-pressed="${state.rosca === 'v'}">R$</button><button data-act="rosca" data-k="n" aria-pressed="${state.rosca === 'n'}">Vendas</button></div></header>${rosca()}</article>`;
    const meta = `<article class="cartao"><header><h3>Meta anual</h3><button class="seta" data-act="ir" data-tab="equipe" aria-label="Ver equipe">${ico('arrow')}</button></header>${medidorMeta()}
      <p class="nota" style="text-align:center">${curto(total(filtrar({ periodo: null })))} de ${curto(D.metaAnual * (state.pais ? PAIS[state.pais].peso / SOMA_PESOS : 1))}</p></article>`;

    return `${titulo('Visão geral de vendas', subRecorte())}
      <div class="grade"><div class="esq">${kpis}
        <article class="cartao g-linha"><header><h3>${state.metric === 'v' ? 'Faturamento' : 'Vendas'} por mês</h3><div class="sel"><button data-act="metric" data-k="v" aria-pressed="${state.metric === 'v'}">Faturamento</button><button data-act="metric" data-k="n" aria-pressed="${state.metric === 'n'}">Vendas</button></div></header>${graficoLinha()}</article>${comp}</div>
        <div class="dir">${heatCard}</div>
        <div class="l2-a">${roxo}</div><div class="l2-b">${aud}</div><div class="l2-c">${meta}</div></div>`;
  }

  function linhasVendas() {
    const q = norm(state.q.trim());
    let r = filtrar().filter(s => !q || norm(`${s.emp} ${s.vend} ${PAIS[s.pais].nome} ${s.v} ${s.data}`).includes(q));
    const { col, dir } = state.sort;
    const val = { data: s => s.data + String(s.id).padStart(6, '0'), emp: s => norm(s.emp), pais: s => norm(PAIS[s.pais].nome), vend: s => norm(s.vend), h: s => s.h, v: s => s.v };
    r.sort((a, b) => (val[col](a) < val[col](b) ? -1 : val[col](a) > val[col](b) ? 1 : 0) * dir);
    return r;
  }
  const POR_PAG = 12;
  function tabelaHtml() {
    const r = linhasVendas(), pags = Math.max(1, Math.ceil(r.length / POR_PAG));
    state.page = Math.min(state.page, pags - 1);
    const fatia = r.slice(state.page * POR_PAG, (state.page + 1) * POR_PAG);
    const th = (c, n, cls = '') => `<th class="${cls}" aria-sort="${state.sort.col === c ? (state.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button data-act="sort" data-col="${c}">${n}${state.sort.col === c ? (state.sort.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
    const corpo = fatia.map(s => `<tr data-act="venda" data-id="${s.id}" tabindex="0"><td>${s.data.slice(8)}/${s.data.slice(5, 7)}</td><td>${esc(s.emp)}</td><td><span class="pont" style="background:${PAIS[s.pais].cor}"></span>${PAIS[s.pais].nome}</td><td>${esc(s.vend)}</td><td>${s.h}h</td><td class="num-c"><b>${brl(s.v)}</b></td></tr>`).join('');
    const nums = []; for (let i = Math.max(0, state.page - 2); i <= Math.min(pags - 1, state.page + 2); i++) nums.push(i);
    return `<div class="tabela-wrap"><table><thead><tr>${th('data', 'Data')}${th('emp', 'Empresa')}${th('pais', 'País')}${th('vend', 'Vendedor')}${th('h', 'Hora')}${th('v', 'Valor', 'num-c')}</tr></thead><tbody>${corpo || '<tr><td colspan="6" class="vazio">Nenhuma venda encontrada.</td></tr>'}</tbody></table></div>
      <div class="pg"><span>${int(r.length)} vendas · ${curto(total(r))}</span><div><button data-act="pg" data-p="${state.page - 1}" ${state.page === 0 ? 'disabled' : ''} aria-label="Página anterior">‹</button>${nums.map(i => `<button data-act="pg" data-p="${i}" ${i === state.page ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('')}<button data-act="pg" data-p="${state.page + 1}" ${state.page >= pags - 1 ? 'disabled' : ''} aria-label="Próxima página">›</button></div></div>`;
  }
  function vistaVendas() {
    return `${titulo('Vendas', subRecorte())}
      <div class="cartao"><div class="barra-ferr"><label class="busca">${ico('search')}<input id="q" data-input="q" type="search" placeholder="Buscar empresa, vendedor, país ou valor" value="${esc(state.q)}" aria-label="Buscar vendas"></label>
        <button class="btn-fantasma" data-act="csv">${ico('download')} Exportar CSV</button></div><div id="tabela">${tabelaHtml()}</div></div>`;
  }

  function vistaClientes() {
    const f = filtrar(), ano = filtrar({ periodo: null });
    const lista = D.empresas.map(e => {
      const a = f.filter(s => s.emp === e.nome);
      return { nome: e.nome, pais: e.pais, v: total(a), n: a.length, tk: a.length ? total(a) / a.length : 0, serie: serieMensal(ano.filter(s => s.emp === e.nome)) };
    }).sort((a, b) => b[state.cliSort] - a[state.cliSort]);
    const max = Math.max(...lista.map(x => x.v), 1);
    return `${titulo('Clientes', subRecorte() + ' · empresas que mais compram')}
      <div class="barra-ferr"><div class="sel" role="group" aria-label="Ordenar"><button data-act="cli-sort" data-k="v" aria-pressed="${state.cliSort === 'v'}">Faturamento</button><button data-act="cli-sort" data-k="n" aria-pressed="${state.cliSort === 'n'}">Nº de vendas</button><button data-act="cli-sort" data-k="tk" aria-pressed="${state.cliSort === 'tk'}">Ticket</button></div></div>
      <div class="cards">${lista.map(c => `<button class="cartao card-btn" data-act="empresa" data-id="${esc(c.nome)}"><div class="card-topo"><span class="av">${iniciais(c.nome)}</span><div><b>${esc(c.nome)}</b><small><span class="pont" style="background:${PAIS[c.pais].cor}"></span>${PAIS[c.pais].nome}</small></div></div>
        <div class="card-val">${curto(c.v)}</div>${spark(c.serie)}<div class="fio"><i style="width:${(c.v / max) * 100}%"></i></div>
        <div class="mini"><span><b>${int(c.n)}</b> vendas</span><span>ticket <b>${c.n ? curto(c.tk) : '—'}</b></span></div></button>`).join('')}</div>`;
  }

  function vistaEquipe() {
    const ano = filtrar({ periodo: null });
    const lista = vendedoresNoRecorte().map(v => ({ ...v, tk: v.n ? v.v / v.n : 0, serie: serieMensal(ano.filter(s => s.vend === v.nome)) })).sort((a, b) => b[state.eqSort] - a[state.eqSort]);
    return `${titulo('Equipe', subRecorte() + ' · desempenho contra a meta')}
      <div class="barra-ferr"><div class="sel" role="group" aria-label="Ordenar"><button data-act="eq-sort" data-k="v" aria-pressed="${state.eqSort === 'v'}">Faturamento</button><button data-act="eq-sort" data-k="n" aria-pressed="${state.eqSort === 'n'}">Nº de vendas</button><button data-act="eq-sort" data-k="att" aria-pressed="${state.eqSort === 'att'}">% da meta</button></div></div>
      <div class="cards">${lista.map((v, i) => `<button class="cartao card-btn" data-act="vend" data-id="${esc(v.nome)}"><div class="card-topo"><span class="av">${iniciais(v.nome)}</span><div><b>${esc(v.nome)}</b><small>${i + 1}º no ranking</small></div></div>
        <div class="card-val">${curto(v.v)} <span class="delta ${v.att >= 1 ? 'up' : v.att < 0.7 ? 'down' : 'zero'}" style="vertical-align:middle">${Math.round(v.att * 100)}% da meta</span></div>${spark(v.serie)}
        <div class="fio"><i class="${v.att >= 1 ? 'bom' : v.att < 0.7 ? 'ruim' : ''}" style="width:${Math.min(100, v.att * 100)}%"></i></div>
        <div class="mini"><span><b>${int(v.n)}</b> vendas</span><span>meta <b>${curto(v.meta)}</b></span></div></button>`).join('')}</div>`;
  }

  const SUGESTOES = ['Qual país mais vende?', 'Quem é o melhor vendedor?', 'Qual foi o melhor mês?', 'Quais clientes mais compram?', 'Há risco de concentração?', 'Como está a meta?', 'Qual o melhor horário?'];
  function chatHtml() {
    return state.chat.map(m => `<div class="msg-q">${esc(m.q)}</div><div class="msg-a">${m.a}</div>`).join('') || '<p class="nota">Escolha uma pergunta ou escreva a sua.</p>';
  }
  function vistaInsights() {
    return `${titulo('Insights', subRecorte() + ' · leitura automática dos números')}
      <div class="ins-grade"><div class="ins-lista">${analise().map(i => `<article class="cartao ins ${i.tom}"><span class="marca"></span><div><small>${i.tag}</small><p>${rich(i.txt)}</p></div></article>`).join('')}</div>
        <article class="cartao chat"><header><h3>Pergunte aos dados</h3></header>
          <p class="nota" style="margin:-6px 0 4px">Respostas por regras simples, não por IA. Para análise profunda, copie o resumo e cole no Claude.</p>
          <div class="msgs" id="msgs" aria-live="polite">${chatHtml()}</div>
          <div class="sugestoes">${SUGESTOES.map(s => `<button data-act="ask" data-q="${esc(s)}">${s}</button>`).join('')}</div>
          <form class="pergunta" data-form="chat"><input id="pergunta" name="q" placeholder="Ex.: qual vendedor está abaixo da meta?" autocomplete="off" aria-label="Pergunta"><button class="btn-roxo" type="submit" aria-label="Enviar">${ico('send')}</button></form>
          <button class="btn-fantasma" data-act="copiar" style="align-self:flex-start">${ico('copy')} Copiar resumo para o Claude</button></article></div>`;
  }

  function renderVista(anim) {
    const v = { geral: vistaGeral, vendas: vistaVendas, clientes: vistaClientes, equipe: vistaEquipe, insights: vistaInsights }[state.tab]();
    $('#vista').innerHTML = `<div class="${anim ? 'vista' : ''}" role="tabpanel">${v}</div>`;
  }

  /* ---------- camadas: modal e gaveta ---------- */
  function drawerHtml() {
    const d = state.drawer;
    const topo = (t, s) => `<div class="modal-topo"><div><h2>${t}</h2><p>${s}</p></div><button class="seta" data-act="fechar" aria-label="Fechar">${ico('x')}</button></div>`;
    if (d.tipo === 'venda') {
      const s = D.vendas.find(x => x.id === d.id), outras = D.vendas.filter(x => x.emp === s.emp && x.id !== s.id).sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 5);
      return topo(`Venda #${s.id}`, esc(s.emp)) + `<dl class="campos"><div><dt>Valor</dt><dd><b>${brl(s.v)}</b></dd></div><div><dt>Data</dt><dd>${s.data.slice(8)}/${s.data.slice(5, 7)}/2025, ${s.h}h</dd></div><div><dt>País</dt><dd>${PAIS[s.pais].nome}</dd></div><div><dt>Vendedor</dt><dd>${esc(s.vend)}</dd></div></dl>
        <h4 class="nota" style="margin-bottom:6px">Outras vendas desta empresa</h4>${outras.map(o => `<div class="lg-linha"><span>${o.data.slice(8)}/${o.data.slice(5, 7)}</span><span class="pontos"></span><b>${brl(o.v)}</b></div>`).join('')}
        <div class="opcoes" style="margin-top:18px"><button class="opcao" data-act="empresa" data-id="${esc(s.emp)}">${ico('building')}<span>Ver empresa<small>Histórico e vendedores</small></span></button></div>`;
    }
    const ano = filtrar({ periodo: null, pais: false });
    const arr = d.tipo === 'empresa' ? ano.filter(s => s.emp === d.id) : ano.filter(s => s.vend === d.id);
    const t = total(arr), rec = arr.slice().sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 6);
    const rank = agrupar(arr, s => (d.tipo === 'empresa' ? s.vend : s.emp)).slice(0, 4);
    const sub = d.tipo === 'empresa' ? PAIS[EMPPAIS[d.id]].nome + ' · ano de 2025' : 'ano de 2025';
    return topo(esc(d.id), sub) + `<div class="card-val" style="margin-bottom:6px">${brl(t)}</div>${spark(serieMensal(arr), 90)}
      <dl class="campos"><div><dt>Vendas</dt><dd>${int(arr.length)}</dd></div><div><dt>Ticket médio</dt><dd>${arr.length ? curto(t / arr.length) : '—'}</dd></div></dl>
      <h4 class="nota" style="margin-bottom:6px">${d.tipo === 'empresa' ? 'Quem atendeu' : 'Principais clientes'}</h4>${rank.map(x => `<div class="lg-linha"><span>${esc(x.k)}</span><span class="pontos"></span><b>${curto(x.v)}</b></div>`).join('')}
      <h4 class="nota" style="margin:14px 0 6px">Últimas vendas</h4>${rec.map(o => `<div class="lg-linha"><span>${o.data.slice(8)}/${o.data.slice(5, 7)} · ${esc(d.tipo === 'empresa' ? o.vend : o.emp)}</span><span class="pontos"></span><b>${brl(o.v)}</b></div>`).join('')}
      <div class="opcoes" style="margin-top:18px"><button class="opcao" data-act="filtrar-q" data-q="${esc(d.id)}">${ico('list')}<span>Ver todas na tabela<small>Abre a aba Vendas já filtrada</small></span></button></div>`;
  }
  function resultadosBusca() {
    const q = norm(state.buscaQ.trim());
    const r = [];
    D.empresas.forEach(e => { if (!q || norm(e.nome).includes(q)) r.push({ t: 'emp', v: e.nome, rot: e.nome, sub: 'Empresa · ' + PAIS[e.pais].nome }); });
    D.vendedores.forEach(v => { if (!q || norm(v.nome).includes(q)) r.push({ t: 'vend', v: v.nome, rot: v.nome, sub: 'Vendedor' }); });
    D.paises.forEach(p => { if (!q || norm(p.nome).includes(q)) r.push({ t: 'pais', v: p.id, rot: p.nome, sub: 'País' }); });
    return r.length ? r.slice(0, 12).map(x => `<button data-act="res" data-t="${x.t}" data-v="${esc(x.v)}"><span>${esc(x.rot)}</span><small>${x.sub}</small></button>`).join('') : '<p class="vazio">Nada encontrado.</p>';
  }
  function renderCamada() {
    const c = $('#camada');
    if (state.drawer) { c.innerHTML = `<div class="veu lado" data-veu><aside class="gaveta" role="dialog" aria-modal="true" aria-label="Detalhes">${drawerHtml()}</aside></div>`; return; }
    if (state.modal === 'share') {
      c.innerHTML = `<div class="veu" data-veu><div class="modal" role="dialog" aria-modal="true" aria-label="Compartilhar relatório"><div class="modal-topo"><div><h2>Compartilhar relatório</h2><p>${subRecorte()}</p></div><button class="seta" data-act="fechar" aria-label="Fechar">${ico('x')}</button></div>
        <div class="opcoes"><button class="opcao" data-act="csv">${ico('download')}<span>Baixar planilha (CSV)<small>${int(linhasCsv().length)} vendas ${state.tab === 'vendas' ? 'da tabela, com a busca aplicada' : 'deste recorte'}</small></span></button>
        <button class="opcao" data-act="copiar">${ico('copy')}<span>Copiar resumo<small>Texto pronto para colar no Claude e pedir análise</small></span></button>
        <button class="opcao" data-act="imprimir">${ico('print')}<span>Imprimir ou salvar em PDF<small>Usa a impressão do navegador</small></span></button></div></div></div>`;
    } else if (state.modal === 'busca') {
      c.innerHTML = `<div class="veu" data-veu style="align-items:start"><div class="modal busca-modal" role="dialog" aria-modal="true" aria-label="Busca"><label class="busca">${ico('search')}<input id="busca" data-input="busca" placeholder="Buscar empresa, vendedor ou país" value="${esc(state.buscaQ)}" autocomplete="off" aria-label="Buscar"></label><div class="res" id="res">${resultadosBusca()}</div></div></div>`;
      $('#busca').focus();
    } else c.innerHTML = '';
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  }

  function render(anim) {
    esconderTip();
    renderBarra(); renderVista(anim); renderCamada();
  }

  /* ---------- dica ---------- */
  const tipEl = $('#tip');
  function esconderTip() { tipEl.hidden = true; }
  document.addEventListener('pointermove', e => {
    const a = e.target.closest && e.target.closest('[data-tip]');
    if (!a) return esconderTip();
    tipEl.innerHTML = a.getAttribute('data-tip'); tipEl.hidden = false;
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.min(e.clientX + 14, innerWidth - w - 8) + 'px';
    tipEl.style.top = (e.clientY + 18 + h > innerHeight ? e.clientY - h - 12 : e.clientY + 18) + 'px';
  });

  /* ---------- ações ---------- */
  function baixarCsv() {
    const linhas = linhasCsv();
    const csv = '﻿Data;Empresa;País;Vendedor;Hora;Valor (R$)\n' + linhas.map(s => [s.data, s.emp, PAIS[s.pais].nome, s.vend, s.h + 'h', s.v].join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `pulse-vendas-${state.per}${state.pais ? '-' + state.pais : ''}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`CSV baixado: ${linhas.length} vendas`);
  }
  function linhasCsv() { return state.tab === 'vendas' ? linhasVendas() : filtrar().slice().sort((a, b) => (a.data < b.data ? -1 : 1)); }
  async function copiarResumo() {
    const txt = resumo();
    try { await navigator.clipboard.writeText(txt); toast('Resumo copiado. Cole no chat com o Claude.'); }
    catch { window.prompt('Copie o resumo:', txt); }
  }
  function ir(tab, anim = true) { state.tab = tab; state.pop = null; state.modal = null; state.drawer = null; state.page = 0; if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab); render(anim); scrollTo(0, 0); }
  function perguntar(q) {
    if (!q.trim()) return;
    state.chat.push({ q, a: responder(q) }); render();
    const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight;
  }
  let timer = null;
  function novaVenda() {
    const e = D.empresas[Math.floor(Math.random() * D.empresas.length)], v = D.vendedores[Math.floor(Math.random() * D.vendedores.length)];
    const id = D.vendas.length + 1, valor = Math.round(Math.exp(Math.log(13000) + (Math.random() + Math.random() + Math.random() - 1.5) * 1.4) * e.peso / 10) * 10;
    D.vendas.push({ id, m: 11, q: 4, pais: e.pais, vend: v.nome, emp: e.nome, v: Math.max(900, valor), data: '2025-12-' + String(28 + (id % 3)), h: 9 + (id % 11), dow: 0 });
    D.vendas[D.vendas.length - 1].dow = new Date('2025-12-' + (28 + (id % 3)) + 'T12:00:00').getDay();
    const ativo = document.activeElement;
    if (!(ativo && /INPUT/.test(ativo.tagName)) && !state.drawer && !state.modal) render();
  }

  document.addEventListener('click', e => {
    if (state.pop && !e.target.closest('.ancora')) { state.pop = null; render(); }
    if (e.target.matches('[data-veu]')) { state.modal = null; state.drawer = null; return render(); }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const d = a.dataset;
    switch (d.act) {
      case 'tab': case 'ir': ir(d.tab); break;
      case 'pop': state.pop = state.pop === d.pop ? null : d.pop; render(); break;
      case 'per': state.per = d.id; state.pop = null; state.page = 0; render(); break;
      case 'pais': state.pais = state.pais === d.id ? '' : d.id; state.pop = null; state.page = 0; render(); break;
      case 'metric': state.metric = d.k; render(); break;
      case 'rosca': state.rosca = d.k; render(); break;
      case 'cli-sort': state.cliSort = d.k; render(); break;
      case 'eq-sort': state.eqSort = d.k; render(); break;
      case 'insight': state.insIdx = +d.i; render(); break;
      case 'modal': state.modal = d.modal; state.pop = null; state.buscaQ = ''; render(); break;
      case 'fechar': state.modal = null; state.drawer = null; render(); break;
      case 'sort': state.sort = state.sort.col === d.col ? { col: d.col, dir: -state.sort.dir } : { col: d.col, dir: d.col === 'data' || d.col === 'v' || d.col === 'h' ? -1 : 1 }; state.page = 0; $('#tabela').innerHTML = tabelaHtml(); break;
      case 'pg': state.page = +d.p; $('#tabela').innerHTML = tabelaHtml(); break;
      case 'venda': state.drawer = { tipo: 'venda', id: +d.id }; render(); break;
      case 'empresa': state.drawer = { tipo: 'empresa', id: d.id }; state.modal = null; render(); break;
      case 'vend': state.drawer = { tipo: 'vend', id: d.id }; render(); break;
      case 'filtrar-q': state.q = d.q; state.drawer = null; ir('vendas'); break;
      case 'res': state.modal = null; if (d.t === 'pais') { state.pais = d.v; render(); } else { state.q = d.v; ir('vendas'); } break;
      case 'csv': baixarCsv(); break;
      case 'copiar': copiarResumo(); state.pop = null; render(); break;
      case 'imprimir': window.print(); break;
      case 'ask': perguntar(d.q); break;
      case 'live':
        state.vivo = !state.vivo; clearInterval(timer);
        if (state.vivo) { novaVenda(); timer = setInterval(novaVenda, 2500); }
        state.pop = null; render(); break;
      case 'reset': state.pais = ''; state.per = 'ano'; state.q = ''; state.pop = null; state.page = 0; render(); break;
    }
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.input === 'q') { state.q = e.target.value; state.page = 0; $('#tabela').innerHTML = tabelaHtml(); }
    if (e.target.dataset.input === 'busca') { state.buscaQ = e.target.value; $('#res').innerHTML = resultadosBusca(); }
  });
  document.addEventListener('submit', e => {
    if (e.target.dataset.form === 'chat') { e.preventDefault(); const v = e.target.q.value; perguntar(v); const i = $('#pergunta'); if (i) i.focus(); }
  });
  document.addEventListener('keydown', e => {
    const digitando = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if (e.key === 'Escape') { if (state.modal || state.drawer || state.pop) { state.modal = null; state.drawer = null; state.pop = null; render(); } }
    else if ((e.key === '/' && !digitando) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); state.modal = 'busca'; state.buscaQ = ''; render(); }
    else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-act], .lg-linha[data-act], .col')) { e.preventDefault(); e.target.click(); }
  });
  addEventListener('hashchange', () => { const t = location.hash.slice(1); if (['geral', 'vendas', 'clientes', 'equipe', 'insights'].includes(t) && t !== state.tab) ir(t); });

  const inicial = location.hash.slice(1);
  if (['geral', 'vendas', 'clientes', 'equipe', 'insights'].includes(inicial)) state.tab = inicial;
  render(true);
})();
