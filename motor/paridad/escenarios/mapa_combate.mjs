// Combates en el mapa de exploración con la campaña: battle_start (grupo de la partida, enemigos
// de los grupos de cada nivel, sorpresa y ocultos) y battle_end (captura del estado, bajas, botín).
import { combateCon, generador } from './jugador.mjs';
import { heroe } from './campana.mjs';

function partida(call, cls, comp, seed) {
  const h = heroe(call, { class: cls });
  return call('cp_new', { hero: h, companions: comp, seed }).cp;
}

function combateEnNivel(call, cp, nivel, grupo, semilla, extra = {}) {
  const lv = call('data', { name: 'levels' })[nivel];
  const g = lv.groups.find((x) => x.id === grupo) || lv.groups[0];
  const spawn = lv.spawns.default || Object.values(lv.spawns)[0];
  const party = cp.party.map((id, i) => ({ id, cell: [spawn[0] + (i % 2), spawn[1] + Math.floor(i / 2)], face: 90 }));
  const enemies = g.enemies.map((e, i) => ({ id: `${g.id}_${i}`, monster: e.id, cell: e.cell, face: e.face ?? 270, group: g.id }));
  let inicio = null;
  const pet = {
    cp, rows: lv.rows, party, enemies, group: g.id,
    encounter: { id: g.id, name: g.name || '¡Combate!', place: lv.name, tips: g.tips || [], ambient: lv.ambient || 'dusk', level: cp.party_level, sunlight: lv.ambient === 'day' },
    surprised: extra.surprised || [], hidden: extra.hidden || {}, seed: semilla,
  };
  if (extra.surprise) pet.surprise = true;
  combateCon(call, () => (inicio = call('battle_start', pet)), semilla, { maxTurnos: extra.maxTurnos ?? 120, auto: extra.auto ?? 0.15 });
  const fin = { cp: inicio?.cp || cp, loot: g.loot || [] };
  if (extra.won !== undefined) fin.won = extra.won;
  if (extra.seed !== undefined) fin.seed = extra.seed;
  return call('battle_end', fin);
}

export const escenarios = {};
const CASOS = [
  ['fighter', ['brenna', 'pip', 'ilyra'], 'merrowick', 'e1'],
  ['wizard', ['brenna', 'ilyra'], 'elderhal', null],
  ['cleric', ['brenna', 'pip', 'odvar'], 'tumulo', null],
  ['rogue', ['ilyra'], 'merrowick', 'e1'],
  ['paladin', ['odvar', 'pip'], 'elderhal', null],
  ['warlock', ['brenna'], 'tumulo', null],
];
CASOS.forEach(([cls, comp, nivel, grupo], i) => {
  escenarios[`${nivel}_${cls}`] = (call) => {
    let cp = partida(call, cls, comp, i);
    const r = combateEnNivel(call, cp, nivel, grupo, 300 + i, { seed: i });
    if (r?.cp) cp = r.cp;
    call('party_summary', { cp });
    // Segundo combate con lo que quede (descanso corto entre medias)
    const d = call('cp_short_rest', { cp, seed: i });
    if (d.cp) cp = d.cp;
    combateEnNivel(call, cp, nivel, grupo, 400 + i, { auto: 1 });
  };
});
escenarios.sorpresa_y_ocultos = (call) => {
  const cp = partida(call, 'ranger', ['pip', 'brenna'], 9);
  combateEnNivel(call, cp, 'merrowick', 'e1', 501, { surprise: true, surprised: ['e1_0', 'e1_1', 'e1_2', 'e1_3', 'e1_4', 'e1_5'], hidden: { hero: 17, pip: 14 }, auto: 1 });
};
escenarios.derrota_forzada = (call) => {
  const cp = partida(call, 'bard', ['odvar'], 10);
  combateEnNivel(call, cp, 'tumulo', null, 502, { won: false, maxTurnos: 6, auto: 1 });
};
escenarios.errores = (call) => {
  call('battle_start', {});
  call('battle_end', {});
  const cp = partida(call, 'monk', [], 11);
  call('battle_start', { cp });
  call('battle_start', { cp, rows: ['....', '....'], party: [{ id: 'nadie' }] });
  call('battle_end', { cp });
  call('battle_start', { cp, rows: ['......', '......', '......'], enemies: [{ monster: 'wolf', cell: [5, 1] }, { id: 'zombie', cell: [4, 2] }, { monster: 'dragon' }], seed: 3 });
  call('state');
  call('battle_end', { cp, won: true, loot: ['potion_healing', ['arrows', 2], { id: 'ring_protection', unid: true }, { id: 'potion_healing', n: 2 }] });
  call('state');
};
