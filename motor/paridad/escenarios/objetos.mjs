// Escenarios de inventario y tienda: vista de inventario, vista previa, equipar, quitar, dar,
// dejar, usar, identificar, ver la tienda, comprar y vender, con grupos de varias clases y
// objetos de todo tipo. El documento de campaña sigue las respuestas del oráculo.
import { generador } from './jugador.mjs';
import { heroe } from './campana.mjs';

const CLASES = ['fighter', 'wizard', 'rogue', 'cleric', 'ranger', 'paladin', 'monk', 'bard'];
const OBJETOS = ['ring_protection', 'longsword_p1', 'leather', 'greatsword', 'cloak_protection', 'pearl_power', 'wand_web',
  'wand_magic_missiles', 'scroll_cure_wounds', 'scroll_magic_missile', 'potion_healing', 'potion_greater_healing',
  'potion_giant_strength', 'antitoxin', 'arrows', 'bolts', 'bullets', 'shield_p1', 'shield', 'chain_mail', 'plate', 'studded_leather',
  'dagger', 'shortbow', 'longbow', 'light_crossbow', 'sling', 'javelin', 'handaxe', 'rapier', 'quarterstaff', 'boots_elvenkind',
  'stone_good_luck', 'amulet_health', 'gauntlets_ogre_power', 'gem_jade', 'gold_ring', 'rope', 'torch', 'thieves_tools',
  'healers_kit', 'rations', 'spider_silk', 'holt_ledger', 'nada'];
const COMERCIANTES = ['smith', 'herbalist', 'peddler', 'nadie'];
const HUECOS = ['weapon:0', 'weapon:1', 'weapon:2', 'weapon:3', 'weapon:9', 'armor', 'shield', 'cloak', 'ring1', 'ring2', 'amulet',
  'boots', 'gloves', 'zz', ''];

function grupo(call, rnd, cls, semilla) {
  const h = heroe(call, { seed: semilla });
  const s = call('sheet_set', { sheet: h, set: { what: 'class', value: cls } }).sheet ?? h;
  const fin = call('sheet_finish', { sheet: s }).sheet ?? s;
  let cp = call('cp_new', { hero: fin, companions: ['brenna', 'pip', 'ilyra', 'odvar'].filter(() => rnd() < 0.8).slice(0, 3), seed: semilla }).cp;
  for (let i = 0; i < 14; i++) {
    const r = call('cp_give', { cp, item: rnd.pick(OBJETOS), n: 1 + rnd.int(3), unid: rnd() < 0.3, to: rnd() < 0.5 ? 'hero' : rnd.pick(cp.party) });
    if (r.cp) cp = r.cp;
  }
  const g = call('cp_gold', { cp, delta: rnd.pick([0, 50, 300, 3000]) });
  if (g.cp) cp = g.cp;
  return cp;
}

/** Referencia a un objeto de la mochila de `who` como lo haría la interfaz (o algo raro). */
function referencia(call, cp, rnd, who) {
  const inv = call('inv', { cp, who });
  const bag = inv.bag || [];
  const e = rnd.pick(bag);
  const k = rnd.int(10);
  if (!e || k === 0) return rnd.pick([{ idx: 99 }, 'nada', { id: 'leather' }, 3, { idx: '1' }, null]);
  if (e.where === 'pack') return k < 7 ? { idx: e.idx } : k < 9 ? e.id : { id: e.id };
  return k < 8 ? e.id : { id: e.id };
}

