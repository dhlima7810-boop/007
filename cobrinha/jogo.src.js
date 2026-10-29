import * as THREE from './three.module.min.js';

// ---------- tabelas de regra ----------
const N = 17;                                   // tabuleiro N × N
const mundo = c => c - (N - 1) / 2;             // célula → coordenada 3D

// Um registro por nível. Mexeu aqui, mexeu no jogo inteiro.
const NIVEIS = {
  facil:   { nome: 'Fácil',   meta: 15, passo0: .22, acel: .004, piso: .10, obsDe: 7, obsPontos: 5, obsSeg: 25, obsMax: 5 },
  medio:   { nome: 'Médio',   meta: 25, passo0: .17, acel: .004, piso: .08, obsDe: 5, obsPontos: 3, obsSeg: 15, obsMax: 10 },
  dificil: { nome: 'Difícil', meta: 40, passo0: .13, acel: .003, piso: .06, obsDe: 3, obsPontos: 2, obsSeg: 10, obsMax: 16 },
};

// Um registro por poder. Para somar um poder novo, acrescente uma entrada
// aqui e trate a chave onde ela importa (passo(), tique() ou o desenho).
// A cor da maçã é o poder. Vermelha é só ponto, e não muda nada — foi o que
// o dono pediu. `cor` é a casca, `brilho` o que ela emite, `luz` o halo no chão.
const PODERES = {
  escudo: { nome: 'Escudo', dica: 'atravessa uma batida', dur: 8, cor: 0x60a5fa, brilho: 0x2563eb, luz: 0x7dd3fc },
  lento:  { nome: 'Lento',  dica: 'tudo mais devagar',    dur: 8, cor: 0xa78bfa, brilho: 0x7c3aed, luz: 0xc4b5fd },
  dobro:  { nome: 'Dobro',  dica: 'cada maçã vale 2',     dur: 8, cor: 0xfbbf24, brilho: 0xf59e0b, luz: 0xffd166 },
};
const CHAVES_PODER = Object.keys(PODERES);

const CUSTO_BANCO = 10;   // pontos do banco para reviver
const MAX_TOKENS = 5;
const CADA_ESPECIAL = 6;   // maçãs normais entre uma especial e outra
const VIDA_ESPECIAL = 7;   // segundos que ela espera na mesa

// ---------- dados guardados ----------
const PADRAO = { recordes: {}, conquistas: {}, tokens: 0, banco: 0, nivel: 'facil', config: { som: true, pausaAba: true } };
let dados;
try { dados = JSON.parse(localStorage.getItem('cobrinha') || '{}'); } catch { dados = {}; }
dados = { ...PADRAO, ...dados };
dados.recordes = { ...dados.recordes };
dados.conquistas = { ...dados.conquistas };
dados.config = { ...PADRAO.config, ...dados.config };
if (!NIVEIS[dados.nivel]) dados.nivel = 'facil';
const salvar = () => { try { localStorage.setItem('cobrinha', JSON.stringify(dados)); } catch {} };

// ---------- cena ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);

const cena = new THREE.Scene();
cena.background = new THREE.Color(0x0b1020);
cena.fog = new THREE.Fog(0x0b1020, 22, 48);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const base = new THREE.Vector3(0, 17, 13);

cena.add(new THREE.HemisphereLight(0xbfe6ff, 0x1a1030, 1.1));
const sol = new THREE.DirectionalLight(0xffffff, 2.2);
sol.position.set(6, 14, 8);
sol.castShadow = true;
sol.shadow.mapSize.set(1024, 1024);
Object.assign(sol.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11 });
cena.add(sol);

// chão xadrez
const cv = document.createElement('canvas');
cv.width = cv.height = 128;
const g = cv.getContext('2d');
[['#16213a', '#1b2947'], ['#1b2947', '#16213a']].forEach((linha, y) =>
  linha.forEach((cor, x) => { g.fillStyle = cor; g.fillRect(x * 64, y * 64, 64, 64); }));
const tex = new THREE.CanvasTexture(cv);
tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(N / 2, N / 2);
tex.colorSpace = THREE.SRGBColorSpace;
tex.anisotropy = 8;
const chao = new THREE.Mesh(new THREE.PlaneGeometry(N, N), new THREE.MeshStandardMaterial({ map: tex, roughness: .9 }));
chao.rotation.x = -Math.PI / 2;
chao.receiveShadow = true;
cena.add(chao);

// muros de neon
const neon = new THREE.MeshStandardMaterial({ color: 0x0891b2, emissive: 0x22d3ee, emissiveIntensity: 1.4 });
[[N + .6, .3, 0, N / 2 + .15], [N + .6, .3, 0, -N / 2 - .15], [.3, N, N / 2 + .15, 0], [.3, N, -N / 2 - .15, 0]]
  .forEach(([w, d, x, z]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, .5, d), neon);
    m.position.set(x, .25, z);
    cena.add(m);
  });

