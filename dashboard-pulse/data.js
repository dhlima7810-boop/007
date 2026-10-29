/* PULSE — dados FICTÍCIOS para estudo.
   Gerados por um sorteio com semente fixa: abrir a página sempre mostra os mesmos números.
   Para usar dados reais, troque este arquivo por um que defina window.DADOS com o mesmo formato:
   { paises:[{id,nome,peso,cor}], vendedores:[{nome,peso}], empresas:[{nome,pais,peso}],
     vendas:[{id,data:'AAAA-MM-DD',m:0-11,q:1-4,pais,vend,emp,v}] } */
(function () {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20251029);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

  const paises = [
    { id: 'BR', nome: 'Brasil',         peso: 3.2, cor: '#16a0ba' },
    { id: 'US', nome: 'Estados Unidos', peso: 2.6, cor: '#d9672b' },
    { id: 'DE', nome: 'Alemanha',       peso: 1.8, cor: '#8f74e8' },
    { id: 'JP', nome: 'Japão',          peso: 1.5, cor: '#2aa862' },
    { id: 'MX', nome: 'México',         peso: 1.1, cor: '#e0568f' },
    { id: 'PT', nome: 'Portugal',       peso: 0.8, cor: '#4a7fe0' },
    { id: 'AR', nome: 'Argentina',      peso: 0.7, cor: '#bf8812' },
    { id: 'CA', nome: 'Canadá',         peso: 1.0, cor: '#8c97a8' },
  ];

  const vendedores = [
    { nome: 'Marina Costa', peso: 1.5, meta: 2300000 }, { nome: 'Rafael Lima', peso: 1.25, meta: 1700000 },
    { nome: 'Beatriz Nunes', peso: 1.1, meta: 1300000 }, { nome: 'Thiago Alves', peso: 1.0, meta: 1400000 },
    { nome: 'Camila Rocha', peso: 0.95, meta: 1500000 }, { nome: 'Diego Martins', peso: 0.8, meta: 1100000 },
    { nome: 'Larissa Souza', peso: 0.7, meta: 1000000 }, { nome: 'Pedro Faria', peso: 0.5, meta: 900000 },
  ];

  const empresas = [
    { nome: 'Nexa Foods', pais: 'BR', peso: 1.2 }, { nome: 'Aurora Logística', pais: 'BR', peso: 1.0 },
    { nome: 'Cobalto Tech', pais: 'BR', peso: 0.8 },
    { nome: 'Helix Dynamics', pais: 'US', peso: 1.5 }, { nome: 'Vertex Retail', pais: 'US', peso: 1.0 },
    { nome: 'Kraft Meridian', pais: 'DE', peso: 1.3 }, { nome: 'Lumen GmbH', pais: 'DE', peso: 0.9 },
    { nome: 'Sakura Systems', pais: 'JP', peso: 1.4 }, { nome: 'Kogyo Nova', pais: 'JP', peso: 0.9 },
    { nome: 'Maya Comercial', pais: 'MX', peso: 1.0 }, { nome: 'Solaris MX', pais: 'MX', peso: 0.8 },
    { nome: 'Atlântica Trading', pais: 'PT', peso: 1.0 },
    { nome: 'Pampa Digital', pais: 'AR', peso: 1.0 },
    { nome: 'Boreal Group', pais: 'CA', peso: 1.0 },
  ];

  const pesoPais = Object.fromEntries(paises.map(p => [p.id, p.peso]));
  const sazon = [0.80, 0.75, 0.95, 0.95, 1.0, 1.0, 0.85, 0.9, 1.05, 1.1, 1.45, 1.35]; // Black Friday em novembro
  const sortear = (lista, peso) => {
    const total = lista.reduce((s, x) => s + peso(x), 0);
    let r = rnd() * total;
    for (const x of lista) { r -= peso(x); if (r <= 0) return x; }
    return lista[lista.length - 1];
  };

  const vendas = [];
  let id = 1;
  for (let m = 0; m < 12; m++) {
    const qtd = Math.round((34 + m * 1.6) * sazon[m] + gauss() * 3);
    for (let i = 0; i < qtd; i++) {
      const emp = sortear(empresas, e => e.peso * pesoPais[e.pais]);
      const vend = sortear(vendedores, x => x.peso);
      const base = Math.exp(Math.log(13000) + gauss() * 0.7);
      const v = Math.round(Math.min(260000, Math.max(900, base * emp.peso * (0.85 + vend.peso * 0.15))) / 10) * 10;
      const dia = 1 + Math.floor(rnd() * 28);
      vendas.push({
        id: id++, m, q: Math.floor(m / 3) + 1, pais: emp.pais, vend: vend.nome, emp: emp.nome, v,
        data: `2025-${String(m + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      });
    }
  }
  // hora da venda (horário comercial, pico no meio da tarde)
  vendas.forEach(v => { v.h = Math.min(21, Math.max(8, Math.round(14 + gauss() * 3.2))); });
  vendas.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.id - b.id));
  window.DADOS = { paises, vendedores, empresas, vendas, metaAnual: 11000000 };
})();
