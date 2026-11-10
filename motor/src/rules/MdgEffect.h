// Marca de Granito · núcleo de reglas portable.
// Efecto temporal sobre una criatura (conjuros, maestrías, acciones...). Las condiciones que
// concede se suman a las de la criatura mientras dure.
#pragma once

#include "MdgVar.h"

#include <memory>

namespace mdg
{

struct Creature;

struct Effect
{
	inline static int next_uid = 1;

	int uid = 0;
	/** "bless", "shield", "sap", "vex", "hold_person"... */
	std::string kind;
	/** Nombre visible. */
	std::string name;
	/** Quien lo creó y quien lo tiene (punteros sin propiedad: las criaturas son del combate). */
	Creature* source = nullptr;
	Creature* owner = nullptr;
	Var data = Var::dict();
	/** Cuándo caduca: "start_turn" / "end_turn" del creador o del portador, o "never". */
	std::string expires = "never";
	Creature* expires_who = nullptr;
	/** -1 = sin límite de rondas. */
	int rounds_left = -1;
	bool concentration = false;
	/** Condiciones que concede ("paralyzed", "incapacitated"...). */
	StrList grants;
	/** -1 = ilimitado; si llega a 0 se elimina. */
	int uses = -1;
	std::string spell_id;
	std::string icon;
	/** Para colorear en la interfaz. */
	bool positive = false;

	explicit Effect(std::string p_kind = std::string()) : uid(next_uid++), kind(std::move(p_kind)) {}

	std::string describe() const { return !name.empty() ? name : kind; }
};

using EffectPtr = std::shared_ptr<Effect>;

inline EffectPtr make_effect(const std::string& kind)
{
	return std::make_shared<Effect>(kind);
}

} // namespace mdg