// ---------- cobra ----------
// Um pouco menor que a casa: a cobra respira dentro do circuito em vez de
// entupi-lo. Abaixo de .45 os gomos desencostam e viram contas soltas.
const RAIO = .47;
const geoCorpo = new THREE.SphereGeometry(RAIO, 24, 16);
const segs = [];
const cabeca = new THREE.Group();
{
  const crânio = new THREE.Mesh(geoCorpo, new THREE.MeshStandardMaterial({ roughness: .35 }));
  crânio.scale.setScalar(1.12);
  crânio.castShadow = true;
  cabeca.add(crânio);
  for (const lado of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    olho.position.set(lado * .27, .23, .355);
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    pupila.position.set(0, 0, .1);
    olho.add(pupila);
    cabeca.add(olho);
  }
  cena.add(cabeca);
  segs.push(cabeca);
}
const corpo = i => {
  while (segs.length <= i) {
    const m = new THREE.Mesh(geoCorpo, new THREE.MeshStandardMaterial({ roughness: .4 }));
    m.castShadow = true;
    cena.add(m);
    segs.push(m);
  }
  return segs[i];
};
const material = m => (m.isGroup ? m.children[0] : m).material;

// bolha do escudo, em volta da cabeça
const bolha = new THREE.Mesh(
  new THREE.SphereGeometry(.86, 20, 14),
  new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: .22, depthWrite: false })
);
bolha.visible = false;
cena.add(bolha);

// ---------- maçãs ----------
function fazerMaca(cor, emissiva, luz) {
  const grupo = new THREE.Group();
  grupo.add(new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 16),
    new THREE.MeshStandardMaterial({ color: cor, emissive: emissiva, emissiveIntensity: .7, roughness: .3 })));
  grupo.userData.casca = grupo.children[0];
  const folha = new THREE.Mesh(new THREE.BoxGeometry(.06, .22, .06), new THREE.MeshStandardMaterial({ color: 0x84cc16 }));
  folha.position.y = .45;
  grupo.add(folha);
  const ponto = new THREE.PointLight(luz, 8, 5);
  ponto.position.y = .8;
  grupo.add(ponto);
  grupo.children.forEach(c => (c.castShadow = true));
  cena.add(grupo);
  return grupo;
}
const maca = fazerMaca(0xef4444, 0xdc2626, 0xff4d4d);          // vermelha: só ponto
const macaEspecial = fazerMaca(0xfbbf24, 0xf59e0b, 0xffd166);   // repintada a cada poder
macaEspecial.userData.luz = macaEspecial.children.find(c => c.isPointLight);
function pintarEspecial(chave) {
  const p = PODERES[chave], m = macaEspecial.userData.casca.material;
  m.color.setHex(p.cor);
  m.emissive.setHex(p.brilho);
  macaEspecial.userData.luz.color.setHex(p.luz);
}

// ---------- obstáculos ----------
// O bloco não cresce parado: ele sobe do chão girando, passa do ponto e
// assenta, e depois respira. Cada um tem a sua fase, senão os 16 pulsam
// juntos e o tabuleiro inteiro pisca.
const geoBloco = new THREE.BoxGeometry(.92, .92, .92);
const geoAresta = new THREE.EdgesGeometry(geoBloco);
const matBlocoBase = new THREE.MeshStandardMaterial({ color: 0x334e68, emissive: 0x0e7490, emissiveIntensity: .35, roughness: .6 });
const matArestaBase = new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: .85 });
const blocosMesh = [];
const meshBloco = i => {
  while (blocosMesh.length <= i) {
    const grupo = new THREE.Group();
    const caixa = new THREE.Mesh(geoBloco, matBlocoBase.clone());
    caixa.castShadow = caixa.receiveShadow = true;
    grupo.add(caixa);
    grupo.add(new THREE.LineSegments(geoAresta, matArestaBase.clone()));
    cena.add(grupo);
    blocosMesh.push(grupo);
  }
  return blocosMesh[i];
};

// A marca no chão é o aviso: aparece antes do bloco e diz onde ele vai cair.
// Sem ela a queda é injusta — ninguém desvia do que não viu.
const geoMarca = new THREE.CircleGeometry(.46, 26);
const matMarcaBase = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: .2, depthWrite: false });
const marcasMesh = [];
const marcaBloco = i => {
  while (marcasMesh.length <= i) {
    const m = new THREE.Mesh(geoMarca, matMarcaBase.clone());
    m.rotation.x = -Math.PI / 2;
    cena.add(m);
    marcasMesh.push(m);
  }
  return marcasMesh[i];
};