function rutina(call, cp0, rnd, pasos) {
  let cp = cp0;
  const uso = (r) => {
    if (r && r.cp) cp = r.cp;
    return r;
  };
  for (let i = 0; i < pasos; i++) {
    const party = cp.party || [];
    const who = rnd() < 0.08 ? rnd.pick(['zz', '', 7]) : rnd.pick(party) || 'hero';
    switch (rnd.int(14)) {
      case 0: call('inv', { cp, who }); break;
      case 1: {
        const item = referencia(call, cp, rnd, who);
        call('inv_preview', rnd() < 0.3 ? { cp, who, item, slot: rnd.pick(['ring1', 'ring2', 'zz']) } : { cp, who, item });
        break;
      }
      case 2:
      case 3: {
        const item = referencia(call, cp, rnd, who);
        uso(call('inv_equip', rnd() < 0.3 ? { cp, who, item, slot: rnd.pick(['ring1', 'ring2']) } : { cp, who, item }));
        break;
      }
      case 4: uso(call('inv_unequip', { cp, who, slot: rnd.pick(HUECOS) })); break;
      case 5: {
        const item = referencia(call, cp, rnd, who);
        const to = rnd() < 0.15 ? rnd.pick([who, 'zz', '']) : rnd.pick(party);
        const pet = { cp, from: who, to, item };
        if (rnd() < 0.6) pet.n = rnd.pick([1, 2, 5, 0, -1, 'x']);
        uso(call('inv_give', pet));
        break;
      }
      case 6: {
        const item = referencia(call, cp, rnd, who);
        const pet = { cp, who, item };
        if (rnd() < 0.6) pet.n = rnd.pick([1, 2, 5, 0]);
        uso(call('inv_drop', pet));
        break;
      }
      case 7:
      case 8: {
        const item = rnd() < 0.7 ? rnd.pick(['potion_healing', 'potion_greater_healing', 'pearl_power', 'scroll_cure_wounds', 'wand_web',
          'potion_giant_strength', 'antitoxin']) : referencia(call, cp, rnd, who);
        const pet = { cp, who, item, seed: rnd.int(10000) };
        if (rnd() < 0.7) pet.target = rnd.pick([...party, 'zz']);
        uso(call('inv_use', pet));
        break;
      }
      case 9: uso(call('identify', rnd() < 0.4 ? { cp, cost: rnd.pick([5, 50, 100000, 0, -3]) } : { cp })); break;
      case 10: call('shop', rnd() < 0.4 ? { cp, merchant: rnd.pick(COMERCIANTES), who } : { cp, merchant: rnd.pick(COMERCIANTES) }); break;
      case 11: {
        const merchant = rnd.pick(COMERCIANTES);
        const tienda = call('shop', { cp, merchant });
        const it = rnd() < 0.85 ? rnd.pick(tienda.stock || [])?.id : rnd.pick(OBJETOS);
        const pet = { cp, merchant, item: it ?? 'dagger', n: rnd.pick([1, 1, 1, 2, 3, 9, 0]) };
        if (rnd() < 0.6) pet.who = who;
        uso(call('shop_buy', pet));
        break;
      }
      case 12: {
        const merchant = rnd.pick(COMERCIANTES);
        const tienda = call('shop', { cp, merchant, who });
        const b = rnd.pick(tienda.buys || []);
        const item = b && rnd() < 0.8 ? (b.where === 'pack' ? { idx: b.idx } : b.id) : referencia(call, cp, rnd, who);
        uso(call('shop_sell', { cp, merchant, who, item, n: rnd.pick([1, 2, 5]) }));
        break;
      }
      default: {
        // Heridas y muertes para probar las pociones
        const id = rnd.pick(party);
        if (!id) break;
        if (rnd() < 0.2) {
          const c = JSON.parse(JSON.stringify(cp));
          c.state[id].dead = true;
          cp = c;
        } else uso(call('cp_damage', { cp, who: id, amount: 1 + rnd.int(8), seed: rnd.int(1000) }));
      }
    }
  }
  call('inv', { cp, who: 'hero' });
  return cp;
}

export const escenarios = {
  errores(call) {
    for (const op of ['inv', 'inv_preview', 'inv_equip', 'inv_unequip', 'inv_give', 'inv_use', 'inv_drop', 'identify', 'shop', 'shop_buy',
      'shop_sell']) {
      call(op, {});
      call(op, { cp: 3 });
      call(op, { cp: {} });
      call(op, { cp: { members: {}, party: ['pip'] }, merchant: 'smith', who: 'pip' });
    }
  },
};

for (let i = 0; i < CLASES.length; i++) {
  escenarios[`grupo_${CLASES[i]}`] = (call) => {
    const rnd = generador(900 + i);
    const cp = grupo(call, rnd, CLASES[i], 70 + i);
    const cp2 = rutina(call, cp, rnd, 160);
    const lvl = call('cp_level_up', { cp: cp2, level: 3 }).cp ?? cp2;
    rutina(call, lvl, rnd, 60);
  };
}
