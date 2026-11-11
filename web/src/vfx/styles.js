// vfx/styles.js
// Reconstruido de publicado/juego.js (módulo __esm «Lm»). Nombres locales aún minificados.

import { FRAME } from './atlas.js';

function Jn(o) {
  return STYLE[o] || STYLE.arcane;
}
function HS(o, e) {
  return e && DAMAGE_STYLE[e] && DAMAGE_STYLE[e] !== 'physical' && (o === 'arcane' || o === 'fire_cone' || !o)
    ? DAMAGE_STYLE[e]
    : o === 'fire_cone'
      ? 'fire'
      : STYLE[o]
        ? o
        : 'arcane';
}
const STYLE = {
  fire: { c: 16738842, c2: 16765562, p: FRAME.flame, sfx: 'fire' },
  fire_cone: { c: 16738842, c2: 16765562, p: FRAME.flame, sfx: 'fire' },
  frost: { c: 8377599, c2: 15268607, p: FRAME.flake, sfx: 'frost' },
  lightning: { c: 9419007, c2: 15922943, p: FRAME.spark, sfx: 'lightning' },
  thunder: { c: 11051263, c2: 15131391, p: FRAME.dust, sfx: 'thunder' },
  shatter: { c: 12624127, c2: 16777215, p: FRAME.shard, sfx: 'thunder' },
  radiant: { c: 16765024, c2: 16774864, p: FRAME.star, sfx: 'radiant' },
  moon: { c: 13623551, c2: 16777215, p: FRAME.star, sfx: 'radiant' },
  necrotic: { c: 6961824, c2: 10289050, p: FRAME.smoke, sfx: 'necrotic' },
  poison: { c: 8048704, c2: 13959050, p: FRAME.bubble, sfx: 'poison' },
  acid: { c: 10288954, c2: 15794096, p: FRAME.drop, sfx: 'acid' },
  force: { c: 10320895, c2: 15129855, p: FRAME.spark, sfx: 'force' },
  missile: { c: 11111423, c2: 15788287, p: FRAME.spark, sfx: 'missile' },
  eldritch: { c: 12599551, c2: 15778047, p: FRAME.spark, sfx: 'eldritch' },
  arcane: { c: 9403391, c2: 14735615, p: FRAME.star, sfx: 'arcane' },
  psychic: { c: 16739024, c2: 16765168, p: FRAME.spiral, sfx: 'psychic' },
  nature: { c: 6278986, c2: 14221210, p: FRAME.leaf, sfx: 'nature' },
  heal: { c: 7339936, c2: 16774336, p: FRAME.star, sfx: 'heal' },
  buff: { c: 16766314, c2: 16775384, p: FRAME.star, sfx: 'buff' },
  curse: { c: 9054928, c2: 16736416, p: FRAME.skull, sfx: 'curse' },
  charm: { c: 16743128, c2: 16769268, p: FRAME.heart, sfx: 'charm' },
  command: { c: 13148415, c2: 16773375, p: FRAME.rune, sfx: 'command' },
  color: { c: 16744703, c2: 16777215, p: FRAME.star, sfx: 'arcane' },
  wind: { c: 14676223, c2: 16777215, p: FRAME.swirl, sfx: 'wind' },
  faerie: { c: 11567359, c2: 8442111, p: FRAME.star, sfx: 'arcane' },
  fog: { c: 13160664, c2: 16777215, p: FRAME.cloud, blend: 'alpha', sfx: 'wind' },
  grease: { c: 4864536, c2: 9072696, p: FRAME.drop, blend: 'alpha', sfx: 'grease' },
  mark: { c: 12123978, c2: 15794128, p: FRAME.cross, sfx: 'mark' },
  darkness: { c: 1183002, c2: 5913226, p: FRAME.cloud, blend: 'alpha', sfx: 'darkness' },
  web: { c: 15921382, c2: 16777215, p: FRAME.web, blend: 'alpha', sfx: 'web' },
  sleep: { c: 10259711, c2: 15261951, p: FRAME.zz, sfx: 'sleep' },
  physical: { c: 16771272, c2: 16777215, p: FRAME.spark, sfx: 'hit' },
};
const DAMAGE_STYLE = {
  fire: 'fire',
  cold: 'frost',
  lightning: 'lightning',
  thunder: 'thunder',
  acid: 'acid',
  poison: 'poison',
  necrotic: 'necrotic',
  radiant: 'radiant',
  psychic: 'psychic',
  force: 'force',
  slashing: 'physical',
  piercing: 'physical',
  bludgeoning: 'physical',
};

export { DAMAGE_STYLE, HS, Jn, STYLE };