const GRAVIDADE = 34;        // unidades por segundo ao quadrado
const QUIQUE = .26;          // quanto da velocidade volta a cada batida

// O chão treme por oscilação amortecida, não por ruído: ruído lê como falha
// de imagem, a onda que decai lê como baque.
let abalo = 0, abaloT = 0;
function sacudir(forca) {
  if (forca <= abalo * Math.exp(-abaloT * 7)) return;   // um baque fraco não corta um forte
  abalo = forca;
  abaloT = 0;
}

// anel de choque no chão, para o bloco chegar com peso
const ondas = [];
const geoOnda = new THREE.RingGeometry(.34, .5, 28);
function onda(x, z, cor = 0x67e8f9) {
  const m = new THREE.Mesh(geoOnda, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, .03, z);
  m.userData = { vida: 1 };
  cena.add(m);
  ondas.push(m);
}

// poeira levantada na batida: sai rasteira, para fora, e assenta
function poeira(x, z, forca) {
  const n = 5 + Math.round(forca * 9);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 1.6 + Math.random() * 4.5 * forca;
    const m = new THREE.Mesh(geoFaisca, new THREE.MeshBasicMaterial({ color: 0x4b6a8a, transparent: true, opacity: .75 }));
    m.position.set(x + Math.cos(a) * .32, .16, z + Math.sin(a) * .32);
    m.userData = { v: new THREE.Vector3(Math.cos(a) * v, .9 + Math.random() * 1.8, Math.sin(a) * v), vida: 1, leve: true };
    cena.add(m);
    faiscas.push(m);
  }
}

// o bloco não some: ele estoura em cacos e deixa o anel
function estilhacar(x, z) {
  onda(x, z, 0x93c5fd);
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(geoFaisca, new THREE.MeshBasicMaterial({ color: i % 3 ? 0x60a5fa : 0x334e68 }));
    m.position.set(x, .5, z);
    m.scale.setScalar(1.6);
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    m.userData = { v: new THREE.Vector3((Math.random() - .5) * 7, Math.random() * 6 + 2, (Math.random() - .5) * 7), vida: 1, gira: true };
    cena.add(m);
    faiscas.push(m);
  }
}

// ---------- faíscas ----------
const faiscas = [];
const geoFaisca = new THREE.BoxGeometry(.16, .16, .16);
function explodir(x, z, cor) {
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(geoFaisca, new THREE.MeshBasicMaterial({ color: cor }));
    m.position.set(x, .5, z);
    m.userData = { v: new THREE.Vector3((Math.random() - .5) * 6, Math.random() * 5 + 2, (Math.random() - .5) * 6), vida: 1 };
    cena.add(m);
    faiscas.push(m);
  }
}

// ---------- estado ----------
let cobra, anterior, dir, fila, comida, especial, especialPoder = 'escudo', blocos = [], pontos, nivel = dados.nivel;
let estado = 'pronto', acc = 0, passoAtual = .22, ultimoT = 0, tremor = 0, angulo = 0, surgir = 1, surgirEspecial = 1;
let tempoJogo = 0, marcoPontos = 0, marcoTempo = 0, desdeEspecial = 0, especialAte = 0;
let poder = null, poderAte = 0, invul = 0, metaBatida = false, revivido = false, creditado = 0;

const $ = id => document.getElementById(id);
const recorde = () => dados.recordes[nivel] || 0;
const protegido = () => invul > 0 || poder === 'escudo';
const podeToken = () => dados.tokens >= 1;
const podeBanco = () => dados.banco >= CUSTO_BANCO;

const passo = () => {
  const n = NIVEIS[nivel];
  const p = Math.max(n.piso, n.passo0 - pontos * n.acel);
  return poder === 'lento' ? p * 1.6 : p;
};

// O comando não pode esperar o fim da casa. Com o passo longo (o poder lento
// chega a 0,35s) a tecla ficava até um terço de segundo sem resposta, e quem
// jogou reclamou disso. Aqui a casa que falta é encurtada para `ATRASO`, sem
// pulo nenhum: a fração já andada (t) é mantida, e só o tempo que resta muda.
// Vale uma vez por casa — a segunda chamada já encontra o resto curto e sai.
const ATRASO = .1;
function apressar() {
  const resta = passoAtual - acc;
  if (resta <= ATRASO) return;
  const t = acc / passoAtual;
  passoAtual = ATRASO / (1 - t);
  acc = t * passoAtual;
}

