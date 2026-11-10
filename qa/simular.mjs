#!/usr/bin/env node
// Simulador de combates sin navegador: carga el núcleo de reglas wasm (rules.mjs + rules.wasm)
// y juega un encuentro con la IA en los dos bandos, con muchas semillas, igual que el
// controlador de combate del juego (ai_turn por turno, end_turn al terminar).
//
// Sirve para dos cosas:
//   1. Medir la dificultad de un encuentro:
//        node qa/simular.mjs --grupo=e1 --n=200
//        node qa/simular.mjs --nivel=elderhal --grupo=camp --compas=brenna,pip,ilyra --nivelGrupo=2
//        node qa/simular.mjs --grupo=e1 --quitar=goblin_warrior,goblin_archer      (¿y si e1 = 3 esbirros?)
//   2. Paridad del núcleo reconstruido: misma semilla → mismo combate.
//        node qa/simular.mjs --grupo=e1 --n=100 --comparar=motor/build/web
//
// Opciones: --reglas=DIR (por defecto publicado/rules), --juego=BUNDLE (de donde se sacan los
// niveles; por defecto publicado/juego.js) o --niveles=DIR con <nivel>.json, --nivel=merrowick,
// --grupo=e1, --n=200, --semilla=1 (primera), --compas=brenna, --nivelGrupo=1,
// --celdas="20,17;21,18;19,18;19,17" (casillas del grupo, en orden de cp.party), --sorpresa=auto|si|no.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { extraerNiveles } = require('./lib/niveles.cjs');
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const A = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const opt = {
  reglas: path.resolve(A.reglas || path.join(RAIZ, 'publicado/rules')),
  comparar: A.comparar ? path.resolve(A.comparar) : null,
  nivel: A.nivel || 'merrowick',
  grupo: A.grupo || 'e1',
  n: Number(A.n || 200),
  semilla: Number(A.semilla || 1),
  compas: String(A.compas ?? 'brenna').split(',').filter(Boolean),
  nivelGrupo: Number(A.nivelGrupo || 1),
  celdas: String(A.celdas || '20,17;21,18;19,18;19,17').split(';').map((c) => c.split(',').map(Number)),
  quitar: new Set(String(A.quitar || '').split(',').filter(Boolean)),
  sorpresa: A.sorpresa || 'auto',
};

async function nucleo(dir) {
  const mod = await import(pathToFileURL(path.join(dir, 'rules.mjs')).href);
  const M = await mod.default({ locateFile: (p) => path.join(dir, p) });
  return (op, args = {}) => {
    const s = M.stringToNewUTF8(JSON.stringify({ op, ...args }));
    try { return JSON.parse(M.UTF8ToString(M._mdg_call(s))); } finally { M._free(s); }
  };
}

function cargarNivel() {
  if (A.niveles) return JSON.parse(fs.readFileSync(path.join(A.niveles, `${opt.nivel}.json`), 'utf8'));
  const n = extraerNiveles(A.juego || path.join(RAIZ, 'publicado/juego.js'));
  if (!n[opt.nivel]) throw new Error(`No encuentro el nivel ${opt.nivel} (hay: ${Object.keys(n).join(', ')})`);
  return n[opt.nivel];
}

function grupoInicial(call) {
  const hoja = call('sheet_new', {});
  if (hoja.error) throw new Error('sheet_new: ' + hoja.error);
  const fin = call('sheet_finish', { sheet: hoja.sheet });
  if (fin.error || fin.ok === false) throw new Error('sheet_finish: ' + (fin.error || (fin.errors || []).join(' ')));
  let cp = call('cp_new', { hero: { ...fin.sheet, name: 'Aren Prueba' }, companions: opt.compas }).cp;
  for (const id of opt.compas) if (!cp.party.includes(id)) { const r = call('cp_recruit', { cp, id }); if (r.cp) cp = r.cp; }
  if (opt.nivelGrupo > 1) { const r = call('cp_level_up', { cp, level: opt.nivelGrupo }); if (r.cp) cp = r.cp; }
  return cp;
}

