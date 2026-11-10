// Escenarios de campaña: cp_new y todas las operaciones cp_*, party_summary y has_item sobre
// partidas con héroes de todas las clases, más documentos mal formados (normalización).
import { generador } from './jugador.mjs';

export function heroe(call, opts) {
  const r = call('sheet_new', opts);
  const f = call('sheet_finish', { sheet: r.sheet });
  return f.sheet ?? r.sheet;
}

const OBJETOS = ['potion_healing', 'potion_greater_healing', 'arrows', 'bolts', 'scroll_cure_wounds', 'scroll_magic_missile',
  'thieves_tools', 'ring_protection', 'cloak_protection', 'longsword_p1', 'shield_p1', 'chain_mail', 'dagger', 'spider_silk',
  'holt_ledger', 'gold', 'nada', 'wand_web', 'antitoxin'];

function rutina(call, cp0, rnd, pasos = 40) {
  let cp = cp0;
  const uso = (r) => {
    if (r && r.cp) cp = r.cp;
    return r;
  };
  uso(call('cp_load', { cp }));
  call('party_summary', { cp });
  for (let i = 0; i < pasos; i++) {
    const party = cp.party || [];
    const id = rnd() < 0.3 ? 'all' : rnd.pick(party) || 'hero';
    switch (rnd.int(16)) {
      case 0: uso(call('cp_recruit', { cp, id: rnd.pick(['brenna', 'pip', 'ilyra', 'odvar', 'nadie']) })); break;
      case 1: uso(call('cp_dismiss', { cp, id: rnd.pick(party) || 'pip' })); break;
      case 2: uso(call('cp_gold', { cp, delta: rnd.pick([10, -5, -1000, 0, 3.7]) })); break;
      case 3: {
        const p = { cp, item: rnd.pick(OBJETOS), n: rnd.pick([1, 2, 0, -1]) };
        if (rnd() < 0.3) p.unid = true;
        if (rnd() < 0.3) p.to = rnd.pick(party);
        uso(call('cp_give', p));
        break;
      }
      case 4: call('has_item', { cp, item: rnd.pick(OBJETOS) }); break;
      case 5: {
        const p = { cp, id, amount: rnd.pick([3, 8, 30, 0]) };
        if (rnd() < 0.5) p.type = rnd.pick(['slashing', 'poison', 'fire', 'necrotic']);
        if (rnd() < 0.3) p.lethal = true;
        uso(call('cp_damage', p));
        break;
      }
      case 6: uso(call('cp_heal', rnd() < 0.5 ? { cp, id } : { cp, id, amount: rnd.pick([1, 5, 100]) })); break;
      case 7: {
        const p = { cp, seed: rnd.int(1000) };
        if (rnd() < 0.3) p.spend = { [rnd.pick(party) || 'hero']: rnd.int(3) };
        if (rnd() < 0.2) p.force = true;
        uso(call('cp_short_rest', p));
        break;
      }
      case 8: uso(call('cp_long_rest', rnd() < 0.5 ? { cp, seed: rnd.int(1000) } : { cp })); break;
      case 9: uso(call('cp_pass_hours', { cp, hours: rnd.pick([1, 3, 8, 12]) })); break;
      case 10: uso(call('cp_revive', { cp, id: rnd.pick(party) || 'hero' })); break;
      case 11: uso(call('cp_level_state', { cp, level: rnd.pick(['merrowick', 'elderhal', 'tumulo', 'x']) })); break;
      case 12: if (rnd() < 0.3) uso(call('cp_level_up', { cp, level: rnd.pick([2, 3, 4, 1]) })); break;
      case 13: call('party_summary', { cp }); break;
      case 14: uso(call('cp_damage', { cp, id: rnd.pick(party) || 'hero', amount: 99, lethal: true })); break;
      default: uso(call('cp_load', { cp }));
    }
  }
  call('party_summary', { cp });
}

export const escenarios = {};
const CLASES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const ESPECIES = ['human', 'elf', 'half_elf', 'dwarf', 'halfling', 'gnome', 'dragonborn', 'goliath', 'orc', 'half_orc', 'tiefling'];
CLASES.forEach((cls, i) => {
  escenarios[`partida_${cls}`] = (call) => {
    const rnd = generador(500 + i);
    const h = heroe(call, { class: cls, species: ESPECIES[i % ESPECIES.length] });
    const comp = [['brenna'], ['pip', 'ilyra'], ['odvar', 'ilyra', 'brenna'], []][i % 4];
    const r = call('cp_new', { hero: h, companions: comp, seed: i });
    rutina(call, r.cp, rnd);
  };
});
escenarios.mercenarios = (call) => {
  const h = heroe(call, { class: 'fighter' });
  let cp = call('cp_new', { hero: h, seed: 1 }).cp;
  for (const cls of ['wizard', 'rogue', 'cleric', 'monk']) {
    const s = heroe(call, { class: cls });
    const r = call('cp_hire', { cp, sheet: s });
    if (r.cp) cp = r.cp;
  }
  call('cp_hire', { cp });
  call('party_summary', { cp });
  rutina(call, cp, generador(77), 20);
};
escenarios.sin_semilla = (call) => {
  const h = heroe(call, { class: 'warlock', species: 'tiefling' });
  const r = call('cp_new', { hero: h, companions: ['odvar'] });
  rutina(call, r.cp, generador(78), 25);
};
escenarios.documentos_raros = (call) => {
  call('cp_new', {});
  call('cp_new', { hero: {} });
  call('cp_new', { hero: 'x' });
  call('cp_load', {});
  call('cp_load', { cp: 3 });
  call('cp_load', { cp: {} });
  call('cp_load', { cp: { party_level: 7, gold: 2.5, day: '3', members: [], state: [] } });
  const h = heroe(call, { class: 'cleric' });
  const cp = call('cp_new', { hero: h, companions: ['pip'], seed: 2 }).cp;
  const raro = JSON.parse(JSON.stringify(cp));
  raro.state.hero.hp = 3.9;
  raro.state.hero.slots = [1.5, '2'];
  raro.members.hero.items = { potion_healing: 2.0 };
  raro.party.push('fantasma');
  delete raro.short_rests_left;
  call('cp_load', { cp: raro });
  call('party_summary', { cp: raro });
  call('cp_zzz', { cp });
  call('cp_take', { cp, item: 'potion_healing', n: 1 });
  call('cp_cast', { cp });
  call('has_item', { cp });
  call('party_summary', { cp: { party: ['hero'], members: {} } });
};