function hud() {
  const n = NIVEIS[nivel];
  $('pts').textContent = pontos ?? 0;
  $('rec').textContent = recorde();
  $('meta').textContent = `${n.nome} · meta ${n.meta}`;
  $('saldo').textContent = `${dados.tokens} token${dados.tokens === 1 ? '' : 's'} · banco ${dados.banco}`;
  const p = poder && PODERES[poder];
  $('poder').hidden = !p;
  if (p) $('poder').textContent = `${p.nome} ${Math.ceil(poderAte)}s · ${p.dica}`;
}

// ---------- sorteio de casas ----------
function casasLivres(evitar = []) {
  const livres = [];
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
    if (cobra.some(s => s.x === x && s.y === y)) continue;
    if (comida && comida.x === x && comida.y === y) continue;
    if (especial && especial.x === x && especial.y === y) continue;
    if (blocos.some(b => b.x === x && b.y === y)) continue;
    if (evitar.some(e => e.x === x && e.y === y)) continue;
    livres.push({ x, y });
  }
  return livres;
}
const sortear = (evitar) => {
  const livres = casasLivres(evitar);
  return livres.length ? livres[Math.floor(Math.random() * livres.length)] : null;
};

// ---------- partida ----------
function reiniciar() {
  cobra = [{ x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }];
  anterior = cobra.map(s => ({ ...s }));
  dir = { x: 1, y: 0 };
  fila = [];
  blocos = [];
  pontos = 0;
  acc = 0;
  angulo = Math.PI / 2;
  passoAtual = NIVEIS[nivel].passo0;
  tempoJogo = marcoPontos = marcoTempo = desdeEspecial = 0;
  poder = null; poderAte = 0; invul = 0;
  metaBatida = false; revivido = false; creditado = 0;
  especial = null;
  comida = null;
  comida = sortear();
  surgir = 0;
  hud();
}

function tique() {
  if (fila.length) dir = fila.shift();
  anterior = cobra.map(s => ({ ...s }));
  let h = { x: cobra[0].x + dir.x, y: cobra[0].y + dir.y };

  const fora = h.x < 0 || h.y < 0 || h.x >= N || h.y >= N;
  const iBloco = blocos.findIndex(b => !b.caindo && b.x === h.x && b.y === h.y);   // no ar ainda não machuca
  const comeu = comida && h.x === comida.x && h.y === comida.y;
  const comeuEspecial = especial && h.x === especial.x && h.y === especial.y;
  const cresce = comeu || comeuEspecial;
  const noCorpo = (cresce ? cobra : cobra.slice(0, -1)).some(s => s.x === h.x && s.y === h.y);

  if (fora || iBloco >= 0 || noCorpo) {
    if (!protegido()) return morrer();
    if (invul <= 0) { poder = null; poderAte = 0; }        // o escudo se gasta aqui
    som(300, .25);
    if (fora) h = { x: (h.x + N) % N, y: (h.y + N) % N };  // atravessa a parede
    if (iBloco >= 0) {                                      // e despedaça o bloco
      estilhacar(mundo(h.x), mundo(h.y));
      blocos.splice(iBloco, 1);
    }
  }

  cobra.unshift(h);
  if (!cresce) { cobra.pop(); return; }

  anterior.push({ ...anterior.at(-1) });
  pontos += poder === 'dobro' ? 2 : 1;
  explodir(mundo(h.x), mundo(h.y), comeuEspecial ? PODERES[especialPoder].cor : 0xfacc15);
  som(520 + pontos * 12, .12);

  if (comeuEspecial) {
    especial = null;
    ativarPoder(especialPoder);
  } else {
    desdeEspecial++;
    comida = sortear();
    if (!comida) return morrer(true);
  }
  if (!metaBatida && pontos >= NIVEIS[nivel].meta) { metaBatida = true; conquistar(); }
  hud();
}

function ativarPoder(chave) {
  poder = chave;
  poderAte = PODERES[poder].dur;
  som(880, .25);
  avisar(`${PODERES[poder].nome}! ${PODERES[poder].dica}`);
}

// O gancho das recompensas: toda conquista de meta passa por aqui.
function conquistar() {
  const primeira = !dados.conquistas[nivel];
  dados.conquistas[nivel] = true;
  dados.tokens = Math.min(MAX_TOKENS, dados.tokens + 1);
  salvar();
  som(1040, .4);
  explodir(mundo(cobra[0].x), mundo(cobra[0].y), 0x4ade80);
  avisar(primeira
    ? `Nível ${NIVEIS[nivel].nome} conquistado! +1 token`
    : `Meta de ${NIVEIS[nivel].nome} batida de novo! +1 token`);
}

