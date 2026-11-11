// story/actions.js — Efectos de la historia: «verbo:argumento» → objeto {op, …}.
// Ejemplos: «set:flag=valor», «inc:x+2», «give:potion_healing*2», «approve:brenna+1», «battle:goblins!»
// («!» = sorpresa), «damage:hero=1d6:fire:dex:12», «travel:kesh:puerta». También acepta objetos
// ({if, do, else}, {narrate}, {say} o ya con op). Lo usa story/runner.js (StoryRunner.apply).

/** Convierte un efecto (texto u objeto) en {op, …}; lanza un error si no lo reconoce. */
function parseEffect(spec) {
  if (spec && typeof spec == 'object') {
    if (spec.if !== void 0 || spec.do || spec.else)
      return { op: 'cond', if: spec.if, do: spec.do || [], else: spec.else || [] };
    if (spec.narrate) return { op: 'narrate', moment: spec.narrate, lines: spec.lines, data: spec.data };
    if (spec.say) return { op: 'say', who: spec.say, text: spec.text };
    if (spec.op) return spec;
    throw new Error(`efecto desconocido: ${JSON.stringify(spec)}`);
  }
  let text = String(spec).trim(),
    colon = text.indexOf(':'),
    verb = colon < 0 ? text : text.slice(0, colon),
    arg = colon < 0 ? '' : text.slice(colon + 1),
    splitEq = (str) => {
      let eq = str.indexOf('=');
      return eq < 0 ? [str, void 0] : [str.slice(0, eq), str.slice(eq + 1)];
    };
  switch (verb) {
    case 'set': {
      let [flag, value] = splitEq(arg);
      return { op: verb, flag, value: value === void 0 ? !0 : parseValue(value) };
    }
    case 'unset':
      return { op: verb, flag: arg };
    case 'inc':
      return { op: verb, flag: arg.split('+')[0], by: Number(arg.split('+')[1] || 1) };
    case 'var': {
      let [name, value] = splitEq(arg);
      return { op: verb, name, value: value === void 0 ? !0 : parseValue(value) };
    }
    case 'gold':
      return { op: verb, delta: Number(arg) };
    case 'give':
    case 'take': {
      let [item, count] = arg.split('*');
      return { op: verb, item, n: Number(count || 1) };
    }
    case 'recruit':
    case 'dismiss':
    case 'wait':
    case 'raise':
    case 'fire':
      return { op: verb, who: arg };
    case 'approve': {
      let match = /^([a-z_]+)([+-]\d+)$/.exec(arg);
      if (!match) throw new Error(`approve mal escrito: ${text}`);
      return { op: verb, who: match[1], delta: Number(match[2]) };
    }
    case 'decision': {
      let [id, choice] = splitEq(arg);
      return { op: verb, id, choice: choice === void 0 ? !0 : parseValue(choice) };
    }
    case 'journal':
    case 'toast':
      return { op: verb, text: arg };
    case 'battle':
      return { op: verb, group: arg.replace(/!$/, ''), surprise: arg.endsWith('!') };
    case 'leave':
      return { op: verb, group: arg };
    case 'place':
      return { op: verb, id: arg };
    case 'object':
    case 'npc': {
      let [id, state] = splitEq(arg);
      return { op: verb, id, state };
    }
    case 'shop':
      return { op: verb, merchant: arg };
    case 'rest':
      return { op: verb, where: arg || 'inn' };
    case 'heal':
      return { op: verb, who: arg || 'party' };
    case 'damage': {
      let [who, damageSpec = '1d4'] = splitEq(arg),
        [dice, type = 'piercing', save, dc] = damageSpec.split(':');
      return { op: verb, who, dice, type, save: save || null, dc: dc ? Number(dc) : null };
    }
    case 'levelup':
      return { op: verb, level: Number(arg) };
    case 'narrate':
    case 'prefetch':
      return { op: verb, moment: arg };
    case 'sfx':
      return { op: verb, name: arg };
    case 'travel': {
      let [level, spawn] = arg.split(':');
      return { op: verb, level, spawn };
    }
    case 'goto':
      return { op: verb, node: arg };
    case 'identify':
    case 'hire':
    case 'refresh':
    case 'proceed':
    case 'end':
    case 'epilogue':
      return { op: verb };
    default:
      throw new Error(`efecto desconocido: ${text}`);
  }
}
/** Tira una expresión «NdM±K» con `rng` (Math.random por defecto); un número se devuelve tal cual. */
function rollDice(expr, rng = Math.random) {
  let match = /^(\d*)d(\d+)([+-]\d+)?$/.exec(String(expr).trim());
  if (!match) return Number(expr) || 0;
  let total = Number(match[3] || 0);
  for (let i = 0; i < Number(match[1] || 1); i++) total += 1 + Math.floor(rng() * Number(match[2]));
  return Math.max(0, total);
}
/** «true»/«false» → booleano, números → número, el resto como texto. */
const parseValue = (str) =>
  str === 'true' ? !0 : str === 'false' ? !1 : str !== '' && !Number.isNaN(Number(str)) ? Number(str) : str;
/** Efectos que se aplazan hasta cerrar el diálogo (abren combate, tienda, descanso, viaje…). */
const DEFERRED_EFFECTS = new Set(['battle', 'shop', 'rest', 'travel', 'epilogue', 'levelup', 'hire']);

export { parseEffect, rollDice, DEFERRED_EFFECTS };
