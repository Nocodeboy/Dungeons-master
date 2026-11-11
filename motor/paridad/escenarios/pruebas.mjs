// Escenarios de pruebas fuera de combate: check, group_check, passive y best con grupos de
// distintas clases, miembros muertos, grupos raros y peticiones mal formadas.
import { generador } from './jugador.mjs';
import { heroe } from './campana.mjs';

const CLASES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const HABILIDADES = ['acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation',
  'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight_of_hand', 'stealth',
  'survival', 'str', 'dex', 'wis', 'thieves_tools', 'tools', 'zzz', '', 7];
const CARACT = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'luck', '', null];
const QUIENES = ['best', 'leader', 'hero', 'brenna', 'pip', 'ilyra', 'odvar', 'nadie', '', 3, null];

function prueba(rnd) {
  const p = {};
  const k = rnd.int(5);
  if (k === 0) p.skill = rnd.pick(HABILIDADES);
  else if (k === 1) p.ability = rnd.pick(CARACT);
  else if (k === 2) p.save = rnd.pick(CARACT);
  else if (k === 3) p.tool = rnd.pick(['thieves_tools', 'herbalism_kit', '']);
  if (rnd() < 0.5) p.dc = rnd.pick([5, 10, 12, 15, 20, 25, 13.5, '12', null]);
  if (rnd() < 0.25) p.adv = rnd() < 0.8;
  if (rnd() < 0.25) p.dis = rnd() < 0.8 ? true : 1;
  if (rnd() < 0.2) p.bonus = rnd.pick([2, -3, 5, 1.5, 'x']);
  if (rnd() < 0.7) p.seed = rnd.int(100000);
  return p;
}

function variantes(cp, rnd) {
  const c = JSON.parse(JSON.stringify(cp));
  const k = rnd.int(6);
  if (k === 1) for (const id of Object.keys(c.state || {})) { if (rnd() < 0.5) c.state[id].dead = true; }
  else if (k === 2) c.party = [...(c.party || [])].reverse();
  else if (k === 3) c.party = [...(c.party || []), 'zz'];
  else if (k === 4) c.party_level = 1 + rnd.int(3);
  else if (k === 5) for (const id of Object.keys(c.state || {})) c.state[id].dead = true;
  return c;
}

function bateria(call, cp, rnd, n) {
  for (let i = 0; i < n; i++) {
    const c = variantes(cp, rnd);
    const op = rnd.pick(['check', 'check', 'check', 'group_check', 'passive', 'best', 'best']);
    const p = prueba(rnd);
    if (op === 'check' && rnd() < 0.8) p.who = rnd.pick(QUIENES);
    if (op === 'group_check' && rnd() < 0.4) p.who = rnd() < 0.7 ? ['pip', 'hero', 'nadie', 'ilyra'].filter(() => rnd() < 0.6) : 'pip';
    if (op === 'passive') {
      delete p.ability; delete p.save; delete p.tool;
      if (rnd() < 0.7) p.skill = rnd.pick(HABILIDADES);
    }
    call(op, { cp: c, ...p });
  }
}

export const escenarios = {
  errores(call) {
    for (const op of ['check', 'group_check', 'passive', 'best']) {
      call(op, {});
      call(op, { cp: 7 });
      call(op, { cp: [] });
      call(op, { cp: {} });
      call(op, { cp: { members: {}, party: ['hero'] }, seed: 1 });
    }
  },
};

for (let i = 0; i < CLASES.length; i++) {
  const cls = CLASES[i];
  escenarios[`grupo_${cls}`] = (call) => {
    const rnd = generador(500 + i);
    const h = heroe(call, { seed: 40 + i, set: { what: 'class', value: cls } });
    const sheet = call('sheet_set', { sheet: h, set: { what: 'class', value: cls } }).sheet ?? h;
    const fin = call('sheet_finish', { sheet }).sheet ?? sheet;
    const comp = ['brenna', 'pip', 'ilyra', 'odvar'].filter(() => rnd() < 0.75).slice(0, 3);
    const cp = call('cp_new', { hero: fin, companions: comp, seed: i }).cp;
    bateria(call, cp, rnd, 70);
    const lvl = call('cp_level_up', { cp, level: 3 }).cp ?? cp;
    bateria(call, lvl, rnd, 40);
  };
}