// ---------- obstáculos ----------
function conferirBlocos() {
  const n = NIVEIS[nivel];
  if (blocos.length >= n.obsMax || pontos < n.obsDe) return;
  const porPontos = pontos - marcoPontos >= n.obsPontos;
  const porTempo = tempoJogo - marcoTempo >= n.obsSeg;
  if (blocos.length && !porPontos && !porTempo) return;
  // nunca nas três casas à frente da cabeça: ninguém morre sem poder desviar
  const frente = [1, 2, 3].map(k => ({ x: cobra[0].x + dir.x * k, y: cobra[0].y + dir.y * k }));
  const casa = sortear(frente);
  if (!casa) return;
  blocos.push({
    ...casa, fase: Math.random() * Math.PI * 2,
    alt: 13 + Math.random() * 4, vel: 0, caindo: true, quiques: 0, esmaga: 0,
    rotX: 0, rotZ: 0, giroX: (Math.random() - .5) * 1.5, giroZ: (Math.random() - .5) * 1.5,
  });
  marcoPontos = pontos;
  marcoTempo = tempoJogo;
  som(180, .18, 'square');
}

function conferirEspecial() {
  if (especial) {
    if (tempoJogo > especialAte) especial = null;
    return;
  }
  if (desdeEspecial < CADA_ESPECIAL) return;
  const casa = sortear();
  if (!casa) return;
  especial = casa;
  especialPoder = CHAVES_PODER[Math.floor(Math.random() * CHAVES_PODER.length)];
  pintarEspecial(especialPoder);                       // a cor já diz o que ela dá
  especialAte = tempoJogo + VIDA_ESPECIAL;
  desdeEspecial = 0;
  surgirEspecial = 0;
  som(760, .15);
}

// ---------- fim, reviver ----------
function morrer(venceu) {
  estado = 'fim';
  tremor = venceu ? 0 : .6;
  som(venceu ? 880 : 110, .5, 'sawtooth');
  dados.banco += pontos - creditado;          // o banco recebe cada ponto uma vez só
  creditado = pontos;
  if (pontos > recorde()) dados.recordes[nivel] = pontos;
  salvar();
  hud();
  const fim = venceu ? 'Você venceu!' : 'Fim de jogo';
  setTimeout(() => estado === 'fim' && abrirPainel('fim', fim,
    `${pontos} ponto${pontos === 1 ? '' : 's'} em ${NIVEIS[nivel].nome} · recorde ${recorde()}`), 700);
}

function reviver(fonte) {
  if (estado !== 'fim' || revivido) return;
  if (fonte === 'token' ? !podeToken() : !podeBanco()) return;
  if (fonte === 'token') dados.tokens--; else dados.banco -= CUSTO_BANCO;
  salvar();
  revivido = true;
  const c = Math.floor(N / 2);
  cobra = cobra.map((_, i) => ({ x: Math.max(0, c - i), y: c }));
  anterior = cobra.map(s => ({ ...s }));
  dir = { x: 1, y: 0 };
  fila = [];
  angulo = Math.PI / 2;
  blocos = blocos.filter(b => Math.abs(b.x - c) > 3 || Math.abs(b.y - c) > 3);
  invul = 2; tremor = 0; acc = 0; passoAtual = passo();
  estado = 'jogando';
  fecharPaineis();
  som(660, .35);
  avisar('Mais uma chance · 2s de escudo');
  hud();
}

// ---------- painéis ----------
let avisoTimer;
function avisar(texto) {
  $('aviso').textContent = texto;
  $('aviso').hidden = false;
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => ($('aviso').hidden = true), 2500);
}

function abrirPainel(modo, titulo, sub) {
  $('titulo').textContent = titulo;
  $('sub').textContent = sub;
  $('principal').hidden = modo === 'pausa';
  $('acoes').hidden = modo !== 'pausa';
  $('dica').hidden = modo === 'pausa';
  $('jogar').textContent = modo === 'fim' ? 'Jogar de novo' : 'Jogar';
  const ofertas = modo === 'fim' && !revivido;
  $('revToken').hidden = !(ofertas && podeToken());
  $('revBanco').hidden = !(ofertas && podeBanco());
  $('revToken').textContent = `Reviver · 1 token (tem ${dados.tokens})`;
  $('revBanco').textContent = `Reviver · ${CUSTO_BANCO} pontos (banco ${dados.banco})`;
  $('pconfig').hidden = $('pniveis').hidden = true;
  $('painel').hidden = false;
  $('pausa').hidden = true;
}

function fecharPaineis() {
  $('painel').hidden = $('pconfig').hidden = $('pniveis').hidden = true;
  $('pausa').hidden = estado !== 'jogando';
}

// Os dois submenus do painel: dificuldade e configurações.
const abrirSub = id => { $('painel').hidden = true; $(id).hidden = false; if (id === 'pconfig') pintarConfig(); };
const voltarSub = () => { $('pconfig').hidden = $('pniveis').hidden = true; $('painel').hidden = false; };
const naoSub = () => $('pconfig').hidden && $('pniveis').hidden;

