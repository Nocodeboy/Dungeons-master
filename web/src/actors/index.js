// actors/index.js
// Reconstruido de publicado/juego.js (módulo __esm «Zf»). Nombres locales aún minificados.

import { buildHumanoid } from './humanoid.js';
import { heroLook } from './look.js';
import { sc } from './materials.js';
import { MONSTER_DEFS } from './monsters.js';
import { cT } from './beasts.js';
import { uu, gv } from './animals.js';
import { Jf, pT, COMPANIONS } from './companions.js';
import { vT, yT } from './portraits.js';
import './preview.js';
import './character.js';
import './appearance.js';

function setRenderer(o) {
  vT(o);
}
function texturesReady() {
  return sc();
}
async function makeHero(o = {}, e = {}) {
  let t = o.id,
    a = t && COMPANIONS[t] && !o.appearance ? Jf(t, e) : heroLook(o, e);
  t && (a.id = t);
  let n = await buildHumanoid(a);
  return (
    (n.kind = 'hero'),
    (n.id = t || n.id),
    (n.userData.sheet = o),
    (n.userData.prefer = e.prefer || null),
    e.lod && n.setLod(e.lod),
    n
  );
}
async function makeCompanion(o, e = {}) {
  let t = Jf(o, e);
  if (!t) throw new Error(`compa\xF1ero desconocido: ${o}`);
  t.id = o;
  let a = await buildHumanoid(t);
  return ((a.kind = 'hero'), (a.id = o), a);
}
async function makeNpc(o) {
  let e = pT(o || {}),
    t = await buildHumanoid(e);
  return ((t.kind = 'npc'), (t.id = e.id || t.id), t);
}
async function makeMonster(o, { index: e = 0 } = {}) {
  let t = MONSTER_DEFS[o],
    a;
  if (!t)
    return (
      console.warn(`[personajes] monstruo desconocido \xAB${o}\xBB: uso un trasgo`),
      makeMonster('goblin_minion', { index: e })
    );
  if (t.type === 'spider') a = await cT({ index: e });
  else if (t.type === 'animal') a = await gv(t.kind, { index: e });
  else {
    let n = t.look(e);
    ((n.id = n.id || o), (a = await buildHumanoid(n)));
  }
  return ((a.kind = 'monster'), (a.id = o), (a.userData.monster = o), a.setStance?.('combat'), a);
}
async function makeAnimal(o, e = {}) {
  return gv(o, e);
}
function hasAnimal(o) {
  return !!uu(o);
}
async function portrait(o, e = {}) {
  return yT(o, e, {
    makeHero: makeHero,
    makeNpc: makeNpc,
    makeMonster: makeMonster,
    makeCompanion: makeCompanion,
    makeAnimal: makeAnimal,
  });
}

export { ANIMAL_DEFS, ANIMAL_KINDS, wander } from './animals.js';
export { COMPANIONS, NPC_LOOKS } from './companions.js';
export { Character } from './character.js';
export {
  DRAGON_COLORS,
  METALS,
  appearanceOptions,
  completeAppearance,
  defaultAppearance,
  randomAppearance,
} from './appearance.js';
export { MONSTER_DEFS, MONSTER_IDS } from './monsters.js';
export { createHeroPreview } from './preview.js';
export { heroLook, sampleSheet, weaponLoadout } from './look.js';
export { setCharacterRim, setTextureDetail } from './materials.js';
export {
  hasAnimal,
  makeAnimal,
  makeCompanion,
  makeHero,
  makeMonster,
  makeNpc,
  portrait,
  setRenderer,
  texturesReady,
};