// Juega un combate completo y devuelve un resumen comparable.
function jugar(call, cp, L, G, semilla) {
  const cuenta = {};
  const enemigos = G.enemies.filter((e) => !opt.quitar.has(e.id)).map((e) => {
    cuenta[e.id] = (cuenta[e.id] || 0) + 1;
    return { id: `${G.id}_${e.id}_${cuenta[e.id]}`, monster: e.id, cell: e.cell, face: 0, group: G.id };
  });
  const party = cp.party.map((id, i) => ({ id, cell: opt.celdas[i] || opt.celdas[opt.celdas.length - 1], face: 0 }));
  const emboscada = opt.sorpresa === 'si' || (opt.sorpresa === 'auto' && G.ambush);
  const r = call('battle_start', {
    cp: structuredClone(cp), rows: L.rows, party, enemies: enemigos, group: G.id,
    encounter: { id: G.id, name: G.name, level: cp.party_level || 1 },
    surprised: emboscada ? party.map((p) => p.id) : [], hidden: {}, seed: semilla,
  });
  if (r.error || !r.state) throw new Error('battle_start: ' + r.error);
  let st = r.state, pasos = 0;
  const leer = () => { const s = call('state'); return s.state || s; };
  while (!st.over && pasos++ < 3000) {
    const c = st.creatures.find((x) => x.id === st.current);
    if (c && c.hp > 0 && !c.dead) call('ai_turn');
    st = leer();
    if (st.over) break;
    call('end_turn');
    st = leer();
  }
  const vivos = (t) => st.creatures.filter((c) => c.team === t && c.hp > 0).length;
  const res = {
    semilla,
    resultado: vivos(1) === 0 && vivos(0) > 0 ? 'victoria' : vivos(0) === 0 ? 'derrota' : 'sin_fin',
    rondas: st.round,
    pv: Object.fromEntries(st.creatures.map((c) => [c.id, c.hp])),
  };
  call('battle_end', { cp: structuredClone(cp), won: res.resultado === 'victoria' });
  return res;
}

async function principal() {
  const L = cargarNivel();
  const G = (L.groups || []).find((g) => g.id === opt.grupo);
  if (!G) throw new Error(`El nivel ${opt.nivel} no tiene el grupo ${opt.grupo} (hay: ${(L.groups || []).map((g) => g.id).join(', ')})`);
  const callA = await nucleo(opt.reglas);
  const cpA = grupoInicial(callA);
  const callB = opt.comparar ? await nucleo(opt.comparar) : null;
  const cpB = callB ? grupoInicial(callB) : null;
  const tot = { victoria: 0, derrota: 0, sin_fin: 0 };
  let rondas = 0, distintos = 0, primero = null;
  for (let i = 0; i < opt.n; i++) {
    const s = opt.semilla + i;
    const a = jugar(callA, cpA, L, G, s);
    tot[a.resultado]++; rondas += a.rondas || 0;
    if (callB) {
      const b = jugar(callB, cpB, L, G, s);
      if (JSON.stringify(a) !== JSON.stringify(b)) { distintos++; primero ??= { a, b }; }
    }
  }
  const informe = {
    nivel: opt.nivel, grupo: opt.grupo, enemigos: G.enemies.filter((e) => !opt.quitar.has(e.id)).map((e) => e.id),
    grupoPJ: cpA.party, nivelGrupo: cpA.party_level, emboscada: opt.sorpresa === 'si' || (opt.sorpresa === 'auto' && !!G.ambush),
    semillas: `${opt.semilla}..${opt.semilla + opt.n - 1}`, ...tot,
    tasaVictoria: +(tot.victoria / opt.n).toFixed(3), rondasMedias: +(rondas / opt.n).toFixed(1),
  };
  if (callB) Object.assign(informe, { comparado: opt.comparar, combatesDistintos: distintos, primeraDiferencia: primero });
  console.log(JSON.stringify(informe, null, 1));
  process.exit(callB && distintos ? 1 : 0);
}

principal().catch((e) => { console.error(e.message || e); process.exit(2); });
