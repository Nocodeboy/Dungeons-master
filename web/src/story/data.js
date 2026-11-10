// story/data.js
// Reconstruido de publicado/juego.js (módulo __esm «cS»). Nombres locales aún minificados.

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

function uI(o = {}) {
  let e = {};
  for (let n of Object.values(o.dialogFiles || dI))
    for (let [s, i] of Object.entries(n)) s.startsWith('_') || (e[s] = { id: s, ...i });
  let t = (n) => Object.fromEntries(Object.entries(n || {}).filter(([s]) => !s.startsWith('_'))),
    a = { ...(o.items || historiaObjetos).known, ...(o.items || historiaObjetos).new };
  return {
    dialogs: e,
    flags: t(o.flags || historiaFlags),
    items: a,
    companions: t(o.companions || historiaCompaneros),
    reactions: t(o.reactions || historiaReacciones),
    quests: t(o.quests || historiaMisiones),
    places: (o.world || historiaMeta).places,
    groups: (o.world || historiaMeta).groups,
    lootFlags: (o.world || historiaMeta).loot,
    battles: t(o.battles || historiaCombates),
    triggers: (o.triggers || historiaDisparadores).triggers,
    returns: (o.triggers || historiaDisparadores).returns,
    objects: t(o.objects || historiaObjetosNivel),
    banter: o.banter || historiaCharlas,
    narration: o.narration || historiaNarrador,
    epilogue: o.epilogue || historiaEpilogo,
    prologue: o.prologue || historiaPrologo,
  };
}
const dI = {
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
const lS = uI();

export { lS };
