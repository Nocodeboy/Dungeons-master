// Marca de Granito · núcleo de reglas portable.
// Rasgos de clase y especie que se usan como acciones (furia, forma salvaje, ráfaga...).
// list() alimenta la hoja de «Habilidades» de la interfaz; use() los resuelve.
// Traducción de class_actions.gd.
#pragma once

#include "MdgBattle.h"

namespace mdg
{

class ClassActions
{
public:
	explicit ClassActions(Battle& battle) : b(battle) {}

	Battle& b;

	/** Rasgos utilizables ahora: [{id, title, icon, cost, cost_key, desc, enabled, target, ...}]. */
	std::vector<Var> list(Creature* c);
	Var entry(Creature* c, const std::string& id);
	int breath_dc(const Creature* c) const;
	std::string breath_dice(const Creature* c) const;
	std::vector<Cell> breath_cells(Creature* c, const std::string& shape, const Vec2& dir);
	/** Marca activa (Marca del cazador / Maleficio): {spell, kind, holder, free} o vacío. */
	Var mark_info(Creature* c) const;
	std::vector<Creature*> valid_targets(Creature* c, const std::string& id);
	/** data: {target: id, choice: id, point: Vector2, dir: Vector2, cell: Vector2i, amount, technique, heal_target, zone}. */
	bool use(Creature* c, const std::string& id, const Var& data = Var());
	std::vector<Cell> lands_aid_cells(Creature* c, const Vec2& point);

private:
	bool has_action(const Creature* c) const;
	bool has_attack(const Creature* c) const;
	Var make_entry(const std::string& id, const std::string& title, const std::string& icon, const std::string& cost,
		const std::string& desc, bool enabled, const std::string& target = "none", const Var& extra = Var());
	void feature_event(Creature* c, const std::string& id);
	Creature* adjacent_enemy(Creature* c);
	bool divine_spark(Creature* c, Creature* target);
	bool turn_undead(Creature* c);
	bool preserve_life(Creature* c);
	bool sw_move(Creature* c, Creature* target);
	bool rage(Creature* c);
	bool wild_shape(Creature* c, const std::string& form_id);
	bool lands_aid(Creature* c, const Vec2& point, const std::string& heal_id);
	bool lay_on_hands(Creature* c, Creature* t, int amount);
	bool move_mark(Creature* c, Creature* t);
	bool breath(Creature* c, const std::string& shape, const Vec2& dir);
};

} // namespace mdg
