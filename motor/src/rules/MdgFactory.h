// Marca de Granito · núcleo de reglas portable.
// Construye criaturas listas para combatir a partir de los datos. Traducción de factory.gd.
#pragma once

#include "MdgCreature.h"

#include <memory>

namespace mdg
{

using CreaturePtr = std::shared_ptr<Creature>;

class Factory
{
public:
	/** Compañero escrito del grupo (party.json) al nivel indicado. */
	static CreaturePtr make_pc(const std::string& pid, int level);
	/** Personaje jugador a partir de una hoja (creador, compañero o mercenario). */
	static CreaturePtr make_from_sheet(const Json& sheet, int level, const std::string& cid = "");
	/** Monstruo a partir de su bloque de estadísticas. */
	static CreaturePtr make_monster(const std::string& mid, int index = 1);
	/** Ataques de un bloque de monstruo; apunta la munición en `c`. */
	static std::vector<Var> monster_attacks(const Json& m, Creature& c);
	static std::string species_name(const std::string& sp);
	static std::string background_name(const std::string& bg);

private:
	static void apply_species(Creature& c, const Json& s, int level);
	static void apply_class_resources(Creature& c, const Json& cd, const Json& s, int level);
	static void add_spell(Creature& c, const std::string& sid, const std::string& source, const std::string& ability = "",
		bool free_daily = false);
	static void apply_spells(Creature& c, const Json& cd, const Json& s, int level);
};

} // namespace mdg
