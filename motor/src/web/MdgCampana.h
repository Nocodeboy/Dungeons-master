// Marca de Granito · campaña sobre el documento JSON «cp» (port de campaign.gd).
// cp = {version, members{id: hoja}, party[ids], state{id: {hp, temp_hp, slots, resources,
//       free_casts, hit_dice, dead, buffs?}}, party_level, gold, location, flags, journal, day,
//       playtime, short_rests_left, levels, merchants}
#pragma once

#include "MdgFactory.h"
#include "MdgDice.h"
#include "MdgJson.h"

namespace mdg
{
class Battle;
}

namespace mdg::web::campana
{

/** Partida nueva con el héroe y los compañeros escritos (party.json). */
Json nueva(const Json& hero, const StrList& companions, Pcg32& rng);
/** Normaliza un documento recibido (from_dict de campaign.gd: tipos, valores por defecto). */
void normalizar(Json& cp);

int nivel(const Json& cp);
bool es_miembro(const Json& cp, const std::string& id);
bool muerto(const Json& cp, const std::string& id);
/** Nombre corto para la interfaz («Odvar», no «Maese Odvar Stonebrow»). */
std::string nombre_corto(const Json& cp, const std::string& id);
/** PG máximos del miembro al nivel del grupo. */
int max_hp(const Json& cp, const std::string& id);

/** Deja escrito en la hoja el equipo inicial (armas, armadura, munición y objetos). */
void materializar(Json& s);
Json estado_nuevo(const Json& cp, const std::string& id);
bool reclutar(Json& cp, const std::string& id);

/** Criatura con su estado guardado (PG, espacios, recursos...). level < 0 = el del grupo. */
CreaturePtr criatura(const Json& cp, const std::string& id, int level);
void aplicar_estado(const Json& cp, Creature& c);
void capturar(Json& cp, Creature& c);

Json descanso_corto(Json& cp, const Json& spend, Pcg32& rng);
void descanso_largo(Json& cp, Pcg32& rng);
void subir_nivel(Json& cp, int lvl);
/** Da un objeto (por defecto al primero del grupo que pueda usarlo); devuelve quién lo recibe. */
std::string dar_objeto(Json& cp, const std::string& id, int n, bool unid, const std::string& to);
void pasar_horas(Json& cp, int horas);

} // namespace mdg::web::campana