// A dificuldade escolhida fica escrita no proprio botao do menu.
function escolherNivel(n) {
  nivel = n;
  dados.nivel = n;
  salvar();
  $('abrirNiveis').textContent = `Dificuldade · ${NIVEIS[n].nome}`;
  hud();
}

function comecar(n) {
  if (n) escolherNivel(n);
  if (estado === 'jogando') return;
  reiniciar();
  estado = 'jogando';
  fecharPaineis();
}

function pausar() {
  if (estado === 'jogando') {
    estado = 'pausado';
    abrirPainel('pausa', 'Pausado', `${pontos} ponto${pontos === 1 ? '' : 's'} em ${NIVEIS[nivel].nome}`);
  } else if (estado === 'pausado') {
    estado = 'jogando';
    fecharPaineis();
  }
}

function sairParaMenu() {
  estado = 'pronto';
  abrirPainel('menu', 'Cobrinha 3D', 'Escolha o nível');
}

function pintarConfig() {
  $('tSom').textContent = `Som: ${dados.config.som ? 'ligado' : 'desligado'}`;
  $('tAba').textContent = `Pausar ao sair da aba: ${dados.config.pausaAba ? 'sim' : 'não'}`;
}

// ---------- entrada ----------
function virar(x, y) {
  if (estado !== 'jogando') return;
  const ultima = fila.at(-1) || dir;
  if ((x === -ultima.x && y === -ultima.y) || (x === ultima.x && y === ultima.y) || fila.length > 2) return;
  fila.push({ x, y });
  if (fila.length === 1) apressar();
}
const teclas = {
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
};
const porNumero = { Digit1: 'facil', Digit2: 'medio', Digit3: 'dificil' };
addEventListener('keydown', e => {
  if (teclas[e.code]) { e.preventDefault(); virar(...teclas[e.code]); return; }
  if (!naoSub()) {                                 // num submenu: 1/2/3 escolhem, Esc volta
    if (!$('pniveis').hidden && porNumero[e.code]) { escolherNivel(porNumero[e.code]); voltarSub(); }
    else if (e.code === 'Escape') voltarSub();
    return;
  }
  if (porNumero[e.code] && estado !== 'jogando' && estado !== 'pausado') comecar(porNumero[e.code]);
  else if (e.code === 'KeyP' || e.code === 'Escape') pausar();
  else if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    estado === 'pausado' ? pausar() : estado !== 'jogando' && comecar();
  }
});
let toque;
addEventListener('touchstart', e => (toque = e.touches[0]), { passive: true });
addEventListener('touchend', e => {
  if (!toque) return;
  const t = e.changedTouches[0], dx = t.clientX - toque.clientX, dy = t.clientY - toque.clientY;
  if (Math.hypot(dx, dy) < 24) return;
  Math.abs(dx) > Math.abs(dy) ? virar(Math.sign(dx), 0) : virar(0, Math.sign(dy));
});

document.querySelectorAll('[data-nivel]').forEach(b =>
  b.addEventListener('click', () => { escolherNivel(b.dataset.nivel); voltarSub(); }));
$('jogar').addEventListener('click', () => comecar());
$('abrirNiveis').addEventListener('click', () => abrirSub('pniveis'));
$('voltarNiveis').addEventListener('click', voltarSub);
$('pausa').addEventListener('click', pausar);
$('continuar').addEventListener('click', pausar);
$('sair').addEventListener('click', sairParaMenu);
$('revToken').addEventListener('click', () => reviver('token'));
$('revBanco').addEventListener('click', () => reviver('banco'));
$('abrirConfig').addEventListener('click', () => abrirSub('pconfig'));
$('menuConfig').addEventListener('click', () => abrirSub('pconfig'));
$('fecharConfig').addEventListener('click', voltarSub);
$('tSom').addEventListener('click', () => { dados.config.som = !dados.config.som; salvar(); pintarConfig(); if (dados.config.som) som(700, .12); });
$('tAba').addEventListener('click', () => { dados.config.pausaAba = !dados.config.pausaAba; salvar(); pintarConfig(); });

// no documento, nunca na janela: é o documento que dispara visibilitychange
document.addEventListener('visibilitychange', () => {
  if (document.hidden && dados.config.pausaAba && estado === 'jogando') pausar();
});

// ---------- som (um bipe de WebAudio, sem arquivos) ----------
let audio;
function som(freq, dur, tipo = 'triangle') {
  if (!dados.config.som) return;
  try {
    audio ||= new AudioContext();
    const o = audio.createOscillator(), v = audio.createGain();
    o.type = tipo; o.frequency.value = freq;
    v.gain.setValueAtTime(.12, audio.currentTime);
    v.gain.exponentialRampToValueAtTime(.001, audio.currentTime + dur);
    o.connect(v).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + dur);
  } catch {}
}

