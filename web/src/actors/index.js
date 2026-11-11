// actors/index.js
// Reconstruido de publicado/juego.js (módulo __esm «Zf»).
//
// Fachada del área de personajes: es el espacio de nombres `game.actors` (main.js) y lo carga con
// import() character.js (makeCharacter), así que sus exports conservan los nombres del original.
// Crea héroes, compañeros, PNJ, monstruos y animales como Character listos para la escena, genera
// retratos (game.portrait) y reexporta catálogos y opciones de aspecto para la interfaz.

import { buildHumanoid } from './humanoid.js';
import { heroLook } from './look.js';
import { allTexturesReady } from './materials.js';
import { MONSTER_DEFS } from './monsters.js';
import { makeGiantSpider } from './beasts.js';
import { resolveAnimalKind, buildAnimal } from './animals.js';
import { companionLook, npcLook, COMPANIONS } from './companions.js';
import { setPortraitRenderer, cachedPortrait } from './portraits.js';
import './preview.js';
import './character.js';
import './appearance.js';

/** Pasa el renderer del juego al módulo de retratos (ver NOTAS: hoy no se usa). */
function setRenderer(renderer) {
  setPortraitRenderer(renderer);
}
/** Promesa que se cumple cuando las texturas de personaje pedidas están cargadas. */
function texturesReady() {
  return allTexturesReady();
}
/**
 * Héroe a partir de su hoja; si el id es de un compañero sin aspecto propio, usa el look del
 * compañero. `opts`: {prefer: 'melee' | 'ranged', lod}.
 */
async function makeHero(sheet = {}, opts = {}) {
  let id = sheet.id,
    look = id && COMPANIONS[id] && !sheet.appearance ? companionLook(id, opts) : heroLook(sheet, opts);
  id && (look.id = id);
  let character = await buildHumanoid(look);
  return (
    (character.kind = 'hero'),
    (character.id = id || character.id),
    (character.userData.sheet = sheet),
    (character.userData.prefer = opts.prefer || null),
    opts.lod && character.setLod(opts.lod),
    character
  );
}
/** Compañero por id (brenna, pip, ilyra, odvar). */
async function makeCompanion(id, opts = {}) {
  let look = companionLook(id, opts);
  if (!look) throw new Error(`compa\xF1ero desconocido: ${id}`);
  look.id = id;
  let character = await buildHumanoid(look);
  return ((character.kind = 'hero'), (character.id = id), character);
}
/** PNJ por id o definición (ver npcLook). */
async function makeNpc(def) {
  let look = npcLook(def || {}),
    character = await buildHumanoid(look);
  return ((character.kind = 'npc'), (character.id = look.id || character.id), character);
}
/** Monstruo por id de MONSTER_DEFS (con un trasgo esbirro si no existe), en postura de combate. */
async function makeMonster(id, { index = 0 } = {}) {
  let def = MONSTER_DEFS[id],
    character;
  if (!def)
    return (
      console.warn(`[personajes] monstruo desconocido \xAB${id}\xBB: uso un trasgo`),
      makeMonster('goblin_minion', { index })
    );
  if (def.type === 'spider') character = await makeGiantSpider({ index });
  else if (def.type === 'animal') character = await buildAnimal(def.kind, { index });
  else {
    let look = def.look(index);
    ((look.id = look.id || id), (character = await buildHumanoid(look)));
  }
  return (
    (character.kind = 'monster'),
    (character.id = id),
    (character.userData.monster = id),
    character.setStance?.('combat'),
    character
  );
}
/** Animal por especie o alias (ver buildAnimal). */
async function makeAnimal(kind, opts = {}) {
  return buildAnimal(kind, opts);
}
/** ¿Hay modelo para este animal? */
function hasAnimal(kind) {
  return !!resolveAnimalKind(kind);
}
/** Retrato PNG (data URL) de un personaje, id u hoja (ver cachedPortrait). */
async function portrait(subject, opts = {}) {
  return cachedPortrait(subject, opts, {
    makeHero,
    makeNpc,
    makeMonster,
    makeCompanion,
    makeAnimal,
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
