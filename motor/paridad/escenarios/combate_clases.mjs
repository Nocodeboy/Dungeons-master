// Combates en los mapas de los niveles con un héroe de cada clase (a nivel 1 y a nivel 3) llevado
// por el jugador automático, para cubrir los rasgos y conjuros de todas las clases en combate.
import { heroe } from './campana.mjs';
import { combateCon } from './jugador.mjs';

const CLASES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const NIVELES = ['merrowick', 'elderhal', 'tumulo'];
const COMPANEROS = [['brenna'], ['pip', 'ilyra'], ['odvar'], ['brenna', 'pip', 'ilyra']];

function combate(call, cp, nivel, semilla) {
  const lv = call('data', { name: 'levels' })[nivel];
  const g = lv.groups[semilla % lv.groups.length];
  const spawn = lv.spawns.default || Object.values(lv.spawns)[0];
  const party = cp.party.map((id, i) => ({ id, cell: [spawn[0] + (i % 2), spawn[1] + Math.floor(i / 2)], face: 90 }));
  const enemies = g.enemies.map((e, i) => ({ id: `${g.id}_${i}`, monster: e.id, cell: e.cell, face: e.face ?? 270, group: g.id }));
  let inicio = null;
  const pet = {
    cp, rows: lv.rows, party, enemies, group: g.id,
    encounter: { id: g.id, name: g.name || '¡Combate!', place: lv.name, tips: g.tips || [], level: cp.party_level, sunlight: lv.ambient === 'day' },
    seed: semilla,
  };
  combateCon(call, () => (inicio = call('battle_start', pet)), semilla, { maxTurnos: 110, auto: 0.1 });
  return call('battle_end', { cp: inicio?.cp || cp, loot: g.loot || [], seed: semilla });
}

export const escenarios = {};
CLASES.forEach((cls, i) => {
  for (const nivelPj of [1, 3]) {
    escenarios[`${cls}_n${nivelPj}`] = (call) => {
      const h = heroe(call, { class: cls, seed: 800 + i });
      let cp = call('cp_new', { hero: h, companions: COMPANEROS[(i + nivelPj) % COMPANEROS.length], seed: i }).cp;
      if (nivelPj > 1) cp = call('cp_level_up', { cp, level: nivelPj }).cp ?? cp;
      const r = combate(call, cp, NIVELES[(i + nivelPj) % NIVELES.length], 700 + i * 10 + nivelPj);
      if (r?.cp) call('party_summary', { cp: r.cp });
    };
  }
});
