// story/data.js — Datos de la historia: reúne los JSON de src/datos/historia/ en un solo objeto.
// Quita las claves privadas («_fuente», «_nota») y da a cada diálogo su id. Lo usa story/index.js
// (createStory) como datos por defecto; se puede sustituir cualquier parte con `overrides`.

import historiaFlags from '../datos/historia/flags.json';
import historiaObjetos from '../datos/historia/objetos.json';
import historiaCompaneros from '../datos/historia/companeros.json';
import historiaReacciones from '../datos/historia/reacciones.json';
import historiaMisiones from '../datos/historia/misiones.json';
import historiaMeta from '../datos/historia/meta.json';
import historiaCombates from '../datos/historia/combates.json';
import historiaDisparadores from '../datos/historia/disparadores.json';
import historiaObjetosNivel from '../datos/historia/objetos-nivel.json';
import historiaCharlas from '../datos/historia/charlas.json';
import historiaNarrador from '../datos/historia/narrador.json';
import historiaEpilogo from '../datos/historia/epilogo.json';
import historiaPrologo from '../datos/historia/prologo.json';
import dialogosPrologo from '../datos/historia/dialogos/prologo.json';
import dialogosMerrowick from '../datos/historia/dialogos/merrowick.json';
import dialogosPip from '../datos/historia/dialogos/pip.json';
import dialogosElderhal from '../datos/historia/dialogos/elderhal.json';
import dialogosSantuario from '../datos/historia/dialogos/santuario.json';
import dialogosOdvar from '../datos/historia/dialogos/odvar.json';
import dialogosKesh from '../datos/historia/dialogos/kesh.json';
import dialogosSellos from '../datos/historia/dialogos/sellos.json';
import dialogosTumulo from '../datos/historia/dialogos/tumulo.json';
import dialogosCompaneros from '../datos/historia/dialogos/companeros.json';

/** Objeto de datos de la historia: dialogs, flags, items, companions, quests, triggers, battles, banter… */
function buildStoryData(overrides = {}) {
  let dialogs = {};
  for (let file of Object.values(overrides.dialogFiles || DIALOG_FILES))
    for (let [id, dialog] of Object.entries(file)) id.startsWith('_') || (dialogs[id] = { id, ...dialog });
  let dropPrivate = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([key]) => !key.startsWith('_'))),
    items = { ...(overrides.items || historiaObjetos).known, ...(overrides.items || historiaObjetos).new };
  return {
    dialogs,
    flags: dropPrivate(overrides.flags || historiaFlags),
    items,
    companions: dropPrivate(overrides.companions || historiaCompaneros),
    reactions: dropPrivate(overrides.reactions || historiaReacciones),
    quests: dropPrivate(overrides.quests || historiaMisiones),
    places: (overrides.world || historiaMeta).places,
    groups: (overrides.world || historiaMeta).groups,
    lootFlags: (overrides.world || historiaMeta).loot,
    battles: dropPrivate(overrides.battles || historiaCombates),
    triggers: (overrides.triggers || historiaDisparadores).triggers,
    returns: (overrides.triggers || historiaDisparadores).returns,
    objects: dropPrivate(overrides.objects || historiaObjetosNivel),
    banter: overrides.banter || historiaCharlas,
    narration: overrides.narration || historiaNarrador,
    epilogue: overrides.epilogue || historiaEpilogo,
    prologue: overrides.prologue || historiaPrologo,
  };
}
/** Archivos de diálogo por clave (la clave es la que usaba el original). */
const DIALOG_FILES = {
  prologue: dialogosPrologo,
  merrowick: dialogosMerrowick,
  pip: dialogosPip,
  sedge: dialogosElderhal,
  elderhal: dialogosSantuario,
  kesh: dialogosOdvar,
  runes: dialogosKesh,
  seals: dialogosSellos,
  tumulo: dialogosTumulo,
  companions: dialogosCompaneros,
};
const storyData = buildStoryData();

export { storyData };
