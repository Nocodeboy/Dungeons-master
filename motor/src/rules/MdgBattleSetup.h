// Marca de Granito · núcleo de reglas portable.
// Construye un Battle a partir de un encuentro de data/encounters. Traducción de battle_setup.gd.
// La campaña (estado guardado de los PJ entre combates) aún no está portada: build() y precast()
// se comportan como en Godot con `campaign = null`.
#pragma once

#include "MdgBattle.h"

#include <memory>

namespace mdg
{

class BattleSetup
{
public:
	/** Orden del grupo por defecto (party.json). */
	static const StrList& party_order();
	/** Conjuros que el grupo lanza antes de entrar en combate si puede. */
	static const StrList& precast_ok();

	/**
	 * party_override: array JSON de ids de party.json (cadenas) o de hojas de personaje (objetos con "id").
	 * Vacío = el grupo por defecto.
	 */
	static std::unique_ptr<Battle> build(const std::string& encounter_id, int64_t seed_value = -1,
		const Json& party_override = Json::array(), int level_override = -1);

	/** Conjuros de larga duración lanzados antes del combate (Armadura de mago, Falsa vida...). */
	static void precast(Battle& battle, Creature& pc);
};

} // namespace mdg