// ---------- quadro a quadro ----------
function ajustar() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const dist = Math.max(1, 1.15 / camera.aspect) * 21.4;   // em tela estreita a câmera recua
  base.setLength(dist);
  camera.position.copy(base);
  cena.fog.near = dist;
  cena.fog.far = dist * 2.2;
}
addEventListener('resize', ajustar);

const relogio = new THREE.Clock();
const alvoOlhar = new THREE.Vector3();
reiniciar();
escolherNivel(nivel);
ajustar();
abrirPainel('menu', 'Cobrinha 3D', 'Escolha o nível');

renderer.setAnimationLoop(() => {
  const dt = Math.min(relogio.getDelta(), .05), tempo = relogio.elapsedTime;

  if (estado === 'jogando') {
    tempoJogo += dt;
    if (invul > 0) invul -= dt;
    if (poder) {
      poderAte -= dt;
      if (poderAte <= 0) { poder = null; poderAte = 0; }
      hud();
    }
    acc += dt;
    while (acc >= passoAtual && estado === 'jogando') { acc -= passoAtual; tique(); passoAtual = passo(); }
    if (estado === 'jogando') { conferirBlocos(); conferirEspecial(); }
  }
  if (estado === 'jogando') ultimoT = Math.min(1, acc / passoAtual);
  else if (estado === 'fim') ultimoT = 0;
  const t = ultimoT;

  // cobra, interpolada entre a casa anterior e a atual
  cobra.forEach((s, i) => {
    const p = anterior[i] || s, m = i ? corpo(i) : cabeca;
    m.visible = true;
    m.position.set(mundo(p.x + (s.x - p.x) * t), .5, mundo(p.y + (s.y - p.y) * t));
    const f = i / cobra.length;
    material(m).color.setHSL(estado === 'fim' && tremor ? 0 : .38 - .1 * f, .75, .52 - .22 * f);
  });
  for (let i = cobra.length; i < segs.length; i++) segs[i].visible = false;

  const proximo = fila[0] || dir;                    // a cabeça responde à tecla, não ao tique
  const alvo = Math.atan2(proximo.x, proximo.y);
  angulo += Math.atan2(Math.sin(alvo - angulo), Math.cos(alvo - angulo)) * Math.min(1, dt * 18);
  cabeca.rotation.y = angulo;

  bolha.visible = protegido() && estado !== 'fim';
  if (bolha.visible) {
    bolha.position.copy(cabeca.position);
    bolha.scale.setScalar(1 + Math.sin(tempo * 8) * .05);
  }

  // maçãs
  if (comida) {
    surgir = Math.min(1, surgir + dt * 3);
    maca.visible = true;
    maca.position.set(mundo(comida.x), .55 + Math.sin(tempo * 3) * .1, mundo(comida.y));
    maca.rotation.y = tempo * 1.5;
    maca.scale.setScalar(1 - Math.pow(1 - surgir, 3));
  } else maca.visible = false;

  if (especial) {
    surgirEspecial = Math.min(1, surgirEspecial + dt * 3);
    const resta = Math.max(0, especialAte - tempoJogo);
    macaEspecial.visible = resta > 1.2 || Math.sin(tempo * 18) > 0;   // pisca quando vai sumir
    macaEspecial.position.set(mundo(especial.x), .6 + Math.sin(tempo * 4) * .14, mundo(especial.y));
    macaEspecial.rotation.y = tempo * 3;
    macaEspecial.scale.setScalar(1.08 * (1 - Math.pow(1 - surgirEspecial, 3)));
  } else macaEspecial.visible = false;

  // obstáculos: caem do alto, batem, quicam e assentam
  for (let i = blocos.length - 1; i >= 0; i--) {
    const b = blocos[i], m = meshBloco(i), marca = marcaBloco(i), x = mundo(b.x), z = mundo(b.y);

    if (b.caindo) {
      b.vel += GRAVIDADE * dt;
      b.alt -= b.vel * dt;
      b.rotX += b.giroX * dt;
      b.rotZ += b.giroZ * dt;

      if (b.alt <= .46) {                                   // bateu no chão
        const forca = Math.min(1, b.vel / 17);
        b.alt = .46;
        b.esmaga = Math.max(b.esmaga, .35 + forca * .65);
        b.quiques++;
        b.giroX *= .28; b.giroZ *= .28;
        onda(x, z);
        poeira(x, z, forca);
        sacudir(.07 + forca * .13);
        som(80 + forca * 60, .18, 'square');
        if (b.quiques <= 2 && b.vel > 5.5) b.vel = -b.vel * QUIQUE;   // ainda tem quique
        else { b.caindo = false; b.vel = 0; }
        if (cobra.some(c => c.x === b.x && c.y === b.y)) {  // pousou nas costas da cobra
          estilhacar(x, z);                                 // estoura em vez de matar de graça
          blocos.splice(i, 1);
          continue;
        }
      }
      const perto = Math.min(1, Math.max(0, (13 - b.alt) / 12));      // a marca acende na descida
      marca.visible = true;
      marca.position.set(x, .02, z);
      marca.material.opacity = .06 + perto * .34;
      marca.scale.setScalar(1.7 - perto * .75);
    } else {
      marca.visible = false;
      b.rotX *= Math.pow(.00004, dt);                       // o tombo assenta depressa, e reto
      b.rotZ *= Math.pow(.00004, dt);
      if (Math.abs(b.rotX) < .004) b.rotX = 0;
      if (Math.abs(b.rotZ) < .004) b.rotZ = 0;
    }

    b.esmaga = Math.max(0, b.esmaga - dt * 3.4);
    const e = b.esmaga, ey = 1 - e * .42, exz = 1 + e * .3;
    const treme = Math.sin(abaloT * 46) * abalo * Math.exp(-abaloT * 7) * .35;

    m.visible = true;
    // No alto, a sombra projetada cai longe e lê como um buraco no chão, longe
    // da casa onde o bloco vai pousar. Quem avisa é a marca; a sombra só volta
    // quando ele encosta.
    m.children[0].castShadow = !b.caindo;
    m.scale.set(exz, ey, exz);
    m.position.set(x, Math.max(b.alt, .46 * ey) + (b.caindo ? 0 : treme), z);
    m.rotation.set(b.rotX, 0, b.rotZ);                      // alinhado com a grade: nada de bloco torto
    m.children[0].material.emissiveIntensity = (b.caindo ? .5 : .3) + Math.sin(tempo * 2 + b.fase) * .18;
    m.children[1].material.opacity = .6 + Math.sin(tempo * 2 + b.fase) * .25;
  }
  for (let i = blocos.length; i < blocosMesh.length; i++) blocosMesh[i].visible = false;
  for (let i = blocos.length; i < marcasMesh.length; i++) marcasMesh[i].visible = false;

  // faíscas
  for (let i = faiscas.length - 1; i >= 0; i--) {
    const f = faiscas[i], d = f.userData;
    d.v.y -= 14 * dt;
    f.position.addScaledVector(d.v, dt);
    if (d.gira) f.rotation.x += dt * 7, f.rotation.z += dt * 5;
    if (d.leve) { d.v.y += 9 * dt; d.v.multiplyScalar(1 - dt * 2.4); }   // poeira não despenca
    d.vida -= dt * (d.leve ? 1.1 : 1.4);
    f.scale.setScalar(Math.max(d.vida, 0) * (d.gira ? 1.6 : d.leve ? .75 : 1));
    if (d.leve) f.material.opacity = Math.max(0, d.vida) * .75;
    if (d.vida <= 0) { cena.remove(f); f.material.dispose(); faiscas.splice(i, 1); }
  }

  // anéis de choque
  for (let i = ondas.length - 1; i >= 0; i--) {
    const o = ondas[i], d = o.userData;
    d.vida -= dt * 1.8;
    o.scale.setScalar(1 + (1 - d.vida) * 2.6);
    o.material.opacity = Math.max(0, d.vida) * .9;
    if (d.vida <= 0) { cena.remove(o); o.material.dispose(); ondas.splice(i, 1); }
  }

  // câmera: acompanha de leve a cabeça; no menu, balança sozinha
  const cx = estado === 'jogando' || estado === 'pausado' ? cabeca.position.x * .25 : Math.sin(tempo * .4) * 3;
  camera.position.x += (base.x + cx - camera.position.x) * Math.min(1, dt * 3);
  camera.position.y += (base.y - camera.position.y) * Math.min(1, dt * 3);
  camera.position.z += (base.z - camera.position.z) * Math.min(1, dt * 3);
  tremor *= Math.pow(.02, dt);
  camera.position.x += (Math.random() - .5) * tremor;
  camera.position.y += (Math.random() - .5) * tremor;
  if (abalo > 0) {                                    // o baque do bloco: onda que decai
    abaloT += dt;
    const amp = abalo * Math.exp(-abaloT * 7);
    camera.position.y += Math.sin(abaloT * 46) * amp;
    camera.position.x += Math.sin(abaloT * 31) * amp * .45;
    if (amp < .0015) abalo = 0;
  }
  alvoOlhar.set(cabeca.position.x * .1, 0, 1);
  camera.lookAt(alvoOlhar);

  renderer.render(cena, camera);
});
